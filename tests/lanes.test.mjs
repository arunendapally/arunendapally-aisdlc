// Bug, hotfix and task lanes, review-wait fixes, kinds, earned autonomy, knowledge, and the CI scripts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, switchableGate, plugin } from './helpers.mjs'
import { STAGES } from '../scripts/lib.mjs'

const ci = name => import(path.join(plugin, 'templates', 'repo', '.github', 'scripts', name).replace(/^([A-Z]):/, 'file:///$1:').split(path.sep).join('/'))
const BUG_BUILD = ['## Repro', '## Expected and actual', '## Root cause', '## Fix']
const VERIFY = ['## Test results', '## Pre-review', '## Not verified', '## Review honesty']
const CLEAN_PRE = '\n## Pre-review\n\nRisk: low, because tests cover it\nOpen findings: 0\nLook here first: src/app.ts:1\nLenses run: correctness, tests\n'
const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()

test('bug lane: repro red, then green, passes Build on checks; the PR review is the only human gate', () => {
  const r = makeRepo('bug/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  assert.equal(r.sdlc('bug', 'demo').status, 0)
  assert.equal(r.state('demo').stage, 4)
  assert.ok(fs.existsSync(path.join(r.repo, 'specs', 'demo', 'bug.md')))
  assert.equal(r.write('src/app.ts'), 'allow', 'code is allowed at once in the bug lane')
  assert.equal(r.write('package.json', '{}'), 'deny', 'a bug fix cannot change dependencies')
  assert.equal(r.write('db/migrations/001.sql', 'x'), 'deny')

  r.fill('specs/demo/bug.md', BUG_BUILD)
  gate.red()
  assert.match(r.sdlc('gate', 'demo').out, /Repro recorded/)
  assert.ok(r.state('demo').reproRedAt)
  gate.green()
  assert.equal(r.sdlc('gate', 'demo').status, 0)
  const build = r.sdlc('request', 'demo')
  assert.equal(build.status, 0, build.out)
  assert.match(build.out, /passed on checks/)
  assert.equal(r.sdlc('advance', 'demo').status, 0)
  assert.equal(r.state('demo').stage, 5)

  const early = r.sdlc('request', 'demo')
  assert.notEqual(early.status, 0)
  assert.match(early.out, /Test results/)
  r.fill('specs/demo/bug.md', [...BUG_BUILD, '## Test results', '## Not verified', '## Review honesty'], CLEAN_PRE)
  r.sdlc('gate', 'demo')
  r.sdlc('review', 'demo')
  const verify = r.sdlc('request', 'demo')
  assert.equal(verify.status, 0, verify.out)
  assert.match(verify.out, /Review deadline: 8h/)
  assert.match(r.say('sdlc approve demo 5'), /approved gate 5/)
  assert.match(r.sdlc('advance', 'demo').out, /complete/)
  assert.ok(r.state('demo').closedAt)
})

test('bug lane: no repro, no pass; too big, no pass; schema work is refused', () => {
  const r = makeRepo('bug/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('bug', 'demo')
  r.fill('specs/demo/bug.md', BUG_BUILD)
  gate.green()
  r.sdlc('gate', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /reproduces it/)
  r.put('src/big.ts', 'x\n'.repeat(250))
  assert.match(r.sdlc('request', 'demo').out, /over the bug lane limit of 200/)
  assert.match(r.sdlc('bug', 'other', '--kind', 'data').out, /is a feature/)
})

test('a full-lane change to the schema must be marked as data work', () => {
  const r = makeRepo()
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: hoursAgo(1) } } })
  r.fill('specs/demo/tasks.md', ['## Baseline', '## Tasks'])
  r.put('db/migrations/002_add.sql', 'alter table x add y int;\n')
  gate.green()
  r.sdlc('gate', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /this is data work/)
  assert.equal(r.sdlc('kind', 'demo', 'data').status, 0)
  assert.deepEqual(r.state('demo').kinds, ['data'])
})

