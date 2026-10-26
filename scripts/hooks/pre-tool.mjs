// PreToolUse: fast local guardrails. GitHub rulesets and required checks stay the real
// enforcement; this only makes a breach fail sooner, inside the session.
// A denial is an answer, not a failed check (ADR-0004, failure F1): each one says so, they are counted
// per session by the rule that fired, and past denialCap the session may only read until a human types.
import fs from 'node:fs'
import path from 'node:path'
import { root, git, loadConfig, isPaused, isProbe, readState, listFeatures, matches, relPath, readStdin, audit } from '../lib.mjs'
import { segments } from '../segments.mjs'

const SECRET = /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{32,})/
const ANSWER = 'This is a final answer, not an error: do not retry, rephrase, wrap it in a script or reach for another tool. Give the user the command once if one is needed, then stop.'

const input = readStdin()
const dir = root(input.cwd)
const cfg = loadConfig(dir)
const tool = input.tool_name
const ti = input.tool_input ?? {}
const session = input.session_id ?? 'default'

// Denials per session and rule, reset by the user-prompt hook whenever a human types.
const denialsFile = path.join(dir, '.ai-sdlc', 'denials.json')
const readDenials = () => {
  try {
    return JSON.parse(fs.readFileSync(denialsFile, 'utf8'))
  } catch {
    return {}
  }
}

const decide = (permissionDecision, reason, rule) => {
  audit(dir, { event: 'pre-tool', tool, decision: permissionDecision, reason, rule, session })
  let text = reason
  if (permissionDecision === 'deny' && rule !== 'held') {
    const all = readDenials()
    const mine = all[session] ?? {}
    mine[rule] = (mine[rule] ?? 0) + 1
    all[session] = mine
    fs.mkdirSync(path.dirname(denialsFile), { recursive: true })
    fs.writeFileSync(denialsFile, JSON.stringify(all, null, 2) + '\n')
    text = mine[rule] >= cfg.denialCap
      ? `${reason} Refused ${mine[rule]} times this session: hand back to the user now. Until they reply, only reading is allowed.`
      : `${reason} ${ANSWER}`
  }
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: `[ai-sdlc] ${text}` } }))
  process.exit(0)
}
const deny = (reason, rule) => decide('deny', reason, rule)
const ask = (reason, rule) => decide('ask', reason, rule)

const READ_ONLY = ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'ToolSearch', 'TodoWrite']
if (isPaused(dir) && !READ_ONLY.includes(tool)) {
  deny('Agents are paused by a human (.ai-sdlc/PAUSED). Stop and wait for "sdlc resume".', 'paused')
}
// A session refused denialCap times by one rule is held: it hands back instead of trying another way.
const held = Object.entries(readDenials()[session] ?? {}).find(([, n]) => n >= cfg.denialCap)
if (held && !READ_ONLY.includes(tool)) {
  deny(`This session was refused ${held[1]} times by the "${held[0]}" guard and is waiting for the user. Tell them what you need, then stop.`, 'held')
}

if (tool.startsWith('mcp__') && new RegExp(cfg.mcpDenyPattern, 'i').test(tool) && !cfg.mcpAllow.includes(tool)) {
  deny(`${tool} looks like it merges, deploys or changes settings. That is a human action; add it to mcpAllow in .ai-sdlc/config.json only if it is safe.`, 'mcp')
}

// Reading order (failure F2): a large file is read in slices, so the context goes to what governs.
const tooBig = full => {
  try {
    const stat = fs.statSync(full)
    if (!stat.isFile()) return null
    const lines = stat.size > cfg.maxReadBytes ? Infinity : fs.readFileSync(full, 'utf8').split('\n').length
    return stat.size > cfg.maxReadBytes || lines > cfg.maxReadLines ? { size: stat.size, lines } : null
  } catch {
    return null
  }
}
const sliceAdvice = (file, big) => `${file} is ${big.lines === Infinity ? `${Math.round(big.size / 1024)}KB` : `${big.lines} lines`}: read the implementation that governs it first, then this file in slices, for example Read with offset 1 and limit 200, or Grep for what you need.`
if (tool === 'Read' && ti.file_path && ti.limit === undefined && ti.offset === undefined) {
  const big = tooBig(path.resolve(dir, ti.file_path))
  if (big) deny(sliceAdvice(relPath(dir, ti.file_path), big), 'read-slices')
}

const branch = git('rev-parse --abbrev-ref HEAD', dir)
const onProtected = cfg.protectedBranches.includes(branch)

