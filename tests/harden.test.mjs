// Later changes 1 to 3 of the council on templates (docs/decisions/2026-11-04-templates-at-every-stage.md):
// checks that passed on what a person did not write, or on a result that says it failed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { releaseProblems, outcomeFollowUp, probeResult } from '../scripts/loop.mjs'
import { loadConfig } from '../scripts/lib.mjs'

const release = ({ rollback = 'Tested: 2026-11-02, on staging: flag off restored the old totals', probes = '| AC-3 total | curl /cart | 10.99 | pass, 10.99 |\n\nLive: abcdef1', outcome = 'Metric: conversion back to 3.1%\nOwner: Priya' } = {}) =>
  `## Rollout\n\nAll at once.\n\n## Rollback (tested)\n\n${rollback}\n\n## Probes\n\n${probes}\n\n## Outcome metric\n\n${outcome}\n`
const problems = (r, text) => releaseProblems(r.repo, { feature: 'demo', lane: 'light', reviewedFiles: [] }, text, loadConfig(r.repo)).problems.join('\n')

test('1: an empty Metric or Owner does not borrow the next line, and a placeholder is not a value', () => {
  const r = makeRepo()
  assert.doesNotMatch(problems(r, release()), /Outcome metric/)
  assert.match(problems(r, release({ outcome: 'Metric:\nOwner: Priya' })), /needs "Metric:" and "Owner:"/)
  assert.match(problems(r, release({ outcome: 'Metric: <the PRD outcome metric>\nOwner: <who reads it>' })), /needs "Metric:" and "Owner:"/)
  const cfg = loadConfig(r.repo)
  assert.equal(outcomeFollowUp({ feature: 'demo', lane: 'light' }, release({ outcome: 'Metric:\nOwner: Priya' }), cfg)?.metric ?? null, null)
})

test('2: a failed probe stops the release; a probe that passed, however it is worded, does not', () => {
  const r = makeRepo()
  const fails = probes => /a probe failed/.test(problems(r, release({ probes: `${probes}\n\nLive: abcdef1` })))
  for (const p of ['| AC-3 total | curl /cart | 10.99 | fail, 10.98 |', '- checkout health: FAILED (500)', '- checkout: FAIL, expected pass']) assert.ok(fails(p), p)
  for (const p of ['- a failed payment is retried once: pass', '- 5xx rate: ok, was red yesterday', '- batch jobs: ok, 0 failed', '| Bad password | curl /login | 401 | pass, 401 "login failed" |', '- p95: 180 ms, pass', '- p95: pass (0 failures)',
    '| Probe | Command | Expected | Result (pass/fail) |\n|---|---|---|---|\n| AC-3 total | curl /cart | 10.99 | pass, 10.99 |']) assert.ok(!fails(p), p)
  assert.equal(probeResult('|---|---|'), null)
})

test('2: a rollback is tested on a date it ran, not one it is planned for, however the line is written', () => {
  const r = makeRepo()
  const refused = rollback => /no "Tested: <date>, <how>" line/.test(problems(r, release({ rollback })))
  for (const t of ['Not tested yet, planned 2026-11-05', 'Tested: <YYYY-MM-DD>, <how>', 'Tested: 2999-01-01, will run on staging']) assert.ok(refused(t), t)
  for (const t of ['Tested: 2026-11-02, on staging; we will rerun it monthly', 'Tested: 2026-11-02, flag off, did not lose data', '**Tested:** 2026-11-02, on staging', 'helm rollback. Tested on 2026-11-02, on staging', 'Tested: 2026-11-02T14:00Z, on staging']) assert.ok(!refused(t), t)
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