test('approving needs a request first, because the request runs the checks', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.fill('specs/demo/prd.md', STAGES[1].headings)
  assert.match(r.say('sdlc approve demo 1'), /has not been requested/)
  assert.equal(r.state('demo').gates['1'], undefined)
})

test('PR size: the Verify gate refuses an oversized full-lane PR', () => {
  const r = makeRepo()
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  const PR = ['## Tasks', '## Test results', '## Mutations', '## Defects', '## Security results', '## QA verdict', '## Review honesty']
  r.fill('specs/demo/pr.md', PR, `${CLEAN_PRE}\n## Not verified\n\nThe test proof did not run: no proofCommand yet.\n`)
  r.put('src/huge.ts', 'x\n'.repeat(450))
  gate.green()
  r.sdlc('gate', 'demo')
  r.sdlc('review', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /over the full lane limit of 400/)
  fs.rmSync(path.join(r.repo, 'src', 'huge.ts'))
  assert.equal(r.sdlc('request', 'demo').status, 0)
})

test('pre-review: open findings or no risk score refuse the Verify gate', () => {
  const r = makeRepo('bug/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('bug', 'demo')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  r.fill('specs/demo/bug.md', [...BUG_BUILD, '## Test results', '## Not verified', '## Review honesty'], '\n## Pre-review\n\nRisk: medium\nOpen findings: 2\n')
  gate.green()
  r.sdlc('gate', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /open findings/)
  r.fill('specs/demo/bug.md', [...BUG_BUILD, '## Test results', '## Not verified', '## Review honesty'], '\n## Pre-review\n\nLooks fine.\n')
  assert.match(r.sdlc('request', 'demo').out, /no "Risk/)
})

test('review deadlines: an overdue gate is flagged in status and at session start', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { gates: { 1: { status: 'waiting', requestedAt: hoursAgo(30) } } })
  assert.match(r.sdlc('status').out, /OVERDUE \(deadline 24h\)/)
  assert.match(r.hook('session-start', {}), /OVERDUE: demo gate 1/)
  r.setState('demo', { gates: { 1: { status: 'waiting', requestedAt: hoursAgo(2) } } })
  assert.doesNotMatch(r.sdlc('status').out, /OVERDUE/)
})

test('hotfix: only a human declares it; it runs Build on checks, two human gates, and a postmortem is due', () => {
  const r = makeRepo('hotfix/api-down')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  assert.equal(r.bash('echo sdlc hotfix api-down broken'), 'deny')
  assert.match(r.say('sdlc hotfix api-down'), /needs the incident/)
  assert.match(r.say('sdlc hotfix api-down checkout returns 500'), /declared hotfix api-down/)
  const s = r.state('api-down')
  assert.equal(s.lane, 'hotfix')
  assert.equal(s.stage, 4)
  assert.equal(s.branch, 'hotfix/api-down')
  assert.equal(r.write('package.json', '{}'), 'ask', 'a hotfix may bump a dependency, with the on-call yes')

  const ALL = ['## Incident', '## Fix', '## Rollback', ...VERIFY.filter(h => h !== '## Pre-review'), '## Probes', '## Follow-up']
  r.fill('specs/api-down/hotfix.md', ALL, CLEAN_PRE)
  gate.green()
  r.sdlc('gate', 'api-down')
  assert.match(r.sdlc('request', 'api-down').out, /passed on checks/)
  r.sdlc('advance', 'api-down')
  r.sdlc('gate', 'api-down')
  r.sdlc('review', 'api-down')
  assert.match(r.sdlc('request', 'api-down').out, /Review deadline: 1h/)
  r.say('sdlc approve api-down 5')
  r.sdlc('advance', 'api-down')
  assert.equal(r.state('api-down').stage, 6)
  assert.equal(r.sdlc('request', 'api-down').status, 0)
  r.say('sdlc approve api-down 6')
  assert.match(r.sdlc('advance', 'api-down').out, /Postmortem due/)

  r.setState('api-down', { postmortemDue: hoursAgo(1) })
  assert.match(r.sdlc('status').out, /POSTMORTEM OVERDUE/)
  r.put('docs/incidents/2026-10-21-api-down.md', '# Incident\n')
  assert.doesNotMatch(r.sdlc('status').out, /POSTMORTEM OVERDUE/)
})

