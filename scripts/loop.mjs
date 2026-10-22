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
import { STAGES, stageSpec, git, gitOk, loadConfig, section, changedFiles, listFeatures, nextStage, writeState } from './lib.mjs'
import { matrix } from './testmatrix.mjs'
import { check as knowledgeCheck, pages as knowledgePages } from './knowledge.mjs'
import { parseFacts, factProblems } from './facts.mjs'
import { parseLedger } from './review.mjs'

export const sha256 = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16)

const mergeBase = (dir, cfg) => cfg.protectedBranches.map(b => git(`merge-base ${b} HEAD`, dir)).find(Boolean)

// The test files that trace this feature's criteria, from the test matrix.
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
  return acs.map(ac => (run.status !== 0 ? { ac, red: true } : { ac, red: false, why: 'the run passed against the base code' }))
}

// The criteria this branch adds: those the base commit's acceptance.feature does not already have.
const newCriteria = (dir, state, rows, base, cfg) => {
  const before = git(`show ${base}:${cfg.specsDir}/${state.feature}/acceptance.feature`, dir)
  return rows.filter(r => !new RegExp(`\b${r.ac}\b`).test(before))
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
  const traced = opts.files ? { rows: [], files: opts.files } : tracedFiles(dir, state.feature)
  const acs = opts.files ? ['the repro'] : newCriteria(dir, state, traced.rows, base, cfg).map(r => r.ac)
  const files = traced.files
  if (!acs.length) return { ok: false, problems: ['no new criteria to prove: acceptance.feature adds none on this branch'] }
  if (!files.length) return { ok: false, problems: ['no test traces any criterion yet: write the tests first (sdlc tests)'] }
  const missing = files.filter(f => !fs.existsSync(path.join(dir, f)))
  if (missing.length) return { ok: false, problems: [`${missing.join(', ')} does not exist`] }
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), 'sdlc-proof-'))
  const report = path.join(os.tmpdir(), `sdlc-proof-${process.pid}.xml`)
  const shared = path.join(tree, 'node_modules')
  let linked = false
  try {
    const green = runIn(dir, files, cfg, report)
    if (green.status !== 0) return { ok: false, problems: [`the traced tests do not pass on this branch, so there is no green run to prove: ${green.output.trim().split('\n').slice(-3).join(' ')}`] }
    git(`worktree add --detach "${tree}" ${base}`, dir)
    if (!fs.existsSync(path.join(tree, '.git'))) return { ok: false, problems: [`could not create a worktree at the base commit ${base.slice(0, 7)}`] }
    // Installed dependencies are not in git: share them, or every test would fail for that reason alone.
    if (fs.existsSync(path.join(dir, 'node_modules')) && !fs.existsSync(shared)) {
      fs.symlinkSync(path.join(dir, 'node_modules'), shared, 'junction')
      linked = true
    }
    for (const f of files) {
      fs.mkdirSync(path.dirname(path.join(tree, f)), { recursive: true })
      fs.copyFileSync(path.join(dir, f), path.join(tree, f))
    }
    const red = runIn(tree, files, cfg, report)
    const verdicts = judgeProof(acs, opts.files ? { ...red, cases: null } : red)
    const problems = verdicts.filter(v => !v.red).map(v => `${v.ac}: ${v.why}`)
    const hashes = Object.fromEntries(files.map(f => [f, sha256(fs.readFileSync(path.join(dir, f), 'utf8'))]))
    return { ok: !problems.length, problems, base: base.slice(0, 7), files: hashes, acs, perTest: Boolean(red.cases) && !opts.files, at: new Date().toISOString() }
  } finally {
    // Unlink the shared folder first, so removing the worktree cannot reach through it.
    if (linked) fs.unlinkSync(shared)
    git(`worktree remove --force "${tree}"`, dir)
    fs.rmSync(tree, { recursive: true, force: true })
    fs.rmSync(report, { force: true })
  }
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
  const { files } = tracedFiles(dir, state.feature)
  for (const f of files.filter(f => !p.files[f])) problems.push(`${f} traces a criterion but was not in the proof: run sdlc proof ${state.feature} again`)
  return { problems, warning: null }
}

