// The loop spine (ADR-0002): the test proof and its hash lock, the outcome
// follow-up, the wider error-budget freeze and the triggered retro.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'
import { judgeProof, readJunit, proofProblems, repeatedFindings } from '../scripts/loop.mjs'

const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()
const ACCEPT = acs => `Feature: F\n  As a user\n  I want x\n  So that y\n${acs.map(ac => `\n  @R1 @${ac} @unit\n  Scenario: S ${ac}\n    Given a\n    When b\n    Then c\n`).join('')}`
const JUNIT = 'node --test --test-reporter=junit --test-reporter-destination={report} {files}'

// A feature whose AC-1 test needs code this branch adds, so it fails on the base commit.
function proofRepo(proofCommand = 'node --test {files}') {
  const r = makeRepo()
  r.config({ proofCommand })
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', ACCEPT(['AC-1']))
  r.put('src/greet.cjs', "module.exports = () => 'hi'\n")
  r.put('tests/demo.test.cjs', "const { test } = require('node:test')\nconst assert = require('node:assert')\ntest('demo AC-1 greets', () => assert.equal(require('../src/greet.cjs')(), 'hi'))\n")
  return r
}

test('proof: the traced tests pass here and fail on the base code, and their files are locked', () => {
  const r = proofRepo()
  const out = r.sdlc('proof', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /Proof passed against [0-9a-f]{7}: AC-1/)
  const state = r.state('demo')
  assert.deepEqual(Object.keys(state.proof.files), ['tests/demo.test.cjs'])
  assert.deepEqual(proofProblems(r.repo, state, '').problems, [])

  // Weakening the test after the red run is caught.
  r.put('tests/demo.test.cjs', "require('node:test').test('demo AC-1 greets', () => {})\n")
  assert.match(proofProblems(r.repo, r.state('demo'), '').problems.join(), /changed after the proof/)
  assert.equal(fs.readdirSync(path.join(r.repo, '..')).some(f => f.startsWith('sdlc-proof-') && fs.existsSync(path.join(r.repo, '..', f, '.git'))), false, 'the worktree is removed')
})

// The calculator run (F-10): a front end in a subfolder ran its base proof without its packages, so the
// tests failed for a missing package and the proof counted that as red.
test('proof: packages in a subfolder are shared, and a red run caused by a missing package proves nothing', () => {
  const r = makeRepo()
  r.config({ proofCommand: 'node --test {files}' })
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', ACCEPT(['AC-1']))
  r.put('web/node_modules/shout/index.js', 'module.exports = s => s.toUpperCase()\n')
  r.put('web/node_modules/shout/package.json', '{"name":"shout","main":"index.js"}\n')
  r.put('web/src/greet.cjs', "module.exports = () => 'hi'\n")
  r.put('web/tests/demo.test.cjs', "const { test } = require('node:test')\nconst assert = require('node:assert')\nconst shout = require('shout')\ntest('demo AC-1 shouts', () => assert.equal(shout(require('../src/greet.cjs')()), 'HI'))\n")
  const out = r.sdlc('proof', 'demo')
  assert.equal(out.status, 0, out.out)

  const verdict = judgeProof(['AC-1'], { status: 1, output: "Error: Cannot find module 'shout'\nRequire stack: ..." })
  assert.deepEqual(verdict, [{ ac: 'AC-1', red: false, why: 'the base run failed on a missing package (shout), not on the code under test' }])
  assert.equal(judgeProof(['AC-1'], { status: 1, output: "Error: Cannot find module '../src/greet.cjs'" })[0].red, true, 'missing code under test is the point')
})

test('proof: a test that passes on the base code proves nothing, per criterion with a JUnit report', () => {
  const r = proofRepo(JUNIT)
  r.put('specs/demo/acceptance.feature', ACCEPT(['AC-1', 'AC-2']))
  r.put('tests/demo2.test.cjs', "require('node:test').test('demo AC-2 always passes', () => {})\n")
  const out = r.sdlc('proof', 'demo')
  assert.equal(out.status, 1)
  assert.match(out.out, /AC-2: its tests passed against the base code/)
  assert.doesNotMatch(out.out, /AC-1:/)
  assert.equal(r.state('demo').proof.ok, false)
  assert.match(proofProblems(r.repo, r.state('demo'), '').problems.join(), /the test proof failed/)
})

test('proof: the tests must be green on the branch first, and only new criteria are proved', () => {
  const r = proofRepo()
  r.put('src/greet.cjs', "module.exports = () => 'bye'\n")
  assert.match(r.sdlc('proof', 'demo').out, /do not pass on this branch/)
})

