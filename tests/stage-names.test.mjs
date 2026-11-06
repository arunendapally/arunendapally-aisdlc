// stage-names: stages are called by name (Define, Design, Build, Verify), the design lives in design.md,
// a feature whose design is already in plan.md keeps passing, and each stage command states its input,
// processing and output.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, plugin, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { STAGES } from '../scripts/lib.mjs'

const GRANT = 'sdlc autonomy on a demo with no users and no data'
const INTENT = '## Intent\n\n- Change: a\n- Smallest: b\n- Drop if: c\n\n'

// A full-lane feature at Design with the spec approved, under autonomy so a complete design passes on checks.
function atDesign(feature) {
  const r = makeRepo(`feature/${feature}`)
  r.say(GRANT)
  r.sdlc('init', feature, '--full')
  r.setState(feature, { stage: 3, stages: { 3: { enteredAt: new Date().toISOString() } }, gates: { 1: { status: 'approved', by: 'Test Human' } } })
  return r
}

test('stage-names AC-1: a passed gate names the stage and the next one', () => {
  const r = makeRepo()
  r.say(GRANT)
  r.sdlc('init', 'demo')
  r.put('specs/demo/prd.md', `${INTENT}${READY_PRD}`)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /Define passed on checks/)
  assert.match(out, /now at Build/)
  assert.doesNotMatch(out, /stage 4/)
})

test('stage-names AC-2: the stage that writes the PRD is Define', () => {
  const writesPrd = Object.values(STAGES).find(s => s.artefact === 'prd.md')
  assert.equal(writesPrd.name, 'Define')
  assert.ok(fs.existsSync(path.join(plugin, 'commands', 'define.md')), 'commands/define.md exists')
})

test('stage-names AC-3: a new feature\'s design is design.md', () => {
  const r = atDesign('demo')
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /design\.md does not exist/)
})

test('stage-names AC-4: a feature with plan.md keeps passing Design', () => {
  const r = atDesign('old')
  r.fill('specs/old/plan.md', STAGES[3].headings.filter(h => h !== '## Decisions'), '\n## Decisions\n\nNone, because no ADR.\n')
  const out = r.sdlc('request', 'old').out
  assert.match(out, /passed on checks/, out)
  assert.equal(r.state('old').stage, 4)
})

test('stage-names AC-5: every stage command states its input, processing and output', () => {
  for (const name of ['define', 'design', 'build', 'verify']) {
    const file = path.join(plugin, 'commands', `${name}.md`)
    const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    for (const label of ['**Input:**', '**Processing:**', '**Output:**']) assert.ok(text.includes(label), `commands/${name}.md has ${label}`)
  }
})
