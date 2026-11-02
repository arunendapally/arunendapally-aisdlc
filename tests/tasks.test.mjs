// Issue #26: task order is data, not prose. Every task says what it depends on, and Build refuses a
// dependency on a task that does not exist or a cycle. The plan answers error handling and data and
// tenancy, and field names the contract does not define are a warning.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'
import { STAGES } from '../scripts/lib.mjs'

function atStage(stage, { full = false, kinds = [] } = {}) {
  const r = makeRepo()
  r.sdlc('init', 'demo', ...(full ? ['--full'] : []), ...(kinds.length ? ['--kind', kinds.join(',')] : []))
  r.setState('demo', { stage, stages: { [stage]: { enteredAt: '2026-10-31T00:00:00Z' } } })
  return r
}
const build = tasks => {
  const r = atStage(4)
  r.put('specs/demo/tasks.md', `# Tasks: demo\n\n## Tasks\n\n${tasks}`)
  return r.sdlc('request', 'demo').out
}

test('every task says what it depends on: an empty list is fine, a missing one is not', () => {
  const out = build('- [ ] T1 [R1] files: src/a.ts test: AC-1 depends-on: []\n- [ ] T2 [R1] files: src/b.ts test: AC-2\n')
  assert.match(out, /tasks\.md: T2 has no "depends-on: \[\]"\. Every task ends with the tasks it waits for, for example "depends-on: \[T1\]", or "depends-on: \[\]" when it waits for none/)
  assert.doesNotMatch(out, /T1 has no "depends-on/)
})

test('Build refuses a dependency on a task that does not exist, and a cycle', () => {
  const missing = build('- [ ] T1 [R1] depends-on: [T7]\n')
  assert.match(missing, /tasks\.md: T1 depends on T7, which is not a task here/)

  const cycle = build('- [ ] T1 [R1] depends-on: [T3]\n- [ ] T2 [R1] depends-on: [T1]\n- [ ] T3 [R1] depends-on: [T2]\n- [x] T4 [R1] depends-on: [T1, T2]\n')
  assert.match(cycle, /tasks\.md: the tasks wait for each other in a loop \(T1 > T3 > T2 > T1\), so none can start/)

  const ok = build('- [ ] T1 [R1] depends-on: []\n- [ ] T2 [R1] depends-on: [T1]\n')
  assert.doesNotMatch(ok, /tasks\.md:/)
})

test('the plan answers error handling and data and tenancy, and says what each expects', () => {
  const r = atStage(3, { full: true })
  r.fill('specs/demo/plan.md', STAGES[3].headings.filter(h => !['## Error handling', '## Data and tenancy'].includes(h)))
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /plan\.md has no "## Error handling" section: the status codes or errors callers get, what is retried, and what users see, or "None, because \.\.\."/)
  assert.match(out, /plan\.md has no "## Data and tenancy" section: how data is scoped to its owner or tenant and kept apart from others, or "None, because \.\.\."/)
})

test('field names the contract does not define are a warning, never a refusal', () => {
  const r = atStage(4, { kinds: ['api'] })
  r.put('specs/demo/openapi.yaml', 'openapi: 3.1.0\ninfo:\n  title: Saved\n  version: 1.0.0\npaths: {}\ncomponents:\n  schemas:\n    Saved:\n      type: object\n      properties:\n        item_id:\n          type: string\n')
  r.put('specs/demo/acceptance.feature', 'Feature: Save\n\n  @R1 @AC-1\n  Scenario: Save\n    Given an item with `item_id` "abc"\n    When it is saved\n    Then the response has "savedAt"\n')
  r.put('specs/demo/tasks.md', '# Tasks: demo\n\n## Tasks\n\n- [ ] T1 [R1] files: src/save.ts test: AC-1 depends-on: [] Sets `saved_at` and `item_id`.\n')
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /WARNING: field names not defined in openapi\.yaml: savedAt \(acceptance\.feature\), saved_at \(tasks\.md\)/)
  assert.doesNotMatch(out, /- [^\n]*savedAt/, 'the warning is not one of the reasons the gate refuses')
})
