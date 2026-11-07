// definition-of-done: each stage document ends with a checklist, the gate refuses an open item or a bare
// N/A, each command states its definition of ready, and a document with no checklist is not refused for it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, plugin, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { section, openDoneItems } from '../scripts/lib.mjs'

const GRANT = 'sdlc autonomy on a demo with no users and no data'
const INTENT = '## Intent\n\n- Change: a\n- Smallest: b\n- Drop if: c\n\n'
const DOD = '## Definition of done'

// A light-lane feature at Define, under autonomy, with the given PRD; returns the request output.
function requestDefine(prd) {
  const r = makeRepo()
  r.say(GRANT)
  r.sdlc('init', 'demo')
  r.put('specs/demo/prd.md', `${INTENT}${prd}`)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  return r.sdlc('request', 'demo').out
}

for (const template of ['prd.md', 'design.md', 'tasks.md', 'pr.md']) {
  test(`definition-of-done AC-1: the ${template} template ends with a checklist`, () => {
    const text = fs.readFileSync(path.join(plugin, 'skills', 'org-ai-sdlc', 'templates', template), 'utf8')
    const headings = text.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/).filter(l => /^## /.test(l))
    assert.equal(headings.at(-1), DOD)
    const items = section(text, DOD).split(/\r?\n/).filter(l => l.startsWith('- [ ] '))
    assert.ok(items.length >= 3 && items.length <= 6, `${template} has ${items.length} items`)
  })
}

test('definition-of-done AC-2: an open item stops the gate', () => {
  const out = requestDefine(`${READY_PRD}\n${DOD}\n\n- [x] Every requirement has a scenario\n- [ ] Open questions answered or owned\n`)
  assert.doesNotMatch(out, /passed on checks/, out)
  assert.match(out, /Open questions answered or owned/)
})

test('definition-of-done AC-3: a ticked item or a reasoned N/A passes', () => {
  const out = requestDefine(`${READY_PRD}\n${DOD}\n\n- [x] Open questions answered or owned\n- [X] Every requirement has a scenario\n- N/A: no screen in this change\n`)
  assert.match(out, /Define passed on checks/, out)
})

test('definition-of-done AC-4: N/A without a reason is refused', () => {
  for (const item of ['- N/A', '- N/A:', '- N/A:  ']) {
    const problems = openDoneItems(`${DOD}\n\n- [x] Done\n${item}\n`, 'prd.md')
    assert.equal(problems.length, 1, item)
    assert.match(problems[0], /reason/)
  }
  assert.deepEqual(openDoneItems(`${DOD}\n\n- [x] Done\n- N/A: no screen\n`, 'prd.md'), [])
})

test('definition-of-done AC-5: each command states its definition of ready', () => {
  const previous = { design: 'Define', build: 'Design', verify: 'Build' }
  for (const [name, before] of Object.entries(previous)) {
    const text = fs.readFileSync(path.join(plugin, 'commands', `${name}.md`), 'utf8')
    assert.match(text, new RegExp(`\\*\\*Ready when:\\*\\*.*${before} definition of done`), `commands/${name}.md`)
  }
  assert.match(fs.readFileSync(path.join(plugin, 'commands', 'define.md'), 'utf8'), /\*\*Ready when:\*\*/)
})

test('definition-of-done AC-6: a document without a checklist is not refused for it', () => {
  const out = requestDefine(READY_PRD)
  assert.match(out, /Define passed on checks/, out)
  assert.doesNotMatch(out, /Definition of done/)
  assert.deepEqual(openDoneItems('## Problem\n\nFilled.\n', 'prd.md'), [])
})
