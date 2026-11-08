// The loop spine (ADR-0002): plan, test, implement, verify, review, release and observe, remember.
// - proof: the new criteria's tests, run against the base branch's code, must fail; their files are
//   hashed then and must not change before the final green run.
// - release: rollout readiness blocks; stale knowledge or facts the change touched, superseded ADRs
//   left unmarked and unlinked postmortem actions only warn (ADR-0003).
// - outcome: a follow-up after a full-lane release with an owner and a due date.
// - advance: the one way a feature moves on, after a human approval or a gate passed on checks.
// - retro triggers: an escalation past the cap, or the same review finding twice.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { STAGES, git, loadConfig, section, changedFiles, listFeatures, nextStage, writeState, matches, destructiveMigrations, scaffoldFiles, designDoc } from './lib.mjs'
import { matrix } from './testmatrix.mjs'
import { parseLedger } from './review.mjs'

export const sha256 = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)

const mergeBase = (dir, cfg) => cfg.protectedBranches.map(b => git(`merge-base ${b} HEAD`, dir)).find(Boolean)

// The test files that trace this feature's criteria, from the test matrix.
// Levels the proof leaves to their own run (proofSkipLevels, finding V6): a browser suite needs tools the
// proof command does not have. runProof and proofProblems both read the traced files through this.
const keptLevel = (test, skip) => !skip.includes(test.match(/ \((\w+)\)$/)?.[1])
export function provable(dir, feature, cfg = loadConfig(dir)) {
  const skip = cfg.proofSkipLevels ?? []
  const { rows } = tracedFiles(dir, feature)
  const kept = rows.map(r => ({ ...r, tests: r.tests.filter(t => keptLevel(t, skip)) }))
  return { rows: kept, files: [...new Set(kept.flatMap(r => r.tests.map(t => t.replace(/ \(\w+\)$/, ''))))] }
}

export function tracedFiles(dir, feature) {
  const rows = matrix(dir, feature).rows
  const files = [...new Set(rows.flatMap(r => r.tests.map(t => t.replace(/ \(\w+\)$/, ''))))]
  return { rows, files }
}

// JUnit XML from any runner: each testcase's name and classname, and whether it failed or errored.
export function readJunit(xml) {
  const cases = []
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const attr = name => m[1].match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? ''
    const body = m[3] ?? ''
    cases.push({ name: `${attr('classname')} ${attr('name')}`.trim(), red: /<(failure|error)\b/.test(body), skipped: /<skipped\b/.test(body) })
  }
  return cases
}

// Decide, per criterion, whether its tests were red against the base code. With a JUnit report,
// a criterion is red when a testcase naming it failed or errored; "no testcase" means not collected.
// Without a report, the whole run must fail and must not say that nothing was collected.
export function judgeProof(acs, run) {
  const notCollected = /no tests? (were )?(found|collected|ran)|no test files found|collected 0 items|0 tests? (run|executed)/i
  if (run.cases) {
    return acs.map(ac => {
      const mine = run.cases.filter(c => new RegExp(`\\b${ac}\\b`, 'i').test(c.name))
      if (!mine.length) return { ac, red: false, why: 'no test naming it was collected' }
      return mine.some(c => c.red) ? { ac, red: true } : { ac, red: false, why: 'its tests passed against the base code, so they do not depend on this change' }
    })
  }
  if (notCollected.test(run.output)) return acs.map(ac => ({ ac, red: false, why: 'the runner collected no tests' }))
  // Red because a package is missing is not red because the code under test is missing.
  const pkg = run.output?.match(/Cannot find (?:module|package) '((?:@[\w.-]+\/)?[\w][\w.-]*)'/)?.[1]
  if (run.status !== 0 && pkg) return acs.map(ac => ({ ac, red: false, why: `the base run failed on a missing package (${pkg}), not on the code under test` }))
  return acs.map(ac => (run.status !== 0 ? { ac, red: true } : { ac, red: false, why: 'the run passed against the base code' }))
}

// The criteria this branch adds: those the base commit's acceptance.feature does not already have.
const newCriteria = (dir, state, rows, base, cfg) => {
  const before = git(`show ${base}:${cfg.specsDir}/${state.feature}/acceptance.feature`, dir)
  return rows.filter(r => !new RegExp(`\\b${r.ac}\\b`).test(before))
}

