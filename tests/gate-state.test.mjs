// unattended-runs R14: a gate run takes minutes; what is recorded about the feature meanwhile is kept.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'

// A gate command that changes the feature's record while it runs, as a person or another agent would.
const meanwhile = (r, change) => {
  r.put('gate.cjs', `const fs = require('fs'); const f = 'specs/demo/state.json'; const s = JSON.parse(fs.readFileSync(f, 'utf8'));
Object.assign(s, ${JSON.stringify(change)}); fs.writeFileSync(f, JSON.stringify(s)); console.log('12 passing')\n`)
  r.config({ gateCommand: 'node gate.cjs' })
}

test('AC-18 a spec change made during a test run survives the run', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4 })
  meanwhile(r, { stage: 1, marker: 'sent back' })
  const out = r.sdlc('gate', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /moved from Build to Define while the gate ran, so this run is not recorded/)
  assert.equal(r.state('demo').stage, 1)
  assert.equal(r.state('demo').marker, 'sent back')
})

test('AC-18 a run at the same stage keeps what was recorded meanwhile and records itself', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4 })
  meanwhile(r, { marker: 'recorded meanwhile' })
  assert.equal(r.sdlc('gate', 'demo').status, 0)
  assert.equal(r.state('demo').marker, 'recorded meanwhile')
  assert.equal(r.state('demo').gateRuns[4].count, 12)
})
