// Issue #62: a field report of a 4-bug batch. Each test names the item it covers.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { makeRepo, plugin } from './helpers.mjs'
import { loadConfig, runtimePath, baseRef, codeTree } from '../scripts/lib.mjs'
import { ledgerProblems } from '../scripts/review.mjs'
import { problems as prBody } from '../templates/repo/.github/scripts/check-pr-body.mjs'

test('item 1: a worktree with no config of its own uses the main worktree\'s', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'npm test' })
  const wt = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ai-sdlc-wt-')), 'wt')
  r.git('worktree', 'add', '-q', '-b', 'bug/x', wt, 'main')
  assert.equal(fs.existsSync(path.join(wt, '.ai-sdlc', 'config.json')), false)
  assert.equal(loadConfig(wt).gateCommand, 'npm test')
})

test('item 1: a person sets the gate once with gate-command; an agent cannot', () => {
  const r = makeRepo()
  assert.equal(r.bash(`node "${path.join(plugin, 'scripts', 'sdlc.mjs')}" gate-command npm test`), 'deny')
  const out = r.sdlc('gate-command', 'npm', 'test')
  assert.equal(out.status, 0, out.out)
  assert.equal(JSON.parse(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'config.json'), 'utf8')).gateCommand, 'npm test')
})

test('item 1: with no gateCommand the gate prints the command for PowerShell and for sh', () => {
  const r = makeRepo()
  r.sdlc('task', 'demo')
  r.git('checkout', '-q', '-b', 'task/demo')
  const out = r.sdlc('gate', 'demo').out
  assert.match(out, /PowerShell: node "[^"]+sdlc\.mjs" gate-command "npm test"/)
  assert.match(out, /sh: +node '[^']+sdlc\.mjs' gate-command 'npm test'/)
})

test('item 6: the hooks\' logs live in the git common dir, so no worktree is dirty from them', () => {
  const r = makeRepo()
  r.tool('Bash', { command: 'git push --force origin feature/demo' })
  assert.equal(fs.existsSync(path.join(r.repo, '.ai-sdlc', 'audit.jsonl')), false)
  assert.equal(fs.existsSync(path.join(r.repo, '.ai-sdlc', 'denials.json')), false)
  assert.match(fs.readFileSync(runtimePath(r.repo, 'audit.jsonl'), 'utf8'), /force-push/)
  assert.match(runtimePath(r.repo, 'audit.jsonl').replace(/\\/g, '/'), /\.git\/ai-sdlc\/audit\.jsonl$/)
})

test('item 3: a denial names its guard and what is allowed instead', () => {
  const r = makeRepo()
  const got = r.tool('Bash', { command: 'git push --force origin feature/demo' })
  assert.equal(got.decision, 'deny')
  assert.match(got.reason, /\(guard: force-push\) Instead: merge the base branch into yours/)
})

test('item 3: a person can let agents run a command through bashAllow', () => {
  const r = makeRepo()
  assert.equal(r.bash('gh release create v1.2.3 --notes x'), 'deny')
  r.config({ bashAllow: ['^gh\\s+release\\s+create\\b'] })
  assert.equal(r.bash('gh release create v1.2.3 --notes x'), 'allow')
  assert.equal(r.bash('gh release create v1 && gh pr merge 3'), 'deny', 'only the allowed segment passes')
})

test('item 2: a bug fix may bump the version in package.json, and nothing else there', () => {
  const r = makeRepo('bug/demo')
  r.sdlc('bug', 'demo')
  const file = path.join(r.repo, 'package.json')
  const edit = (old_string, new_string) => r.tool('Edit', { file_path: file, old_string, new_string }).decision
  assert.equal(edit('  "version": "1.0.0",', '  "version": "1.0.1",'), 'allow')
  assert.equal(edit('"left-pad": "1.0.0"', '"left-pad": "1.3.0"'), 'deny')
  assert.equal(edit('  "version": "1.0.0",\n  "main": "a.js",', '  "version": "1.0.1",\n  "main": "b.js",'), 'deny')
})