// Release: is it safe to ship (problems block), and is what we know still true (warnings)?
export function releaseProblems(dir, state, artefactText, cfg = loadConfig(dir)) {
  const problems = []
  const changed = state.reviewedFiles ?? changedFiles(dir, cfg).map(f => f.file)

  // Rollout readiness: a rollback that was actually tested, and probe results. A lane with an outcome
  // window also names who reads the outcome, or says why there is none. A hotfix is already in
  // production, so its incident commander judges these.
  if (['full', 'light'].includes(state.lane)) {
    const rollback = section(artefactText, '## Rollback (tested)') ?? ''
    if (!/\btested\b[^\n]*\d{4}-\d{2}-\d{2}/i.test(rollback)) problems.push('the rollback has no "Tested: <date>, <how>" line: test the rollback before release')
    const probes = section(artefactText, '## Probes') ?? ''
    if (!/\b(pass(ed)?|ok|green|fail(ed)?|red)\b/i.test(probes)) problems.push('"## Probes" records no result (pass or fail for each probe)')
    const outcome = section(artefactText, '## Outcome metric') ?? ''
    const none = /Metric:\s*None, because\s+\S/i.test(outcome)
    if (state.lane in cfg.outcomeWindowDays && !none && (!/Metric:\s*\S/i.test(outcome) || !/Owner:\s*\S/i.test(outcome))) problems.push('"## Outcome metric" needs "Metric:" and "Owner:" lines (or "Metric: None, because ..."), so the outcome follow-up has an owner')
  }
  problems.push(...liveProblems(dir, state, artefactText, cfg))
  return { problems, warnings: rememberWarnings(dir, state, changed, cfg) }
}

// What was released and what is live (ADR-0004, failure F3), in every lane that releases. The reviewed
// commit must be on the remote's protected branch, so a branch deploy is never the release and never
// the only copy; and the running system's build must contain it, and still contain the last release.
export const releaseSha = (dir, state) => state.reviewedSha ?? git('rev-parse HEAD', dir)
export const liveShaIn = text => (section(text, '## Probes') ?? section(text, '## Live') ?? '').match(/Live:\s*([0-9a-f]{7,40}|unknown)\b/i)?.[1]
// The commit on origin/<branch> that holds the reviewed change: the commit itself after a merge, or the
// squash commit whose patch is the same. Null when the change never reached the remote's branch.
export function landedOn(dir, sha, branch) {
  const ref = `origin/${branch}`
  if (!gitOk(`rev-parse --verify --quiet ${ref}`, dir)) return null
  if (gitOk(`merge-base --is-ancestor ${sha} ${ref}`, dir)) return sha
  const base = git(`merge-base ${sha} ${ref}`, dir)
  if (!base) return null
  const id = git(`diff ${base} ${sha} | git patch-id --stable`, dir).split(' ')[0]
  if (!id) return null
  const match = git(`log -p --no-merges ${base}..${ref} | git patch-id --stable`, dir).split('\n').map(l => l.split(' ')).find(([p]) => p === id)
  return match?.[1] ?? null
}

export function liveProblems(dir, state, artefactText, cfg = loadConfig(dir)) {
  const problems = []
  const reviewed = releaseSha(dir, state)
  if (!git('remote get-url origin', dir)) return ['the repo has no "origin" remote: a release must be on the remote, or the branch is the only copy']
  git('fetch --quiet origin', dir)
  const landed = cfg.protectedBranches.map(b => landedOn(dir, reviewed, b)).find(Boolean)
  if (!landed) problems.push(`the reviewed commit ${reviewed.slice(0, 7)} is not on origin/${cfg.protectedBranches.join(' or origin/')}: merge and push it first. A deploy from a branch is a preview, never a release`)
  const sha = landed ?? reviewed
  const live = liveShaIn(artefactText)
  if (!live) return [...problems, '"## Probes" has no "Live: <sha>" line: read the build the running system reports (a version endpoint, a meta tag, the platform\'s inspect command) and record it']
  if (/unknown/i.test(live)) return [...problems, '"Live: unknown": find out what is running before calling it released']
  // cat-file -t, not "${live}^{commit}": cmd.exe on Windows eats the caret.
  if (git(`cat-file -t ${live}`, dir) !== 'commit') return [...problems, `Live: ${live} is not a commit this repo knows: fetch, or read the build id again`]
  if (!gitOk(`merge-base --is-ancestor ${sha} ${live}`, dir)) problems.push(`the live build ${live.slice(0, 7)} does not contain the release commit ${sha.slice(0, 7)}: what is running is not this release`)
  const previous = listFeatures(dir).filter(s => s.feature !== state.feature && s.releasedSha).sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt))[0]
  if (previous && !gitOk(`merge-base --is-ancestor ${previous.releasedSha} ${live}`, dir)) problems.push(`the live build ${live.slice(0, 7)} no longer contains ${previous.feature} (${previous.releasedSha.slice(0, 7)}), released before: this deploy rolled it back`)
  return problems
}

