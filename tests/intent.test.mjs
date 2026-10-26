// The person's intent (docs/decisions/2026-10-25-fewer-better-human-asks.md): only a person types it,
// the PRD waits for it, and every approval shows it back to them.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const INTENT = 'sdlc intent demo change: shoppers can come back to items they liked; smallest: a save button and a saved list; drop if: under 5% of shoppers save anything in two weeks'

test('only a person sets the intent, in three parts, while the feature is at Plan', () => {
  const r = makeRepo()
  assert.match(r.say('sdlc intent demo change: shoppers can save; smallest: a button'), /needs all three parts.*drop if.*Nothing recorded/s)
  assert.equal(fs.existsSync(path.join(r.repo, 'specs', 'demo', 'state.json')), false)

  assert.match(r.say(INTENT), /Test Human set the intent for demo/)
  const s = r.state('demo')
  assert.equal(s.stage, 1, 'a new feature starts at Plan')
  assert.equal(s.lane, 'light')
  assert.deepEqual([s.intent.change, s.intent.smallest, s.intent.dropIf, s.intent.by],
    ['shoppers can come back to items they liked', 'a save button and a saved list', 'under 5% of shoppers save anything in two weeks', 'Test Human'])
  assert.match(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'audit.jsonl'), 'utf8'), /"event":"intent"/)

  r.setState('demo', { stage: 4 })
  assert.match(r.say(INTENT), /past Plan.*Nothing recorded/)
})

test('an agent cannot write the PRD before the person has typed the intent', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  assert.equal(r.write('specs/demo/prd.md', READY_PRD), 'deny')
  r.say(INTENT)
  assert.equal(r.write('specs/demo/prd.md', READY_PRD), 'allow')
})

test('Plan cannot be requested without the intent; the PRD carries it verbatim, whatever an agent wrote', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  assert.match(r.sdlc('request', 'demo').out, /no intent from a person yet/)

  r.say(INTENT)
  r.put('specs/demo/prd.md', `## Intent\n\nWhatever the agent thought.\n\n${READY_PRD}`)
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /waiting on/)
  const prd = fs.readFileSync(path.join(r.repo, 'specs', 'demo', 'prd.md'), 'utf8')
  assert.match(prd, /- Drop if: under 5% of shoppers save anything in two weeks/)
  assert.doesNotMatch(prd, /Whatever the agent thought/)
  assert.equal(prd.match(/## Intent/g).length, 1)
})

test('the approval shows the person their own intent and the unconfirmed assumptions', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say(INTENT)
  r.put('specs/demo/prd.md', READY_PRD.replace('## Assumptions\n\nFilled.', '## Assumptions\n\n- A1: shoppers sign in [confirmed]\n- A2: lists stay small (recommended, accepted) [unconfirmed]')
    .replace('## Open questions\n\nFilled.', '## Open questions\n\n- A2: product lead to confirm'))
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /Your intent:\n- Change: shoppers can come back to items they liked\n- Smallest: a save button and a saved list\n- Drop if: under 5% of shoppers save anything in two weeks/)
  assert.match(out, /Unconfirmed assumptions: A2/)
})

test('a new intent while gate 1 waits lapses the request', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say(INTENT)
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'demo')
  r.say(INTENT.replace('two weeks', 'one month'))
  assert.match(r.say('sdlc approve demo 1'), /has lapsed/)
})
