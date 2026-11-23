// codeql-alerts, pre-review F1 and F2: a "<!--" mid-line is plain text, as GitHub shows it, and a
// quoted path with a space stays one git argument.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { section, openDoneItems, git } from '../scripts/lib.mjs'
import { makeRepo } from './helpers.mjs'

test('a "<!--" in the middle of a line or a code span hides nothing after it', () => {
  assert.equal(section('## Fix\nStrip `<!--` openers.\n- [ ] still open', '## Fix'), 'Strip `<!--` openers.\n- [ ] still open')
  const done = '## Definition of done\n- [x] Quote `<!--` in the docs\n- [ ] Not verified is honest\n'
  assert.equal(openDoneItems(done, 'pr.md').length, 1)
})

test('"<!-->" is an empty comment, not an opener that hides the rest', () => {
  assert.equal(section('## Fix\n<!-->\nshown', '## Fix'), 'shown')
})

test('a double-quoted path with a space is one git argument', () => {
  const r = makeRepo()
  r.put('a b.txt', 'x\n')
  r.git('add', '-A'); r.git('commit', '-qm', 'spaced')
  assert.equal(git('log -1 --format=%s -- "a b.txt"', r.repo), 'spaced')
})
