// guard-follows-cd-into-worktree: a session whose folder is the main checkout may commit in a worktree
// nested under it (.claude/worktrees/<slug>) by a leading cd; the guard judges that worktree's branch.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'

test('a cd into a nested worktree on a feature branch is judged on that branch, not on main', () => {
  const r = makeRepo()
  r.git('checkout', 'main')
  const wt = path.join(r.repo, '.claude', 'worktrees', 'fix')
  r.git('worktree', 'add', '-b', 'bug/fix', wt)
  assert.equal(r.bash('git commit -m x'), 'deny', 'the main checkout itself stays protected')
  assert.notEqual(r.bash(`cd "${wt}" && git commit -m x`), 'deny', 'the worktree is on bug/fix')
  assert.equal(r.bash(`cd "${path.join(r.repo, 'scripts')}" && git commit -m x`), 'deny', 'a folder of the main checkout is still main')
})
