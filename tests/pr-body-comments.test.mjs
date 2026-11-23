// The pr-body check reads what GitHub shows: text inside an HTML comment, closed or not, is hidden
// there, so it never counts as section content (CodeQL js/incomplete-multi-character-sanitization).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { problems } from '../templates/repo/.github/scripts/check-pr-body.mjs'

const body = preReview => `## Summary\nx\n## Test results\nx\n## Pre-review\n${preReview}\n## Not verified\nx\n`

test('a pre-review hidden in an unclosed comment counts as empty', () => {
  assert.ok(problems(body('<!-- Risk: high Open findings: 0 Revert: git revert')).includes('empty section: ## Pre-review'))
})

test('a comment rebuilt from the pieces of another is stripped too', () => {
  assert.ok(problems(body('<!<!-- a -->-- Risk: high Open findings: 0 Revert: git revert -->')).includes('empty section: ## Pre-review'))
})

test('a visible pre-review after a closed comment still counts', () => {
  assert.deepEqual(problems(body('<!-- guide -->\nRisk: low\nOpen findings: 0\nRevert: git revert')), [])
})