// Run the proof command in a folder; with {report} it also reads the JUnit report the runner wrote.
const runIn = (cwd, files, cfg, report) => {
  fs.rmSync(report, { force: true })
  const command = cfg.proofCommand.replaceAll('{files}', files.map(f => `"${f}"`).join(' ')).replaceAll('{report}', `"${report}"`)
  // A node test runner inside another one reports to its parent and exits 0, so the proof runs alone.
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const r = spawnSync(command, { cwd, env, shell: true, encoding: 'utf8', timeout: 600000 })
  return { status: r.status, output: `${r.stdout ?? ''}${r.stderr ?? ''}`, cases: fs.existsSync(report) ? readJunit(fs.readFileSync(report, 'utf8')) : null }
}

// The proof: the traced tests pass on this branch, and fail against the base commit's code in a
// throwaway worktree holding today's test files. Their hashes are recorded, so a test cannot be
// weakened between the red run and the green one. opts.files names the tests in a lane with no
// acceptance.feature (a hotfix's repro); opts.base proves against a commit other than the merge-base.
export function runProof(dir, state, opts = {}, cfg = loadConfig(dir)) {
  const base = opts.base ?? mergeBase(dir, cfg)
  if (!base) return { ok: false, problems: ['no base commit to prove against'] }
  // Levels the proof leaves to their own run (proofSkipLevels, finding V6): a browser suite needs tools
  // the proof command does not have.
  const skip = cfg.proofSkipLevels ?? []
  const all = opts.files ? { rows: [], files: opts.files } : tracedFiles(dir, state.feature)
  const traced = opts.files ? all : provable(dir, state.feature, cfg)
  const skippedAcs = opts.files ? [] : all.rows.filter(r => r.tests.length && !r.tests.some(t => keptLevel(t, skip))).map(r => r.ac)
  const added = opts.files ? [] : newCriteria(dir, state, traced.rows, base, cfg)
  // Only a criterion a test traces can be proved; the rest are named, never listed as proved (finding V1).
  const acs = opts.files ? ['the repro'] : added.filter(r => r.tests.length).map(r => r.ac)
  // A @manual or @release criterion has no test by design: it is proved by hand or by a release probe.
  const due = added.filter(r => !r.tests.length && r.due && !skippedAcs.includes(r.ac)).map(r => `${r.ac} (${r.due === 'release' ? 'at release' : 'by hand'})`)
  const untested = added.filter(r => !r.tests.length && !r.due && !skippedAcs.includes(r.ac)).map(r => r.ac)
  const skipped = added.filter(r => skippedAcs.includes(r.ac)).map(r => r.ac)
  const files = traced.files
  // Nothing to run, because every new criterion is proved another way: say so, and pass.
  if (!acs.length && !untested.length && (due.length || skipped.length)) return { ok: true, problems: [], base: base.slice(0, 7), files: {}, acs: [], ...(due.length ? { due } : {}), ...(skipped.length ? { skipped, skipLevels: skip } : {}), at: new Date().toISOString() }
  if (!acs.length) return { ok: false, problems: [untested.length ? `no test traces the new criteria yet (${untested.join(', ')}): write the tests first (sdlc tests)` : 'no new criteria to prove: acceptance.feature adds none on this branch'] }
  if (!files.length) return { ok: false, problems: ['no test traces any criterion yet: write the tests first (sdlc tests)'] }
  const missing = files.filter(f => !fs.existsSync(path.join(dir, f)))
  if (missing.length) return { ok: false, problems: [`${missing.join(', ')} does not exist`] }
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), 'sdlc-proof-'))
  const report = path.join(os.tmpdir(), `sdlc-proof-${process.pid}.xml`)
  // Every installed node_modules, at the root and in subfolders such as web/ or packages/x/.
  const modules = ['node_modules', ...fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .flatMap(e => [path.join(e.name, 'node_modules'), ...fs.readdirSync(path.join(dir, e.name), { withFileTypes: true })
      .filter(s => s.isDirectory() && !s.name.startsWith('.') && s.name !== 'node_modules').map(s => path.join(e.name, s.name, 'node_modules'))])]
    .filter(m => fs.existsSync(path.join(dir, m)))
  const linked = []
  try {
    const green = runIn(dir, files, cfg, report)
    if (green.status !== 0) return { ok: false, problems: [`the traced tests do not pass on this branch, so there is no green run to prove: ${green.output.trim().split('\n').slice(-3).join(' ')}. If the gate passes these tests, the proof command itself may be broken: run it by hand with these files to see why (${files.join(' ')})`] }
    git(`worktree add --detach "${tree}" ${base}`, dir)
    if (!fs.existsSync(path.join(tree, '.git'))) return { ok: false, problems: [`could not create a worktree at the base commit ${base.slice(0, 7)}`] }
    // Installed dependencies are not in git: share them, or every test would fail for that reason alone.
    for (const m of modules) {
      const shared = path.join(tree, m)
      if (fs.existsSync(shared)) continue
      fs.mkdirSync(path.dirname(shared), { recursive: true })
      fs.symlinkSync(path.join(dir, m), shared, 'junction')
      linked.push(shared)
    }
    for (const f of files) {
      fs.mkdirSync(path.dirname(path.join(tree, f)), { recursive: true })
      fs.copyFileSync(path.join(dir, f), path.join(tree, f))
    }
    const red = runIn(tree, files, cfg, report)
    const verdicts = judgeProof(acs, opts.files ? { ...red, cases: null } : red)
    const problems = verdicts.filter(v => !v.red).map(v => `${v.ac}: ${v.why}`)
    const hashes = Object.fromEntries(files.map(f => [f, sha256(fs.readFileSync(path.join(dir, f), 'utf8'))]))
    // A base with no code (finding F-9): every test fails there for want of the code, which proves less.
    const listed = git(`ls-tree -r --name-only ${base}`, dir).split('\n').filter(Boolean)
    // What "sdlc init-repo" writes is not product code either (finding V2).
    const scaffold = scaffoldFiles()
    const greenfield = listed.length > 0 && !listed.some(f => !matches(f, cfg.prLineExcludes) && !scaffold.has(f))
    return { ok: !problems.length, problems, base: base.slice(0, 7), files: hashes, acs, ...(untested.length ? { untested } : {}), ...(due.length ? { due } : {}), ...(skipped.length ? { skipped, skipLevels: skip } : {}), perTest: Boolean(red.cases) && !opts.files, ...(greenfield ? { greenfield } : {}), at: new Date().toISOString() }
  } finally {
    // Unlink the shared folder first, so removing the worktree cannot reach through it.
    for (const shared of linked) fs.unlinkSync(shared)
    git(`worktree remove --force "${tree}"`, dir)
    fs.rmSync(tree, { recursive: true, force: true })
    fs.rmSync(report, { force: true })
  }
}

