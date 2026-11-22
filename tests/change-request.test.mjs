// specs/change-request: a spec change found once Build has started asks the person "change request or
// amend the existing PRD?" before anything moves; before Build it goes back to Define as before.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const SLICES = '# Slices: saved-items\n\n## Outcome\n\nShoppers keep items.\n\n## Slices\n\n- save-list: save a list. Depends on: none. Status: started\n'
const OVERVIEW = '# Architecture overview: saved-items\n\n## System context\n\n```mermaid\nC4Context\n  Person(shopper, "Shopper")\n  System(web, "web")\n```\n\n## Systems under change\n\n| System / repo | Change type | Owner | Contract impact | Data impact | Deploy order |\n|---|---|---|---|---|---|\n\n## Decision log\n\n| Date | Decision | Agreed by | Source | Changes |\n|---|---|---|---|---|\n'

// "save-list" in capability "saved-items", Define approved, then its PRD changed.
function changedAfterDefine(full = false) {
  const r = makeRepo('feature/save-list')
  r.put('specs/saved-items/slices.md', SLICES)
  r.config({ gateOwners: { 1: ['Test Human'] } }) // ADR-0007: a person keeps Define, so it has an approval to keep
  r.sdlc('init', 'save-list', '--capability', 'saved-items', ...(full ? ['--full'] : []))
  r.put('specs/saved-items/architecture-overview.md', OVERVIEW) // capability-overview: Define needs its System context
  r.say('sdlc intent save-list change: shoppers can save; smallest: a button; drop if: nobody saves')
  r.put('specs/save-list/prd.md', READY_PRD)
  r.put('specs/save-list/acceptance.feature', READY_FEATURE)
  r.sdlc('request', 'save-list')
  assert.match(r.say('sdlc approve save-list 1'), /approved Define/)
  assert.equal(r.state('save-list').stage, full ? 3 : 4)
  r.put('specs/save-list/prd.md', READY_PRD.replace('Save an item', 'Save and share an item'))
  return r
}

test('AC-1, AC-2, AC-3: a spec change at Build stops with the question, the reasons and the effort change', () => {
  const r = changedAfterDefine()
  const { status, out } = r.sdlc('request', 'save-list')
  assert.equal(status, 1)
  assert.match(out, /change request or amend the existing PRD\?/)
  assert.equal(r.state('save-list').stage, 4, 'still at Build')
  assert.equal(r.state('save-list').gates['1'].status, 'approved')
  assert.match(out, /the work already done and its estimate stay as agreed/)
  assert.match(out, /design and tasks may change/)
  assert.match(out, /its own effort estimate/)
  assert.match(out, /original estimate must be re-done with the added effort stated/)
  assert.match(out, /sdlc cr save-list <new-slug>/)
  assert.match(out, /sdlc amend save-list/)
})

test('AC-4: a change request is a new feature in the same capability that names the original', () => {
  const r = changedAfterDefine()
  const { status, out } = r.sdlc('cr', 'save-list', 'save-list-offline')
  assert.equal(status, 0, out)
  assert.equal(r.state('save-list-offline').capability, 'saved-items')
  assert.match(fs.readFileSync(path.join(r.repo, 'specs', 'save-list-offline', 'prd.md'), 'utf8'), /^# PRD: .*\n\nChanges: save-list\n/)
  assert.match(out, /git restore specs\/save-list\/prd\.md/)
  const s = r.state('save-list')
  assert.equal(s.gates['1'].status, 'approved', 'the original keeps its Define approval')
  assert.equal(s.stage, 4)
})

test('AC-5: amending goes back to Define, as before', () => {
  const r = changedAfterDefine()
  const { out } = r.sdlc('amend', 'save-list')
  assert.match(out, /goes back to Define/)
  const s = r.state('save-list')
  assert.equal(s.stage, 1)
  assert.equal(s.gates['1'], undefined)
  assert.match(r.sdlc('amend', 'save-list').out, /nothing to amend/, 'no change since an approval, nothing moves')
})

test('AC-6: a spec change before Build goes back to Define with no question', () => {
  const r = changedAfterDefine(true)
  const { out } = r.sdlc('request', 'save-list')
  assert.equal(r.state('save-list').stage, 1)
  assert.match(out, /goes back to Define/)
  assert.doesNotMatch(out, /change request/i)
})
