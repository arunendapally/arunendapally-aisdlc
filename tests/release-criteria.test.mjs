// The unit-converter run (that repo's docs/plugin-feedback.md, V4 to V6): criteria that can only run
// against the live site, or that a person checks in a browser, had no place to be proved, so Verify
// refused them and the run wrote early workarounds; and the proof ran browser tests it had no tools for.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'
import { matrix } from '../scripts/testmatrix.mjs'
import { packetText } from '../scripts/review.mjs'
import { releaseProblems, proofProblems } from '../scripts/loop.mjs'
import { lint } from '../scripts/gherkin.mjs'
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
  assert.match(problems(doc('- home page: pass')), /AC-3 is checked at release: name it on a probe line of its own with its result/)
  assert.doesNotMatch(problems(doc('- AC-3 the live page carries the released sha: pass')), /AC-3/)
  assert.match(problems(doc('- AC-3 the live page carries the released sha: not ok')), /AC-3 is checked at release/)
  const hotfix = releaseProblems(r.repo, { feature: 'demo', lane: 'hotfix', reviewedFiles: [] }, doc('- home page: pass'), loadConfig(r.repo)).problems.join('\n')
  assert.match(hotfix, /AC-3 is checked at release/, 'a hotfix releases too')
})

// merge-is-hand-check: the merge is the hand check, so the PR body carries no "Checked by hand" line.
test('merge-is-hand-check AC-1: a @manual criterion needs no "Checked by hand" line at Verify', async () => {
  const r = setup()
  const tm = await import('../scripts/testmatrix.mjs')
  assert.equal(tm.manualProblems, undefined, 'Verify has no check for the line')
  assert.ok(!matrix(r.repo, 'demo').problems.some(p => /AC-2/.test(p)))
  // The Verify request itself, on a PR body with no "Checked by hand" line: no refusal names AC-2.
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: new Date().toISOString() } } })
  r.put('specs/demo/pr.md', '## Summary\n\nx\n\n## Test results\n\nSuite: 1 passed\n\n## Pre-review\n\nRisk: medium\n\n## Not verified\n\nx\n')
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /Gate 5/, out)
  assert.doesNotMatch(out, /AC-2/)
})

test('merge-is-hand-check AC-2: the packet lists the criteria a person checks before merging', () => {
  const rows = [{ ac: 'AC-2', level: 'e2e', name: 'Usable by keyboard', due: 'manual' }, { ac: 'AC-3', level: 'e2e', name: 'Live', due: 'release' }]
  const text = packetText({ feature: 'demo', lane: 'light', head: 'abc1234', files: [], code: 0, tests: 0, deletedTests: [], untested: rows, lenses: [], newDeps: [], oversized: null, codeLines: 0, criteria: 3, last: null, sinceLast: null })
  assert.match(text, /## Check by hand before merging\n\nYour merge records that you checked these\..*\n\n- AC-2 Usable by keyboard/)
  assert.doesNotMatch(text.split('## Check by hand before merging')[0], /AC-2/, 'not repeated under criteria with no test')
  assert.match(text, /AC-3 \(e2e, at release/)
})

test('merge-is-hand-check AC-3: an untested criterion that is not @manual is still refused', () => {
  const r = setup()
  r.put('specs/demo/acceptance.feature', FEATURE.replace(' @manual', ''))
  assert.ok(matrix(r.repo, 'demo').problems.some(p => /AC-2/.test(p)))
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
  const verify = proofProblems(r.repo, r.state('demo'), '', loadConfig(r.repo)).problems
  assert.deepEqual(verify, [], 'Verify agrees with the proof on which files it runs')
})

test('V5: a proof whose only new criteria are by hand or at release passes, and says so', () => {
  const r = makeRepo()
  r.config({ proofCommand: 'node --test {files}' })
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', 'Feature: F\n  As a user\n  I want x\n  So that y\n\n  @R1 @AC-1 @e2e @manual\n  Scenario: By keyboard\n    Given a\n    When b\n    Then c\n')
  const out = r.sdlc('proof', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /Nothing for the proof to run .*AC-1 \(by hand\)/)
})

test('V4, V5: the tags go on a scenario, on an e2e criterion, one at a time; a lane with no Release cannot use @release', () => {
  const errors = text => lint(text).errors.map(e => e.message).join('\n')
  assert.match(errors('@manual\nFeature: F\n\n  @R1 @AC-1 @e2e\n  Scenario: S\n    Given a\n    When b\n    Then c\n'), /never on a Feature or Rule/)
  assert.match(errors('Feature: F\n\n  @R1 @AC-1 @unit @manual\n  Scenario: S\n    Given a\n    When b\n    Then c\n'), /a unit, subsystem or API criterion has a test/)
  assert.match(errors('Feature: F\n\n  @R1 @AC-1 @e2e @manual @release\n  Scenario: S\n    Given a\n    When b\n    Then c\n'), /both @release and @manual/)
  const r = setup()
  r.setState('demo', { stage: 5, lane: 'bug' })
  assert.match(r.sdlc('request', 'demo').out, /AC-3 is tagged @release, but the bug lane has no Release/)
})
