// stop-at-pr (ADR-0008): every lane ends at Verify, which passes on its checks; the plugin never merges;
// a @release criterion is listed for a person to check after deploy.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, switchableGate } from './helpers.mjs'
import { packet, packetText } from '../scripts/review.mjs'

const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()
const PRE = '\n## Pre-review\n\nRisk: medium, because it changes code the tests cover\nOpen findings: 0\nLenses run: correctness, tests\nRevert: git revert the merge commit\n'
const NOT_VERIFIED = '\n## Not verified\n\nThe test proof did not run: no proofCommand yet.\n'
const RELEASE_FEATURE = 'Feature: F\n  As a shopper\n  I want x\n  So that y\n\n  @R1 @AC-3 @e2e @release\n  Scenario: The live page shows the new price\n    Given a\n    When b\n    Then c\n'

// A feature at stage 5 in the given lane whose Verify checks all pass, unless the PR body leaves out a section.
function atVerify(lane, { leave = null, prd = null, feature = null, extra = '' } = {}) {
  const r = makeRepo(['hotfix', 'task'].includes(lane) ? `${lane}/demo` : 'feature/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  if (lane === 'hotfix') r.say('sdlc hotfix demo checkout returns 500')
  else if (lane === 'task') r.sdlc('task', 'demo')
  else r.sdlc('init', 'demo', ...(lane === 'full' ? ['--full'] : []))
  if (feature) r.put('specs/demo/acceptance.feature', feature)
  else fs.rmSync(path.join(r.repo, 'specs', 'demo', 'acceptance.feature'), { force: true })
  if (prd) r.put('specs/demo/prd.md', prd)
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  const doc = { hotfix: 'hotfix.md', task: 'task.md' }[lane] ?? 'pr.md'
  const first = { hotfix: ['## Incident', '## Fix', '## Rollback'], task: ['## Change', '## Why', '## Behaviour change'] }[lane] ?? ['## Summary']
  r.fill(`specs/demo/${doc}`, [...first, '## Test results'].filter(h => h !== leave), PRE + NOT_VERIFIED + extra)
  gate.green()
  r.sdlc('gate', 'demo')
  r.sdlc('review', 'demo')
  return r
}

for (const lane of ['light', 'full', 'hotfix', 'task']) {
  test(`stop-at-pr AC-1: the ${lane} lane ends at Verify, and the feature is complete`, () => {
    const r = atVerify(lane)
    const out = r.sdlc('request', 'demo')
    assert.equal(out.status, 0, out.out)
    assert.match(out.out, /demo is complete/)
    assert.ok(r.state('demo').closedAt, 'closed at Verify, with no stage after it')
    assert.equal(r.state('demo').stage, 5)
  })
}

test('stop-at-pr AC-2: Verify does not wait for a named approver', () => {
  const r = atVerify('light')
  assert.equal(fs.existsSync(path.join(r.repo, '.ai-sdlc', 'AUTONOMY')), false, 'no autonomy')
  const out = r.sdlc('request', 'demo').out
  assert.doesNotMatch(out, /waiting on/)
  assert.match(r.state('demo').gates['5'].by, /^checks/)
})

test('stop-at-pr AC-3: there is no merge command', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  const out = r.sdlc('merge', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /Unknown command/)
})

test('stop-at-pr AC-4: a @release criterion is listed to check after deploy, and Verify does not refuse it', () => {
  const r = atVerify('light', { feature: RELEASE_FEATURE, extra: '\n## Check after deploy\n\nAC-3 (e2e): the live page shows the new price\n' })
  const text = packetText(packet(r.repo, r.state('demo')))
  const after = text.split('## Check after deploy')[1]
  assert.ok(after, text)
  assert.match(after.split('\n## ')[0], /AC-3.*The live page shows the new price/)
  const out = r.sdlc('request', 'demo')
  assert.doesNotMatch(out.out, /AC-3/)
  assert.equal(out.status, 0, out.out)
})

test('stop-at-pr AC-5: completing a feature at Verify opens its outcome follow-up from the PRD', () => {
  const r = atVerify('light', { prd: '## Outcome metric\n\nMetric: share of saved items bought\nOwner: Priya\n' })
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /Outcome follow-up: Priya reads "share of saved items bought"/)
  assert.deepEqual([r.state('demo').outcome.owner, r.state('demo').outcome.metric], ['Priya', 'share of saved items bought'])
})

test('stop-at-pr AC-6: a failing Verify still stops with the reasons', () => {
  const r = atVerify('light', { leave: '## Test results' })
  const out = r.sdlc('request', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /## Test results/)
  assert.equal(r.state('demo').closedAt, undefined)
})

// Not a criterion: the plan leaves how a feature already at Release closes to a follow-up; this only
// stops "advance" from sending it back to stage 1.
test('stop-at-pr: a feature left at stage 6 closes on advance, never back to Plan', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full')
  r.setState('demo', { stage: 6, stages: { 6: { enteredAt: hoursAgo(1) } }, gates: { 6: { status: 'approved' } } })
  assert.match(r.sdlc('advance', 'demo').out, /demo is complete/)
  assert.equal(r.state('demo').stage, 6)
})

// Review finding F2: the PR body, not only the untracked packet, names each @release criterion.
test('stop-at-pr: Verify refuses a PR body that leaves an untested @release criterion out of "## Check after deploy"', () => {
  const r = atVerify('light', { feature: RELEASE_FEATURE })
  const out = r.sdlc('request', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /AC-3 is tagged @release with no test: name it under "## Check after deploy" in pr\.md/)
})

// Review finding F1: Verify is the last stage, so code committed after it passed reopens it.
test('stop-at-pr: a commit after Verify passed is flagged in status and reopens Verify on request', () => {
  const r = atVerify('light')
  assert.match(r.sdlc('request', 'demo').out, /demo is complete/)
  assert.doesNotMatch(r.sdlc('status').out, /CHANGED AFTER VERIFY/)
  r.put('src/late.js', 'export const late = 1\n')
  r.git('add', 'src/late.js')
  r.git('commit', '-q', '-m', 'after Verify')
  assert.match(r.sdlc('status').out, /demo: complete \(light lane\), CHANGED AFTER VERIFY: request Verify again/)
  const reopened = r.sdlc('request', 'demo')
  assert.match(reopened.out, /src\/late\.js changed after Verify reviewed [0-9a-f]{7}, so demo is back at stage 5 \(Verify\)/)
  assert.match(reopened.out, /the full gate has not passed at this stage/, 'the new code needs the gate again')
  assert.equal(r.state('demo').closedAt, undefined)
  r.sdlc('gate', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /passed on checks.*demo is complete/)
  assert.doesNotMatch(r.sdlc('status').out, /CHANGED AFTER VERIFY/)
})
