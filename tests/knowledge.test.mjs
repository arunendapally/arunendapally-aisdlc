// The knowledge base as an Open Knowledge Format (OKF 0.2) bundle: the frontmatter reader, old and new
// page formats, the generated index and log, and the conformance check.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'
import { frontmatter } from '../scripts/knowledge.mjs'

const okfPage = (sha, { title = 'Payments retry', confidence = 'Moderate' } = {}) => `---
type: component
title: ${title}
description: Retries never charge twice.
sources:
  - resource: src/pay.ts
  - { resource: src/pay.test.ts, title: The retry tests }
generated: { by: ai-sdlc/architect, at: 2026-10-29T10:00:00Z }
verified:
  - by: ai-sdlc/architect
    at: 2026-10-29T10:00:00Z
  - { by: "human:test", at: 2026-10-29T11:00:00Z }
verified_commit: ${sha}
confidence: ${confidence}   # Established | Moderate | Preliminary
---

See [[glossary]].
`

const legacyPage = sha => `---\nname: glossary\ndescription: Terms.\ntype: glossary\nsources: [README.md]\nverified: ${sha}\nconfidence: Established\n---\n`

function repoWithPay() {
  const r = makeRepo()
  r.put('src/pay.ts', 'export const retry = 1\n')
  r.put('src/pay.test.ts', 'test\n')
  r.git('add', '.')
  r.git('commit', '-m', 'pay')
  return { r, sha: r.git('rev-parse', '--short', 'HEAD') }
}

test('frontmatter: reads scalars, flow and block lists, flow and block mappings, quotes and comments', () => {
  const meta = frontmatter(okfPage('abc1234'))
  assert.equal(meta.type, 'component')
  assert.equal(meta.confidence, 'Moderate')
  assert.deepEqual(meta.sources, [{ resource: 'src/pay.ts' }, { resource: 'src/pay.test.ts', title: 'The retry tests' }])
  assert.deepEqual(meta.generated, { by: 'ai-sdlc/architect', at: '2026-10-29T10:00:00Z' })
  assert.deepEqual(meta.verified, [{ by: 'ai-sdlc/architect', at: '2026-10-29T10:00:00Z' }, { by: 'human:test', at: '2026-10-29T11:00:00Z' }])
  assert.equal(meta.verified_commit, 'abc1234')
  assert.deepEqual(frontmatter('---\nsources:\n- a.ts\n- "b, c.ts"\ntags: [x, y]\nokf_version: "0.2"\n---\n'), { sources: ['a.ts', 'b, c.ts'], tags: ['x', 'y'], okf_version: '0.2' })
  assert.deepEqual(frontmatter(legacyPage('abc1234')).sources, ['README.md'])
  assert.equal(frontmatter('no frontmatter'), null)
})

test('knowledge: an OKF page is read, checked and goes stale when its sources change since verified_commit', () => {
  const { r, sha } = repoWithPay()
  r.put('knowledge/payments-retry.md', okfPage(sha))
  r.put('knowledge/glossary.md', legacyPage(sha))
  let out = r.sdlc('knowledge', 'check')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /2 pages, 0 invalid, 0 stale/)
  assert.match(r.sdlc('knowledge', 'for', 'src/pay.test.ts').out, /payments-retry.*Retries never charge twice/)

  r.put('src/pay.test.ts', 'test 2\n')
  r.git('commit', '-am', 'change the tests')
  out = r.sdlc('knowledge', 'check')
  assert.match(out.out, /STALE knowledge\/payments-retry.md: changed since .*src\/pay.test.ts/)
  assert.doesNotMatch(out.out, /STALE knowledge\/glossary.md/, 'an old-format page is still checked against its own sources')

  r.put('knowledge/half.md', '---\ntype: component\ntitle: Half\nsources:\n  - id: no-resource\n---\n')
  out = r.sdlc('knowledge', 'check')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /half.md: missing description, sources, verified_commit, confidence/)
})

