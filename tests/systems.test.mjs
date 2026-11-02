// Issue #27 (d) and #26 (packets): work that spans repos declares its systems under change in a
// feature-level architecture-overview.md before tasks exist, Build checks the table against the tasks
// both ways, and "sdlc packets" prints each repo's share of the work.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'

const TABLE = rows => `# Architecture overview: demo\n\n## Systems under change\n\n| System / repo | Change type | Owner | Contract impact | Data impact | Deploy order |\n|---|---|---|---|---|---|\n${rows.map(r => `| ${r.join(' | ')} |`).join('\n')}\n`

function buildWith(tasks, overview) {
  const r = makeRepo()
  const here = path.basename(r.repo)
  r.sdlc('init', 'demo', '--full')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-11-02T00:00:00Z' } } })
  r.put('specs/demo/tasks.md', `# Tasks: demo\n\n## Tasks\n\n${tasks(here)}`)
  if (overview) r.put('specs/demo/architecture-overview.md', overview(here))
  return { r, here, out: r.sdlc('request', 'demo').out }
}
const TWO = here => `- [ ] T1 [R1] repos: [${here}] files: api/save.ts test: AC-1 depends-on: []\n- [ ] T2 [R1] repos: [web] files: web/save.tsx test: AC-2 depends-on: [T1]\n`

test('work across repos needs an architecture overview with its systems under change', () => {
  const { out } = buildWith(TWO)
  assert.match(out, /tasks\.md names more than one repo \(.+, web\): write specs\/demo\/architecture-overview\.md from the plugin's architecture-overview\.md template, with a "## Systems under change" table/)
  const single = buildWith(here => `- [ ] T1 [R1] files: a.ts depends-on: []\n`)
  assert.doesNotMatch(single.out, /architecture-overview/, 'one repo needs no overview')
})

test('Build checks the systems table against the tasks, both ways', () => {
  const missing = buildWith(TWO, here => TABLE([[`\`${here}\``, 'modified', 'api team', 'OpenAPI delta', 'none', '1']]))
  assert.match(missing.out, /architecture-overview\.md: T2 changes web, which is not in "## Systems under change"/)

  const idle = buildWith(TWO, here => TABLE([[here, 'modified', 'api team', 'OpenAPI delta', 'none', '1'], ['web', 'modified', 'web team', 'reads savedAt', 'none', '2'], ['billing', 'new', 'billing team', 'none', 'migration', '3']]))
  assert.match(idle.out, /architecture-overview\.md: billing is new, but no task in tasks\.md changes it/)

  const typo = buildWith(TWO, here => TABLE([[here, 'changed', 'api team', 'none', 'none', '1'], ['web', 'consumer-only (verify)', 'web team', 'reads savedAt', 'none', 'n/a']]))
  assert.match(typo.out, /architecture-overview\.md: .+ has change type "changed": use new, modified, config-only or consumer-only \(verify\)/)

  const ok = buildWith(TWO, here => TABLE([[here, 'modified', 'api team', 'OpenAPI delta', 'none', '1'], ['web', 'modified', 'web team', 'reads savedAt', 'none', '2'], ['reports', 'consumer-only (verify)', 'data team', 'reads savedAt', 'none', 'n/a']]))
  assert.doesNotMatch(ok.out, /architecture-overview\.md:/)
})

test('sdlc packets prints each repo its tasks, the scenarios they prove and what waits on another repo', () => {
  const { r, here } = buildWith(TWO, here => TABLE([['web', 'modified', 'web team', 'reads savedAt', 'none', '2'], [here, 'modified', 'api team', 'OpenAPI delta', 'none', '1']]))
  const out = r.sdlc('packets', 'demo').out
  const api = out.indexOf(`Packet ${here} (deploy 1)`)
  const web = out.indexOf('Packet web (deploy 2)')
  assert.ok(api !== -1 && web !== -1 && api < web, `packets come in deploy order:\n${out}`)
  assert.match(out, /Packet web \(deploy 2\)\n  tasks: T2\n  scenarios: AC-2\n  waits on: T1 \(.+\)/)
  assert.match(out, new RegExp(`Packet ${here} \\(deploy 1\\)\\n  tasks: T1\\n  scenarios: AC-1\\n  waits on: nothing in another repo`))
})
