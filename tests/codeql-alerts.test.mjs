// codeql-alerts: the CodeQL alerts on main, each as the behaviour it allowed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { section, git, lessonPaid } from '../scripts/lib.mjs'
import { traces } from '../scripts/testmatrix.mjs'
import { makeRepo } from './helpers.mjs'

test('a section hidden in an unclosed or rebuilt comment reads as empty, as GitHub shows it', () => {
  assert.equal(section('## Fix\n<!-- secret, never shown', '## Fix'), '')
  assert.equal(section('## Fix\n<!<!-- a -->-- hidden -->', '## Fix'), '')
  assert.equal(section('## Fix\n<!-- guide --!>\nshown', '## Fix'), 'shown')
})

test('git runs its arguments without a shell, so a metacharacter is passed through, not interpreted', () => {
  const r = makeRepo()
  r.put('a.txt', 'x\n')
  r.git('add', '-A'); r.git('commit', '-qm', 'first')
  assert.match(git('log -1 --format=%s|x', r.repo), /^first\|x$/)
  assert.equal(git('log -1 --format=%s -- "a.txt"', r.repo), 'first')
})

test('a slug or criterion with regex characters is matched literally, never as a pattern', () => {
  assert.equal(traces('covers AC-1 for a.b', 'x.test.mjs', 'a.b', 'AC-1'), true)
  assert.equal(traces('covers AC-1 for axb', 'x.test.mjs', 'a.b', 'AC-1'), false)
  assert.doesNotThrow(() => traces('text', 'x.test.mjs', 'a(b', 'AC-1'))
  const r = makeRepo()
  r.put('standards/traps.md', '# Traps\n\n### T1\n- **Source:** axb\n- **Guard now:** a test\n')
  assert.equal(lessonPaid(r.repo, 'a.b'), false)
  assert.doesNotThrow(() => lessonPaid(r.repo, 'a(b'))
})