test('knowledge: an old-format page whose verified commit is unknown is stale, and an OKF stale_after in the past is stale', () => {
  const { r, sha } = repoWithPay()
  r.put('knowledge/glossary.md', legacyPage('deadbeef'))
  r.put('knowledge/payments-retry.md', okfPage(sha).replace('confidence:', 'stale_after: 2020-01-01T00:00:00Z\nconfidence:'))
  const out = r.sdlc('knowledge', 'check')
  assert.match(out.out, /STALE knowledge\/glossary.md: verified commit deadbeef is unknown/)
  assert.match(out.out, /STALE knowledge\/payments-retry.md: stale_after 2020-01-01T00:00:00Z has passed/)
})

test('knowledge index: writes an OKF index.md and a newest-first log.md, and replaces the old INDEX.md', () => {
  const { r, sha } = repoWithPay()
  r.put('knowledge/INDEX.md', '# Knowledge index\n\n## glossary\n\n- [glossary](glossary.md): Terms. (Established)\n')
  r.put('knowledge/payments-retry.md', okfPage(sha))
  r.put('knowledge/glossary.md', legacyPage(sha))
  r.sdlc('knowledge', 'index')
  const dir = path.join(r.repo, 'knowledge')
  assert.deepEqual(fs.readdirSync(dir).filter(n => n.toLowerCase() === 'index.md'), ['index.md'])
  const index = fs.readFileSync(path.join(dir, 'index.md'), 'utf8')
  assert.match(index, /^---\nokf_version: "0.2"\n---\n/)
  assert.match(index, /^\* \[Payments retry\]\(payments-retry.md\) - Retries never charge twice\. \(Moderate, verified [0-9a-f]+\)$/m)
  assert.match(index, /^\* \[glossary\]\(glossary.md\) - Terms\. \(Established, verified [0-9a-f]+\)$/m)
  const today = new Date().toISOString().slice(0, 10)
  let log = fs.readFileSync(path.join(dir, 'log.md'), 'utf8')
  assert.match(log, new RegExp(`^# Knowledge log\\n\\n## ${today}\\n\\* \\*\\*Creation\\*\\*: \\[Payments retry\\]\\(payments-retry.md\\)`))
  assert.doesNotMatch(log, /glossary/, 'a page already in the old index is not new')

  // Unchanged pages log nothing; a changed description is an update, a removed page a removal.
  r.sdlc('knowledge', 'index')
  assert.equal(fs.readFileSync(path.join(dir, 'log.md'), 'utf8'), log)
  fs.writeFileSync(path.join(dir, 'log.md'), log.replace(today, '2026-01-01'))
  r.put('knowledge/payments-retry.md', okfPage(sha).replace('Retries never charge twice.', 'Retries charge once.'))
  fs.rmSync(path.join(dir, 'glossary.md'))
  r.sdlc('knowledge', 'index')
  log = fs.readFileSync(path.join(dir, 'log.md'), 'utf8')
  assert.match(log, new RegExp(`## ${today}\\n\\* \\*\\*Update\\*\\*: \\[Payments retry\\]\\(payments-retry.md\\)[^\\n]*\\n\\* \\*\\*Removal\\*\\*: glossary.md[^\\n]*\\n\\n## 2026-01-01`))
})

test('knowledge check: reports files that are not OKF: no frontmatter or no type', () => {
  const { r, sha } = repoWithPay()
  r.put('knowledge/payments-retry.md', okfPage(sha))
  r.put('knowledge/README.md', '# Knowledge\n\nNo frontmatter here.\n')
  r.put('knowledge/notes/untyped.md', '---\ntitle: Untyped\ntype: ""\n---\n')
  r.put('knowledge/index.md', '---\nokf_version: "0.2"\n---\n# Knowledge index\n')
  r.put('knowledge/log.md', '# Knowledge log\n')
  const out = r.sdlc('knowledge', 'check')
  assert.match(out.out, /OKF: 1 of 3 files conform/)
  assert.match(out.out, /NOT OKF knowledge\/README.md: no frontmatter/)
  assert.match(out.out, /NOT OKF knowledge\/notes\/untyped.md: no type/)
  assert.doesNotMatch(out.out, /NOT OKF knowledge\/(index|log).md/, 'index.md and log.md are reserved')
})
