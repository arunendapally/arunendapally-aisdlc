// The unit-converter run (that repo's docs/plugin-feedback.md, P2 and B1): a gate command that could not
// start ("node --test test/" on Node 22) read like a new repo with nothing passing, and the gate kept no
// record of the runtime, so a Node upgrade that cancelled 43 and failed 12 of 88 tests went unexplained.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo } from './helpers.mjs'

const atBuild = (r, lane) => {
  r.sdlc(...(lane === 'bug' ? ['bug', 'demo', 'it breaks'] : ['init', 'demo']))
  if (lane === 'bug') r.git('switch', '-q', '-c', 'bug/demo')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-10-31T00:00:00Z' } } })
}
const state = r => JSON.parse(fs.readFileSync(`${r.repo}/specs/demo/state.json`, 'utf8'))

test('P2: a gate command whose own file is missing is named as the command, recorded red, with no baseline', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node --test test/' })
  r.put('test/a.test.mjs', "import test from 'node:test'\ntest('a', () => {})\n")
  atBuild(r)
  const out = r.sdlc('gate', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /The gate command failed before any test ran \(Cannot find module '[^']*test'\)/)
  assert.match(out.out, /fix gateCommand in \.ai-sdlc\/config\.json/)
  assert.doesNotMatch(out.out, /expected in a new repo/)
  assert.equal(state(r).baseline, undefined)
  assert.equal(state(r).gateRuns[4].ok, false)
})

test('P2: a broken command after a green run leaves a red record, so a request cannot pass on it', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs' })
  r.put('gate.cjs', "console.log('1 passing')\n")
  atBuild(r)
  r.sdlc('gate', 'demo')
  assert.equal(state(r).gateRuns[4].ok, true)
  fs.rmSync(`${r.repo}/gate.cjs`)
  assert.match(r.sdlc('gate', 'demo').out, /failed before any test ran/)
  assert.equal(state(r).gateRuns[4].ok, false)
  assert.match(r.sdlc('request', 'demo').out, /the full gate has not passed at this stage/)
})

test('P2: a test that imports code not written yet is the red-first run, not a broken command', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node --test "test/**/*.test.mjs"' })
  r.put('test/a.test.mjs', "import test from 'node:test'\nimport { add } from '../src/add.mjs'\ntest('adds', () => add(1, 2))\n")
  atBuild(r)
  const out = r.sdlc('gate', 'demo').out
  assert.match(out, /expected in a new repo: the baseline is 0/)
  assert.doesNotMatch(out, /failed before any test ran/)
})

test('P2: in the bug lane the same red run is the repro', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node --test "test/**/*.test.mjs"' })
  r.put('test/a.test.mjs', "import test from 'node:test'\nimport { add } from '../src/add.mjs'\ntest('adds', () => add(1, 2))\n")
  atBuild(r, 'bug')
  assert.match(r.sdlc('gate', 'demo').out, /Repro recorded/)
})

test('B1: the gate records the runtimeCommand output, warns when it differs, and follows a raised baseline', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs', runtimeCommand: 'node -e "console.log(require(\'./runtime.json\'))"' })
  r.put('runtime.json', '"v1"\n')
  r.put('gate.cjs', "console.log(require('fs').readFileSync('count.txt', 'utf8').trim() + ' passing')\n")
  r.put('count.txt', '3\n')
  atBuild(r)
  r.sdlc('gate', 'demo')
  assert.equal(state(r).baselineRuntime, 'v1')
  assert.equal(state(r).gateRuns[4].runtime, 'v1')
  r.put('runtime.json', '"v2"\n')
  assert.match(r.sdlc('gate', 'demo').out, /RUNTIME CHANGED: this run used v2; the baseline was set on v1/)
  r.put('count.txt', '4\n')
  r.sdlc('gate', 'demo')
  assert.equal(state(r).baselineRuntime, 'v2', 'a green run that raises the baseline moves its runtime')
  assert.doesNotMatch(r.sdlc('gate', 'demo').out, /RUNTIME CHANGED/)
})

test('B1: the cancelled-subtest trap is in the repo template', () => {
  const traps = fs.readFileSync(new URL('../templates/repo/standards/traps.md', import.meta.url), 'utf8')
  assert.match(traps, /### Subtests that were never awaited/)
  assert.match(traps, /43 cancelled and 12 failed/)
})
