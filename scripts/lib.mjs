// Shared state and policy for the ai-sdlc plugin. No dependencies: Node 18+ only.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// ADR-0003: one spec gate (the PRD plus acceptance.feature), Design only in the full lane, Build on
// checks in every lane. Stage numbers keep their old meaning; there is no stage 2 any more.
export const STAGES = {
  1: { name: 'Plan', artefact: 'prd.md', owner: 'product lead',
    headings: ['## Problem', '## Users and jobs', '## Questions asked', '## Assumptions', '## Requirements', '## Never', '## Out of scope', '## Outcome metric', '## Open questions'] },
  3: { name: 'Design', artefact: 'plan.md', owner: 'architect + product lead',
    headings: ['## Decisions', '## Data model', '## Contracts', '## Threat model', '## Test plan', '## Run it'] },
  4: { name: 'Build', artefact: 'tasks.md', owner: 'checks (gate green, small diff)',
    headings: ['## Tasks'] },
  5: { name: 'Verify', artefact: 'pr.md', owner: 'CODEOWNER engineer',
    headings: ['## Summary', '## Test results', '## Pre-review', '## Not verified'] },
  6: { name: 'Release', artefact: 'release.md', owner: 'release owner',
    headings: ['## Rollout', '## Rollback (tested)', '## Probes'] },
}

// Which stages each lane runs. Bug and hotfix lanes keep one document for the whole run,
// which is also the PR body. Build passes on checks in every lane.
const BUG_BUILD = ['## Repro', '## Expected and actual', '## Root cause', '## Fix']
const HOTFIX_BUILD = ['## Incident', '## Fix', '## Rollback']
const SMALL_VERIFY = ['## Test results', '## Pre-review', '## Not verified']
export const LANES = {
  full: { stages: [1, 3, 4, 5, 6], auto: [4] },
  light: { stages: [1, 4, 5, 6], auto: [4] },
  bug: {
    stages: [4, 5], auto: [4], artefact: 'bug.md', branch: 'bug',
    headings: { 4: BUG_BUILD, 5: [...BUG_BUILD, ...SMALL_VERIFY] },
    owners: { 4: 'checks (repro red, gate green, small diff)', 5: 'CODEOWNER engineer' },
  },
  hotfix: {
    stages: [4, 5, 6], auto: [4], artefact: 'hotfix.md', branch: 'hotfix',
    headings: { 4: HOTFIX_BUILD, 5: [...HOTFIX_BUILD, ...SMALL_VERIFY], 6: [...HOTFIX_BUILD, ...SMALL_VERIFY, '## Probes', '## Follow-up'] },
    owners: { 4: 'checks (gate green, small diff)', 5: 'on-call engineer (CODEOWNER)', 6: 'incident commander' },
  },
}

LANES.task = {
  stages: [4, 5], auto: [4], artefact: 'task.md', branch: 'task',
  headings: { 4: ['## Change', '## Why', '## Behaviour change'], 5: ['## Change', '## Why', '## Behaviour change', ...SMALL_VERIFY] },
  owners: { 4: 'checks (gate green, small diff)', 5: 'CODEOWNER engineer' },
}

// What kind of work it is adds sections (and owners) to whatever lane it runs in.
// Sections are keyed by stage and land in that stage's artefact for the lane.
export const KINDS = {
  brownfield: { headings: { 1: ['## Current system'], 4: ['## Characterisation tests'] } },
  perf: { headings: { 1: ['## Performance budget'], 4: ['## Benchmark before'], 5: ['## Benchmark after'] } },
  // API work: an OpenAPI file is the contract; a breaking change must be declared.
  api: { headings: { 1: ['## API changes'] } },
  // An additive migration runs in the light lane with a down migration and the DBA on the PR. One that
  // alters or drops what exists needs the full lane (see destructiveMigrations).
  data: {
    headings: { 1: ['## Data impact'], 3: ['## Migration plan (expand-contract)', '## Rehearsal'], 4: ['## Down migration'], 6: ['## Backout'] },
    owners: { 3: 'DBA', 5: 'DBA', 6: 'DBA' },
  },
}

