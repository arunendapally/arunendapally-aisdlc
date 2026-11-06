// test-lock: tests proven red are locked against the builder, and a test that conflicts with the spec
// is escalated to a person, not edited (specs/test-lock).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const TEST = "// demo\ntest('AC-1 Save an item', () => {})\n"
const sha = t => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16)

// Feature "demo" at Build, gate 1 approved by a person, whose proof recorded tests/demo.test.mjs for AC-1.
function proved() {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say('sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves')
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'demo')
  r.say('sdlc approve demo 1')
  assert.equal(r.state('demo').stage, 4)
  r.config({ proofCommand: 'node --test {files}' })
  r.put('tests/demo.test.mjs', TEST)
  const at = new Date().toISOString()
  const files = { 'tests/demo.test.mjs': sha(TEST) }
  r.setState('demo', { proof: { ok: true, problems: [], base: 'abc1234', files, acs: ['AC-1'], at }, lock: { files, at } })
  return r
}
const writeTest = r => r.tool('Write', { file_path: `${r.repo}/tests/demo.test.mjs`, content: 'test("AC-1", () => {})\n' })

test('AC-1 An agent\'s edit to a proved test is refused', () => {
  const r = proved()
  const out = writeTest(r)
  assert.equal(out.decision, 'deny')
  assert.match(out.reason, /tests\/demo\.test\.mjs/)
  assert.match(out.reason, /sdlc conflict/)
  assert.equal(r.tool('Write', { file_path: `${r.repo}/src/save.mjs`, content: 'x' }).decision, 'allow', 'code stays open')
})

test('AC-2 A changed test cannot be proved again without a settled conflict', () => {
  const r = proved()
  r.put('tests/demo.test.mjs', 'test("AC-1", () => {})\n')
  const before = r.state('demo').proof
  const out = r.sdlc('proof', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /tests\/demo\.test\.mjs/)
  assert.match(out.out, /conflict/)
  assert.deepEqual(r.state('demo').proof, before, 'the refusal keeps the proof, so the lock stays')
})

test('AC-3 An agent raises a conflict and the feature waits for a person', () => {
  const r = proved()
  const out = r.sdlc('conflict', 'demo', 'AC-1', 'the spec says 200 items, the test checks 100')
  assert.equal(out.status, 0, out.out)
  assert.match(r.sdlc('status', 'demo').out, /conflict on AC-1 waiting for a person/)
  assert.match(r.sdlc('request', 'demo').out, /conflict on AC-1/)
  assert.equal(r.state('demo').gates['4'], undefined, 'the request does not pass while the conflict is open')
})

test('AC-4 Raising a conflict does not count against the retry cap', () => {
  const r = proved()
  r.setState('demo', { retries: { '4:gate': 2 } })
  assert.equal(r.sdlc('conflict', 'demo', 'AC-1', 'the spec says 200 items, the test checks 100').status, 0)
  assert.deepEqual(r.state('demo').retries, { '4:gate': 2 })
})

test('AC-5 A spec change unlocks the tests', () => {
  const r = proved()
  assert.equal(writeTest(r).decision, 'deny')
  r.put('specs/demo/prd.md', READY_PRD + '\nChanged.\n')
  assert.equal(writeTest(r).decision, 'allow')
})

test('AC-1 only a person settles a conflict; "change the test" unlocks it until the next proof', () => {
  const r = proved()
  r.sdlc('conflict', 'demo', 'AC-1', 'the spec says 200 items')
  assert.equal(r.bash('sdlc settle demo AC-1 change'), 'deny', 'an agent cannot settle its own conflict')
  const q = JSON.parse(r.sdlc('ask', 'demo').out).questions[0]
  assert.deepEqual(q.options.map(o => o.label), ['Change the test', 'Keep the test'])
  assert.equal(r.tool('AskUserQuestion', { questions: [q], answers: { [q.question]: 'Change the test' } }).decision, 'deny')
  r.hook('answers', { tool_name: 'AskUserQuestion', tool_input: { questions: [q], answers: { [q.question]: 'Change the test' } } })
  assert.equal(r.state('demo').conflicts['AC-1'].by, 'Test Human')
  assert.equal(writeTest(r).decision, 'allow')
})

test('AC-1 in bypass mode the edit is audited, never called refused', () => {
  const r = proved()
  const out = r.hook('pre-tool', { tool_name: 'Write', tool_input: { file_path: `${r.repo}/tests/demo.test.mjs`, content: 'x' }, permission_mode: 'bypassPermissions' })
  assert.equal(out, '')
  const audit = fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'audit.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
  assert.ok(audit.some(e => e.decision === 'bypassed' && e.rule === 'test-lock'))
})

test('AC-2 a failed or narrower proof run by the agent keeps the lock (review F1)', () => {
  const r = proved()
  r.put('tests/other.test.mjs', "// demo\ntest('AC-1 other', () => {})\n")
  assert.notEqual(r.sdlc('proof', 'demo', '--base', 'HEAD').status, 0)
  assert.notEqual(r.sdlc('proof', 'demo', '--files', 'tests/other.test.mjs').status, 0)
  assert.equal(r.state('demo').proof.ok, false)
  assert.equal(writeTest(r).decision, 'deny', 'the Write is still refused')
  r.put('tests/demo.test.mjs', 'test("AC-1", () => {})\n')
  assert.match(r.sdlc('proof', 'demo').out, /tests\/demo\.test\.mjs changed after the proof/)
})

test('AC-1 a shell write, move or delete of a proved test is refused (review F2)', () => {
  const r = proved()
  for (const c of ['echo x > tests/demo.test.mjs', 'echo x >> "tests/demo.test.mjs"', 'sed -i s/a/b/ tests/demo.test.mjs', 'cp /tmp/x.mjs tests/demo.test.mjs',
    'mv tests/demo.test.mjs /tmp/x', 'rm -f tests/demo.test.mjs', 'echo x | tee tests/demo.test.mjs', 'npm test && rm tests/demo.test.mjs']) {
    assert.equal(r.bash(c), 'deny', c)
  }
  for (const c of ['node --test tests/demo.test.mjs', 'cp tests/demo.test.mjs /tmp/copy.mjs', 'git checkout -- tests/demo.test.mjs', 'echo x > tests/new.test.mjs 2>&1']) {
    assert.equal(r.bash(c), 'allow', c)
  }
})

test('AC-3 a stale conflict question records nothing (review F4)', () => {
  const r = proved()
  r.sdlc('conflict', 'demo', 'AC-1', 'the spec says 200 items')
  const q = JSON.parse(r.sdlc('ask', 'demo').out).questions[0]
  const stale = { ...q, question: q.question.replace(/\d+\]$/, '1]') }
  const out = r.hook('answers', { tool_name: 'AskUserQuestion', tool_input: { questions: [stale], answers: { [stale.question]: 'Change the test' } } })
  assert.match(out, /no longer matches/)
  assert.equal(r.state('demo').conflicts['AC-1'].status, 'open')
})
