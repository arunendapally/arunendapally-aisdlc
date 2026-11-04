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
  assert.match(warnings[0], /^prd\.md R1 reads like a solution: code in backticks .*status code \(HTTP 200\).*a design word \(sha\)/)
  assert.match(warnings[1], /^prd\.md R2 .*a design word \(module\)/)
  assert.match(warnings[2], /^prd\.md R3 .*a design word \(cookie\)/)
  assert.match(warnings[3], /^prd\.md R4 .*an endpoint \(POST \/\)/)
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
  assert.match(warnings[1], /^acceptance\.feature line 7 .*a design word \(table\)/)
})

test('the Plan gate warns about solution language and still asks the product lead', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say('sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves')
  r.put('specs/demo/prd.md', READY_PRD.replace('- R1. (must) Save an item.', '- R1. (must) POST /saved stores the item in the database.'))
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  const out = r.sdlc('request', 'demo')
  assert.equal(out.status, 0)
  assert.match(out.out, /WARNING: prd\.md R1 reads like a solution: an endpoint \(POST \/\), a design word \(database\)/)
  assert.match(out.out, /waiting on: product lead/)
})

test('the PRD template says requirements, not solutions, and gives the solution a home', () => {
  const prdTemplate = fs.readFileSync(new URL('../skills/org-ai-sdlc/templates/prd.md', import.meta.url), 'utf8')
  const tasksTemplate = fs.readFileSync(new URL('../skills/org-ai-sdlc/templates/tasks.md', import.meta.url), 'utf8')
  assert.match(prdTemplate, /Requirements, not solutions/)
  assert.match(prdTemplate, /^## Constraints$/m)
  assert.doesNotMatch(prdTemplate, /Data needed/)
  assert.match(tasksTemplate, /^## Approach$/m)
  // The template's own examples must pass its own check.
  const uncommented = prdTemplate.replace(/<!--|-->/g, '')
  assert.deepEqual(solutionWarnings(uncommented), [])
})
