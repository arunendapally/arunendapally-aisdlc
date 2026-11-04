// A PRD states requirements, not solutions (the unit-converter run, Plan v2): its requirements named a
// meta tag, a commit sha, a workflow and browser storage. The Plan gate now warns about solution language
// in requirement lines and scenario steps. It never refuses: it becomes a refusal only if an eval shows it
// is reliable, as the field-name check did.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { solutionWarnings } from '../scripts/solutions.mjs'

const prd = reqs => `## Requirements\n\n${reqs}\n\n## Non-functional requirements\n\n- Performance: R1\n`

test('a requirement that names the mechanism is flagged, with what it named', () => {
  const warnings = solutionWarnings(prd([
    '- R1. (must) The live page responds with HTTP 200 and contains `<meta name="build" content="<sha>">` whose sha equals the main commit the workflow deployed.',
    '- R2. (must) The conversion module, imported in Node with no browser, returns the same results.',
    '- R3. (must) The page writes no cookie, local storage or session storage.',
    '- R4. (must) POST /saved stores the item in the saved_items table.',
  ].join('\n')))
  assert.equal(warnings.length, 4)
  assert.match(warnings[0], /^prd\.md R1 reads like a solution: code in backticks .*markup .*a status code \(HTTP 200\)/)
  assert.match(warnings[1], /^prd\.md R2 .*a named technology \(Node\)/)
  assert.match(warnings[2], /^prd\.md R3 .*a named technology \(local storage\)/)
  assert.match(warnings[3], /^prd\.md R4 .*an endpoint \(POST \/\).*an identifier \(saved_items\)/)
  assert.match(warnings[0], /put how in the design, or a person's choice in "## Constraints"/)
})

test('a requirement that states a need is not flagged, and neither are Constraints', () => {
  const text = `${prd([
    '- R1. (must) A visitor at the public address always gets the latest released version of the page. Needs: which version was released last.',
    '- R2. (must) The page never collects, keeps or sends anything about the visitor. Needs: nothing.',
    '- R3. (should) If the public page stops working, the owner hears about it within a day.',
    '- R4. (must) A shopper with 200 saved items sees the whole list within half a second.',
  ].join('\n'))}\n## Constraints\n\n- Plain HTML and one JavaScript module on GitHub Pages; the workflow deploys main. (Arun)\n`
  assert.deepEqual(solutionWarnings(text), [])
})

test('a scenario step that names the mechanism is flagged by line; the feature title and tags are not', () => {
  const feature = 'Feature: Save\n\n  @R1 @AC-1 @unit\n  Scenario: Save to the API\n    Given the page source in index.html\n    When a visitor saves an item\n    Then the saved_items table has one row\n'
  const warnings = solutionWarnings('', feature)
  assert.equal(warnings.length, 2)
  assert.match(warnings[0], /^acceptance\.feature line 5 reads like a solution: a file \(index\.html\)/)
  assert.match(warnings[1], /^acceptance\.feature line 7 .*an identifier \(saved_items\)/)
})

// Precision first: a warning that fires on business words gets ignored. The corpus is the measure.
test('the labelled corpus: no need is flagged, and most solutions are', () => {
  const { cases } = JSON.parse(fs.readFileSync(new URL('./fixtures/solution-corpus.json', import.meta.url), 'utf8'))
  const flagged = c => solutionWarnings(`## Requirements\n\n- R1. (must) ${c.text}\n`, '', c.kinds).length > 0
  const falsePositives = cases.filter(c => !c.solution && flagged(c)).map(c => c.text)
  const solutions = cases.filter(c => c.solution)
  const caught = solutions.filter(flagged).length
  assert.deepEqual(falsePositives, [])
  assert.ok(caught / solutions.length >= 0.85, `caught ${caught} of ${solutions.length}`)
})

test('in api work the contract is the requirement; in data work the datasets are', () => {
  const api = '## Requirements\n\n- R1. (must) A partner calling GET /v1/rates gets status 200 with `currency` and `rate`, and can register a webhook.\n'
  assert.deepEqual(solutionWarnings(api, '', ['api']), [])
  assert.equal(solutionWarnings(api).length, 1)
  assert.match(solutionWarnings('## Requirements\n\n- R1. (must) A partner gets rates read from Postgres.\n', '', ['api'])[0], /Postgres/)
  assert.deepEqual(solutionWarnings('## Requirements\n\n- R1. (must) Analysts can query yesterday\'s sales in the database by 06:00.\n', '', ['data']), [])
})

test('a wrapped requirement, a * step and an Examples row are read too; an outline placeholder is not markup', () => {
  assert.match(solutionWarnings('## Requirements\n\n- R1. (must) A shopper can save an item\n  that is kept in the saved_items table.\n')[0], /R1 .*saved_items/)
  const feature = 'Feature: x\n  Scenario Outline: y\n    * the shopper has <count> items\n    Then the list shows <item>\n    Examples:\n      | count | item |\n      | 1 | `blue_mug` |\n'
  const warnings = solutionWarnings('', feature)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /line 7 /)
})

test('the Plan gate warns about solution language and still asks the product lead', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say('sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves')
  r.put('specs/demo/prd.md', READY_PRD.replace('- R1. (must) Save an item.', '- R1. (must) POST /saved stores the item in the database.'))
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  const out = r.sdlc('request', 'demo')
  assert.equal(out.status, 0)
  assert.match(out.out, /WARNING: prd\.md R1 reads like a solution: an endpoint \(POST \/\), a named technology \(database\)/)
  assert.match(out.out, /waiting on: product lead/)
})

test('the light lane needs ## Approach in tasks.md at Build; the full lane has plan.md', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs' })
  r.put('gate.cjs', "console.log('1 passing')\n")
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-10-31T00:00:00Z' } } })
  r.put('specs/demo/tasks.md', '# Tasks: demo\n\n## Tasks\n\n- [ ] T1 [R1] files: src/a.js test: AC-1 depends-on: []\n')
  r.sdlc('gate', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /## Approach/)
  r.put('specs/demo/tasks.md', '# Tasks: demo\n\n## Approach\n\nOne module, src/a.js.\n\n## Tasks\n\n- [ ] T1 [R1] files: src/a.js test: AC-1 depends-on: []\n')
  assert.doesNotMatch(r.sdlc('request', 'demo').out, /## Approach/)
})

test('the PRD template says requirements, not solutions, and gives the solution a home', () => {
  const prdTemplate = fs.readFileSync(new URL('../skills/org-ai-sdlc/templates/prd.md', import.meta.url), 'utf8')
  const tasksTemplate = fs.readFileSync(new URL('../skills/org-ai-sdlc/templates/tasks.md', import.meta.url), 'utf8')
  assert.match(prdTemplate, /Requirements, not solutions/)
  assert.match(prdTemplate, /^## Constraints$/m)
  assert.doesNotMatch(prdTemplate, /Data needed/)
  assert.match(tasksTemplate, /^## Approach$/m)
  // The templates' own examples must pass their own check.
  const featureTemplate = fs.readFileSync(new URL('../skills/org-ai-sdlc/templates/acceptance.feature', import.meta.url), 'utf8')
  // Its counter-examples ("Not: ...") are meant to warn, so they are left out.
  assert.deepEqual(solutionWarnings(prdTemplate.replace(/<!--|-->/g, '').replace(/^\s*Not:.*$/gm, ''), featureTemplate), [])
})