// What the change may have made untrue. These warn at Release, and an agent re-verifies them.
export function rememberWarnings(dir, state, changed, cfg = loadConfig(dir)) {
  const problems = []

  // Remember: no knowledge page or fact this change touched may be stale.
  const { stale } = knowledgeCheck(dir)
  const touched = new Set(knowledgePages(dir).filter(p => Array.isArray(p.meta?.sources) && p.meta.sources.some(s => changed.some(c => c === s || c.startsWith(s.replace(/\/?$/, '/'))))).map(p => p.file))
  for (const s of stale.filter(s => touched.has(s.file))) problems.push(`knowledge page ${s.file} is stale (${s.why}): re-verify it against the code`)
  const facts = path.join(dir, cfg.specsDir, state.feature, 'facts.md')
  if (fs.existsSync(facts)) {
    const mine = parseFacts(fs.readFileSync(facts, 'utf8')).facts.filter(f => changed.includes(f.file))
    for (const p of factProblems(dir, mine).filter(p => /is stale/.test(p))) problems.push(`facts.md: ${p}`)
  }

  // ADRs the change supersedes must say so.
  const texts = [path.join(dir, cfg.specsDir, state.feature, 'plan.md'), ...changed.filter(f => /^docs\/adr\/.+\.md$/.test(f)).map(f => path.join(dir, f))]
    .filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8'))
  const superseded = [...new Set(texts.flatMap(t => [...t.matchAll(/\bsupersedes?\s+ADR-(\d{1,4})\b/gi)].map(m => m[1].padStart(4, '0'))))]
  for (const id of superseded) {
    const folder = path.join(dir, 'docs', 'adr')
    const file = fs.existsSync(folder) ? fs.readdirSync(folder).find(f => f.startsWith(id)) : null
    if (!file) problems.push(`the change supersedes ADR-${id}, which docs/adr does not have`)
    else if (!/^Status:\s*superseded/im.test(fs.readFileSync(path.join(folder, file), 'utf8'))) problems.push(`ADR-${id} is superseded by this change: set its "Status: superseded by ..."`)
  }

  // Postmortems: every action links to the trap, test, check or PRD it became, with an owner and a date.
  const link = /\]\(|https?:\/\/|#\d+|[\w.-]+\/[\w./-]+/
  for (const f of changed.filter(f => /^docs\/incidents\/.+\.md$/.test(f) && fs.existsSync(path.join(dir, f)))) {
    const rows = (section(fs.readFileSync(path.join(dir, f), 'utf8'), '## Actions') ?? '').split('\n')
      .filter(l => /^\|/.test(l) && !/^\|\s*Action\s*\|/i.test(l) && !/^\|[\s|:-]+\|$/.test(l))
    for (const row of rows) {
      const [action, becomes, owner, due] = row.split('|').slice(1, -1).map(c => c.trim())
      if (!link.test(becomes ?? '') || !owner || !/\d{4}-\d{2}-\d{2}/.test(due ?? '')) problems.push(`${f}: action "${(action ?? '').slice(0, 40)}" needs a link to the trap, test, check or PRD it became, an owner and a due date`)
    }
  }
  return problems
}

// The outcome follow-up a released feature leaves behind: the metric, its owner and when to read it.
// Only lanes with an outcome window open one, and "Metric: None, because ..." opens none.
export function outcomeFollowUp(state, artefactText, cfg) {
  const days = cfg.outcomeWindowDays[state.lane]
  const outcome = section(artefactText, '## Outcome metric') ?? ''
  const metric = outcome.match(/Metric:\s*(.+)/i)?.[1]?.trim()
  if (!days || !metric || /^None, because/i.test(metric)) return null
  const owner = outcome.match(/Owner:\s*(.+)/i)?.[1]?.trim()
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
    // What shipped and what was live when it did, so the next release can check it is still there.
    if (state.stage === 6) {
      const artefact = path.join(dir, cfg.specsDir, state.feature, stageSpec(state, 6).artefact)
      state.releasedSha = cfg.protectedBranches.map(b => landedOn(dir, releaseSha(dir, state), b)).find(Boolean) ?? releaseSha(dir, state)
      const live = fs.existsSync(artefact) ? liveShaIn(fs.readFileSync(artefact, 'utf8')) : null
      if (live && !/unknown/i.test(live)) state.liveSha = live
    }
    // The feature closes at release; its outcome is a follow-up with an owner and a date.
    const release = path.join(dir, cfg.specsDir, state.feature, 'release.md')
    const outcome = fs.existsSync(release) ? outcomeFollowUp(state, fs.readFileSync(release, 'utf8'), cfg) : null
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
  return `${state.feature} is now at stage ${state.stage} (${STAGES[state.stage].name}).`
}