test('proof: "no tests collected" is not red, and JUnit failures and errors are', () => {
  assert.deepEqual(judgeProof(['AC-1'], { status: 1, output: 'No tests found, exiting with code 1', cases: null }), [{ ac: 'AC-1', red: false, why: 'the runner collected no tests' }])
  assert.equal(judgeProof(['AC-1'], { status: 1, output: 'Cannot find module ../src/greet', cases: null })[0].red, true, 'an import error on new code is red')
  assert.equal(judgeProof(['AC-1'], { status: 0, output: '1 passing', cases: null })[0].red, false, 'a green run on the base code proves nothing')
  const cases = readJunit('<testsuite><testcase name="demo AC-1 a" classname="x"><failure message="no"/></testcase><testcase name="demo AC-2 b" classname="x"/><testcase name="AC-3 c"><error/></testcase></testsuite>')
  assert.deepEqual(judgeProof(['AC-1', 'AC-2', 'AC-3', 'AC-4'], { status: 1, output: '', cases }).map(v => v.red), [true, false, true, false])
})

test('proof: without a proofCommand the Verify gate warns and the PR must say the proof did not run', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  const state = r.state('demo')
  const without = proofProblems(r.repo, state, '## Not verified\n\nNothing.\n')
  assert.match(without.warning, /No proofCommand/)
  assert.match(without.problems.join(), /must say under "## Not verified"/)
  assert.deepEqual(proofProblems(r.repo, state, '## Not verified\n\nThe test proof did not run.\n').problems, [])
  assert.match(r.sdlc('proof', 'demo').out, /A human sets it/)
  assert.deepEqual(proofProblems(r.repo, { ...state, lane: 'bug' }, '').problems, [], 'the bug lane keeps its red-first repro instead')
})

test('spike: a spike slice cannot pass Verify until it is replaced', () => {
  const r = proofRepo()
  assert.match(r.sdlc('spike', 'demo').out, /is a spike/)
  assert.match(r.sdlc('status').out, /SPIKE/)
  assert.match(proofProblems(r.repo, r.state('demo'), '').problems.join(), /spike code merges only once/)
  r.sdlc('spike', 'demo', '--off')
  assert.equal(r.state('demo').spike, false)
})

test('hotfix: the proof runs after the merge, against the code before the fix, and gates the postmortem', () => {
  const r = makeRepo('hotfix/api-down')
  r.config({ proofCommand: 'node --test {files}' })
  r.say('sdlc hotfix api-down checkout returns 500')
  const base = r.git('rev-parse', 'HEAD')
  r.put('src/greet.cjs', "module.exports = () => 'hi'\n")
  r.put('tests/api-down.test.cjs', "require('node:test').test('repro', () => require('node:assert').equal(require('../src/greet.cjs')(), 'hi'))\n")
  assert.match(r.sdlc('proof', 'api-down', '--files', 'tests/api-down.test.cjs').out, /after the merge/)
  r.git('add', '.')
  r.git('commit', '-m', 'fix')
  r.git('checkout', 'main')
  r.git('merge', '--ff-only', 'hotfix/api-down')
  r.setState('api-down', { closedAt: hoursAgo(72), postmortemDue: hoursAgo(24), proofBase: base })
  r.put('docs/incidents/2026-10-20-api-down.md', '# Incident\n')
  r.put('standards/traps.md', '### Retries hid the outage\n- **What happened:** x.\n- **Source:** api-down\n- **Guard now:** a test in tests/retry.test.ts.\n')
  assert.match(r.sdlc('status').out, /POSTMORTEM OVERDUE.*test proof has not passed/, 'a postmortem without a passing proof is not done')
  assert.match(r.sdlc('proof', 'api-down').out, /name the tests to prove with --files/)
  const out = r.sdlc('proof', 'api-down', '--files', 'tests/api-down.test.cjs')
  assert.equal(out.status, 0, out.out)
  assert.doesNotMatch(r.sdlc('status').out, /POSTMORTEM OVERDUE/)
})

test('outcome: a full-lane feature closes at Verify (ADR-0008) and leaves a follow-up with an owner, a due date and its own flow number', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, gates: { 5: { status: 'approved' } } })
  r.put('specs/demo/prd.md', '## Outcome metric\n\nMetric: checkout conversion +2%\nOwner: Priya\n')
  const closed = r.sdlc('advance', 'demo').out
  assert.match(closed, /complete\. Outcome follow-up: Priya reads "checkout conversion \+2%" by/)
  const due = r.state('demo').outcome.due
  assert.ok(Math.abs(Date.parse(due) - Date.now() - 14 * 864e5) < 6e4, 'the full lane watch window is 14 days')
  assert.match(r.sdlc('status').out, /OUTCOME DUE/)

  r.setState('demo', { outcome: { ...r.state('demo').outcome, due: hoursAgo(1) } })
  assert.match(r.sdlc('status').out, /OUTCOME OVERDUE/)
  assert.match(r.hook('session-start', {}), /OUTCOME OVERDUE: demo/)
  assert.match(r.sdlc('outcome', 'demo', 'breach', 'p95 doubled').out, /incident commander, who decides whether to declare a hotfix/)
  assert.equal(r.state('demo').outcome.status, 'open', 'a breach never closes or declares anything by itself')
  assert.match(r.sdlc('outcome', 'demo', 'met').out, /Outcome for demo: met/)
  assert.match(r.sdlc('metrics', 'demo').out, /outcome met after/)
  assert.doesNotMatch(r.sdlc('status').out, /OUTCOME/)
})

