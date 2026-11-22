// amend-drops-gate-runs: going back to Define drops the gate runs of the stages it leaves, as it
// drops their approvals, so Verify never reads an old run's count against a newer baseline.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

test('amending a feature at Verify drops the old Build and Verify gate runs, so Verify asks for a new one', () => {
  const r = makeRepo('feature/save-list')
  r.config({ gateOwners: { 1: ['Test Human'] } }) // a person keeps Define, so there is an approval to drift from
  r.sdlc('init', 'save-list')
  r.say('sdlc intent save-list change: shoppers can save; smallest: a button; drop if: nobody saves')
  r.put('specs/save-list/prd.md', READY_PRD)
  r.put('specs/save-list/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'save-list')
  assert.match(r.say('sdlc approve save-list 1'), /approved Define/)
  r.setState('save-list', { stage: 5, baseline: 9, gateRuns: { 4: { ok: true, count: 9 }, 5: { ok: true, count: 9 } } })
  r.put('specs/save-list/prd.md', READY_PRD.replace('Save an item', 'Save and share an item'))
  assert.match(r.sdlc('amend', 'save-list').out, /goes back to Define/)
  const s = r.state('save-list')
  assert.equal(s.stage, 1)
  assert.equal(s.gateRuns?.[4], undefined, 'the Build run was on the old spec')
  assert.equal(s.gateRuns?.[5], undefined, 'the Verify run was on the old spec')
  assert.equal(s.baseline, 9, 'the baseline ratchet stays')
})