test('task lane: small chores start at Build and may touch dependencies', () => {
  const r = makeRepo('task/bump')
  assert.equal(r.sdlc('task', 'bump').status, 0)
  assert.equal(r.state('bump').lane, 'task')
  assert.ok(fs.existsSync(path.join(r.repo, 'specs', 'bump', 'task.md')))
  assert.equal(r.write('package.json', '{}'), 'allow')
})

test('kinds add the right sections, stack, and cannot be misused', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--kind', 'brownfield,perf')
  assert.deepEqual(r.state('demo').kinds, ['brownfield', 'perf'])
  r.setState('demo', { stage: 2, stages: { 2: { enteredAt: hoursAgo(1) } } })
  r.put('specs/demo/spec.md', '# Spec\n')
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /Current system/)
  assert.match(out, /Performance budget/)
  assert.match(r.sdlc('init', 'x', '--kind', 'nonsense').out, /Unknown kind/)
  r.sdlc('task', 't1')
  assert.match(r.sdlc('kind', 't1', 'data').out, /full lane/)
})

test('earned autonomy: clean approvals build a streak, a human promotes, rejection or freeze takes it back', () => {
  const r = makeRepo('bug/b3')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs', trustThreshold: 2 })
  gate.green()
  const ready = name => {
    r.sdlc('bug', name)
    r.setState(name, { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12, gateRuns: { 5: { ok: true, count: 12 } }, branch: 'bug/b3' })
    r.fill(`specs/${name}/bug.md`, [...BUG_BUILD, '## Test results', '## Not verified', '## Review honesty'], CLEAN_PRE)
    r.sdlc('review', name)
  }
  for (const name of ['b1', 'b2']) {
    ready(name)
    r.sdlc('request', name)
    r.say(`sdlc approve ${name} 5`)
    if (name === 'b1') assert.match(r.say('sdlc trust bug 5'), /has 1 clean approvals; it needs 2/, 'no promotion before the threshold')
  }
  assert.match(r.say('sdlc trust bug 4'), /needs 2/)
  assert.match(r.say('sdlc trust full 5'), /never promoted/)
  assert.match(r.sdlc('trust').out, /READY: bug:5/)
  assert.equal(r.bash('echo sdlc trust bug 5'), 'deny', 'agents cannot promote themselves')
  assert.match(r.say('sdlc trust bug 5'), /promoted gate bug:5/)

  ready('b3')
  assert.match(r.sdlc('request', 'b3').out, /passed on checks \(earned trust\)/)

  ready('b4')
  r.say('sdlc freeze')
  assert.match(r.sdlc('request', 'b4').out, /waiting on/, 'a freeze suspends promotions')
  r.say('sdlc unfreeze')
  r.say('sdlc reject b4 5 missed an edge case')
  assert.match(r.sdlc('trust').out, /bug:5: 0 clean in a row/)
  ready('b5')
  assert.match(r.sdlc('request', 'b5').out, /waiting on/, 'a rejection demotes the gate')
})

