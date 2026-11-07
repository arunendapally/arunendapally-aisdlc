// trace-index: "sdlc trace <capability>" prints each requirement, named by feature, with its scenarios,
// tests, decisions and ADRs; "sdlc trace --file <path>" reads the same links backwards. Written nowhere.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, READY_PRD } from './helpers.mjs'

const PRD = READY_PRD.replace('- R1. (must) Save an item.\n', '- R1. (must) Save an item.\n- R2. (must) Share the list.\n')
const FEATURE = 'Feature: Save\n  As a shopper\n  I want to save items\n  So that I buy later\n\n  @R1 @AC-1 @unit\n  Scenario: Save an item\n    Given an item\n    When I save it\n    Then it is saved\n'
const OVERVIEW = '# Architecture overview: saved-items\n\n## Decision log\n\n| Date | Decision | Agreed by | Source | Changes |\n|---|---|---|---|---|\n| 2026-11-07 | Keep no price | Arun | chat | save-list R1 |\n| 2026-11-08 | Other | Arun | chat | other-thing R1 |\n'

function repo() {
  const r = makeRepo('feature/save-list')
  r.put('specs/saved-items/slices.md', '# Slices: saved-items\n\n## Slices\n\n- save-list: save an item. Depends on: none. Status: planned\n')
  r.put('specs/saved-items/architecture-overview.md', OVERVIEW)
  r.put('specs/save-list/prd.md', PRD)
  r.put('specs/save-list/acceptance.feature', FEATURE)
  r.put('tests/save-list.test.mjs', "test('save-list AC-1: save an item', () => {})\n")
  r.put('docs/adr/0001-no-price.md', '# ADR-0001: No price\n\n## Context\n\nsave-list/R1 keeps no price.\n')
  r.put('docs/adr/0002-other.md', '# ADR-0002: Other\n\nNothing to do with the list.\n')
  return r
}

const lineOf = (out, id) => out.split('\n').find(l => l.startsWith(`${id} `)) ?? ''

test('trace-index AC-1: the index lists each requirement with its scenarios and tests', () => {
  const r = repo()
  const { status, out } = r.sdlc('trace', 'saved-items')
  assert.equal(status, 0, out)
  assert.match(lineOf(out, 'save-list/R1'), /AC-1/)
  assert.match(lineOf(out, 'save-list/R1'), /tests\/save-list\.test\.mjs/)
  assert.equal(r.git('status', '--porcelain').includes('trace'), false, 'the index is written nowhere (PRD A2)')
})

test('trace-index AC-2: the index lists the decisions and ADRs for a requirement', () => {
  const line = lineOf(repo().sdlc('trace', 'saved-items').out, 'save-list/R1')
  assert.match(line, /2026-11-07 Keep no price/)
  assert.match(line, /docs\/adr\/0001-no-price\.md/)
  assert.doesNotMatch(line, /2026-11-08|0002-other/)
})

test('trace-index AC-3: a test traces back to its requirement', () => {
  const r = repo()
  assert.match(r.sdlc('trace', '--file', 'tests/save-list.test.mjs').out, /save-list\/R1/)
  assert.match(r.sdlc('trace', '--file', 'docs/adr/0001-no-price.md').out, /save-list\/R1/)
  assert.match(r.sdlc('trace', '--file', 'decision:2026-11-07 Keep no price').out, /save-list\/R1/)
  assert.match(r.sdlc('trace', '--file', 'docs/adr/0002-other.md').out, /traces to no requirement/)
})

test('trace-index AC-4: a requirement with no scenario or no test is marked', () => {
  const r = repo()
  assert.match(lineOf(r.sdlc('trace', 'saved-items').out, 'save-list/R2'), /no scenario/)
  r.put('tests/save-list.test.mjs', "test('save a thing', () => {})\n")
  assert.match(lineOf(r.sdlc('trace', 'saved-items').out, 'save-list/R1'), /no test/)
})

test('trace-index AC-2: a decision naming a range or a list links every requirement in it, and R1 never matches R10', () => {
  const r = repo()
  r.put('specs/save-list/prd.md', PRD.replace('- R2. (must) Share the list.\n', ['R2', 'R3', 'R4', 'R10'].map(id => `- ${id}. (must) Thing.\n`).join('')))
  r.put('specs/saved-items/architecture-overview.md', OVERVIEW.replace('| 2026-11-08 | Other', '| 2026-11-09 | Range | Arun | chat | save-list R2 to R3 |\n| 2026-11-10 | List | Arun | chat | save-list R1, R4 |\n| 2026-11-11 | Dash | Arun | chat | save-list R2-R4 |\n| 2026-11-12 | Ten | Arun | chat | save-list R10 |\n| 2026-11-08 | Other'))
  r.put('docs/adr/0003-ten.md', '# ADR-0003: Ten\n\nsave-list/R10 only.\n')
  const out = r.sdlc('trace', 'saved-items').out
  assert.match(lineOf(out, 'save-list/R3'), /Range.*Dash/)
  assert.match(lineOf(out, 'save-list/R4'), /List.*Dash/)
  assert.doesNotMatch(lineOf(out, 'save-list/R1'), /Ten|0003-ten/)
  assert.match(lineOf(out, 'save-list/R10'), /Ten.*0003-ten/)
})
