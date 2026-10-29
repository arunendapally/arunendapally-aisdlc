// Friction from the calculator run's Verify stage (C:/Code/sci-calc/docs/process-findings.md, F-18 to
// F-21): a baseline that protected nothing, a size limit that refused the pre-review's own fix, and
// refusals that left no trace and no next step.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, switchableGate } from './helpers.mjs'

const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()
const BUG = ['## Repro', '## Expected and actual', '## Root cause', '## Fix', '## Test results', '## Not verified']
const PRE = '\n## Pre-review\n\nRisk: medium\nOpen findings: 0\nLenses run: correctness, tests\nRevert: git revert the merge commit\n'

function verifyRepo(lines) {
  const r = makeRepo('bug/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('bug', 'demo')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  r.put('src/total.ts', 'x\n'.repeat(lines))
  r.fill('specs/demo/bug.md', BUG, PRE)
  gate.green()
  r.sdlc('gate', 'demo')
  return r
}

test('F-18 the baseline ratchets to the most tests the feature has passed', () => {
  const r = makeRepo()
  r.put('count.cjs', "console.log(require('fs').readFileSync('COUNT', 'utf8').trim() + ' passing')\n")
  r.config({ gateCommand: 'node count.cjs' })
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: hoursAgo(1) } } })
  r.put('COUNT', '0')
  r.sdlc('gate', 'demo')
  r.put('COUNT', '26')
  assert.match(r.sdlc('gate', 'demo').out, /26 passing \(baseline 26\)/)
  r.put('COUNT', '20')
  assert.match(r.sdlc('gate', 'demo').out, /20 passing is below the 26 this feature has reached/)
})

test('F-19 a review fix may take a PR a little over the limit once its size passed at Verify; the count is shown first', () => {
  const r = verifyRepo(190)
  assert.match(r.sdlc('gate', 'demo').out, /PR size: 1\d\d of 200 code lines/)
  assert.match(r.sdlc('request', 'demo').out, /waiting on/)
  r.put('src/total.ts', 'x\n'.repeat(215))
  r.sdlc('gate', 'demo')
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /over the bug lane limit of 200, within the room for review fixes/)
  assert.match(out, /waiting on/)
  r.put('src/total.ts', 'x\n'.repeat(260))
  r.sdlc('gate', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /over the bug lane limit of 200\. Split it/)
})

test('F-20 and F-21 a refused request leaves a trace in status, and says what to do under autonomy', () => {
  const r = verifyRepo(10)
  r.fill('specs/demo/bug.md', BUG, PRE.replace('Revert: git revert the merge commit\n', ''))
  r.sdlc('request', 'demo')
  assert.match(r.sdlc('status', 'demo').out, /last request refused .*how to undo this/)
  r.say('sdlc autonomy on a demo with no users')
  assert.match(r.sdlc('request', 'demo').out, /Under autonomy no one approves around a check: fix each reason above and request again/)
  r.fill('specs/demo/bug.md', BUG, PRE)
  r.sdlc('request', 'demo')
  assert.doesNotMatch(r.sdlc('status', 'demo').out, /last request refused/)
})
