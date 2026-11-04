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