// Migrations that alter or drop what already exists: these are the hard-to-undo changes.
const DESTRUCTIVE = /\b(DROP\s+(TABLE|COLUMN|INDEX|CONSTRAINT)|TRUNCATE|RENAME\s+(TABLE|COLUMN|TO)|ALTER\s+COLUMN|ALTER\s+TABLE\s+\S+\s+(DROP|RENAME|ALTER|MODIFY))\b|\b(dropTable|dropColumn|renameColumn|renameTable|alterColumn|remove_column|rename_column|drop_table)\b/i
export function destructiveMigrations(dir, cfg = loadConfig(dir)) {
  return changedFiles(dir, cfg).map(f => f.file)
    .filter(f => matches(f, ['**/migrations/**', '**/*.sql', '**/schema.prisma']) && fs.existsSync(path.join(dir, f)) && DESTRUCTIVE.test(fs.readFileSync(path.join(dir, f), 'utf8')))
}

// The artefact, sections and owner of a stage, as the feature's lane and kinds define them.
// A gate the trust ledger promoted runs on checks, unless the error budget is frozen.
export function stageSpec(state, stage = state.stage, trusted = []) {
  const lane = LANES[state.lane] ?? LANES.full
  const kinds = (state.kinds ?? []).map(k => KINDS[k]).filter(Boolean)
  // Kind sections land in the lane's artefact. A one-document lane (bug, task, hotfix) carries
  // every kind section up to the current stage, since there is no earlier document to hold them.
  const extra = kinds.flatMap(k => Object.entries(k.headings ?? {})
    .filter(([s]) => lane.artefact ? Number(s) <= stage && lane.stages.includes(stage) : Number(s) === stage)
    .flatMap(([, h]) => h))
  const owners = [lane.owners?.[stage] ?? STAGES[stage].owner, ...kinds.map(k => k.owners?.[stage]).filter(Boolean)]
  return {
    name: STAGES[stage].name,
    artefact: lane.artefact ?? STAGES[stage].artefact,
    headings: [...new Set([...(lane.headings?.[stage] ?? STAGES[stage].headings), ...extra])],
    owner: owners.join(' + '),
    isAuto: (lane.auto ?? []).includes(stage) || trusted.includes(`${state.lane}:${stage}`),
  }
}

