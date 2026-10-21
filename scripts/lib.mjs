// Shared state and policy for the ai-sdlc plugin. No dependencies: Node 18+ only.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const STAGES = {
  1: { name: 'Plan', artefact: 'brief.md', owner: 'product lead',
    headings: ['## Problem', '## Evidence', '## Requirements', '## Never', '## Outcome metric', '## Open questions'] },
  2: { name: 'Analyze', artefact: 'spec.md', owner: 'product lead + architect + security owner',
    headings: ['## Lane', '## Requirements', '## User journey', '## Integration decision', '## Acceptance criteria and test IDs', '## Test plan', '## SLOs and error budget', '## Threat model'] },
  3: { name: 'Design', artefact: 'plan.md', owner: 'architect + product lead',
    headings: ['## Data model', '## Contracts', '## Decisions', '## C4 changes', '## Screens', '## Accessibility checks', '## Test strategy', '## Observability', '## Operability'] },
  4: { name: 'Build', artefact: 'tasks.md', owner: 'tech lead',
    headings: ['## Baseline', '## Tasks'] },
  5: { name: 'Verify', artefact: 'pr.md', owner: 'CODEOWNER engineer + security owner (QA verdict attached)',
    headings: ['## Tasks', '## Test results', '## Mutations', '## Defects', '## Security results', '## QA verdict', '## Not verified', '## Review honesty'] },
  6: { name: 'Release', artefact: 'release.md', owner: 'release owner (SRE and ops advise)',
    headings: ['## Artefact', '## Release order', '## Rollout', '## Rollback (tested)', '## Probes', '## Runbook', '## Cost delta', '## Traps added'] },
}
STAGES[5].headings.splice(-2, 0, '## Pre-review')

// Which stages each lane runs. Bug and hotfix lanes keep one document for the whole run,
// which is also the PR body, and their Build gate is passed by checks rather than a person.
const BUG_BUILD = ['## Repro', '## Expected and actual', '## Root cause', '## Fix']
const HOTFIX_BUILD = ['## Incident', '## Fix', '## Rollback']
const SMALL_VERIFY = ['## Test results', '## Pre-review', '## Not verified', '## Review honesty']
export const LANES = {
  full: { stages: [1, 2, 3, 4, 5, 6] },
  light: { stages: [1, 2, 4, 5, 6] },
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
  greenfield: { headings: { 3: ['## Walking skeleton'] } },
  brownfield: { headings: { 2: ['## Current system'], 4: ['## Characterisation tests'] } },
  perf: { headings: { 2: ['## Performance budget'], 4: ['## Benchmark before'], 5: ['## Benchmark after'] } },
  data: {
    lane: 'full',
    headings: { 2: ['## Data impact'], 3: ['## Migration plan (expand-contract)', '## Rehearsal'], 6: ['## Backout'] },
    owners: { 3: 'DBA', 6: 'DBA' },
  },
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
  deployPatterns: ['vercel\\b.*(--prod|--target[= ]production|\\bpromote\\b)', 'terraform\\s+apply', 'kubectl\\s+(apply|delete|rollout)', 'helm\\s+(install|upgrade)', 'npm\\s+publish',
    'gh\\s+pr\\s+merge', 'gh\\s+release\\s+create', 'gh\\s+(ruleset|secret|repo\\s+edit)\\b', 'gh\\s+api\\b.*(-X|--method)\\s*(?!GET\\b)[A-Z]+', 'git\\s+config\\b.*\\balias\\.',
    '\\bsdlc\\s+(approve|reject|lane|hotfix|trust|distrust|resume|unfreeze)\\b'],
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
  mcpAllow: [],
  retryCap: 3,
  // Small PRs review faster: changed lines allowed per PR, by lane, excluding specs, docs and lock files.
  maxPrLines: { full: 400, light: 300, bug: 200, task: 200, hotfix: 100 },
  prLineExcludes: ['specs/**', 'docs/**', '**/*.md', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml', '**/*.lock', '**/*.snap'],
  // Hours a human gate may wait before it is overdue and escalated, by lane.
  reviewSlaHours: { full: 24, light: 8, bug: 8, task: 8, hotfix: 1 },
  // Earned autonomy: after this many clean human approvals in a row, a gate may be promoted to
  // run on checks. These gates are never promoted: the merge of a full feature and every release.
  trustThreshold: 10,
  // Who may promote or demote a gate, by git user.name. Empty means anyone at the keyboard.
  trustOwners: [],
  neverTrust: ['full:5', 'light:5', 'full:6', 'light:6', 'hotfix:5', 'hotfix:6'],
  // A bug fix that needs these is not a bug fix: open a feature instead.
  bugForbidPaths: ['**/package.json', '**/requirements*.txt', '**/pyproject.toml', '**/go.mod', '**/cargo.toml', '**/pom.xml', '**/build.gradle*', '**/migrations/**', '.github/**', 'infra/**', 'terraform/**'],
  // Days after a hotfix ships by which its postmortem must exist.
  postmortemDays: 2,
}

// List settings in a repo's config can only add to the plugin's defaults, so a repo file
// (or an agent that slipped past a guard) can never switch a guard off.
const ADDITIVE = ['bannedText', 'bannedTextPaths', 'protectedBranches', 'denyPaths', 'askPaths', 'highRiskPaths', 'deployPatterns', 'prodPatterns', 'bugForbidPaths']

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

export function loadConfig(dir) {
  const file = path.join(dir, '.ai-sdlc', 'config.json')
  const own = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  const cfg = { ...DEFAULT_CONFIG, ...own }
  for (const key of [...ADDITIVE, 'neverTrust']) cfg[key] = [...new Set([...DEFAULT_CONFIG[key], ...(own[key] ?? [])])]
  for (const key of ['maxPrLines', 'reviewSlaHours']) cfg[key] = { ...DEFAULT_CONFIG[key], ...(own[key] ?? {}) }
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
  return changedFiles(dir, cfg).filter(f => !matches(f.file, cfg.prLineExcludes)).reduce((sum, f) => sum + f.lines, 0)
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

// Hotfixes shipped without a postmortem past the deadline.
export function overduePostmortems(dir, now = Date.now()) {
  const incidents = path.join(dir, 'docs', 'incidents')
  const files = fs.existsSync(incidents) ? fs.readdirSync(incidents) : []
  return listFeatures(dir).filter(s => s.postmortemDue && Date.parse(s.postmortemDue) < now && !files.some(f => f.endsWith(`-${s.feature}.md`)))
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
  if (isFrozen(dir)) return []
  return Object.entries(readTrust(dir)).filter(([, t]) => t.promoted).map(([key]) => key)
}

// Gates that earned promotion and wait for a human to grant it.
export function promotable(dir) {
  const cfg = loadConfig(dir)
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