test('knowledge: source-backed pages go stale when their sources change, and broken pages fail', () => {
  const r = makeRepo()
  r.put('src/pay.ts', 'export const retry = 1\n')
  r.git('add', '.')
  r.git('commit', '-m', 'pay')
  const sha = r.git('rev-parse', '--short', 'HEAD')
  r.put('knowledge/payments-retry.md', `---\nname: payments-retry\ndescription: Retries never charge twice.\ntype: component\nsources: [src/pay.ts]\nverified: ${sha}\nconfidence: Moderate\n---\n\nSee [[glossary]].\n`)
  r.put('knowledge/glossary.md', `---\nname: glossary\ndescription: Terms.\ntype: glossary\nsources: [README.md]\nverified: ${sha}\nconfidence: Established\n---\n`)
  let out = r.sdlc('knowledge', 'check')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /2 pages, 0 invalid, 0 stale/)
  assert.match(r.sdlc('knowledge', 'for', 'src/pay.ts').out, /payments-retry/)

  r.put('src/pay.ts', 'export const retry = 2\n')
  r.git('commit', '-am', 'change pay')
  assert.match(r.sdlc('knowledge', 'check').out, /STALE knowledge\/payments-retry.md/)

  r.put('knowledge/bad.md', '---\nname: bad\ntype: opinion\n---\nSee [[nowhere]].\n')
  out = r.sdlc('knowledge', 'check')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /missing description, sources, verified, confidence/)
  assert.match(out.out, /\[\[nowhere\]\]/)
  fs.rmSync(path.join(r.repo, 'knowledge', 'bad.md'))

  r.sdlc('knowledge', 'index')
  const index = fs.readFileSync(path.join(r.repo, 'knowledge', 'INDEX.md'), 'utf8')
  assert.match(index, /payments-retry.*STALE/)
  assert.match(r.hook('session-start', {}), /Knowledge: 2 pages/)
})

test('CI: the PR body check knows each lane and the pre-review rule', async () => {
  const { problems, laneOf } = await ci('check-pr-body.mjs')
  const body = hs => hs.map(h => `${h}\n\nFilled.\n`).join('\n')
  assert.equal(laneOf(body(BUG_BUILD)), 'bug')
  assert.deepEqual(problems(body([...BUG_BUILD, '## Test results', '## Not verified', '## Review honesty']) + CLEAN_PRE), [])
  assert.ok(problems(body(BUG_BUILD)).some(p => /Test results/.test(p)))
  assert.ok(problems('## Tasks\n\nx\n').some(p => /QA verdict/.test(p)), 'a body with no lane marks is checked as full')
  assert.ok(problems(body([...BUG_BUILD, '## Test results', '## Not verified', '## Review honesty']) + '\n## Pre-review\n\nRisk: low\nOpen findings: 1\n').some(p => /open findings/.test(p)))
})

test('CI: the PR size check counts what reviewers read, and honours a human exception', async () => {
  const { verdict } = await ci('check-pr-size.mjs')
  const f = (filename, n) => ({ filename, additions: n, deletions: 0 })
  assert.equal(verdict({ files: [f('src/a.ts', 300), f('package-lock.json', 5000), f('specs/x/spec.md', 900)] }).ok, true)
  assert.equal(verdict({ files: [f('src/a.ts', 300)], lane: 'bug' }).ok, false)
  assert.equal(verdict({ files: [f('src/a.ts', 300)], lane: 'bug', labels: ['size-exception'] }).ok, true)
})

test('CI: the review deadline check escalates once, by lane', async () => {
  const { overdue, comment, MARKER } = await ci('check-review-sla.mjs')
  const now = Date.parse('2026-10-21T12:00:00Z')
  const pr = (number, hours, extra = {}) => ({ number, created_at: new Date(now - hours * 36e5).toISOString(), labels: [], requested_reviewers: [{ login: 'alice' }], ...extra })
  const late = overdue([
    pr(1, 30),
    pr(2, 2),
    pr(3, 2, { body: '## Incident\n\nx' }),
    pr(4, 30, { draft: true }),
    pr(5, 30, { approved: true }),
    pr(6, 30, { escalated: true }),
  ], now)
  assert.deepEqual(late.map(o => o.number), [1, 3])
  assert.match(comment(late[0], '@org/backup'), /@alice @org\/backup/)
  assert.ok(comment(late[0]).startsWith(MARKER))
})