test('outcome: the PRD can name its own read date; the light lane opens one too (agile change 2)', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, gates: { 5: { status: 'approved' } } })
  r.put('specs/demo/prd.md', '## Outcome metric\n\nMetric: m\nOwner: o\nRead on: 2026-12-01\n')
  r.sdlc('advance', 'demo')
  assert.equal(r.state('demo').outcome.due.slice(0, 10), '2026-12-01')
  r.sdlc('init', 'small')
  r.setState('small', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, gates: { 5: { status: 'approved' } } })
  r.put('specs/small/prd.md', '## Outcome metric\n\nMetric: m\nOwner: o\n')
  const closed = r.sdlc('advance', 'small')
  assert.equal(closed.status, 0, closed.out)
  assert.equal(r.state('small').outcome.status, 'open', 'the light lane opens an outcome follow-up by default')
  assert.ok(Math.abs(Date.parse(r.state('small').outcome.due) - Date.now() - 7 * 864e5) < 6e4, 'the light lane watch window is 7 days')
  r.sdlc('init', 'refactor')
  r.setState('refactor', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, gates: { 5: { status: 'approved' } } })
  r.put('specs/refactor/prd.md', '## Outcome metric\n\nMetric: None, because nothing a user sees changes\n')
  r.sdlc('advance', 'refactor')
  assert.equal(r.state('refactor').outcome, undefined, '"None, because ..." opens no follow-up')

  // An overdue outcome is a reminder, never a block on the next feature.
  r.setState('small', { outcome: { ...r.state('small').outcome, due: hoursAgo(1) } })
  assert.match(r.sdlc('status').out, /OUTCOME OVERDUE/)
  assert.equal(r.sdlc('init', 'next').status, 0, 'an overdue outcome never blocks the next feature')

  r.config({ outcomeWindowDays: { light: 0 } })
  r.sdlc('init', 'small2')
  r.setState('small2', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, gates: { 5: { status: 'approved' } } })
  r.put('specs/small2/prd.md', '## Outcome metric\n\nMetric: m\nOwner: o\n')
  r.sdlc('advance', 'small2')
  assert.equal(r.state('small2').outcome, undefined, 'a repo can turn it off for light')
})

test('agile change 2: the PRD names the objective its outcome metric serves', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  const prd = fs.readFileSync(path.join(r.repo, 'specs', 'demo', 'prd.md'), 'utf8')
  assert.match(prd.split('## Outcome metric')[1].split('\n## ')[0], /\nObjective: /)
})

test('freeze: a spent error budget refuses new features but not bugs or tasks', () => {
  const r = makeRepo()
  r.put('.ai-sdlc/BUDGET_FROZEN', '')
  const refused = r.sdlc('init', 'shiny')
  assert.equal(refused.status, 1)
  assert.match(refused.out, /error budget is spent/)
  assert.equal(r.sdlc('bug', 'oops').status, 0)
  assert.equal(r.sdlc('task', 'tidy').status, 0)
  assert.match(r.hook('session-start', {}), /no new full or light features/)
})

test('triggered retro: an escalation past the cap makes the retro due in status, and running it clears that', () => {
  const r = makeRepo()
  r.config({ retryCap: 1 })
  r.sdlc('init', 'demo')
  r.sdlc('retry', 'demo', 'flaky-login')
  assert.match(r.sdlc('retry', 'demo', 'flaky-login').out, /ESCALATE/)
  assert.match(r.sdlc('status').out, /RETRO DUE: demo escalated "flaky-login"/)
  assert.doesNotMatch(r.hook('session-start', {}), /RETRO DUE/, 'status shows it; session start stays short')
  assert.match(r.sdlc('retro').out, /Triggered by: demo escalated/)
  assert.doesNotMatch(r.sdlc('status').out, /RETRO DUE/)
})

test('triggered retro: the same serious finding in two features is a repeat', () => {
  const r = makeRepo()
  r.sdlc('init', 'a')
  r.sdlc('init', 'b')
  r.sdlc('init', 'c')
  const row = (sev, item) => `| ID | Severity | Location | Checklist | Finding | Status | Source |\n|---|---|---|---|---|---|---|\n| F1 | ${sev} | README.md:1 | ${item} | x | open | pre-review |\n`
  r.put('specs/a/review.md', row('blocker', 'C3 secrets'))
  r.put('specs/b/review.md', row('major', 'C3 secrets'))
  r.put('specs/c/review.md', row('nit', 'C9 naming'))
  assert.deepEqual(repeatedFindings(r.repo), [{ item: 'C3 secrets', features: ['a', 'b'] }])
})
