// The unit-converter run (that repo's docs/plugin-feedback.md, V4 to V6): criteria that can only run
// against the live site, or that a person checks in a browser, had no place to be proved, so Verify
// refused them and the run wrote early workarounds; and the proof ran browser tests it had no tools for.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'
import { matrix, manualProblems } from '../scripts/testmatrix.mjs'
import { releaseProblems } from '../scripts/loop.mjs'
import { loadConfig } from '../scripts/lib.mjs'

const FEATURE = 'Feature: F\n  As a user\n  I want x\n  So that y\n\n  @R1 @AC-1 @unit\n  Scenario: Converts\n    Given a\n    When b\n    Then c\n\n' +
  '  @R1 @AC-2 @e2e @manual\n  Scenario: Usable by keyboard\n    Given a\n    When b\n    Then c\n\n' +
  '  @R1 @AC-3 @e2e @release\n  Scenario: The live page is the released version\n    Given a\n    When b\n    Then c\n'
const setup = () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', FEATURE)
  r.put('test/demo.test.mjs', "// demo\ntest('AC-1 converts', () => {})\n")
  return r
}

test('V4: a @release criterion is due at Release, not refused at Verify', () => {
  const r = setup()
  const m = matrix(r.repo, 'demo')
  assert.ok(!m.problems.some(p => /AC-3/.test(p)), m.problems.join('\n'))
  assert.equal(m.rows.find(x => x.ac === 'AC-3').due, 'release')
  assert.match(r.sdlc('tests', 'demo').out, /\| AC-3 .*\| at release \|/)
})

test('V4: Release refuses until a probe names each @release criterion with a pass', () => {
  const r = setup()
  const doc = probes => `## Rollout\n\nAll at once.\n\n## Rollback (tested)\n\nTested: 2026-11-02, revert and redeploy on a fork\n\n## Probes\n\n${probes}\n\nLive: abcdef1\n\n## Outcome metric\n\nMetric: None, because nothing about visitors is collected\n`
  const problems = text => releaseProblems(r.repo, { feature: 'demo', lane: 'light', reviewedFiles: [] }, text, loadConfig(r.repo)).problems.join('\n')
  assert.match(problems(doc('- home page: pass')), /AC-3 is checked at release: name it in a probe with its result/)
  assert.doesNotMatch(problems(doc('- AC-3 the live page carries the released sha: pass')), /AC-3/)
})

test('V5: a @manual criterion needs a "Checked by hand" line with who, when and how in the PR body', () => {
  const r = setup()
  const pr = line => `## Summary\n\nx\n\n## Test results\n\nSuite: 1 passed\n${line}\n\n## Pre-review\n\nRisk: medium\n\n## Not verified\n\nx\n`
  assert.match(manualProblems(r.repo, 'demo', pr('')).join('\n'), /AC-2 is checked by hand: add "Checked by hand: AC-2, <who>, <YYYY-MM-DD>, <how>" under "## Test results"/)
  assert.match(manualProblems(r.repo, 'demo', pr('Checked by hand: AC-2')).join('\n'), /AC-2/)
  assert.deepEqual(manualProblems(r.repo, 'demo', pr('Checked by hand: AC-2, Arun, 2026-11-04, Chromium and Safari, keyboard only')), [])
  assert.ok(!matrix(r.repo, 'demo').problems.some(p => /AC-2/.test(p)))
})

test('V6: the proof skips the levels proofSkipLevels names, and says so', () => {
  const r = makeRepo()
  r.config({ proofCommand: 'node --test {files}', proofSkipLevels: ['e2e'] })
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', 'Feature: F\n  As a user\n  I want x\n  So that y\n\n  @R1 @AC-1 @unit\n  Scenario: S\n    Given a\n    When b\n    Then c\n\n  @R1 @AC-2 @e2e\n  Scenario: T\n    Given a\n    When b\n    Then d\n')
  r.put('src/greet.cjs', "module.exports = () => 'hi'\n")
  r.put('tests/demo.test.cjs', "const { test } = require('node:test')\nconst assert = require('node:assert')\ntest('demo AC-1 greets', () => assert.equal(require('../src/greet.cjs')(), 'hi'))\n")
  r.put('test/e2e/demo.e2e.cjs', "require('playwright-that-is-not-installed') // demo AC-2\n")
  const out = r.sdlc('proof', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /: AC-1 failed on the base code/)
  assert.match(out.out, /Not proved, e2e tests are left to their own run \(proofSkipLevels\): AC-2\./)
})
