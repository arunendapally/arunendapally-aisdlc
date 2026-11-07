// capability-overview: a capability has one architecture overview beside its slices, with a system context
// (C4 Level 1) and a decision log of what was agreed after the PRD. Features in it are checked against it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { decisionProblems } from '../scripts/lib.mjs'
import { packet, packetText } from '../scripts/review.mjs'

const SLICES = '# Slices: saved-items\n\n## Outcome\n\nShoppers keep items.\n\n## Slices\n\n- save-list: save an item. Depends on: none. Status: planned\n'
const CONTEXT = '```mermaid\nC4Context\n  Person(shopper, "Shopper")\n  System(web, "web")\n```\n'
const LOG = rows => `| Date | Decision | Agreed by | Source | Changes |\n|---|---|---|---|---|\n${rows.map(r => `| ${r} |`).join('\n')}\n`
const OVERVIEW = ({ context = CONTEXT, systems = '', decisions = [] } = {}) =>
  `# Architecture overview: saved-items\n\n## System context\n\n${context}\n## Systems under change\n\n| System / repo | Change type | Owner | Contract impact | Data impact | Deploy order |\n|---|---|---|---|---|---|\n${systems}\n## Decision log\n\n${LOG(decisions)}`

function capabilityRepo() {
  const r = makeRepo('feature/save-list')
  r.put('specs/saved-items/slices.md', SLICES)
  r.sdlc('init', 'save-list', '--capability', 'saved-items')
  return r
}

test('capability-overview AC-1: the first feature of a capability starts its overview', () => {
  const r = capabilityRepo()
  const text = fs.readFileSync(path.join(r.repo, 'specs', 'saved-items', 'architecture-overview.md'), 'utf8')
  assert.match(text, /^## System context$/m)
  assert.match(text, /^## Decision log$/m)
  assert.match(text, /^\| Date \| Decision \| Agreed by \| Source \| Changes \|$/m)
  assert.ok(!fs.existsSync(path.join(r.repo, 'specs', 'save-list', 'architecture-overview.md')), 'no copy in the feature folder')
})

test('capability-overview AC-2: a feature is checked against its capability\'s systems', () => {
  const r = capabilityRepo()
  r.put('specs/saved-items/architecture-overview.md', OVERVIEW({ systems: '| web | modified | web team | none | none | 1 |' }))
  r.setState('save-list', { stage: 4, stages: { 4: { enteredAt: '2026-11-07T00:00:00Z' } } })
  r.put('specs/save-list/tasks.md', '# Tasks: save-list\n\n## Tasks\n\n- [ ] T1 [R1] repos: [cart] files: a.ts test: AC-1 depends-on: []\n')
  const out = r.sdlc('request', 'save-list').out
  assert.match(out, /T1 changes cart, which is not in "## Systems under change"/)
  assert.doesNotMatch(out, /web is modified, but no task/, 'another feature in the capability may change web')
})

test('capability-overview AC-3: Define needs the capability\'s system context', () => {
  const r = capabilityRepo()
  r.put('specs/save-list/prd.md', `## Intent\n\n- Change: a\n- Smallest: b\n- Drop if: c\n\n${READY_PRD}`)
  r.put('specs/save-list/acceptance.feature', READY_FEATURE)
  const empty = r.sdlc('request', 'save-list').out
  assert.match(empty, /System context/)
  r.put('specs/saved-items/architecture-overview.md', OVERVIEW())
  assert.doesNotMatch(r.sdlc('request', 'save-list').out, /System context/)
  r.put('specs/saved-items/architecture-overview.md', OVERVIEW({ decisions: ['2026-11-07 | Offline mode moves to next | | | R4'] }))
  assert.match(r.sdlc('request', 'save-list').out, /has no agreed by and no source/, 'the Define request applies AC-4')
})

test('capability-overview AC-4: a decision row must say who agreed it and where', () => {
  const problems = decisionProblems(OVERVIEW({ decisions: ['2026-11-07 | Offline mode moves to next | | | R4 out of scope'] }))
  assert.equal(problems.length, 1)
  assert.match(problems[0], /agreed by/)
  assert.match(problems[0], /source/)
  assert.deepEqual(decisionProblems(OVERVIEW({ decisions: ['2026-11-07 | Offline mode moves to next | unconfirmed | chat, "move it" | R4'] })), [])
})

test('capability-overview AC-5: an unconfirmed decision is shown in the review packet', () => {
  const r = capabilityRepo()
  r.put('specs/saved-items/architecture-overview.md', OVERVIEW({ decisions: ['2026-11-07 | Offline mode moves to next | unconfirmed | chat, "move it" | save-list R4', '2026-11-06 | Keep the cart API | Ana (architect) | email | none'] }))
  const text = packetText(packet(r.repo, r.state('save-list')))
  const unconfirmed = text.split('## Unconfirmed decisions')[1]
  assert.ok(unconfirmed, text)
  assert.match(unconfirmed, /Offline mode moves to next/)
  assert.doesNotMatch(unconfirmed.split('\n## ')[0], /Keep the cart API/)
})
