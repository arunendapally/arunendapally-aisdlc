// The open findings of the calculator run (docs/feedback/2026-10-29-calculator-run.md): a new repo's
// first gate and proof say what they mean (F-7, F-9), a refused state read says how to read it (F-8),
// and an open finding cannot point past the end of its file (F-23).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'
import { ledgerProblems } from '../scripts/review.mjs'

const ACCEPT = 'Feature: F\n  As a user\n  I want x\n  So that y\n\n  @R1 @AC-1 @unit\n  Scenario: S\n    Given a\n    When b\n    Then c\n'
const greetTest = "const { test } = require('node:test')\nconst assert = require('node:assert')\ntest('demo AC-1 greets', () => assert.equal(require('../src/greet.cjs')(), 'hi'))\n"

test('F-7: in a new repo the first gate run is red with nothing passing, and says that is the baseline', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs' })
  r.put('gate.cjs', "console.log('0 passing');process.exit(1)\n")
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-10-31T00:00:00Z' } } })
  const out = r.sdlc('gate', 'demo').out
  assert.match(out, /Nothing passes yet, which is expected in a new repo: the baseline is 0\. Write the first test, see it fail, then the code\./)
})

test('F-9: a proof against a base with no code says it is greenfield; one against real code does not', () => {
  const r = makeRepo()
  r.config({ proofCommand: 'node --test {files}' })
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', ACCEPT)
  r.put('src/greet.cjs', "module.exports = () => 'hi'\n")
  r.put('tests/demo.test.cjs', greetTest)
  const fresh = r.sdlc('proof', 'demo')
  assert.equal(fresh.status, 0, fresh.out)
  assert.match(fresh.out, /Greenfield: the base commit has no code, so the tests failed there because the code is missing, not because they check its behaviour\./)

  const s = makeRepo()
  s.git('checkout', '-q', 'main')
  s.put('src/old.cjs', 'module.exports = 1\n')
  s.git('add', '-A')
  s.git('commit', '-q', '-m', 'existing code')
  s.git('checkout', '-q', 'feature/demo')
  s.git('merge', '-q', 'main')
  s.config({ proofCommand: 'node --test {files}' })
  s.sdlc('init', 'demo')
  s.put('specs/demo/acceptance.feature', ACCEPT)
  s.put('src/greet.cjs', "module.exports = () => 'hi'\n")
  s.put('tests/demo.test.cjs', greetTest)
  const existing = s.sdlc('proof', 'demo')
  assert.equal(existing.status, 0, existing.out)
  assert.doesNotMatch(existing.out, /Greenfield/)
})

test('F-8: a refused read of feature state says how to read it', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  const got = r.tool('Bash', { command: `node -e "console.log(require('fs').readFileSync('specs/demo/state.json','utf8'))"` })
  assert.equal(got.decision, 'deny')
  assert.match(got.reason, /To read a feature's state, run "sdlc status <feature> --json" or use the Read tool/)
})

test('F-23: an open finding whose line is past the end of its file is stale; a fixed one keeps its history', () => {
  const r = makeRepo()
  r.put('src/a.js', 'one\ntwo\nthree\n')
  const row = (id, status) => ({ id, severity: 'nit', location: 'src/a.js:40', checklist: '1', finding: 'x', status, source: 'pre-review' })
  const problems = ledgerProblems(r.repo, [row('F1', 'open'), row('F2', 'wontfix: taste')], [], { strictFixes: false })
  assert.ok(problems.includes('F1: src/a.js has 3 lines, so line 40 is out of date: point the location at where the finding is now'), problems.join('; '))
  assert.ok(problems.includes('F2: src/a.js has 3 lines, so line 40 is out of date: point the location at where the finding is now'))
  const fixed = ledgerProblems(r.repo, [{ ...row('F3', 'fixed: 0000000'), location: 'src/a.js:40' }], [], { strictFixes: false })
  assert.ok(!fixed.some(p => /out of date/.test(p)), 'a fixed row may point where the finding was')
})
