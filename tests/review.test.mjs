// ADR-0005, from "How the Claude Code team does code review": review converges, an approval covers what
// was checked, the change sets its risk tier, and a person can retire work that will not go further.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { makeRepo, switchableGate, READY_PRD, READY_FEATURE } from './helpers.mjs'
import { riskTier } from '../scripts/loop.mjs'
import { parseLedger, ledgerProblems } from '../scripts/review.mjs'

const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()
const BUG = ['## Repro', '## Expected and actual', '## Root cause', '## Fix', '## Test results', '## Not verified']
const PRE = risk => `\n## Pre-review\n\nRisk: ${risk}\nOpen findings: 0\nLenses run: correctness, tests\nRevert: git revert the merge commit\n`

// A bug at Verify whose gate is green, ready to request.
function verifyRepo() {
  const r = makeRepo('bug/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('bug', 'demo')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  r.put('src/total.ts', 'export const total = 1\n')
  r.fill('specs/demo/bug.md', BUG, PRE('medium'))
  gate.green()
  r.sdlc('gate', 'demo')
  return r
}

test('an approval covers what the request checked: a later change lapses it', () => {
  const r = verifyRepo()
  assert.match(r.sdlc('request', 'demo').out, /waiting on/)
  r.put('src/total.ts', 'export const total = 2\n')
  const lapsed = r.say('sdlc approve demo 5')
  assert.match(lapsed, /what it checked has changed since the request, so it has lapsed/)
  assert.equal(r.state('demo').gates['5'].status, 'lapsed')
  assert.match(r.sdlc('request', 'demo').out, /waiting on/)
  assert.match(r.say('sdlc approve demo 5'), /approved gate 5/, 'requested again, the approval stands')
})

test('a commit with the same change does not lapse an approval; a spec edit lapses the spec gate', () => {
  const r = verifyRepo()
  r.sdlc('request', 'demo')
  r.git('add', 'src/total.ts')
  r.git('commit', '-q', '-m', 'commit what was reviewed')
  assert.match(r.say('sdlc approve demo 5'), /approved gate 5/)

  const s = makeRepo()
  s.sdlc('init', 'demo')
  s.say('sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves')
  s.put('specs/demo/prd.md', READY_PRD)
  s.put('specs/demo/acceptance.feature', READY_FEATURE)
  s.sdlc('request', 'demo')
  s.put('specs/demo/prd.md', READY_PRD.replace('Save an item', 'Save and share an item'))
  assert.match(s.say('sdlc approve demo 1'), /has lapsed/)
})

test('the change sets its risk tier, and the pre-review may raise it but never lower it', () => {
  const r = makeRepo()
  assert.equal(riskTier(r.repo, ['docs/guide.md', 'specs/x/prd.md']).tier, 'low')
  assert.equal(riskTier(r.repo, ['src/cart.ts']).tier, 'medium')
  assert.equal(riskTier(r.repo, ['src/auth/login.ts']).tier, 'high')
  assert.equal(riskTier(r.repo, ['.github/workflows/ci.yml']).tier, 'high')
  assert.equal(riskTier(r.repo, ['src/cart.ts'], 'Risk: high').tier, 'high', 'raised by the label')
  assert.equal(riskTier(r.repo, ['src/auth/login.ts'], 'Risk: low').tier, 'high', 'never lowered by the label')
  assert.equal(riskTier(r.repo, ['.ai-sdlc/audit.jsonl']).tier, 'low', 'the plugin state is not part of the change')

  const v = verifyRepo()
  v.put('src/auth/token.ts', 'export const t = 1\n')
  const out = v.sdlc('request', 'demo').out
  assert.match(out, /the pre-review says "Risk: medium", but the change is high: src\/auth\/token\.ts is on a path that always needs a person/)
  assert.equal(v.state('demo').riskTier, 'high')
  v.fill('specs/demo/bug.md', BUG, PRE('high'))
  assert.match(v.sdlc('request', 'demo').out, /Risk tier: high/)
})

test('the plugin, the repo kit and this repo use one PR template, with risk and revert', () => {
  const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const plugin = read('../skills/org-ai-sdlc/templates/pr.md')
  assert.equal(read('../templates/repo/.github/pull_request_template.md'), plugin)
  assert.equal(read('../.github/pull_request_template.md'), plugin)
  assert.match(plugin, /Revert:/)
  assert.match(plugin, /high {4}auth, payments/)
})

test('every pre-review says how to undo the change', () => {
  const r = verifyRepo()
  r.fill('specs/demo/bug.md', BUG, PRE('medium').replace('Revert: git revert the merge commit\n', ''))
  assert.match(r.sdlc('request', 'demo').out, /does not say how to undo this \("Revert: <command or flag>"\)/)
})

test('review converges: a finding that repeats a closed one is refused, and re-review shows only what changed', () => {
  const r = makeRepo()
  r.put('src/a.ts', 'x\n')
  const row = (id, status) => `| ${id} | major | src/a.ts:1 | 6 | retry not idempotent | ${status} | pre-review |`
  const ledger = rows => parseLedger(`| ID | Severity | Location | Checklist | Finding | Status | Source |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`)
  const repeat = ledgerProblems(r.repo, ledger([row('F1', 'wontfix: by design'), row('F2', 'open')]), ['F1'])
  assert.match(repeat.join('\n'), /F2 repeats F1 \(src\/a\.ts, item 6\), which is already closed/)
  assert.doesNotMatch(ledgerProblems(r.repo, ledger([row('F1', 'wontfix: by design')]), ['F1']).join('\n'), /repeats/)

  const v = verifyRepo()
  v.git('add', '-A')
  v.git('commit', '-q', '-m', 'first round')
  v.sdlc('review', 'demo')
  v.put('src/more.ts', 'export const more = 1\n')
  v.git('add', '-A')
  v.git('commit', '-q', '-m', 'second round')
  const packet = v.sdlc('review', 'demo').out
  assert.match(packet, /## Changed since the last review \([0-9a-f]{7}\)/)
  assert.match(packet, /- `src\/more\.ts`/)
  assert.doesNotMatch(packet.split('## Changed since the last review')[1].split('##')[0], /total\.ts/)
})

test('review converges: after three refused rounds the gate stops until a person gives direction', () => {
  const r = verifyRepo()
  r.fill('specs/demo/bug.md', BUG, PRE('medium').replace('Open findings: 0', 'Open findings: 2'))
  for (let i = 1; i <= 3; i++) assert.match(r.sdlc('request', 'demo').out, new RegExp(`Review round ${i} of 3`))
  assert.match(r.sdlc('request', 'demo').out, /refused 3 times\. Stop fixing finding by finding/)
  assert.equal(r.bash('echo sdlc reject demo 5 rethink'), 'deny', 'an agent cannot reset its own rounds')
  r.say('sdlc reject demo 5 rethink: fix the retry at its source')
  assert.equal(r.state('demo').reviewRounds, 0)
  r.fill('specs/demo/bug.md', BUG, PRE('medium'))
  assert.match(r.sdlc('request', 'demo').out, /waiting on/)
})

test('code committed after Verify never reached a reviewer, so Release refuses it', () => {
  const r = makeRepo()
  r.remote()
  r.sdlc('init', 'demo', '--full')
  r.put('src/saved.ts', 'export const saved = true\n')
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'reviewed')
  r.setState('demo', { stage: 6, stages: { 6: { enteredAt: hoursAgo(1) } }, reviewedSha: r.git('rev-parse', 'HEAD'), reviewedHashes: { 'src/saved.ts': 'unused' } })
  r.put('src/extra.ts', 'export const extra = 1\n')
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'after review')
  assert.match(r.sdlc('request', 'demo').out, /src\/extra\.ts changed after Verify reviewed .*never reached a reviewer/)
})

