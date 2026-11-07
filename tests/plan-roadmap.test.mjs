// plan-roadmap: Plan is a roadmap. A capability's slices are placed now, next or later, an enabler can be a
// slice, each slice says how it goes live on its own, and a feature's tasks give one ticket per repo.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, plugin } from './helpers.mjs'
import * as lib from '../scripts/lib.mjs'

const slices = lines => `# Slices: saved-items\n\n## Outcome\n\nShoppers buy what they saved.\n\n## Slices\n\n${lines.join('\n')}\n`
const API = '- save-api: the saved-items API contract. Horizon: now. Kind: enabler. Goes live: compatible. Depends on: none. Status: planned'
const LIST = '- save-list: a shopper saves an item and sees it in a list. Horizon: now. Kind: slice. Goes live: flag SAVED_ITEMS. Depends on: save-api. Status: planned'
const SHARE = '- save-share: a shopper shares the list by link. Horizon: later. Kind: slice. Goes live: after save-list, because the link opens the list. Depends on: save-list. Status: planned'

test('plan-roadmap AC-1: status groups slices by horizon and marks enablers', () => {
  const r = makeRepo()
  r.put('specs/saved-items/slices.md', slices([API, LIST, SHARE]))
  const out = r.sdlc('status').out
  const at = s => out.indexOf(s)
  assert.ok(at('\n  now\n') !== -1 && at('\n  later\n') !== -1, `horizons are listed:\n${out}`)
  assert.ok(at('\n  now\n') < at('    save-api:') && at('    save-list:') < at('\n  later\n') && at('\n  later\n') < at('    save-share:'), `slices sit under their horizon:\n${out}`)
  assert.doesNotMatch(out, /\n  next\n/, 'an empty horizon is not listed')
  assert.match(out, /    save-api: enabler, not started/)
})

test('plan-roadmap AC-1: a slice with no horizon is now (PRD A2)', () => {
  const r = makeRepo()
  const old = slices(['- old: written before horizons. Depends on: none. Status: planned'])
  r.put('specs/saved-items/slices.md', old)
  assert.match(r.sdlc('status').out, /\n  now\n    old: not started \(planned\)/)
  assert.deepEqual(lib.roadmapProblems(old), [], 'a slice with no Goes live is not refused')
})

test('plan-roadmap AC-2: an enabler can be a slice', () => {
  assert.deepEqual(lib.roadmapProblems(slices([API])).filter(p => p.includes('save-api')), [])
})

test('plan-roadmap AC-3: each slice says how it goes live on its own', () => {
  for (const how of ['compatible', 'flag SAVED_ITEMS', 'after save-api, because the list needs its data']) {
    const text = slices([API, `- save-list: a list. Horizon: now. Kind: slice. Goes live: ${how}. Depends on: save-api. Status: planned`])
    assert.deepEqual(lib.roadmapProblems(text).filter(p => p.includes('save-list')), [], how)
  }
})

test('plan-roadmap AC-4: going live after another slice needs a reason', () => {
  const bare = slices([API, '- save-list: a list. Horizon: now. Kind: slice. Goes live: after save-api. Depends on: save-api. Status: planned'])
  const [problem, ...others] = lib.roadmapProblems(bare)
  assert.match(problem, /save-list.*reason/)
  assert.deepEqual(others, [])
  // Wired in: the Define request of a slice in that capability refuses it; init warns.
  const r = makeRepo()
  r.put('specs/saved-items/slices.md', bare)
  assert.match(r.sdlc('init', 'save-list', '--capability', 'saved-items').out, /save-list.*reason/)
  assert.match(r.sdlc('request', 'save-list').out, /slices\.md: save-list.*reason/)
})

test('plan-roadmap AC-5: tasks give one ticket per repo', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('specs/demo/tasks.md', '# Tasks: demo\n\n## Tasks\n\n- [ ] T1 [R1] repos: [cart] files: api/save.ts test: AC-1 depends-on: [] Save an item.\n- [ ] T2 [R1] repos: [web] files: web/save.tsx test: AC-2 depends-on: [T1] Show the save button.\n- [ ] T3 [R2] repos: [web] files: web/list.tsx test: AC-3 depends-on: [T2] Show the list.\n')
  const out = r.sdlc('tickets', 'demo')
  assert.equal(out.status, 0, out.out)
  const tickets = out.out.split(/^(?=## )/m).filter(t => t.startsWith('## '))
  assert.equal(tickets.length, 2, out.out)
  const web = tickets.find(t => /^## .*web/.test(t))
  const cart = tickets.find(t => /^## .*cart/.test(t))
  assert.ok(web && cart, out.out)
  assert.match(web, /T2 .*Show the save button/)
  assert.match(web, /T3 .*Show the list/)
  assert.match(web, /AC-2, AC-3/)
  assert.doesNotMatch(web, /T1 /)
  assert.match(cart, /T1 .*Save an item/)
  assert.doesNotMatch(cart, /T2 |T3 /)
})

test('plan-roadmap AC-6: the Plan command states its input, processing and output', () => {
  const text = fs.readFileSync(path.join(plugin, 'commands', 'plan.md'), 'utf8')
  for (const h of ['**Input:**', '**Processing:**', '**Output:**']) assert.ok(text.includes(h), h)
})

// Pre-review F1 and F2: one slice's gap blocks only that slice, and a mistyped horizon is named.
test('plan-roadmap: a slice is checked on its own line, and a mistyped horizon is named', () => {
  const roadmap = '## Slices\n\n- save-list: a. Horizon: soon. Goes live: compatible. Status: planned\n- save-share: b. Goes live: after save-list. Status: planned\n'
  assert.deepEqual(lib.roadmapProblems(roadmap, 'save-list'), ['save-list has a Horizon that is not now, next or later'])
  assert.equal(lib.roadmapProblems(roadmap, 'save-share').length, 1)
  assert.equal(lib.roadmapProblems(roadmap).length, 2)
})