if (tool === 'Bash' || tool === 'PowerShell') {
  const c = ti.command ?? ''
  // Each segment is judged on what it runs (docs/decisions/2026-10-23-bash-guard-targets.md). A heredoc
  // body is data only when a quoted delimiter feeds it to a file write or a commit message; fed to
  // anything else, or unquoted (so $( ) runs), it is code and is judged with its segment. When the
  // parse is unsure, the whole line is one segment, as before.
  const parts = segments(c) ?? [{ text: c, heredocs: [], unsure: true }]
  const quotedOnly = p => p.heredocs.every(h => h.quoted)
  const commitShape = t => /^git\s+commit\b[^\n]*\s-m\s+"\$\(cat\s+<<'(\w+)'\n[\s\S]*?\n\1\n\)"\s*$/.test(t)
  const writeTarget = p => {
    const t = p.text.replace(/<<-?\s*(['"])\w+\1/, '').trim()
    return p.heredocs.length && quotedOnly(p) ? t.match(/^cat\s*>>?\s*([^\s$`'"]+)$/)?.[1] ?? t.match(/^tee\s+(?:-a\s+)?([^\s$`'"]+)$/)?.[1] : undefined
  }
  const isData = p => !p.unsure && p.heredocs.length > 0 && quotedOnly(p) && (writeTarget(p) !== undefined || /^git\s+commit\b/.test(p.text))
  const code = p => (isData(p) ? p.text : [p.text, ...p.heredocs.map(h => h.body)].join('\n'))

  // A push is judged on its own arguments: a protected branch in any form, a +refspec, a force flag.
  const protectedRef = new RegExp(cfg.protectedBranches.map(b => `(?:^|[\\s:/+])${b}(?:\\s|$|["')])`).join('|'))
  for (const p of parts) {
    const run = code(p)
    if (!/\bgit\b[^;&|\n]*\bpush\b/.test(run)) continue
    const args = run.replace(/[\s\S]*?\bpush\b/, '')
    if (/(^|\s)(--force|-f|--force-with-lease|--force-if-includes)\b|(^|\s)\+\S/.test(args)) deny('Force push is not allowed for agents.', 'force-push')
    if (protectedRef.test(args) || /(^|\s)--(mirror|all)\b/.test(args) || onProtected) deny(`Agents never push to ${cfg.protectedBranches.join('/')}. Push the feature branch and open a PR.`, 'push-protected')
  }
  if (SECRET.test(c)) deny('The command contains what looks like a secret. Use the secret store and reference it by name.', 'secret')
  if (/--no-verify\b/.test(c)) deny('--no-verify skips the checks. Fix the failure instead.', 'no-verify')
  if (onProtected && /\bgit\s+(commit|merge|rebase|cherry-pick|reset)\b/.test(c)) deny(`You are on ${branch}. Work on a feature branch in its own worktree.`, 'commit-protected')
  for (const p of cfg.deployPatterns) {
    if (new RegExp(p, 'i').test(c)) deny(`"${c.slice(0, 60)}" merges, deploys, changes settings or records a human decision. A human runs it.`, 'human-action')
  }
  for (const p of cfg.prodPatterns) {
    if (new RegExp(p, 'i').test(c) && !isProbe(c)) deny(`"${c.slice(0, 60)}" touches production. Agents run read-only probes only.`, 'production')
  }
  if (/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/.test(c)) deny('Piping a download into a shell runs untrusted code.', 'curl-sh')
  if (/(^|[\s'"/])\.env(?!\.example)(\.[\w-]+)?\b/.test(c) || /\bid_rsa\b|\.pem\b/.test(c)) deny('Commands may not read or write secrets files.', 'secrets-file')
  // A segment may name a guardrail file only to read it, to stage, commit or read git history (no file
  // content changes), or to run the state CLI. Redirects, $( ) and backticks make any of them a write.
  const guardrail = /(state\.json|\.ai-sdlc|PAUSED|BUDGET_FROZEN|settings(\.local)?\.json|\.github[\\/]workflows|CODEOWNERS)/i
  const plain = t => !/[>`]|\$\(/.test(t.replace(/<<-?\s*'\w+'/g, ''))
  const exempt = p => {
    if (p.unsure || !quotedOnly(p)) return false
    const t = p.text
    if (commitShape(t)) return true
    if (/^node\s+("[^"]*sdlc\.mjs"|\S*sdlc\.mjs)(\s+[\w.=-]+)*\s*$/.test(t)) return true
    if (!plain(t)) return false
    if (/^git\s+(add|commit|status|diff|log|show)\b/.test(t)) return true
    if (/^sed\s+-n\s+(['"]?)\d+(,\d+)?p\1(\s+[^\s'"]+)+$/.test(t)) return true
    return /^(cat|grep|rg|head|tail|less|jq|type|ls|wc|Get-Content|Select-String)\b/i.test(t) && !/\s--pre\b/.test(t) && !p.heredocs.length
  }
  for (const p of parts) {
    const target = writeTarget(p)
    if (target && (matches(target, cfg.denyPaths) || matches(target, cfg.askPaths))) deny(`${target} is a guardrail, CI or ownership file: a shell write to it is never allowed. Use the Write tool, which asks a human.`, 'guardrail-command')
    if (guardrail.test(code(p)) && !exempt(p)) deny('Commands may not touch feature state, guardrails, settings, CI or ownership files. Use sdlc.mjs, or ask a human.', 'guardrail-command')
  }
  const single = !/[;&|`$<>]/.test(c.replace(/^node\s+"[^"]*"/, 'node x'))
  // A whole-file dump of a large file is the same mistake as a full Read.
  const dump = single && c.trim().match(/^(cat|type|Get-Content)\s+("[^"]+"|'[^']+'|\S+)\s*$/i)
  if (dump) {
    const target = dump[2].replace(/^["']|["']$/g, '')
    const big = tooBig(path.resolve(dir, target))
    if (big) deny(sliceAdvice(target, big), 'read-slices')
  }
  // A branch deploy is a preview, never a release (failure F3), and the remote must hold its commits.
  if (cfg.previewPatterns.some(p => new RegExp(p, 'i').test(c))) {
    const upstream = git('rev-parse --abbrev-ref --symbolic-full-name @{u}', dir)
    const unpushed = upstream ? git('rev-list @{u}..HEAD', dir) : 'no upstream'
    if (unpushed) ask(`"${c.slice(0, 60)}" deploys ${branch}, which ${upstream ? 'has commits the remote does not' : 'is not on the remote'}. Push it first: a branch deploy is a preview, never a release, and must not be the only copy.`, 'preview-unpushed')
  }
  process.exit(0)
}

if (!['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) process.exit(0)

const file = ti.file_path ?? ti.notebook_path ?? ''
const rel = relPath(dir, file).toLowerCase()
const content = [ti.content, ti.new_string, ...(ti.edits ?? []).map(e => e.new_string), ti.new_source].filter(Boolean).join('\n')

if (rel.startsWith('..')) process.exit(0)
if (matches(rel, cfg.denyPaths) || matches(rel, [`${cfg.specsDir}/*/state.json`])) deny(`${rel} is a guardrail or secrets file. Agents cannot change their own limits.`, 'guardrail-file')
if (SECRET.test(content)) deny(`The new content of ${rel} looks like a secret. Use the secret store and reference it by name.`, 'secret')
const banned = matches(rel, cfg.bannedTextPaths) && cfg.bannedText.find(t => content.includes(t))
if (banned) deny(`The new content of ${rel} contains banned text "${banned}" (house style). Recast the sentence.`, 'house-style')
if (/\b(it|describe|test)\.only\(/.test(content)) deny(`${rel}: a focused test (.only) silently skips the rest of the suite.`, 'focused-test')
const skips = /\b(it|describe|test)\.skip\(|\bxit\(|@pytest\.mark\.skip|@Disabled\b|t\.Skip\(/.test(content)
if (skips) ask(`${rel} adds a skipped test. A skip needs a quarantine entry with an owner and an expiry date.`, 'skipped-test')
// A deploy written into a script runs the same as one typed into a shell.
if (matches(rel, cfg.scriptPaths) && cfg.deployPatterns.some(p => new RegExp(p, 'i').test(content))) ask(`${rel} would run a merge, deploy or human decision when executed. A human must approve it.`, 'deploy-in-script')

// Stage gates on the artefact chain: each artefact needs the gate before it.
const spec = rel.match(new RegExp(`^${cfg.specsDir}/([^/]+)/(plan|tasks)\\.md$`))
if (spec) {
  const state = readState(dir, spec[1])
  if (state && state.stage < 3 && state.gates[1]?.status !== 'approved') deny(`${spec[2]}.md waits for gate 1 (the PRD and acceptance.feature) to be approved first.`, 'artefact-order')
}
// The PRD is built to the person's intent, so it waits for them to type one. Never suggest the words.
const prd = rel.match(new RegExp(`^${cfg.specsDir}/([^/]+)/prd\\.md$`))
if (prd) {
  const state = readState(dir, prd[1])
  if (state && ['full', 'light'].includes(state.lane) && !state.intent) deny(`prd.md waits for the person's intent. Ask them to type, in their own words: sdlc intent ${prd[1]} change: <what changes for the user>; smallest: <the smallest version that tells us it works>; drop if: <the result that would make us drop it>. Do not suggest the answers.`, 'intent-first')
}

// Code on a feature branch waits until the feature reaches Build.
const feature = listFeatures(dir).find(s => s.branch === branch)
const isDoc = rel.startsWith(`${cfg.specsDir}/`) || rel.startsWith('docs/') || rel.endsWith('.md')
if (feature && feature.stage < 4 && !isDoc) deny(`${feature.feature} is at stage ${feature.stage}. Code waits for stage 4 (Build).`, 'code-before-build')
if (feature?.lane === 'bug' && matches(rel, cfg.bugForbidPaths)) deny(`${rel} is out of scope for a bug fix (dependencies, schema, CI or infrastructure). Open a feature with /ai-sdlc:start instead.`, 'bug-scope')
if (feature?.lane === 'hotfix' && matches(rel, cfg.bugForbidPaths)) ask(`${rel} changes dependencies, schema, CI or infrastructure inside a hotfix. The on-call engineer must approve this edit.`, 'hotfix-scope')

if (matches(rel, cfg.askPaths)) ask(`${rel} controls CI, ownership or agents. A human must approve this edit.`, 'ask-path')
if (matches(rel, cfg.highRiskPaths)) ask(`${rel} is a high-risk path (autonomy ceiling L2). A human must approve this edit.`, 'high-risk')
process.exit(0)
