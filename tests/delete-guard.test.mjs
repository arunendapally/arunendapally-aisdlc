// The delete and inline-program guards (pre-review F14, F15 and F19 of unattended-runs v2, final round).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'

test('mirroring tools and git worktree remove are judged by where they delete', () => {
  const r = makeRepo()
  for (const command of ['rsync -a --delete src/ ../x', 'robocopy src ..\\x /MIR', 'git worktree remove --force ../x']) assert.equal(r.bash(command), 'deny', command)
  for (const command of ['rsync -a --delete src/ build/', 'git worktree remove .claude/worktrees/old']) assert.equal(r.bash(command), 'allow', command)
})

test('a move or a bracket after the delete does not make an ordinary delete unknown', () => {
  const r = makeRepo()
  for (const command of ['cd web && rm -rf dist && cd ..', 'rm -rf dist && (npm test)', 'find . -type d -empty -delete']) assert.equal(r.bash(command), 'allow', command)
  assert.equal(r.bash('cd web && cd .. && rm -rf dist'), 'deny', 'a second move before the delete is still unknown')
})

test('a package runner does not hide an inline program that names a proved test', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4, lock: { at: new Date().toISOString(), files: { 'tests/save.test.mjs': 'abc' } } })
  r.put('tests/save.test.mjs', 'x\n')
  assert.equal(r.bash('npx node -e "require(\'fs\').writeFileSync(\'tests/save.test.mjs\', \'\')"'), 'deny')
})
