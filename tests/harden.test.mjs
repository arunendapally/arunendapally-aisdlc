// Later changes 1 to 4 of the council on templates (docs/decisions/2026-11-04-templates-at-every-stage.md):
// checks that passed on what a person did not write, or on a result that says it failed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { releaseProblems, outcomeFollowUp } from '../scripts/loop.mjs'
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

test('2: a failed probe stops the release; a probe that tests a failure and passes does not', () => {
  const r = makeRepo()
  assert.match(problems(r, release({ probes: '| AC-3 total | curl /cart | 10.99 | fail, 10.98 |\n\nLive: abcdef1' })), /a probe failed: .*AC-3 total/)
  assert.match(problems(r, release({ probes: '- checkout health: FAILED (500)\n\nLive: abcdef1' })), /a probe failed/)
  assert.doesNotMatch(problems(r, release({ probes: '- a failed payment is retried once: pass\n\nLive: abcdef1' })), /a probe failed/)
})

test('2: a rollback is tested on a date it ran, not one it is planned for', () => {
  const r = makeRepo()
  assert.match(problems(r, release({ rollback: 'Not tested yet, planned 2026-11-05' })), /no "Tested: <date>, <how>" line/)
  assert.match(problems(r, release({ rollback: 'Tested: <YYYY-MM-DD>, <how>' })), /no "Tested: <date>, <how>" line/)
  assert.doesNotMatch(problems(r, release()), /Tested/)
})

test('1: Lenses run and Revert need a value on their own line', () => {
  const r = makeRepo()
  const pre = lines => `## Summary\n\nx\n\n## Test results\n\nx\n\n## Pre-review\n\n${lines}\n\n## Not verified\n\nx\n`
  const check = async body => (await import('../templates/repo/.github/scripts/check-pr-body.mjs')).problems(body).join('\n')
  return (async () => {
    assert.match(await check(pre('Risk: medium\nOpen findings: 0\nRevert:\nLook here first: a.js:1')), /Revert/)
    assert.doesNotMatch(await check(pre('Risk: medium\nOpen findings: 0\nRevert: git revert of the merge')), /Revert/)
  })()
})

test('3: a data feature needs a fact; "None, because" elsewhere in facts.md does not stand in for one', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--kind', 'data')
  r.say('sdlc intent demo change: points; smallest: a column; drop if: nobody earns')
  r.put('specs/demo/prd.md', READY_PRD)
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  r.put('specs/demo/facts.md', '# System facts: demo\n\n## Facts\n\n## Not found\n\nNone, because we searched src/ and found nothing missing.\n')
  assert.match(r.sdlc('request', 'demo').out, /data work needs at least one fact/)
})
