// ADR-0004: each of the three real failures from docs/feedback.md, replayed against the guard that now
// catches it. F1 a denial retried as a failure, F2 context spent before the source of truth, F3 a branch
// deploy erased by the next merge. Plus the lesson an escape owes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, switchableGate } from './helpers.mjs'
import { releaseProblems, landedOn } from '../scripts/loop.mjs'
import { loadConfig } from '../scripts/lib.mjs'

const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()

test('F1: a denial is an answer; the second refusal hands back, then the session may only read until a human types', () => {
  const r = makeRepo()
  const s = 'session-f1'
  const first = r.tool('Bash', { command: 'gh pr merge 3' }, s)
  assert.equal(first.decision, 'deny')
  assert.match(first.reason, /final answer, not an error: do not retry, rephrase/)
  const rephrased = r.tool('Bash', { command: 'gh pr merge 3 --squash --auto' }, s)
  assert.equal(rephrased.decision, 'deny')
  assert.match(rephrased.reason, /Refused 2 times this session: hand back to the user now/, 'a rephrase counts against the same guard')
  const held = r.tool('Write', { file_path: `${r.repo}/src/ok.ts`, content: 'x' }, s)
  assert.equal(held.decision, 'deny', 'any other way of acting is held too')
  assert.match(held.reason, /waiting for the user/)
  assert.equal(r.tool('Read', { file_path: `${r.repo}/README.md` }, s).decision, 'allow', 'reading is still allowed')
  assert.equal(r.tool('Write', { file_path: `${r.repo}/src/ok.ts`, content: 'x' }, 'another-session').decision, 'allow', 'other sessions are not held')
  r.sayIn('ok, I will merge it myself', s)
  assert.equal(r.tool('Write', { file_path: `${r.repo}/src/ok.ts`, content: 'x' }, s).decision, 'allow', 'a human reply releases the session')
})

test('F1: a repo can lower the denial cap, never raise it', () => {
  const r = makeRepo()
  r.config({ denialCap: 1 })
  assert.equal(loadConfig(r.repo).denialCap, 1)
  assert.match(r.tool('Bash', { command: 'gh pr merge 3' }, 's').reason, /hand back to the user now/)
  r.config({ denialCap: 50 })
  assert.equal(loadConfig(r.repo).denialCap, 2)
})

test('F2: large files are read in slices, with the exact call in the refusal', () => {
  const r = makeRepo()
  r.put('db/schema.json', JSON.stringify({ t: 'x'.repeat(120000) }))
  r.put('src/validators.ts', 'export const v = 1\n'.repeat(2000))
  r.put('src/small.ts', 'export const s = 1\n')
  const full = r.tool('Read', { file_path: `${r.repo}/db/schema.json` })
  assert.equal(full.decision, 'deny')
  assert.match(full.reason, /read the implementation that governs it first, then this file in slices, for example Read with offset 1 and limit 200/)
  assert.match(r.tool('Read', { file_path: `${r.repo}/src/validators.ts` }).reason, /2001 lines/)
  assert.equal(r.tool('Read', { file_path: `${r.repo}/src/validators.ts`, offset: 1, limit: 200 }).decision, 'allow')
  assert.equal(r.tool('Read', { file_path: `${r.repo}/src/small.ts` }).decision, 'allow')
  assert.equal(r.tool('Bash', { command: 'cat src/validators.ts' }).decision, 'deny', 'a shell dump is the same mistake')
  assert.equal(r.tool('Bash', { command: 'head -50 src/validators.ts' }).decision, 'allow')
})

test('F3: release refuses a change that is not on the remote main, and a live build that is not this release', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full')
  const state = () => r.state('demo')
  const ready = live => `## Rollback (tested)\n\nTested: 2026-10-21, staging.\n\n## Probes\n\n- saved items render: pass\n\nLive: ${live}\n\n## Outcome metric\n\nMetric: m\nOwner: o\n`
  assert.match(releaseProblems(r.repo, state(), ready('abc1234')).problems.join(), /no "origin" remote/, 'the branch would be the only copy')
  r.remote()
  r.put('src/saved.ts', 'export const saved = true\n')
  r.git('add', '.')
  r.git('commit', '-q', '-m', 'saved items')
  r.setState('demo', { reviewedSha: r.git('rev-parse', 'HEAD') })
  const branchBuild = r.git('rev-parse', 'HEAD')
  const before = releaseProblems(r.repo, state(), ready(branchBuild)).problems.join('\n')
  assert.match(before, /is not on origin\/main.*a preview, never a release/, 'a deploy from the branch is not a release')
  assert.match(releaseProblems(r.repo, state(), ready('unknown')).problems.join(), /"Live: unknown": find out what is running/)
  assert.match(releaseProblems(r.repo, state(), '## Probes\n\n- ok\n').problems.join(), /no "Live: <sha>" line/)

  const main = r.land()
  assert.deepEqual(releaseProblems(r.repo, state(), ready(main)).problems, [])
  const old = r.git('rev-parse', 'origin/main~1')
  assert.match(releaseProblems(r.repo, state(), ready(old)).problems.join(), /does not contain the release commit/, 'the running build is older than this release')
})