test('item 5: the change is measured from origin/main when it is ahead of the local main', () => {
  const r = makeRepo()
  r.remote()
  r.git('checkout', '-q', '-b', 'other', 'main')
  r.put('merged.txt', 'merged elsewhere\n')
  r.git('add', 'merged.txt')
  r.git('commit', '-q', '-m', 'merged PR')
  r.git('push', '-q', 'origin', 'other:main')
  r.git('fetch', '-q', 'origin')
  r.git('checkout', '-q', 'feature/demo')
  r.git('merge', '-q', 'origin/main')
  assert.equal(baseRef(r.repo), 'origin/main')
  r.sdlc('init', 'demo')
  const out = r.sdlc('review', 'demo')
  assert.equal(out.status, 0, out.out)
  const text = fs.readFileSync(path.join(r.repo, 'specs', 'demo', 'review-packet.md'), 'utf8')
  assert.match(text, /against origin\/main \([0-9a-f]{7}\)/)
  assert.doesNotMatch(text, /merged\.txt/)
})

test('item 7: the gate\'s code id ignores specs and state, and follows code', () => {
  const r = makeRepo()
  r.put('src/a.js', '1\n')
  const before = codeTree(r.repo)
  r.put('specs/demo/task.md', 'notes\n')
  assert.equal(codeTree(r.repo), before)
  r.put('src/a.js', '2\n')
  assert.notEqual(codeTree(r.repo), before)
})

test('item 7: "fixed: HEAD" is the last commit that changed the finding\'s file', () => {
  const r = makeRepo()
  r.put('src/a.js', 'one\n')
  r.git('add', '.')
  r.git('commit', '-q', '-m', 'fix')
  const row = { id: 'F1', severity: 'minor', location: 'src/a.js:1', checklist: '2', finding: 'x', status: 'fixed: HEAD', source: 'pre-review' }
  assert.deepEqual(ledgerProblems(r.repo, [row]), [])
  assert.match(ledgerProblems(r.repo, [{ ...row, location: 'src/none.js:1' }]).join(), /fixed: HEAD/)
})

test('item 8: open nits may stay when they are named', () => {
  const body = pre => `## Summary\n\nx\n\n## Test results\n\nx\n\n## Pre-review\n\nRisk: low\n${pre}\nLook here first: a.js:1\nLenses run: correctness\nRevert: git revert\n\n## Not verified\n\nx\n`
  assert.ok(!prBody(body('Open findings: 1 (nit F5)')).includes('pre-review has open findings'))
  assert.ok(!prBody(body('Open findings: 0 (nits left open: F5)')).includes('pre-review has open findings'))
  assert.ok(prBody(body('Open findings: 2')).includes('pre-review has open findings'))
})

test('item 4: the pre-reviewer can write its ledger and its section', () => {
  const agent = fs.readFileSync(path.join(plugin, 'agents', 'pre-reviewer.md'), 'utf8')
  assert.match(agent.match(/^tools: (.*)$/m)[1], /\bEdit\b/)
  const r = makeRepo('task/demo')
  r.sdlc('task', 'demo')
  assert.equal(r.write('specs/demo/review.md', '| F1 |'), 'allow')
})

test('item 12: sdlc bug --issue fills the Report line, or says it could not', () => {
  const r = makeRepo('bug/demo')
  const out = r.sdlc('bug', 'demo', '--issue', '999999')
  assert.equal(out.status, 0, out.out)
  assert.match(fs.readFileSync(path.join(r.repo, 'specs', 'demo', 'bug.md'), 'utf8'), /^Report: (https:\/\/\S+|issue #999999 \[unconfirmed)/m)
  assert.equal(spawnSync('node', ['--check', path.join(plugin, 'scripts', 'sdlc.mjs')]).status, 0)
})

test('item 7: a green Build gate on the same code counts at Verify; a code change needs a new run', () => {
  const r = makeRepo('task/demo')
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('task', 'demo')
  r.put('src/a.js', '1\n')
  r.setState('demo', { stage: 5, baseline: 12, gateRuns: { 4: { ok: true, count: 12, tree: codeTree(r.repo) } } })
  r.sdlc('review', 'demo')
  assert.doesNotMatch(r.sdlc('request', 'demo').out, /full gate has not passed/)
  r.put('src/a.js', '2\n')
  assert.match(r.sdlc('request', 'demo').out, /full gate has not passed/)
})
