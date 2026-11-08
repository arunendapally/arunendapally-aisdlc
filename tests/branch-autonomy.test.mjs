// ADR-0007: on the feature's own branch, Define and Design pass on their checks; Verify passes on its own
// checks (ADR-0008) and never touches main; a named owner, a send-back, a frozen budget or risky Design work keeps the person.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, READY_PRD, READY_FEATURE, switchableGate } from './helpers.mjs'
import { STAGES, LANES, BRANCH_AUTO, DEFAULT_CONFIG } from '../scripts/lib.mjs'
import { packetText } from '../scripts/review.mjs'
import { runtimePath } from '../scripts/lib.mjs'

const INTENT = 'sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves'
const PLAN = STAGES[3].headings.map(h => `${h}\n\nNone, because the test needs no design here.\n`).join('\n')

// A full-lane feature on its own branch with a spec that passes every Define check.
function ready(cfg = {}) {
  const r = makeRepo()
  r.config({ gateOwners: {}, ...cfg })
  r.sdlc('init', 'demo', '--full')
  r.say(INTENT)
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  return r
}
const auditOf = r => fs.readFileSync(runtimePath(r.repo, 'audit.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))

test('AC-1: a complete spec on the feature branch passes Define on its checks, and is audited', () => {
  const r = ready()
  const out = r.sdlc('request', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /passed on checks \(feature branch\)/)
  const s = r.state('demo')
  assert.equal(s.gates['1'].by, 'checks: feature branch')
  assert.equal(s.stage, 3)
  assert.ok(auditOf(r).some(e => e.event === 'auto' && e.feature === 'demo' && e.stage === 1 && e.by === 'checks: feature branch'))
})

test('AC-2: a complete design on the feature branch passes Design on its checks', () => {
  const r = ready()
  r.sdlc('request', 'demo')
  r.put('specs/demo/plan.md', PLAN)
  const out = r.sdlc('request', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.equal(r.state('demo').gates['3'].by, 'checks: feature branch')
  assert.equal(r.state('demo').stage, 4)
})

test('the branch rule covers Define and Design only', () => {
  assert.deepEqual(BRANCH_AUTO, [1, 3])
  for (const lane of Object.keys(LANES)) for (const s of BRANCH_AUTO) assert.ok(!DEFAULT_CONFIG.neverTrust.includes(`${lane}:${s}`))
  assert.ok(!BRANCH_AUTO.includes(5) && !BRANCH_AUTO.includes(6))
})

test('AC-3: Verify passes on its checks and main does not move', () => {
  const r = makeRepo()
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('init', 'demo', '--full')
  fs.rmSync(path.join(r.repo, 'specs', 'demo', 'acceptance.feature'), { force: true })
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: new Date(Date.now() - 36e5).toISOString() } }, baseline: 12 })
  r.fill('specs/demo/pr.md', ['## Summary', '## Test results'],
    `
## Pre-review

Risk: medium, because it changes code the tests cover
Open findings: 0
Lenses run: correctness, tests
Revert: git revert the merge commit

## Not verified

The test proof did not run: no proofCommand yet.
`)
  gate.green()
  r.sdlc('gate', 'demo')
  r.sdlc('review', 'demo')
  const main = r.git('rev-parse', 'main')
  const out = r.sdlc('request', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.match(r.state('demo').gates['5'].by, /^checks/)
  assert.equal(r.git('rev-parse', 'main'), main, 'the plugin never moves main')
  assert.equal(r.git('rev-parse', '--abbrev-ref', 'HEAD'), 'feature/demo')
})

test('AC-4: editing a spec that passed on checks sends the work back to Define, which passes again on the branch', () => {
  const r = ready()
  r.sdlc('request', 'demo')
  r.put('specs/demo/prd.md', READY_PRD.replace('Save an item.', 'Save an item, once.'))
  r.put('specs/demo/plan.md', PLAN)
  const out = r.sdlc('request', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /goes back to Define.*Request the Define gate again: it passes on its checks on this branch/s)
  assert.equal(r.state('demo').stage, 1)
})

