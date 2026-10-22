// PreToolUse: fast local guardrails. GitHub rulesets and required checks stay the real
// enforcement; this only makes a breach fail sooner, inside the session.
import { root, git, loadConfig, isPaused, isProbe, readState, listFeatures, matches, relPath, readStdin, audit } from '../lib.mjs'

const SECRET = /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{32,})/

const input = readStdin()
const dir = root(input.cwd)
const cfg = loadConfig(dir)
const tool = input.tool_name
const ti = input.tool_input ?? {}

const decide = (permissionDecision, reason) => {
  audit(dir, { event: 'pre-tool', tool, decision: permissionDecision, reason })
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: `[ai-sdlc] ${reason}` } }))
  process.exit(0)
}
const deny = reason => decide('deny', reason)
const ask = reason => decide('ask', reason)

const READ_ONLY = ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'ToolSearch', 'TodoWrite']
if (isPaused(dir) && !READ_ONLY.includes(tool)) {
  deny('Agents are paused by a human (.ai-sdlc/PAUSED). Stop and wait for "sdlc resume".')
}

if (tool.startsWith('mcp__') && new RegExp(cfg.mcpDenyPattern, 'i').test(tool) && !cfg.mcpAllow.includes(tool)) {
  deny(`${tool} looks like it merges, deploys or changes settings. That is a human action; add it to mcpAllow in .ai-sdlc/config.json only if it is safe.`)
}

const branch = git('rev-parse --abbrev-ref HEAD', dir)
const onProtected = cfg.protectedBranches.includes(branch)

if (tool === 'Bash' || tool === 'PowerShell') {
  const c = ti.command ?? ''
  const protectedRef = cfg.protectedBranches.map(b => `(?:^|[\\s:/])${b}(?:\\s|$)`).join('|')
  if (/\bgit\b[^;&|]*\bpush\b/.test(c)) {
    if (/\s(--force|-f|--force-with-lease)\b/.test(c)) deny('Force push is not allowed for agents.')
    if (new RegExp(protectedRef).test(c.replace(/.*\bpush\b/, '')) || onProtected) deny(`Agents never push to ${cfg.protectedBranches.join('/')}. Push the feature branch and open a PR.`)
  }
  if (/--no-verify\b/.test(c)) deny('--no-verify skips the checks. Fix the failure instead.')
  if (onProtected && /\bgit\s+(commit|merge|rebase|cherry-pick|reset)\b/.test(c)) deny(`You are on ${branch}. Work on a feature branch in its own worktree.`)
  for (const p of cfg.deployPatterns) {
    if (new RegExp(p, 'i').test(c)) deny(`"${c.slice(0, 60)}" merges, deploys, changes settings or records a human decision. A human runs it.`)
  }
  for (const p of cfg.prodPatterns) {
    if (new RegExp(p, 'i').test(c) && !isProbe(c)) deny(`"${c.slice(0, 60)}" touches production. Agents run read-only probes only.`)
  }
  if (/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/.test(c)) deny('Piping a download into a shell runs untrusted code.')
  if (/(^|[\s'"/])\.env(?!\.example)(\.[\w-]+)?\b/.test(c) || /\bid_rsa\b|\.pem\b/.test(c)) deny('Commands may not read or write secrets files.')
  // The state CLI is exempt only when it is the whole command, never one part of a chain.
  // Staging, committing and reading git history are exempt too, since they change no file content.
  const single = !/[;&|`$<>]/.test(c.replace(/^node\s+"[^"]*"/, 'node x'))
  const isStateCli = single && /^node\s+("[^"]*sdlc\.mjs"|\S*sdlc\.mjs)(\s+[\w.=-]+)*\s*$/.test(c.trim())
  const isGitRecord = single && /^git\s+(add|commit|status|diff|log|show)\b/.test(c.trim())
  const isRead = single && /^(cat|grep|rg|head|tail|less|jq|type|Get-Content|Select-String)\b/i.test(c.trim())
  const guardrail = /(state\.json|\.ai-sdlc|PAUSED|BUDGET_FROZEN|settings(\.local)?\.json|\.github[\\/]workflows|CODEOWNERS)/i
  if (guardrail.test(c) && !isStateCli && !isGitRecord && !isRead) deny('Commands may not touch feature state, guardrails, settings, CI or ownership files. Use sdlc.mjs, or ask a human.')
  process.exit(0)
}

if (!['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) process.exit(0)

const file = ti.file_path ?? ti.notebook_path ?? ''
const rel = relPath(dir, file).toLowerCase()
const content = [ti.content, ti.new_string, ...(ti.edits ?? []).map(e => e.new_string), ti.new_source].filter(Boolean).join('\n')

if (rel.startsWith('..')) process.exit(0)
if (matches(rel, cfg.denyPaths) || matches(rel, [`${cfg.specsDir}/*/state.json`])) deny(`${rel} is a guardrail or secrets file. Agents cannot change their own limits.`)
if (SECRET.test(content)) deny(`The new content of ${rel} looks like a secret. Use the secret store and reference it by name.`)
const banned = matches(rel, cfg.bannedTextPaths) && cfg.bannedText.find(t => content.includes(t))
if (banned) deny(`The new content of ${rel} contains banned text "${banned}" (house style). Recast the sentence.`)
if (/\b(it|describe|test)\.only\(/.test(content)) deny(`${rel}: a focused test (.only) silently skips the rest of the suite.`)
const skips = /\b(it|describe|test)\.skip\(|\bxit\(|@pytest\.mark\.skip|@Disabled\b|t\.Skip\(/.test(content)
if (skips) ask(`${rel} adds a skipped test. A skip needs a quarantine entry with an owner and an expiry date.`)

// Stage gates on the artefact chain: each artefact needs the gate before it.
const spec = rel.match(new RegExp(`^${cfg.specsDir}/([^/]+)/(plan|tasks)\\.md$`))
if (spec) {
  const state = readState(dir, spec[1])
  if (state && state.stage < 3 && state.gates[1]?.status !== 'approved') deny(`${spec[2]}.md waits for gate 1 (the PRD and acceptance.feature) to be approved first.`)
}

// Code on a feature branch waits until the feature reaches Build.
const feature = listFeatures(dir).find(s => s.branch === branch)
const isDoc = rel.startsWith(`${cfg.specsDir}/`) || rel.startsWith('docs/') || rel.endsWith('.md')
if (feature && feature.stage < 4 && !isDoc) deny(`${feature.feature} is at stage ${feature.stage}. Code waits for stage 4 (Build).`)
if (feature?.lane === 'bug' && matches(rel, cfg.bugForbidPaths)) deny(`${rel} is out of scope for a bug fix (dependencies, schema, CI or infrastructure). Open a feature with /ai-sdlc:start instead.`)
if (feature?.lane === 'hotfix' && matches(rel, cfg.bugForbidPaths)) ask(`${rel} changes dependencies, schema, CI or infrastructure inside a hotfix. The on-call engineer must approve this edit.`)

if (matches(rel, cfg.askPaths)) ask(`${rel} controls CI, ownership or agents. A human must approve this edit.`)
if (matches(rel, cfg.highRiskPaths)) ask(`${rel} is a high-risk path (autonomy ceiling L2). A human must approve this edit.`)
process.exit(0)
