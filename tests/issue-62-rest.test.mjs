// Issue #62, the rest: sdlc worktree, cleanup, ship, and changelog fragments.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, switchableGate } from './helpers.mjs'

const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()
const PRE = '\n## Pre-review\n\nRisk: medium, because it changes code\nOpen findings: 0\nLook here first: gate.cjs:1\nLenses run: correctness\nRevert: git revert the merge commit\n\n## Not verified\n\nNo proofCommand, so the proof did not run.\n'

test('item 6: sdlc worktree starts the work on its lane branch in its own worktree', () => {
  const r = makeRepo()
  r.git('checkout', '-q', 'main')
  const out = r.sdlc('worktree', 'bug', 'fix-total')
  assert.equal(out.status, 0, out.out)
  const where = path.join(r.repo, '.claude', 'worktrees', 'fix-total')
  assert.equal(r.git('-C', where, 'rev-parse', '--abbrev-ref', 'HEAD'), 'bug/fix-total')
  assert.ok(fs.existsSync(path.join(where, 'specs', 'fix-total', 'bug.md')))
  assert.notEqual(r.sdlc('worktree', 'hotfix', 'x').status, 0, 'a hotfix is declared by a person')
})

test('item 6: sdlc cleanup removes merged clean worktrees and keeps the rest', () => {
  const r = makeRepo()
  r.git('checkout', '-q', 'main')
  r.sdlc('worktree', 'task', 'done-one')
  r.sdlc('worktree', 'task', 'open-one')
  const done = path.join(r.repo, '.claude', 'worktrees', 'done-one')
  const open = path.join(r.repo, '.claude', 'worktrees', 'open-one')
  r.git('-C', done, 'add', '-A')
  r.git('-C', done, 'commit', '-q', '-m', 'done')
  r.git('merge', '-q', '--no-ff', '-m', 'merge', 'task/done-one')
  fs.writeFileSync(path.join(open, 'wip.txt'), 'wip\n')
  const out = r.sdlc('cleanup')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /Removed 1 merged worktree\(s\): task\/done-one/)
  assert.equal(fs.existsSync(done), false)
  assert.ok(fs.existsSync(open), 'unmerged work stays')
  assert.equal(r.git('branch', '--list', 'task/done-one'), '')
})

test('item 11: sdlc ship runs the gate, passes Build and Verify on checks and commits the specs', () => {
  const r = makeRepo('task/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('task', 'demo')
  r.fill('specs/demo/task.md', ['## Summary', '## Change', '## Why', '## Behaviour change', '## Test results'], PRE)
  gate.green()
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'work')
  r.remote()
  r.sdlc('gate', 'demo')
  r.setState('demo', { stages: { 4: { enteredAt: hoursAgo(1) } } })
  r.sdlc('review', 'demo')
  const out = r.sdlc('ship', 'demo')
  assert.ok(r.state('demo').closedAt, out.out)
  assert.equal(r.git('status', '--porcelain', '--', 'specs/demo'), '', 'the spec folder is committed')
  assert.match(out.out, /pr demo|https:\/\//, 'it goes on to open the PR')
})

test('item 10: changelog fragments fold into the Unreleased section and are removed', () => {
  const r = makeRepo()
  r.put('CHANGELOG.md', '# Changelog\n\n## [Unreleased]\n\n- **Old entry.**\n\n## [1.0.0]\n')
  r.put('changelog.d/a-fix.md', '- **A fix.**\n')
  r.put('changelog.d/b-task.md', '- **A task.**\n')
  const out = r.sdlc('changelog')
  assert.equal(out.status, 0, out.out)
  const text = fs.readFileSync(path.join(r.repo, 'CHANGELOG.md'), 'utf8')
  assert.match(text, /## \[Unreleased\]\n\n- \*\*A fix\.\*\*\n- \*\*A task\.\*\*\n- \*\*Old entry\.\*\*/)
  assert.deepEqual(fs.readdirSync(path.join(r.repo, 'changelog.d')), [])
})