test('sdlc close: only a person retires work, with a reason, and never while a lesson is owed', () => {
  const r = makeRepo()
  r.sdlc('init', 'spike-idea')
  assert.equal(r.bash('echo sdlc close spike-idea dropped'), 'deny', 'agents cannot close work')
  assert.match(r.say('sdlc close spike-idea'), /needs a reason/)
  assert.match(r.say('sdlc close spike-idea superseded by saved-items'), /closed spike-idea at stage 1: \\"superseded by saved-items/)
  const s = r.state('spike-idea')
  assert.ok(s.closedAt)
  assert.equal(s.closedBy, 'Test Human')
  assert.equal(s.outcome, undefined, 'nothing was released, so no outcome follow-up')
  assert.match(r.sdlc('status').out, /spike-idea: closed at stage 1 by Test Human: superseded by saved-items/)
  assert.doesNotMatch(r.hook('session-start', {}), /spike-idea: stage/)

  r.sdlc('init', 'checkout', '--full')
  r.sdlc('bug', 'double-charge', '--caused-by', 'checkout')
  assert.match(r.say('sdlc close double-charge cannot reproduce'), /owes a lesson/, 'closing never buries an escape')
})

test('the merge request shows the risk tier, how much was reviewed and what was not verified', () => {
  const r = verifyRepo()
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /waiting on/)
  assert.match(out, /Risk tier: medium\. Files reviewed: \d+\.\nNot verified: Filled\./)
})