// The proved test files an agent may not change (test-lock): those of the last passing proof (state.lock,
// which a failed or narrower proof never clears), none once a person approved a new spec version after
// it (a Define gate passed on checks does not count: review F3), less a criterion's files whose conflict
// a person settled as "change the test".
export function lockedFiles(state) {
  const p = state.lock
  if (!p?.files || state.closedAt) return []
  const g = state.gates?.[1]
  if (g?.status === 'approved' && !g.auto && !String(g.by ?? '').startsWith('checks:') && g.approvedAt > p.at) return []
  const freed = Object.values(state.conflicts ?? {}).filter(c => c.decision === 'change' && c.settledAt > p.at).flatMap(c => c.files)
  return Object.keys(p.files).filter(f => !freed.includes(f))
}

// What the Verify gate requires of the proof. Without a proofCommand it only warns, and the PR must
// say the proof did not run.
export function proofProblems(dir, state, artefactText, cfg = loadConfig(dir)) {
  if (!['full', 'light'].includes(state.lane)) return { problems: [], warning: null }
  if (state.spike) return { problems: ['this slice is a spike: spike code merges only once a non-spike slice replaces it (sdlc spike <feature> --off)'], warning: null }
  if (!cfg.proofCommand) {
    const notVerified = section(artefactText, '## Not verified') ?? ''
    return {
      problems: /proof/i.test(notVerified) ? [] : ['no proofCommand is set, so the PR must say under "## Not verified" that the test proof did not run'],
      warning: 'No proofCommand in .ai-sdlc/config.json: the test proof cannot run.',
    }
  }
  const p = state.proof
  if (!p) return { problems: [`the test proof has not run: sdlc proof ${state.feature}`], warning: null }
  if (!p.ok) return { problems: [`the test proof failed: ${p.problems.join('; ')}`], warning: null }
  const changed = Object.entries(p.files).filter(([f, h]) => !fs.existsSync(path.join(dir, f)) || sha256(fs.readFileSync(path.join(dir, f), 'utf8')) !== h).map(([f]) => f)
  const problems = changed.map(f => `${f} changed after the proof; a test may not change between red and green: run sdlc proof ${state.feature} again`)
  // The files the proof was meant to run: proofSkipLevels left out, as in runProof.
  const { files } = provable(dir, state.feature, cfg)
  for (const f of files.filter(f => !p.files[f])) problems.push(`${f} traces a criterion but was not in the proof: run sdlc proof ${state.feature} again`)
  return { problems, warning: null }
}

