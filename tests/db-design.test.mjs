// The council on templates (docs/decisions/2026-11-04-templates-at-every-stage.md): data work keeps one
// document the DBA owns, db-design.md, the data contract as openapi.yaml is the API's. Its sections are due
// stage by stage and stay due; the parts approved at Plan and Design lapse those approvals when they change,
// and the Build and Release parts do not.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo } from './helpers.mjs'
import { stageSpec } from '../scripts/lib.mjs'
import { gateFingerprint } from '../scripts/loop.mjs'

const ER = '```mermaid\nerDiagram\n  %% changed: POINTS\n  POINTS {\n    uuid customer_id FK\n    int balance "added"\n  }\n```\n'

test('data work starts db-design.md; each stage asks for the sections due by then, in that file', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full', '--kind', 'data')
  const doc = fs.readFileSync(`${r.repo}/specs/demo/db-design.md`, 'utf8')
  for (const h of ['## Data impact', '## Data model', '## Migration plan (expand-contract)', '## Rehearsal', '## Down migration', '## Backout']) assert.match(doc, new RegExp(`^${h.replace(/[()]/g, '\\$&')}$`, 'm'))
  const due = stage => stageSpec(r.state('demo'), stage).docs['db-design.md']
  assert.deepEqual(due(1), ['## Data impact'])
  assert.deepEqual(due(3), ['## Data impact', '## Data model', '## Migration plan (expand-contract)'])
  assert.deepEqual(due(6).slice(-1), ['## Backout'])
})

test('Plan and Design approvals cover their db-design.md sections; Build and Release sections do not lapse them', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full', '--kind', 'data')
  const write = extra => r.put('specs/demo/db-design.md', `## Data impact\n\nPoints per customer.\n\n## Data model\n\n${ER}\n## Migration plan (expand-contract)\n\nAdd the column.\n${extra}`)
  write('')
  const state = r.state('demo')
  const plan = gateFingerprint(r.repo, state, 1)
  const design = gateFingerprint(r.repo, state, 3)
  write('\n## Rehearsal\n\nRan on a copy, 4 s.\n\n## Down migration\n\nDrop the column.\n\n## Backout\n\nRevert, then the down migration.\n')
  assert.equal(gateFingerprint(r.repo, state, 1), plan, 'Build and Release sections do not change what Plan approved')
  assert.equal(gateFingerprint(r.repo, state, 3), design, 'or what Design approved')
  r.put('specs/demo/db-design.md', fs.readFileSync(`${r.repo}/specs/demo/db-design.md`, 'utf8').replace('Add the column.', 'Add the column, then backfill.'))
  assert.notEqual(gateFingerprint(r.repo, state, 3), design, 'a changed migration plan lapses Design')
  r.put('specs/demo/db-design.md', fs.readFileSync(`${r.repo}/specs/demo/db-design.md`, 'utf8').replace('Points per customer.', 'Points and tiers per customer.'))
  assert.notEqual(gateFingerprint(r.repo, state, 1), plan, 'a changed data impact lapses Plan')
})

test('the two ADR templates stay the same file', () => {
  const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8')
  assert.equal(read('../templates/repo/docs/adr/0000-template.md'), read('../skills/org-ai-sdlc/templates/adr.md'))
})

// Pre-review F1 and F2: approvals given before db-design.md must hold after the upgrade.
test('a feature with no db-design.md fingerprints exactly as before, so its approvals hold', async () => {
  const crypto = await import('node:crypto')
  const sha = t => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16)
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full')
  r.put('specs/demo/plan.md', '## Decisions\n\nNone, because no ADR.\n')
  const before = gateFingerprint(r.repo, r.state('demo'), 3)
  assert.equal(before, sha(fs.readFileSync(`${r.repo}/specs/demo/plan.md`, 'utf8')).slice(0, before.length))
})

test('a data feature started before db-design.md keeps its sections where they were', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full')
  r.setState('demo', { kinds: ['data'] }) // as a 0.6.0 feature: data, and no dataDoc stamp
  const state = r.state('demo')
  assert.deepEqual(stageSpec(state, 1).docs, {})
  assert.ok(stageSpec(state, 1).headings.includes('## Data impact'), 'Data impact stays in prd.md')
  assert.ok(stageSpec(state, 3).headings.includes('## Rehearsal'), 'Rehearsal stays in plan.md')
  assert.ok(stageSpec(state, 6).headings.includes('## Backout'), 'Backout stays a stage-6 section of db-design.md')
  r.sdlc('kind', 'demo', 'data')
  assert.equal(r.state('demo').dataDoc, undefined, 'adding a kind it already has does not move its sections')
})

test('the light lane has no Design stage, so Build warns about a missing ER diagram', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--kind', 'data')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-10-31T00:00:00Z' } } })
  r.fill('specs/demo/db-design.md', ['## Data impact', '## Data model', '## Migration plan (expand-contract)', '## Rehearsal', '## Down migration'])
  assert.match(r.sdlc('request', 'demo').out, /WARNING: ER diagram: db-design\.md "## Data model" has no Mermaid erDiagram/)
})
