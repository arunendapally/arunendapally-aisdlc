// Later changes 1 to 3 of the council on templates (docs/decisions/2026-11-04-templates-at-every-stage.md):
// checks that passed on what a person did not write, or on a result that says it failed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { outcomeFollowUp } from '../scripts/loop.mjs'
import { loadConfig } from '../scripts/lib.mjs'

const release = ({ rollback = 'Tested: 2026-11-02, on staging: flag off restored the old totals', probes = '| AC-3 total | curl /cart | 10.99 | pass, 10.99 |\n\nLive: abcdef1', outcome = 'Metric: conversion back to 3.1%\nOwner: Priya' } = {}) =>
  `## Rollout\n\nAll at once.\n\n## Rollback (tested)\n\n${rollback}\n\n## Probes\n\n${probes}\n\n## Outcome metric\n\n${outcome}\n`

test('1: an empty Metric does not borrow the next line', () => {
  const r = makeRepo()
  const cfg = loadConfig(r.repo)
  assert.equal(outcomeFollowUp({ feature: 'demo', lane: 'light' }, release({ outcome: 'Metric:\nOwner: Priya' }), cfg)?.metric ?? null, null)
})

test('1: every Pre-review value is on its own line, in CI and at the Verify gate', async () => {
  const { problems: check } = await import('../templates/repo/.github/scripts/check-pr-body.mjs')
  const body = lines => `## Summary\n\nx\n\n## Test results\n\nx\n\n## Pre-review\n\n${lines}\n\n## Not verified\n\nx\n`
  const full = 'Risk: medium\nOpen findings: 0\nLook here first: a.js:1\nLenses run: correctness\nRevert: git revert of the merge'
  assert.deepEqual(check(body(full)).filter(p => /pre-review/.test(p)), [])
  assert.match(check(body(full.replace('Revert: git revert of the merge', 'Revert:\nnext line'))).join('\n'), /Revert/)
  assert.match(check(body(full.replace('Risk: medium', 'Risk:\nmedium'))).join('\n'), /Risk/)
  assert.match(check(body(full.replace('Open findings: 0', 'Open findings:\n0'))).join('\n'), /open findings/)
  const src = fs.readFileSync(new URL('../scripts/sdlc.mjs', import.meta.url), 'utf8')
  for (const label of ['Risk', 'Open findings', 'Lenses run', 'Revert']) assert.match(src, new RegExp(`/${label}:\\[ \\\\t\\]\\*`), `${label} at the Verify gate`)
})

test('3: "None, because" counts only under ## Facts; greenfield data work may use it there', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--kind', 'data')
  r.say('sdlc intent demo change: points; smallest: a column; drop if: nobody earns')
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.put('specs/demo/facts.md', '# System facts: demo\n\n## Facts\n\n## Not found\n\nNone, because we searched src/ and found nothing missing.\n')
  assert.match(r.sdlc('request', 'demo').out, /facts\.md has no facts/)
  r.put('specs/demo/facts.md', '# System facts: demo\n\n## Facts\n\nNone, because the saved list is a new store and nothing reads it yet.\n\n## Not found\n\nNothing missing; searched src/.\n')
  assert.doesNotMatch(r.sdlc('request', 'demo').out, /facts\.md/)
})
