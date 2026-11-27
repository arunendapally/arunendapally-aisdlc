// c4-model-page edges: the pre-review's findings on check.mjs and the skill (specs/c4-model-page/review.md).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = rel => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const page = () => read('skills/c4-model-page/reference/page-template.md').match(/```html\n([\s\S]*?)\n```/)[1]
const check = async html => (await import('../skills/c4-model-page/check.mjs')).checkPage(html)
// Adds lines to the containers diagram, just before its classDefs.
const withArrow = line => page().replace(/(data-view="containers">[\s\S]*?)(\n  classDef person)/, `$1\n  ${line}$2`)

test('AC-4 An arrow written in another Mermaid form still needs a call row', async () => {
  for (const line of ['api --> stock;', 'api --> stock --> listener', 'api -- "asks" --> stock', 'api -- asks --> stock']) {
    const problems = await check(withArrow(line))
    assert.ok(problems.some(p => p.includes('cart-api → stock-service')), `${line}: ${problems.join(' / ')}`)
  }
  const unread = await check(withArrow('api --> stock & listener'))
  assert.ok(unread.some(p => p.includes('cannot read')), 'an arrow line it cannot read is reported, not skipped')
})

test('AC-5 A missing Changes or Calls table is reported', async () => {
  assert.ok((await check(page().replace('data-table="changes"', 'data-table="deltas"'))).some(p => p.includes('No Changes table')))
  assert.ok((await check(page().replace('data-table="calls"', 'data-table="links"'))).some(p => p.includes('No Calls table')))
})

test('AC-5 Cells with attributes and empty rows are read, not shifted or crashed on', async () => {
  const html = page().replace('<tr><td>cart-api</td><td>Changed:', '<tr><td class="x">cart-api</td><td class="y">Changed:')
    .replace('<tbody>\n      <tr><td>web → cart-api</td>', '<tbody>\n      <tr></tr>\n      <tr><td>web → cart-api</td>')
  assert.deepEqual(await check(html), [])
})

test('AC-5 A system outside the journey that does not change may stay purple', async () => {
  const html = page().replace('<tr><td>stock-service</td>', '<tr><td>mobile</td><td>No change</td><td>none</td><td>none</td></tr>\n      <tr><td>stock-service</td>')
  assert.deepEqual(await check(html), [])
})

test('AC-3 The plugin\'s own documents are the defaults', () => {
  const text = read('skills/c4-model-page/SKILL.md')
  const defaults = text.slice(text.indexOf('By default'), text.indexOf('A team that keeps'))
  for (const own of ['specs/<feature>/design.md', 'specs/<feature>/architecture-overview.md', 'specs/<feature>/openapi.yaml', 'docs/architecture/workspace.dsl']) assert.ok(defaults.includes(own), own)
})
