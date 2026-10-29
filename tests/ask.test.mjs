// Ask, don't make people paste commands (owner feedback, 29 Oct): the agent asks with the question tool,
// the person clicks, and a PostToolUse hook records the answer with the same checks a typed command has.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const INTENT = 'sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves'
const asked = (questions, answers, extra = {}) => ({ hook_event_name: 'PostToolUse', tool_name: 'AskUserQuestion', tool_input: { questions, ...(answers ? { answers } : {}) }, ...extra })

function waitingPlan() {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say(INTENT)
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'demo')
  const out = r.sdlc('ask', 'demo')
  assert.equal(out.status, 0, out.out)
  return { r, question: JSON.parse(out.out).questions[0] }
}

test('sdlc ask prints the gate question: approve or send back, bound to what was checked', () => {
  const { r, question } = waitingPlan()
  const fp = r.state('demo').gates['1'].fingerprint.slice(0, 8)
  assert.match(question.question, new RegExp(`\\[gate demo 1 ${fp}\\]$`))
  assert.deepEqual(question.options.map(o => o.label), ['Approve', 'Send back'])
  assert.equal(question.multiSelect, false)
})

test('a click on Approve records the approval, from either answer shape', () => {
  const { r, question } = waitingPlan()
  const out = r.hook('answers', asked([question], { [question.question]: 'Approve' }))
  assert.match(out, /Test Human approved gate 1/)
  assert.equal(r.state('demo').gates['1'].by, 'Test Human')
  assert.equal(r.state('demo').stage, 4)

  const t = waitingPlan()
  t.r.hook('answers', asked([t.question], null, { tool_response: `User has answered your questions: "${t.question.question}"="Approve". You can now continue.` }))
  assert.equal(t.r.state('demo').gates['1'].status, 'approved')
})

test('Send back, or a written answer, records a rejection with the reason', () => {
  const { r, question } = waitingPlan()
  r.hook('answers', asked([question], { [question.question]: 'the outcome metric has no baseline' }))
  const gate = r.state('demo').gates['1']
  assert.deepEqual([gate.status, gate.reason], ['rejected', 'the outcome metric has no baseline'])
})

test('a stale question, a subagent, or an answer set by the agent records nothing', () => {
  const { r, question } = waitingPlan()
  const stale = { ...question, question: question.question.replace(/[0-9a-f]{8}\]$/, '00000000]') }
  assert.match(r.hook('answers', asked([stale], { [stale.question]: 'Approve' })), /no longer matches/)
  r.hook('answers', asked([question], { [question.question]: 'Approve' }, { agent_id: 'sub-1' }))
  assert.equal(r.state('demo').gates['1'].status, 'waiting')

  const pre = q => r.tool('AskUserQuestion', q)
  assert.equal(pre({ questions: [question], answers: { [question.question]: 'Approve' } }).decision, 'deny', 'an agent cannot answer for the person')
  assert.equal(pre({ questions: [question] }).decision, 'allow')
})

test('the intent questionnaire records the three parts the person chose or wrote', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  const out = r.sdlc('ask', 'demo')
  const questions = JSON.parse(out.out).questions
  assert.deepEqual(questions.map(q => q.header), ['Change', 'Smallest', 'Drop if'])
  assert.ok(questions.every(q => q.question.endsWith('[intent demo]')))
  const answers = { [questions[0].question]: 'shoppers can save; and share', [questions[1].question]: 'a button', [questions[2].question]: 'nobody saves in two weeks' }
  assert.match(r.hook('answers', asked(questions, answers)), /set the intent for demo/)
  const s = r.state('demo')
  assert.deepEqual([s.intent.change, s.intent.smallest, s.intent.dropIf, s.intent.by], ['shoppers can save, and share', 'a button', 'nobody saves in two weeks', 'Test Human'])
})
