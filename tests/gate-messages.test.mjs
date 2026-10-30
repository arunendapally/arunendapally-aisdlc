// Issue #17: the Plan gate took three rounds of refusals on a brownfield + data feature, each fixing
// something the last message did not explain. Every artefact a kind needs is copied in at the start,
// refusals say what was expected, evidence may sit inside an assumption tag, and one request lists all.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'

const read = (r, f) => fs.readFileSync(path.join(r.repo, 'specs', 'demo', f), 'utf8')

test('a brownfield or data feature starts with facts.md and the PRD sections its kinds require', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--full', '--kind', 'brownfield,data')
  assert.match(read(r, 'facts.md'), /- F1: \[governing\] <statement>\. Source: path\/to\/file\.ts:42\. Verified: <short commit>\./)
  assert.match(read(r, 'prd.md'), /\n## Current system\n/)
  assert.match(read(r, 'prd.md'), /\n## Data impact\n/)

  const s = makeRepo()
  s.sdlc('init', 'demo')
  assert.equal(fs.existsSync(path.join(s.repo, 'specs', 'demo', 'facts.md')), false)
  s.sdlc('kind', 'demo', 'brownfield')
  assert.ok(fs.existsSync(path.join(s.repo, 'specs', 'demo', 'facts.md')), 'a kind added later brings its artefacts too')
  assert.match(read(s, 'prd.md'), /\n## Current system\n/)
})

test('a fact in the wrong shape is named with the expected format, not reported as missing', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--kind', 'brownfield')
  r.put('src/orders.js', 'export const softDelete = true\n')
  r.put('specs/demo/facts.md', '## Facts\n\n- **F1. Orders are soft-deleted** (src/orders.js:1)\n')
  r.put('specs/demo/prd.md', read(r, 'prd.md').replace('## Requirements', '## Requirements\n\n- R1. (must) Keep F1 working.'))
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /facts\.md line \d+ looks like a fact but is not in the expected shape: "- F<n>: <statement>\. Source: <path:line>\. Verified: <commit>\."/)
  assert.doesNotMatch(out, /has no facts/)
  assert.doesNotMatch(out, /which facts\.md does not define/, 'the malformed line explains the missing F1')
})

test('an assumption tag may name its evidence', async () => {
  const { assumptionProblems } = await import('../scripts/facts.mjs')
  const prd = ['## Assumptions', '', '- A1: shoppers sign in [confirmed, code]', '- A2: totals are cached [confirmed: spec 020 FR-013]', '- A3: lists stay small [unconfirmed: no data yet]', '- A4: nothing marked', '', '## Open questions', '', '- A3: product lead'].join('\n')
  const problems = assumptionProblems(prd)
  assert.deepEqual(problems, ['assumption "- A4: nothing marked" is not marked: end it with [confirmed] or [unconfirmed], optionally with evidence, for example [confirmed: src/a.ts:3]'])
})

test('one request lists every problem at once', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo', '--kind', 'brownfield')
  r.put('specs/demo/facts.md', '## Facts\n\n- **F1. something**\n')
  r.put('specs/demo/prd.md', '## Assumptions\n\n- A1: unmarked\n')
  const out = r.sdlc('request', 'demo').out
  for (const expected of [/no "## Current system" section/, /A1: unmarked" is not marked/, /looks like a fact but is not in the expected shape/]) assert.match(out, expected)
})