// The value on a "Metric:" or "Owner:" line, on that line only, and never one holding a "<placeholder>".
const outcomeValue = (text, label) => {
  const value = text.match(new RegExp(`${label}:(?:\\*\\*)?[ \\t]*(.*)`, 'i'))?.[1]?.replace(/^\*+\s*/, '').trim()
  return value && !/<[^>]*>/.test(value) ? value : null
}

// The outcome follow-up a released feature leaves behind: the metric, its owner and when to read it.
// Only lanes with an outcome window open one, and "Metric: None, because ..." opens none.
export function outcomeFollowUp(state, artefactText, cfg) {
  const days = cfg.outcomeWindowDays[state.lane]
  const outcome = section(artefactText, '## Outcome metric') ?? ''
  const metric = outcomeValue(outcome, 'Metric')
  if (!days || !metric || /^None, because/i.test(metric)) return null
  const owner = outcomeValue(outcome, 'Owner')
  const readOn = outcome.match(/Read on:\s*(\d{4}-\d{2}-\d{2})/i)?.[1]
  const due = readOn ? new Date(`${readOn}T00:00:00Z`).toISOString() : new Date(Date.now() + days * 864e5).toISOString()
  return { metric, owner, due, status: 'open', openedAt: new Date().toISOString() }
}

export function overdueOutcomes(dir, now = Date.now()) {
  return listFeatures(dir).filter(s => s.outcome?.status === 'open' && Date.parse(s.outcome.due) < now)
}

// Retro triggers: why a retro is due before its schedule.
const triggerFile = dir => path.join(dir, '.ai-sdlc', 'retro-due.json')
export function readTriggers(dir) {
  return fs.existsSync(triggerFile(dir)) ? JSON.parse(fs.readFileSync(triggerFile(dir), 'utf8')) : []
}
export function addTrigger(dir, reason) {
  const list = readTriggers(dir)
  if (list.some(t => t.reason === reason)) return false
  fs.mkdirSync(path.dirname(triggerFile(dir)), { recursive: true })
  fs.writeFileSync(triggerFile(dir), JSON.stringify([...list, { reason, at: new Date().toISOString() }], null, 2) + '\n')
  return true
}
export function clearTriggers(dir) {
  fs.rmSync(triggerFile(dir), { force: true })
}

// The same serious finding twice: a checklist item with blocker or major findings in two features.
export function repeatedFindings(dir, cfg = loadConfig(dir)) {
  const byItem = {}
  for (const s of listFeatures(dir)) {
    const file = path.join(dir, cfg.specsDir, s.feature, 'review.md')
    if (!fs.existsSync(file)) continue
    for (const f of parseLedger(fs.readFileSync(file, 'utf8')).filter(f => ['blocker', 'major'].includes(f.severity) && f.checklist)) {
      byItem[f.checklist] = new Set([...(byItem[f.checklist] ?? []), s.feature])
    }
  }
  return Object.entries(byItem).filter(([, features]) => features.size >= 2).map(([item, features]) => ({ item, features: [...features] }))
}

// Move to the lane's next stage once the gate is approved; past the last stage, close the run.
// Returns what to tell the person or agent.
export function advanceFeature(dir, state) {
  const cfg = loadConfig(dir)
  const now = new Date().toISOString()
  state.stages[state.stage].leftAt = now
  const next = nextStage(state)
  if (next === undefined) {
    state.closedAt = now
    if (state.lane === 'hotfix') state.postmortemDue = new Date(Date.now() + cfg.postmortemDays * 864e5).toISOString()
    // The feature closes at its PR (ADR-0008); its outcome, from the PRD, is a follow-up with an owner and a date.
    const prd = path.join(dir, cfg.specsDir, state.feature, 'prd.md')
    const outcome = fs.existsSync(prd) ? outcomeFollowUp(state, fs.readFileSync(prd, 'utf8'), cfg) : null
    if (outcome) state.outcome = outcome
    writeState(dir, state)
    const proofNote = cfg.proofCommand ? `, and the test proof: sdlc proof ${state.feature} --files <repro tests>` : ''
    const due = state.postmortemDue ? ` Postmortem due by ${state.postmortemDue.slice(0, 10)}: sdlc incident ${state.feature}${proofNote}` : ''
    const follow = outcome ? ` Outcome follow-up: ${outcome.owner} reads "${outcome.metric}" by ${outcome.due.slice(0, 10)}, then: sdlc outcome ${state.feature} met|missed|breach` : ''
    return `${state.feature} is complete.${due}${follow}`
  }
  state.stage = next
  state.stages[state.stage] = { enteredAt: now }
  writeState(dir, state)
  return `${state.feature} is now at ${STAGES[state.stage].name}.`
}