test('F3: the next release refuses a live build that rolled the last release back', () => {
  const r = makeRepo()
  r.remote()
  r.put('src/first.ts', 'export const first = 1\n')
  const firstLive = r.land('first')
  // The second feature branched before the first landed, and its build is what got deployed.
  r.git('checkout', '-q', '-b', 'feature/second', 'main~1')
  r.put('specs/first/state.json', JSON.stringify({ feature: 'first', lane: 'full', stage: 6, stages: {}, gates: {}, retries: {}, closedAt: hoursAgo(5), releasedSha: firstLive, liveSha: firstLive }))
  r.sdlc('init', 'second', '--full', '--branch', 'feature/second')
  r.put('src/second.ts', 'export const second = 2\n')
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'second, branched before first landed')
  r.setState('second', { reviewedSha: r.git('rev-parse', 'HEAD') })
  const secondBranch = r.git('rev-parse', 'HEAD')
  r.git('push', '-q', 'origin', `${secondBranch}:refs/heads/main`, '--force')
  const text = `## Rollback (tested)\n\nTested: 2026-10-21, staging.\n\n## Probes\n\n- ok\n\nLive: ${secondBranch}\n\n## Outcome metric\n\nMetric: m\nOwner: o\n`
  assert.match(releaseProblems(r.repo, r.state('second'), text).problems.join(), /no longer contains first .*this deploy rolled it back/)
  assert.match(r.sdlc('status').out, new RegExp(`Live: ${firstLive.slice(0, 7)} \\(first`), 'status says which version is live')
})

test('F3: a squash merge counts as landed', () => {
  const r = makeRepo()
  r.remote()
  r.put('src/a.ts', 'export const a = 1\n')
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'a')
  r.put('src/b.ts', 'export const b = 2\n')
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'b')
  const tip = r.git('rev-parse', 'HEAD')
  r.git('checkout', '-q', 'main')
  r.git('merge', '-q', '--squash', 'feature/demo')
  r.git('commit', '-q', '-m', 'squashed')
  const squash = r.git('rev-parse', 'HEAD')
  r.git('push', '-q', 'origin', 'main')
  r.git('checkout', '-q', 'feature/demo')
  assert.equal(landedOn(r.repo, tip, 'main'), squash)
})

test('F3: an agent preview deploy asks until the branch is on the remote; prod deploys and deploys in scripts never pass quietly', () => {
  const r = makeRepo()
  r.remote()
  const preview = r.tool('Bash', { command: 'vercel deploy' })
  assert.equal(preview.decision, 'ask')
  assert.match(preview.reason, /is not on the remote.*a branch deploy is a preview, never a release/)
  r.git('push', '-q', '-u', 'origin', 'feature/demo')
  assert.equal(r.tool('Bash', { command: 'vercel deploy' }).decision, 'allow')
  for (const c of ['vercel --prod', 'vercel alias set x.vercel.app example.com', 'netlify deploy --prod', 'fly deploy', 'firebase deploy', 'wrangler deploy', 'npm run deploy']) {
    assert.equal(r.tool('Bash', { command: c }).decision, 'deny', c)
  }
  assert.equal(r.write('scripts/ship.sh', 'vercel --prod\n'), 'ask', 'a deploy written into a script')
  assert.equal(r.write('package.json', '{"scripts":{"ship":"fly deploy"}}'), 'ask')
  assert.equal(r.write('scripts/build.sh', 'npm run build\n'), 'allow')
})

test('lesson owed: an escaped bug cannot merge until a trap names it with a guard that is a check', () => {
  const r = makeRepo('bug/double-charge')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('init', 'checkout', '--full')
  r.sdlc('bug', 'double-charge', '--caused-by', 'checkout')
  assert.equal(r.state('double-charge').lessonOwed, true)
  r.setState('double-charge', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  r.fill('specs/double-charge/bug.md', ['## Repro', '## Expected and actual', '## Root cause', '## Fix', '## Test results', '## Not verified'], '\n## Pre-review\n\nRisk: medium\nOpen findings: 0\nLenses run: correctness\nRevert: git revert the merge commit\n')
  gate.green()
  r.sdlc('gate', 'double-charge')
  assert.match(r.sdlc('request', 'double-charge').out, /a lesson is owed: add a trap to standards\/traps\.md with "- \*\*Source:\*\* double-charge"/)
  assert.match(r.hook('session-start', {}), /LESSON OWED: double-charge/)
  r.put('standards/traps.md', '### Retries charged twice\n- **What happened:** x.\n- **Source:** double-charge\n- **Guard now:** reviewers remember to check retries.\n')
  assert.match(r.sdlc('request', 'double-charge').out, /a lesson is owed/, 'a guard in words does not pay it')
  r.put('standards/traps.md', '### Retries charged twice\n- **What happened:** x.\n- **Source:** another-bug\n- **Guard now:** the idempotency test in tests/charge.test.ts.\n')
  assert.match(r.sdlc('request', 'double-charge').out, /a lesson is owed/, 'a trap about something else does not pay it')
  r.put('standards/traps.md', '### Retries charged twice\n- **What happened:** x.\n- **Source:** double-charge\n- **Guard now:** the idempotency test in tests/charge.test.ts.\n')
  assert.match(r.sdlc('request', 'double-charge').out, /waiting on/)
  r.sdlc('init', 'calm', '--full')
  assert.equal(r.state('calm').lessonOwed, undefined, 'a feature with no escape owes nothing')
})