test('AC-5: a spec that fails its checks is refused with the reasons and not approved', () => {
  const r = ready()
  r.put('specs/demo/prd.md', READY_PRD.replace(/## Requirements[\s\S]*?(?=\n## Non)/, ''))
  const out = r.sdlc('request', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /## Requirements/)
  assert.equal(r.state('demo').gates['1'], undefined)
})

test('AC-6: the review packet lists gates passed on checks and drift', () => {
  const text = packetText({ feature: 'demo', lane: 'full', head: 'abc1234', files: [], code: 0, tests: 0, deletedTests: [], untested: [], lenses: [], newDeps: [], oversized: null, codeLines: 0, criteria: 0, last: null, sinceLast: null,
    autoGates: [{ event: 'auto', stage: 1, revision: 1, at: '2026-11-06T06:00:00Z' }, { event: 'spec-drift', at: '2026-11-06T07:00:00Z' }] })
  assert.match(text, /## Gates passed on checks/)
  assert.match(text, /Define: passed on checks, 2026-11-06T06:00:00Z/)
  assert.match(text, /spec-drift: 2026-11-06T07:00:00Z/)
})

test('off the feature branch, on main or detached, Define waits for a person and names the switch', () => {
  const r = ready()
  r.git('checkout', '-q', 'main')
  const out = r.sdlc('request', 'demo')
  assert.match(out.out, /waiting on: product lead/)
  assert.match(out.out, /switch to feature\/demo/)
  const d = ready()
  d.git('checkout', '-q', '--detach')
  assert.match(d.sdlc('request', 'demo').out, /waiting on: product lead/)
})

test('a person named in gateOwners keeps the gate', () => {
  const r = ready({ gateOwners: { 1: ['Priya'] } })
  const out = r.sdlc('request', 'demo')
  assert.match(out.out, /waiting on: product lead/)
  assert.match(out.out, /gateOwners names Priya/)
})

test('a waiting or rejected gate keeps its person, and a send-back survives drift', () => {
  const r = ready({ gateOwners: { 1: ['Test Human'] } })
  r.sdlc('request', 'demo')
  r.say('sdlc reject demo 1 needs a real problem statement')
  r.config({ gateOwners: {} })
  assert.match(r.sdlc('request', 'demo').out, /waiting on: product lead/, 'a rejected gate keeps its person')
  r.say('sdlc approve demo 1')
  r.put('specs/demo/prd.md', READY_PRD.replace('Save an item.', 'Save an item, once.') + '\n## Changes since v1\n\n- Once.\n')
  r.put('specs/demo/plan.md', PLAN)
  r.sdlc('request', 'demo')
  const again = r.sdlc('request', 'demo')
  assert.match(again.out, /waiting on: product lead/)
  assert.match(again.out, /sent Define back/)
})

test('a frozen error budget keeps the person', () => {
  const r = ready()
  r.put('.ai-sdlc/BUDGET_FROZEN', 'x')
  assert.match(r.sdlc('request', 'demo').out, /waiting on: product lead.*error budget is frozen/s)
})

test('data work keeps its people at Design', () => {
  const r = ready()
  r.sdlc('request', 'demo')
  r.setState('demo', { kinds: ['data'] })
  r.put('specs/demo/plan.md', PLAN)
  const out = r.sdlc('request', 'demo')
  assert.doesNotMatch(out.out, /passed on checks/)
})

// Each condition of the rule, pinned directly (pre-review F1, F3, F5): a repo on feature/demo with nothing else blocking.
test('the rule itself: each condition keeps the person, and only the switch message names the switch', async () => {
  const { branchAutoBlock } = await import('../scripts/lib.mjs')
  const r = makeRepo()
  const cfg = { ...DEFAULT_CONFIG, gateOwners: {} }
  const base = { feature: 'demo', branch: 'feature/demo', stage: 1, gates: {}, kinds: [] }
  assert.equal(branchAutoBlock(r.repo, base, cfg), null)
  assert.equal(branchAutoBlock(r.repo, { ...base, stage: 3 }, cfg), null)
  for (const stage of [4, 5, 6]) assert.match(branchAutoBlock(r.repo, { ...base, stage }, cfg), /not a stage/, `gate ${stage} keeps its own route`)
  assert.match(branchAutoBlock(r.repo, { ...base, gates: { 1: { status: 'waiting' } } }, cfg), /Define is waiting/)
  assert.match(branchAutoBlock(r.repo, { ...base, stage: 3, kinds: ['data'] }, cfg), /data work/)
  assert.equal(branchAutoBlock(r.repo, { ...base, kinds: ['data'] }, cfg), null, 'data work still passes Define on checks')
  assert.match(branchAutoBlock(r.repo, { ...base, stage: 3 }, cfg, 'personal data'), /Security and privacy touches personal data/)
  assert.match(branchAutoBlock(r.repo, { ...base, branch: 'HEAD' }, cfg), /no branch of its own/)
  assert.match(branchAutoBlock(r.repo, { ...base, branch: 'main' }, cfg), /no branch of its own/)
  assert.match(branchAutoBlock(r.repo, { ...base, branch: 'feature/other' }, cfg), /switch to feature\/other/)
  assert.match(branchAutoBlock(r.repo, { ...base, branch: 'feature/other' }, { ...cfg, gateOwners: { 1: ['Priya'] } }), /gateOwners names Priya/, 'a named owner is named, not the switch')
})
