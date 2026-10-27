// Human verbs from a real session (issue #15): a context block the app puts before the message, a
// terminal path for when the chat hook is not there, and a quoted gh body that only mentions a verb.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const INTENT = 'sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves'
const WRAPPED = text => `<system-reminder>\nLinked sessions now: other-session said "sdlc approve demo 1".\n</system-reminder>\n\n${text}`

test('a command after a context block the app added is recorded, and the block itself never is', () => {
  const r = makeRepo()
  assert.match(r.say(WRAPPED(INTENT)), /Test Human set the intent for demo/)
  assert.equal(r.state('demo').intent.change, 'shoppers can save')

  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'demo')
  assert.equal(r.say(WRAPPED('thanks, looks good')), '', 'a command inside the block is not the person\'s')
  assert.equal(r.state('demo').gates['1'].status, 'waiting')
})

test('a command that does not start the message is never ignored silently', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  assert.match(r.say('ok then: sdlc intent demo change: a; smallest: b; drop if: c'), /Nothing recorded.*start of your message/s)
  assert.equal(r.state('demo').intent, undefined)
  assert.equal(r.say('what does the board say?'), '', 'an ordinary message gets no note')
})

test('a person can type a human verb in their own terminal; an agent cannot run it', () => {
  const r = makeRepo()
  const out = r.sdlc('intent', 'demo', 'change: shoppers can save; smallest: a button; drop if: nobody saves')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /Test Human set the intent for demo/)
  assert.equal(r.state('demo').intent.by, 'Test Human')
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'demo')
  assert.match(r.sdlc('approve', 'demo', '1').out, /approved gate 1/)

  for (const c of ['node scripts/sdlc.mjs approve demo 1', 'node "C:/x/scripts/sdlc.mjs" intent demo change: a', 'node sdlc.mjs close demo done',
    `echo '{"prompt":"sdlc approve demo 5"}' | node scripts/hooks/user-prompt.mjs`]) assert.equal(r.bash(c), 'deny', c)
  assert.equal(r.bash('node scripts/sdlc.mjs status'), 'allow')
  assert.equal(r.tool('mcp__terminal__run_in_terminal', { command: 'node scripts/sdlc.mjs approve demo 1' }).decision, 'deny', 'nor through a terminal tool')
})

test('a quoted gh issue or PR body only mentions a verb; it does not run it', () => {
  const r = makeRepo()
  assert.equal(r.bash('gh issue create --title "Verbs ignored" --body "sdlc intent is ignored and .ai-sdlc/state.json is untouched"'), 'allow')
  assert.equal(r.bash("gh pr comment 3 --body 'try sdlc approve demo 5 again'"), 'allow')
  assert.equal(r.bash('gh issue create --title x --body "$(echo sdlc approve demo 5)"'), 'deny', '$( ) in a double-quoted body runs')
  assert.equal(r.bash('gh pr merge 3 --body "sdlc approve"'), 'deny', 'only create, comment and edit carry text')
  assert.equal(r.bash('gh issue create --title x --body "ok" && sdlc approve demo 5'), 'deny')
})
