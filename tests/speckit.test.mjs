// Issue #25: accept a Spec Kit spec.md as input to the Plan gate rather than compete with it.
// sdlc import-speckit <feature> <spec.md> fills the PRD's requirements, assumptions, open questions and
// outcome, and acceptance.feature's scenarios, keeping each Spec Kit id beside ours. What Spec Kit does not
// say (which requirement a scenario proves, the non-functional needs, the person's intent) is left for the
// product owner and the person, and the Plan gate names each gap.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo } from './helpers.mjs'
import { parseSpecKit } from '../scripts/speckit.mjs'

const SPEC = fs.readFileSync(new URL('./fixtures/speckit-spec.md', import.meta.url), 'utf8')

test('a Spec Kit spec is read into requirements, scenarios, assumptions, open questions and outcomes', () => {
  const s = parseSpecKit(SPEC)
  assert.equal(s.title, 'Save items for later')
  assert.deepEqual(s.requirements.map(r => r.id), ['FR-001', 'FR-002', 'FR-003'])
  assert.deepEqual(s.scenarios.map(x => [x.story, x.given]), [[1, 'a signed-in shopper with an empty saved list'], [1, '"Blue mug" is saved'], [2, '"Blue mug" is saved']])
  assert.deepEqual(s.clarifications, ['how soon?'])
  assert.deepEqual(s.outcomes.map(o => o.id), ['SC-001', 'SC-002'])
  assert.deepEqual(s.assumptions, ['Guests cannot save items.'])
})

test('sdlc import-speckit writes the PRD and acceptance.feature, and the Plan gate names what is left', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('spec.md', SPEC)
  const out = r.sdlc('import-speckit', 'demo', 'spec.md')
  assert.equal(out.status, 0, out.out)
  const prd = fs.readFileSync(`${r.repo}/specs/demo/prd.md`, 'utf8')
  assert.match(prd, /^- R1\. \(must\) System MUST let a signed-in shopper save an in-stock item\. \(Spec Kit FR-001\)$/m)
  assert.match(prd, /^- A1: Guests cannot save items\. \[unconfirmed\]$/m)
  assert.match(prd, /^- A2: .*how soon\?.* \[unconfirmed\]$/m)
  assert.match(prd, /Metric: 8% of saved items are bought within 14 days\. \(Spec Kit SC-001\)/)
  const feature = fs.readFileSync(`${r.repo}/specs/demo/acceptance.feature`, 'utf8')
  assert.match(feature, /@AC-1 @story-1\n  Scenario: Story 1, scenario 1\n    Given a signed-in shopper with an empty saved list\n    When they save "Blue mug"\n    Then the saved list holds "Blue mug"/)
  assert.match(out.out, /tag each scenario with the requirement it proves \(@R1 \.\.\.\)/i)
  r.say('sdlc intent demo change: shoppers keep items; smallest: one list; drop if: nobody saves')
  const asked = r.sdlc('request', 'demo').out
  assert.match(asked, /Scenario "Story 1, scenario 1" needs the requirement it proves, like @R1/)
  assert.match(asked, /R1 has no scenario/)
})

test('import-speckit never overwrites a PRD someone has written', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('specs/demo/prd.md', '## Problem\n\nWritten by a person.\n')
  r.put('spec.md', SPEC)
  const out = r.sdlc('import-speckit', 'demo', 'spec.md')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /prd\.md already has content/)
})