export const DEFAULT_CONFIG = {
  specsDir: 'specs',
  bannedText: ['\u2014'],
  protectedBranches: ['main', 'master'],
  denyPaths: ['.ai-sdlc/**', '.claude/settings*.json', '**/.env', '**/.env.*', '**/*.pem', '**/*.key', '**/id_rsa*', '**/*.tfstate', '**/*.tfstate.*'],
  askPaths: ['.github/workflows/**', '.github/CODEOWNERS', 'CODEOWNERS', '.claude/agents/**', '.claude/hooks/**', '.mcp.json'],
  highRiskPaths: ['**/auth/**', '**/payments/**', '**/migrations/**', 'infra/**', 'terraform/**'],
  deployPatterns: ['vercel\\b.*(--prod|--target[= ]production|\\bpromote\\b|\\balias\\b)', 'terraform\\s+apply', 'netlify\\s+deploy\\b.*--prod', 'fly(ctl)?\\s+deploy\\b',
    'firebase\\s+deploy\\b', 'wrangler\\s+(deploy|publish)\\b', '(npm|pnpm|yarn)\\s+(run\\s+)?deploy\\b', 'kubectl\\s+(apply|delete|rollout)', 'helm\\s+(install|upgrade)', 'npm\\s+publish',
    'gh\\s+pr\\s+merge', 'gh\\s+release\\s+create', 'gh\\s+(ruleset|secret|repo\\s+edit)\\b', 'gh\\s+api\\b.*(-X|--method)\\s*(?!GET\\b)[A-Z]+', 'git\\s+config\\b.*\\balias\\.',
    '\\bsdlc\\s+(approve|reject|lane|hotfix|intent|autonomy|trust|distrust|resume|unfreeze|close)\\b',
    // The same verbs through the CLI's terminal path, and the hook fed a prompt by hand, are a person's alone.
    '\\bsdlc\\.mjs["\']?\\s+(approve|reject|lane|hotfix|intent|autonomy|distrust|resume|unfreeze|close)\\b', 'hooks[\\\\/]user-prompt\\.mjs'],
  // Production is touched only by read-only probes: a command matching these must also be a probe.
  prodPatterns: ['\\b(aws|gcloud|az)\\b.*\\bprod(uction)?\\b', 'kubectl\\b.*--context[= ]\\S*prod'],
  // House-style text bans apply to these files. A repo can widen it, for example to "**".
  bannedTextPaths: ['**/*.md'],
  // Who may approve each gate, by git user.name. Empty means anyone at the keyboard.
  gateOwners: {},
  // The repo's full gate, and how to read the passing test count from its output.
  gateCommand: '',
  testCountPattern: '(\\d+)\\s+(?:tests?\\s+)?pass(?:ed|ing)?|pass(?:ed)?[:\\s]+(\\d+)',
  // MCP tools whose names look like they merge, deploy or change settings are denied unless listed in mcpAllow.
  mcpDenyPattern: '(merge|deploy|promote|rollback|release|publish|delete|apply|push|ruleset|protection|secret|setting|permission)',
  // MCP tools that act in a browser (navigate, click, type, run script, upload) ask a person unless listed
  // in mcpAllow: pages are content anyone can fill, and a browser can send data anywhere.
  mcpAskPattern: '^(navigate|computer|click|type|form_input|fill.*|javascript.*|evaluate.*|file_upload|upload.*|browser_batch)$',
  mcpAllow: [],
  // Two different loops (ADR-0004). retryCap counts failed checks after a real change; denialCap counts
  // refusals by one guard in one session, after which the session hands back and may only read until a
  // human types. A repo can lower denialCap, never raise it.
  retryCap: 3,
  denialCap: 2,
  // Review has to converge (ADR-0005): after this many refused Verify requests, step back and rethink.
  reviewRoundCap: 3,
  // A Read (or a cat) of a file bigger than this, without a slice, is refused with the sliced call.
  maxReadLines: 1500,
  maxReadBytes: 100000,
  // Preview deploys an agent may run, once its branch is on the remote; a preview is never a release.
  previewPatterns: ['\\bvercel\\b(?![^|;&]*(--prod|\\b(alias|promote|env|login|whoami|ls|list|inspect|logs|pull|link)\\b))', '\\bnetlify\\s+deploy\\b(?![^|;&]*--prod)'],
  // Files that run what they contain: a deploy written into one asks a human.
  scriptPaths: ['**/*.sh', '**/*.ps1', '**/*.bat', '**/*.cmd', '**/makefile', '**/justfile', '**/package.json', '**/taskfile.yml'],
  // Small PRs review faster: changed lines allowed per PR, by lane, excluding specs, docs and lock files.
  maxPrLines: { full: 400, light: 300, bug: 200, task: 200, hotfix: 100 },
  // More acceptance scenarios than this at Plan warns that the feature is more than one slice.
  sliceScenarios: 7,
  // What a reviewer does not reason about line by line: docs, lockfiles, snapshots, tests (counting them
  // made test-first PRs "too big"), project and tool boilerplate, and this plugin's own state.
  prLineExcludes: ['specs/**', 'docs/**', '**/*.md', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml', '**/*.lock', '**/*.snap',
    '**/*.test.*', '**/*.spec.*', '**/*_test.go', '**/test_*.py', '**/*Tests.cs', '**/*Test.cs', '**/*Test.java', '**/*Test.kt',
    '**/*.sln', '**/*.csproj', '**/tsconfig*.json', '**/launchSettings.json', '**/appsettings*.json', '**/.gitignore', '.ai-sdlc/**'],
  // Hours a human gate may wait before it is overdue and escalated, by lane.
  reviewSlaHours: { full: 24, light: 8, bug: 8, task: 8, hotfix: 1 },
  // Earned autonomy is optional (ADR-0003): with trust on, after this many clean human approvals in a
  // row a gate may be promoted to run on checks. These gates are never promoted: every merge and every
  // release. Bug and task merges joined them in ADR-0005, because nothing counts their reverts yet;
  // risk tiers, not streaks, are how merges may later need fewer people.
  trust: false,
  trustThreshold: 10,
  // Who may promote or demote a gate, by git user.name. Empty means anyone at the keyboard.
  trustOwners: [],
  neverTrust: ['full:5', 'light:5', 'full:6', 'light:6', 'hotfix:5', 'hotfix:6', 'bug:5', 'task:5'],
  // A bug fix that needs these is not a bug fix: open a feature instead.
  bugForbidPaths: ['**/package.json', '**/requirements*.txt', '**/pyproject.toml', '**/go.mod', '**/cargo.toml', '**/pom.xml', '**/build.gradle*', '**/migrations/**', '.github/**', 'infra/**', 'terraform/**'],
  // Days after a hotfix ships by which its postmortem must exist.
  postmortemDays: 2,
  // The test proof (ADR-0002): runs the traced test files against the base branch's code, where they
  // must fail. {files} becomes the quoted test files; {report}, if used, a JUnit XML path to write.
  proofCommand: '',
  // Days after release by which the outcome metric is read, unless release.md names a date. Only the
  // lanes listed here open an outcome follow-up; add "light" to turn it on there.
  outcomeWindowDays: { full: 14 },
}