// The risk tier of a change (ADR-0005), set by what it touches, never by who wrote it. The pre-review's
// "Risk:" label can raise it, never lower it, so an agent cannot talk its own work down.
const TIERS = ['low', 'medium', 'high']
const DOCS_ONLY = ['**/*.md', 'docs/**', '**/*.txt', 'specs/**']
const ALWAYS_A_PERSON = ['.github/**', '**/migrations/**']
export function riskTier(dir, all, preText = '', cfg = loadConfig(dir)) {
  const why = []
  // The plugin's own state and settings are not part of the change: agents cannot write them at all.
  const files = all.filter(f => !f.startsWith('.ai-sdlc/'))
  const high = files.filter(f => matches(f, [...cfg.highRiskPaths, ...cfg.askPaths, ...ALWAYS_A_PERSON]))
  if (high.length) why.push(`${high.slice(0, 3).join(', ')} ${high.length > 1 ? 'are' : 'is'} on a high-risk path, so the org's review rules decide who looks`)
  const destructive = destructiveMigrations(dir, cfg)
  if (destructive.length) why.push(`${destructive.join(', ')} alters or drops data`)
  const code = files.filter(f => !matches(f, DOCS_ONLY))
  const rule = why.length ? 'high' : code.length ? 'medium' : 'low'
  if (rule === 'medium') why.push(`it changes code (${code.slice(0, 3).join(', ')})`)
  if (rule === 'low') why.push('it changes only documents and specs')
  const label = preText.match(/Risk:\s*(low|medium|high)\b/i)?.[1]?.toLowerCase() ?? null
  const tier = TIERS[Math.max(TIERS.indexOf(rule), label ? TIERS.indexOf(label) : 0)]
  return { tier, rule, label, why }
}

// What a gate's approval covers (ADR-0005): the spec's text at Plan, the plan at Design, and otherwise
// the content of every file the change touches. Committing, amending or rebasing the same content does
// not lapse it; any new content does.
export function gateFingerprint(dir, state, stage, cfg = loadConfig(dir)) {
  const folder = path.join(dir, cfg.specsDir, state.feature)
  const read = f => (fs.existsSync(path.join(folder, f)) ? fs.readFileSync(path.join(folder, f), 'utf8').replace(/\r\n/g, '\n') : '')
  // The intent is part of what Plan approves, so a new one lapses a waiting gate 1.
  const intent = state.intent ? JSON.stringify([state.intent.change, state.intent.smallest, state.intent.dropIf]) : ''
  // db-design.md's sections approved at Plan and Design; its Build and Release sections may grow later
  // without lapsing an approval.
  // Nothing when the feature has no db-design.md, so other features hash exactly as before.
  const db = (...hs) => (state.dataDoc ? hs.map(h => `${h}\n${section(read('db-design.md'), h) ?? ''}`).join('\n') : '')
  if (stage === 1) return sha256(read('prd.md') + read('acceptance.feature') + intent + db('## Data impact'))
  if (stage === 3) return sha256(read(designDoc(dir, state)) + db('## Data model', '## Migration plan (expand-contract)'))
  const files = changedFiles(dir, cfg).map(f => f.file).filter(f => !f.startsWith(`${cfg.specsDir}/`) && !f.startsWith('.ai-sdlc/')).sort()
  const hashes = contentHashes(dir, files)
  return sha256(files.map(f => `${f}:${hashes[f] ?? 'deleted'}`).join('\n'))
}

// What Verify reviewed, file by file, so Release can tell reviewed code from code added later.
export const contentHashes = (dir, files) => Object.fromEntries(files.filter(f => fs.existsSync(path.join(dir, f)) && fs.statSync(path.join(dir, f)).isFile())
  .map(f => [f, sha256(fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n'))]))

// Code that changed after Verify reviewed it never reached a reviewer (ADR-0005). A file committed
// later with the content the review saw is not new.
export function unreviewedChanges(dir, state, cfg = loadConfig(dir)) {
  if (!state.reviewedSha || git(`cat-file -t ${state.reviewedSha}`, dir) !== 'commit') return []
  const reviewed = state.reviewedHashes ?? {}
  return git(`diff --name-only ${state.reviewedSha} HEAD`, dir).split('\n')
    .filter(f => f && !f.startsWith(`${cfg.specsDir}/`) && !f.startsWith('.ai-sdlc/'))
    .filter(f => !(f in reviewed) || contentHashes(dir, [f])[f] !== reviewed[f])
}
