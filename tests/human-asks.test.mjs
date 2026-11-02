// The rest of the human-asks record (docs/decisions/2026-10-25-fewer-better-human-asks.md): the person
// sees their own drop-if bar when the outcome is read, and rubber-stamp signals are raw numbers per gate
// (time to approve, runs with no rejection and no human finding), never per person, with no thresholds.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'
import { approvalSignals, analyze, report } from '../scripts/retro.mjs'

const at = h => new Date(Date.parse('2026-10-01T00:00:00Z') + h * 36e5).toISOString()
const gate = (requested, approved, extra = {}) => ({ status: 'approved', by: 'Priya', requestedAt: at(requested), approvedAt: at(approved), ...extra })

test('sdlc outcome shows the person their own drop-if line', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say('sdlc intent demo change: shoppers can save; smallest: a button; drop if: under 5% of shoppers save in a week')
  r.setState('demo', { closedAt: at(0), outcome: { metric: 'saves per shopper', owner: 'Priya', due: at(24), status: 'open', openedAt: at(0) } })
  const out = r.sdlc('outcome', 'demo', 'met').out
  assert.match(out, /Outcome for demo: met\./)
  assert.match(out, /Your drop-if: under 5% of shoppers save in a week/)
})

test('approval signals are raw numbers per gate: time to approve and the longest clean run', () => {
  const evidence = [{
    repo: 'r', sla: {}, cap: 3, audit: [], traps: [], promotable: [], trust: {},
    features: [
      { feature: 'a', lane: 'light', gates: { 1: gate(0, 0.5), 5: gate(1, 1.1) }, retries: {}, stages: {} },
      { feature: 'b', lane: 'light', gates: { 1: gate(2, 4), 5: gate(3, 5) }, retries: {}, stages: {} },
      { feature: 'c', lane: 'light', gates: { 1: gate(6, 6.1, { rejections: 1 }), 4: { status: 'approved', auto: true, requestedAt: at(7), approvedAt: at(7) } }, retries: {}, stages: {} },
    ],
    reviews: [{ id: 'H1', feature: 'b', source: 'human', severity: 'major' }],
  }]
  const s = approvalSignals(evidence)
  assert.deepEqual(Object.keys(s), ['light:1', 'light:5'], 'gates passed on checks are not approvals')
  assert.equal(s['light:1'].approvals, 3)
  assert.deepEqual([s['light:1'].minHours, s['light:1'].medianHours, s['light:1'].maxHours].map(h => Math.round(h * 10) / 10), [0.1, 0.5, 2])
  assert.equal(s['light:1'].longestCleanRun, 2, 'a rejection breaks the run')
  assert.equal(s['light:5'].longestCleanRun, 1, 'a human finding at review breaks the merge run')

  const text = report(analyze(evidence))
  assert.match(text, /## Gate approvals, per gate/)
  assert.match(text, /light:1: 3 approvals, time to approve 0\.1h \/ 0\.5h \/ 2\.0h \(fastest \/ median \/ slowest\), longest run with no rejection and no human finding: 2/)
  assert.doesNotMatch(text, /Priya/, 'never per person')
})

test('sdlc metrics shows the same per-gate numbers, and no names', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { gates: { 1: gate(0, 2) } })
  const out = r.sdlc('metrics').out
  assert.match(out, /Gate approvals, per gate \(never per person; no thresholds yet\):\n  light:1: 1 approvals, time to approve 2\.0h/)
  assert.doesNotMatch(out, /Priya/)
})