// List settings in a repo's config can only add to the plugin's defaults, so a repo file
// (or an agent that slipped past a guard) can never switch a guard off.
const ADDITIVE = ['bannedText', 'bannedTextPaths', 'protectedBranches', 'denyPaths', 'askPaths', 'highRiskPaths', 'deployPatterns', 'prodPatterns', 'bugForbidPaths', 'scriptPaths']

// A read-only production probe: a read verb and no write verb.
export function isProbe(command) {
  return /\b(get|list|ls|describe|show|status|logs|top|get-\S+|list-\S+|describe-\S+)\b/.test(command) &&
    !/\b(rm|delete|put|create|update|apply|patch|cp|mv|sync|set|scale|rollout|exec|edit|deploy|remove|stop|start|restart|terminate)\b|\b\w+-(delete|put|create|update|set|remove)\b/.test(command)
}

export function root(cwd = process.cwd()) {
  try {
    return execSync('git rev-parse --show-toplevel', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return cwd
  }
}

export function git(args, cwd) {
  try {
    return execSync(`git ${args}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

// Whether a git command succeeds, for checks such as "merge-base --is-ancestor" that answer by exit code.
export function gitOk(args, cwd) {
  try {
    execSync(`git ${args}`, { cwd, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function loadConfig(dir) {
  const file = path.join(dir, '.ai-sdlc', 'config.json')
  const own = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  const cfg = { ...DEFAULT_CONFIG, ...own }
  for (const key of [...ADDITIVE, 'neverTrust']) cfg[key] = [...new Set([...DEFAULT_CONFIG[key], ...(own[key] ?? [])])]
  // A repo can widen the MCP patterns, never narrow them: its pattern is added to the default.
  for (const key of ['mcpDenyPattern', 'mcpAskPattern']) cfg[key] = own[key] ? `(?:${DEFAULT_CONFIG[key]})|(?:${own[key]})` : DEFAULT_CONFIG[key]
  cfg.denialCap = Math.max(1, Math.min(DEFAULT_CONFIG.denialCap, Number(own.denialCap) || DEFAULT_CONFIG.denialCap))
  for (const key of ['maxPrLines', 'reviewSlaHours', 'outcomeWindowDays']) cfg[key] = { ...DEFAULT_CONFIG[key], ...(own[key] ?? {}) }
  return cfg
}

export function isPaused(dir) {
  return fs.existsSync(path.join(dir, '.ai-sdlc', 'PAUSED'))
}

export function statePath(dir, feature, cfg = loadConfig(dir)) {
  return path.join(dir, cfg.specsDir, feature, 'state.json')
}

export function readState(dir, feature) {
  const file = statePath(dir, feature)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null
}

export function writeState(dir, state) {
  state.updatedAt = new Date().toISOString()
  const file = statePath(dir, state.feature)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n')
}

export function listFeatures(dir) {
  const specs = path.join(dir, loadConfig(dir).specsDir)
  if (!fs.existsSync(specs)) return []
  return fs.readdirSync(specs)
    .filter(name => fs.existsSync(path.join(specs, name, 'state.json')))
    .map(name => readState(dir, name))
}

// Sections the stage's artefact must hold, each with real content (template comments do
// not count; write "None, because ..." when a section does not apply).
export function missingHeadings(dir, state, stage = state.stage) {
  const { artefact, headings } = stageSpec(state, stage)
  const file = path.join(dir, loadConfig(dir).specsDir, state.feature, artefact)
  if (!fs.existsSync(file)) return [`${artefact} does not exist`]
  const problems = []
  for (const h of headings) {
    const body = section(fs.readFileSync(file, 'utf8'), h)
    if (body === null) problems.push(`${artefact} has no "${h}" section`)
    else if (!body) problems.push(`${artefact} section "${h}" is empty`)
  }
  return problems
}

// The text of a "## " section without template comments; null when the heading is absent.
export function section(text, heading) {
  const lines = text.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)
  const at = lines.findIndex(l => l.trim() === heading)
  if (at === -1) return null
  const end = lines.findIndex((l, i) => i > at && /^#{1,2} /.test(l))
  return lines.slice(at + 1, end === -1 ? undefined : end).join('\n').trim()
}

// The person's intent, typed as "change: ...; smallest: ...; drop if: ..." (one per line works too).
// Only the parts are checked: a word count or a number rule is passed by filler in seconds.
export const INTENT_PARTS = [['change', 'Change'], ['smallest', 'Smallest'], ['dropIf', 'Drop if']]
// A label counts only at the start of the text, of a line, or after ";" ("exchange:" is not "change:"),
// and a part runs to the next label, keeping its own semicolons and lines. "drop:" means "drop if:".
export function parseIntent(text) {
  const labels = [...text.matchAll(/(^|\n|;)[ \t]*(change|smallest|drop[ \t]+if|drop)[ \t]*:/gi)]
  const out = { change: '', smallest: '', dropIf: '' }
  labels.forEach((m, i) => {
    const key = { change: 'change', smallest: 'smallest' }[m[2].toLowerCase()] ?? 'dropIf'
    const end = i + 1 < labels.length ? labels[i + 1].index : text.length
    out[key] = text.slice(m.index + m[0].length, end).trim()
  })
  return out
}

// The PRD's "## Intent" section, written from what the person typed, replacing whatever was there.
export function withIntent(prdText, intent) {
  const block = `## Intent\n\n<!-- Typed by ${intent.by} on ${intent.at.slice(0, 10)}. Only a person changes it: sdlc intent <feature> change: ...; smallest: ...; drop if: ... -->\n\n${INTENT_PARTS.map(([k, label]) => `- ${label}: ${intent[k]}`).join('\n')}\n`
  const lines = prdText.replace(/\r\n/g, '\n').split('\n')
  const at = lines.findIndex(l => l.trim() === '## Intent')
  if (at !== -1) {
    const end = lines.findIndex((l, i) => i > at && /^#{1,2} /.test(l))
    lines.splice(at, (end === -1 ? lines.length : end) - at, ...block.split('\n'))
    return lines.join('\n')
  }
  const first = lines.findIndex(l => /^## /.test(l))
  lines.splice(first === -1 ? lines.length : first, 0, ...block.split('\n'))
  return lines.join('\n')
}

// Lines changed on this branch against the protected branch it came from, uncommitted work
// included, leaving out the paths that do not need a reviewer's line-by-line reading.
export function changedFiles(dir, cfg = loadConfig(dir)) {
  const base = cfg.protectedBranches.map(b => git(`merge-base ${b} HEAD`, dir)).find(Boolean)
  if (!base) return []
  const tracked = git(`diff --numstat ${base}`, dir).split('\n').filter(Boolean).map(line => {
    const [added, removed, file] = line.split('\t')
    return { file, lines: (Number(added) || 0) + (Number(removed) || 0) }
  })
  // New files not yet added count too, or a fresh file would slip past every limit.
  const fresh = git('ls-files --others --exclude-standard', dir).split('\n').filter(Boolean).map(file => {
    const full = path.join(dir, file)
    const lines = fs.statSync(full).size > 1e6 ? 0 : fs.readFileSync(full, 'utf8').split('\n').length
    return { file, lines }
  })
  return [...tracked, ...fresh]
}

export function changedLines(dir, cfg = loadConfig(dir)) {
  const harness = harnessFiles(dir, cfg)
  return changedFiles(dir, cfg).filter(f => !matches(f.file, cfg.prLineExcludes) && !harness.has(f.file)).reduce((sum, f) => sum + f.lines, 0)
}

// The scripts the gate and proof commands run (directly, or through an npm script) are the harness the
// plugin asks a repo for, not the change under review, so they do not count toward PR size (F-26).
function harnessFiles(dir, cfg) {
  const files = new Set()
  const scan = cmd => {
    for (const t of (cmd ?? '').split(/\s+/)) if (/^[\w./-]+\.(m?js|cjs|ts|py|sh|ps1)$/.test(t) && fs.existsSync(path.join(dir, t))) files.add(t.replace(/^\.\//, ''))
    const npm = (cmd ?? '').match(/\bnpm\s+(?:run\s+)?([\w:-]+)/)
    if (npm) {
      try {
        scan(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts?.[npm[1]]?.replace(/\bnpm\b/g, ''))
      } catch {}
    }
  }
  scan(cfg.gateCommand)
  scan(cfg.proofCommand)
  return files
}

// Waiting gates past their lane's review deadline.
export function overdueGates(dir, now = Date.now()) {
  const sla = loadConfig(dir).reviewSlaHours
  return listFeatures(dir).flatMap(s => {
    const gate = s.gates[s.stage]
    if (s.closedAt || gate?.status !== 'waiting') return []
    const hours = (now - Date.parse(gate.requestedAt)) / 36e5
    const limit = sla[s.lane] ?? sla.full
    return hours > limit ? [{ feature: s.feature, stage: s.stage, hours: Math.round(hours * 10) / 10, limit, owner: stageSpec(s).owner }] : []
  })
}

// The loop with memory (ADR-0004): an escaped bug or a hotfix owes a lesson, paid by a trap in
// standards/traps.md that names it ("- **Source:** <slug>") and is guarded by a check, not by words.
export const ENFORCED_GUARD = /\b(tests?|hooks?|lint|ci|ruleset|workflow|assert(ion)?s?|evals?|gate)\b/i
export function lessonPaid(dir, slug) {
  const file = path.join(dir, 'standards', 'traps.md')
  if (!fs.existsSync(file)) return false
  return fs.readFileSync(file, 'utf8').split(/^### /m).slice(1).some(block =>
    new RegExp(`\\*\\*Source:\\*\\*[^\\n]*\\b${slug}\\b`).test(block) && ENFORCED_GUARD.test(block.match(/\*\*Guard now:\*\*\s*(.*)/)?.[1] ?? ''))
}
export function lessonsOwed(dir) {
  return listFeatures(dir).filter(s => s.lessonOwed && !lessonPaid(dir, s.feature))
}
export const lessonProblem = slug => `a lesson is owed: add a trap to standards/traps.md with "- **Source:** ${slug}" and a "Guard now" that is a test, hook, lint rule, CI check or eval, so this cannot happen again unnoticed`

// Hotfixes shipped without a postmortem past the deadline. A hotfix's test proof runs after the
// merge, and until it passes the postmortem is not done (ADR-0002); nor is it while its lesson is
// owed (ADR-0004).
export function overduePostmortems(dir, now = Date.now()) {
  const incidents = path.join(dir, 'docs', 'incidents')
  const files = fs.existsSync(incidents) ? fs.readdirSync(incidents) : []
  const proofDue = s => loadConfig(dir).proofCommand && !s.proof?.ok
  return listFeatures(dir).filter(s => s.postmortemDue && Date.parse(s.postmortemDue) < now && (!files.some(f => f.endsWith(`-${s.feature}.md`)) || proofDue(s) || (s.lessonOwed && !lessonPaid(dir, s.feature))))
}

export const TEMPLATES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'org-ai-sdlc', 'templates')

// Copy an artefact template into the feature folder; returns its repo-relative path.
export function copyTemplate(dir, feature, name) {
  const to = path.join(dir, loadConfig(dir).specsDir, feature, name)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  if (!fs.existsSync(to)) fs.copyFileSync(path.join(TEMPLATES, name), to)
  return path.relative(dir, to).split(path.sep).join('/')
}

// One way to create a feature, whoever starts it.
export function createFeature(dir, { feature, lane = 'full', stage, branch, extra = {} }) {
  const now = new Date().toISOString()
  const first = stage ?? LANES[lane].stages[0]
  const state = {
    feature, lane, stage: first,
    branch: branch ?? `${LANES[lane].branch ?? 'feature'}/${feature}`,
    createdAt: now,
    stages: { [first]: { enteredAt: now } },
    gates: {},
    retries: {},
    ...extra,
  }
  writeState(dir, state)
  return state
}

// A person may grant a repo autonomy ("sdlc autonomy on <reason>"): every gate then passes on its
// checks, recorded as granted by them. Only a person grants it or takes it back.
export function autonomy(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, '.ai-sdlc', 'AUTONOMY'), 'utf8'))
  } catch {
    return null
  }
}

export function isFrozen(dir) {
  return fs.existsSync(path.join(dir, '.ai-sdlc', 'BUDGET_FROZEN'))
}

// The trust ledger: per "lane:stage", the run of clean human approvals and whether a human
// promoted the gate. Only hooks write it (it lives under .ai-sdlc/, which agents cannot touch).
export function readTrust(dir) {
  const file = path.join(dir, '.ai-sdlc', 'trust.json')
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
}

export function writeTrust(dir, trust) {
  const file = path.join(dir, '.ai-sdlc', 'trust.json')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(trust, null, 2) + '\n')
}

// Gates promoted to run on checks. A frozen error budget suspends every promotion.
export function trustedGates(dir) {
  if (!loadConfig(dir).trust || isFrozen(dir)) return []
  return Object.entries(readTrust(dir)).filter(([, t]) => t.promoted).map(([key]) => key)
}

// Gates that earned promotion and wait for a human to grant it.
export function promotable(dir) {
  const cfg = loadConfig(dir)
  if (!cfg.trust) return []
  return Object.entries(readTrust(dir))
    .filter(([key, t]) => !t.promoted && t.streak >= cfg.trustThreshold && !cfg.neverTrust.includes(key))
    .map(([key, t]) => ({ key, streak: t.streak }))
}

// The next stage this feature's lane runs, or undefined when the run is complete.
export function nextStage(state) {
  const stages = (LANES[state.lane] ?? LANES.full).stages
  return stages[stages.indexOf(state.stage) + 1]
}

// Minimal glob: ** spans directories, * stays inside one segment.
export function globToRegex(glob) {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*' && glob[i + 1] === '*') {
      re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*'
      i += glob[i + 2] === '/' ? 2 : 1
    } else if (c === '*') re += '[^/]*'
    else re += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${re}$`, 'i')
}

// Case-insensitive, because Windows and macOS file systems are.
export function matches(rel, globs) {
  return globs.some(g => globToRegex(g).test(rel))
}

export function relPath(dir, file) {
  return path.relative(dir, path.resolve(dir, file)).split(path.sep).join('/')
}

export function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

export function audit(dir, entry) {
  const file = path.join(dir, '.ai-sdlc', 'audit.jsonl')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n')
}
