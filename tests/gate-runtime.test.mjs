// The unit-converter run (that repo's docs/plugin-feedback.md, P2 and B1): a gate command that could not
// start ("node --test test/" on Node 22) read like a new repo with nothing passing, and the gate kept no
// record of the runtime, so a Node upgrade that cancelled 55 of 88 tests went unexplained.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo } from './helpers.mjs'

const atBuild = r => { r.sdlc('init', 'demo'); r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-10-31T00:00:00Z' } } }) }

test('P2: a gate command that fails before any test runs is named as the command, and sets no baseline', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs' })
  r.put('gate.cjs', "console.error(\"Error: Cannot find module '/repo/test'\");console.log('not ok 1 - test');process.exit(1)\n")
  atBuild(r)
  const out = r.sdlc('gate', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /The gate command failed before any test ran \(Cannot find module '\/repo\/test'\)/)
  assert.match(out.out, /fix gateCommand in \.ai-sdlc\/config\.json/)
  assert.doesNotMatch(out.out, /expected in a new repo/)
  assert.equal(JSON.parse(fs.readFileSync(`${r.repo}/specs/demo/state.json`, 'utf8')).baseline, undefined)
})

test('P2: a new repo with real tests that all fail still reads as a new repo', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs' })
  r.put('gate.cjs', "console.log('0 passing');process.exit(1)\n")
  atBuild(r)
  assert.match(r.sdlc('gate', 'demo').out, /expected in a new repo: the baseline is 0/)
})

test('B1: the gate records its runtime, and warns when it differs from the baseline run', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs' })
  r.put('gate.cjs', "console.log('3 passing')\n")
  atBuild(r)
  r.sdlc('gate', 'demo')
  const state = JSON.parse(fs.readFileSync(`${r.repo}/specs/demo/state.json`, 'utf8'))
  assert.equal(state.baselineRuntime, `node ${process.version}`)
  assert.equal(state.gateRuns[4].runtime, `node ${process.version}`)
  r.setState('demo', { baselineRuntime: 'node v20.0.0' })
  const out = r.sdlc('gate', 'demo').out
  assert.match(out, new RegExp(`RUNTIME CHANGED: this run used node ${process.version.replace(/\./g, '\\.')}; the baseline was set on node v20\\.0\\.0`))
})

test('B1: the cancelled-subtest trap is in the repo template', () => {
  const traps = fs.readFileSync(new URL('../templates/repo/standards/traps.md', import.meta.url), 'utf8')
  assert.match(traps, /### Subtests that were never awaited/)
})
