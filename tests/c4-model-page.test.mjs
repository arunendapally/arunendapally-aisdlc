// c4-model-page: one HTML C4 model page per feature, built from its design documents (specs/c4-model-page).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = rel => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const skill = () => read('skills/c4-model-page/SKILL.md')
const templateDoc = () => read('skills/c4-model-page/reference/page-template.md')
// The worked example page inside the template's html block.
const page = () => templateDoc().match(/```html\n([\s\S]*?)\n```/)[1]
const check = async html => (await import('../skills/c4-model-page/check.mjs')).checkPage(html)

test('AC-1 A finished page has five views, each with its own link', async () => {
  const html = page()
  assert.deepEqual(await check(html), [])
  for (const view of ['context', 'containers', 'run']) assert.match(html, new RegExp(`data-view="${view}"`))
  const noRun = html.replace('<a role="tab" href="#run"', '<a role="tab" href="#later"')
  assert.ok((await check(noRun)).some(p => p.includes('#run')), 'a missing #run tab is reported')
  const noRunDiagram = html.replace('data-view="run"', 'data-view="other"')
  assert.ok((await check(noRunDiagram)).some(p => p.includes('run')), 'a missing run diagram is reported')
})

test('AC-2 A fact the documents do not hold shows as Open with an owner', () => {
  const text = skill()
  assert.match(text, /not in (the|its|these) sources?[^\n]*"?Open"?/i)
  assert.match(text, /name (who|the person|the owner)/i)
  assert.match(text, /never (mark|call)[^\n]*(Decided|Verified)/i)
})

test('AC-3 The page reads the plugin\'s documents unless a team names its own', () => {
  const text = skill()
  for (const own of ['specs/<feature>/design.md', 'architecture-overview.md', 'openapi.yaml', 'docs/architecture/workspace.dsl']) assert.ok(text.includes(own), `default source ${own}`)
  for (const team of ['technical-design.md', 'Teams/<repo>/openapi.yaml']) assert.ok(text.includes(team), `optional source ${team}`)
  assert.match(text, /named[^\n]*(instead|win|replace)/i)
})

test('AC-4 A call with no matching arrow is reported', async () => {
  const html = page()
  const noArrow = html.replace('  web ==>|"POST /saved-items"| api\n', '').replace('  web -.->|"GET /saved-items"| api\n', '')
  assert.ok((await check(noArrow)).some(p => p.includes('web → cart-api')), 'a call row with no arrow')
  const noRow = html.replace(/<tr><td>mobile → cart-api<\/td>.*<\/tr>\n/, '')
  assert.ok((await check(noRow)).some(p => p.includes('mobile → cart-api')), 'an arrow with no call row')
})

test('AC-5 A system coloured unchanged but listed as changed is reported', async () => {
  const html = page().replace('  class web,api,db changing\n', '  class web,db changing\n  class api unchanged\n')
  const problems = await check(html)
  assert.ok(problems.some(p => p.includes('cart-api')), problems.join('\n'))
  const undrawn = page().replace('<tr><td>stock-service</td>', '<tr><td>payments</td>')
  assert.ok((await check(undrawn)).some(p => p.includes('payments')), 'a changes row no diagram draws')
})

test('AC-6 Every diagram can be panned, zoomed, fitted and shown full screen', () => {
  const html = page()
  const frames = html.match(/class="controls"/g).length
  assert.equal(frames, html.match(/<pre class="mermaid"/g).length, 'one controls bar per diagram')
  for (const act of ['out', 'in', 'fit', 'one', 'full']) assert.equal(html.match(new RegExp(`data-act="${act}"`, 'g')).length, frames, act)
  for (const label of ['>-<', '>+<', '>Fit<', '>100%<', '>Full screen<']) assert.ok(html.includes(label), label)
  for (const key of ["'+'", "'-'", "'0'", 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) assert.ok(html.includes(key), key)
  assert.match(html, /Math\.min\(6, Math\.max\(0\.2,/)
  assert.match(html, /addEventListener\('wheel'/)
  assert.match(html, /addEventListener\('dblclick', fit\)/)
})

test('AC-8 Design offers the page when it finishes', () => {
  const design = read('commands/design.md')
  assert.match(design, /c4-model-page/)
  assert.ok(design.indexOf('c4-model-page') < design.indexOf('**Gate:**'), 'handed off before the gate, so the approver can open it')
})
