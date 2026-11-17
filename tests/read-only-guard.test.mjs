// The guard's read-only test (pre-review F1 of the read-only change): a read verb that runs code from its
// own arguments is not a read, so the person's-action scan still judges it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'

test('a read verb whose arguments run code is still judged as a person\'s action', () => {
  const r = makeRepo()
  for (const command of [
    'Get-Content (gh pr merge 5)',
    'Get-Content @(gh pr merge 5)',
    'Select-String -Pattern x -Path (gh pr merge 5)',
    'type (gh pr merge 5)',
    'rg --hostname-bin "gh pr merge 5" pattern .',
    'rg --hostname-bin="gh pr merge 5" pattern .',
    'less +!"gh pr merge 5" notes.txt',
    // A PowerShell script block bound to a piped parameter runs once per object.
    'Get-Content x | Get-Content -Path {gh pr merge 5}',
    'ls | Select-String -Pattern x -Path {gh pr merge 5}',
    // git takes a unique prefix of --output.
    'git log --outp="gh pr merge 5"',
    // Anything outside quotes that is not a name, path, glob or option.
    'cat [gh pr merge 5]',
    'grep x "$HOME/gh pr merge 5"',
  ]) assert.equal(r.bash(command), 'deny', command)
})

test('ordinary reads stay reads', () => {
  const r = makeRepo()
  for (const command of [
    'git log --oneline -5',
    'git diff origin/main...HEAD -- scripts/hooks/user-prompt.mjs',
    'grep -rn "sdlc approve" docs 2>/dev/null | head -20',
    'cat C:\\Code\\repo\\scripts\\hooks\\user-prompt.mjs',
    'ls -la ~/notes/*.md',
    'Get-Content -Path scripts/hooks/user-prompt.mjs -TotalCount 20',
  ]) assert.equal(r.bash(command), 'allow', command)
})

test('a bracket inside quotes is only text to a read', () => {
  const r = makeRepo()
  assert.equal(r.bash('grep -rn "sdlc approve (demo)" docs'), 'allow')
  assert.equal(r.bash("grep -rn 'gh pr merge (5)' docs"), 'allow')
})
