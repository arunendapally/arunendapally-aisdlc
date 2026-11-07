// Autonomy (the 29 Oct calculator run): a person grants a repo autonomy once, with a reason, and every
// gate then passes on its checks. Only a person grants or takes it back; the guards stay.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const GRANT = 'sdlc autonomy on a demo calculator with no users and no data'

test('only a person grants autonomy, with a reason, and can take it back', () => {
  const r = makeRepo()
  assert.match(r.say('sdlc autonomy on'), /needs a reason.*Nothing recorded/s)
  assert.match(r.say(GRANT), /Test Human granted autonomy/)
  const flag = JSON.parse(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'AUTONOMY'), 'utf8'))
  assert.deepEqual([flag.by, flag.reason], ['Test Human', 'a demo calculator with no users and no data'])
  assert.match(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'audit.jsonl'), 'utf8'), /"event":"autonomy-on"/)
  assert.match(r.sdlc('status').out, /AUTONOMY: granted by Test Human/)

  assert.equal(r.bash('echo sdlc autonomy on because'), 'deny', 'an agent cannot grant itself autonomy')
  assert.equal(r.bash('node scripts/sdlc.mjs autonomy on because'), 'deny')
  assert.equal(r.write('.ai-sdlc/AUTONOMY', '{}'), 'deny')

  assert.match(r.say('sdlc autonomy off'), /took autonomy back/)
  assert.equal(fs.existsSync(path.join(r.repo, '.ai-sdlc', 'AUTONOMY')), false)
})

test('with autonomy, every gate passes on its checks, and the PRD may carry the agent-written intent', () => {
  const r = makeRepo()
  r.say(GRANT)
  r.sdlc('init', 'demo')
  assert.equal(r.write('specs/demo/prd.md', READY_PRD), 'allow', 'no typed intent is needed')
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  assert.match(r.sdlc('request', 'demo').out, /PRD has no "## Intent"/, 'the intent is still required, written into the PRD')

  r.put('specs/demo/prd.md', `## Intent\n\n- Change: shoppers can save\n- Smallest: a button\n- Drop if: nobody saves\n\n${READY_PRD}`)
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /passed on checks \(autonomy granted by Test Human\)/)
  const s = r.state('demo')
  assert.equal(s.gates['1'].by, 'checks: autonomy granted by Test Human')
  assert.equal(s.stage, 4, 'the light lane moves on to Build by itself')
})

test('with autonomy, messages say what happens next without a person, and risky work moves to the full lane itself', () => {
  const r = makeRepo()
  r.say(GRANT)
  r.sdlc('init', 'demo')
  r.put('specs/demo/prd.md', `## Intent\n\n- Change: a\n- Smallest: b\n- Drop if: c\n\n${READY_PRD}`)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'demo')
  r.put('specs/demo/prd.md', `## Intent\n\n- Change: a\n- Smallest: b\n- Drop if: c\n\n${READY_PRD.replace('Save an item', 'Save and share an item')}`)
  assert.match(r.sdlc('request', 'demo').out, /change request or amend the existing PRD\?/)
  const drift = r.sdlc('amend', 'demo').out
  assert.match(drift, /goes back to Define\. Request the Define gate again: it passes on its checks under autonomy/)
  assert.doesNotMatch(drift, /a person approves/)

  r.put('specs/demo/prd.md', `## Intent\n\n- Change: a\n- Smallest: b\n- Drop if: c\n\n${READY_PRD.replace('Save an item', 'Save and share an item')}\n## Changes since v1\n\nSharing added.\n`)
  assert.match(r.sdlc('request', 'demo').out, /passed on checks/)
  r.put('src/auth/login.ts', 'export const x = 1\n')
  const risky = r.sdlc('request', 'demo').out
  assert.match(risky, /high-risk paths, so demo moves to the full lane and goes back to Design/)
  const s = r.state('demo')
  assert.deepEqual([s.lane, s.stage], ['full', 3])
})

test('without autonomy nothing changes: a person still approves', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say('sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves')
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  assert.match(r.sdlc('request', 'demo').out, /waiting on/)
})
