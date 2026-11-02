// The v0.6.0 pre-review findings: the repo is named by its origin, not its folder (F-1); an aligned
// table separator is not a system (F-2); a task line in another common shape is still a task (F-5); and
// ordinary auth and personal-data wording routes to the full lane (F-4).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const atBuild = (tasks, overview, origin) => {
  const r = makeRepo()
  if (origin) r.git('remote', 'add', 'origin', origin)
  r.sdlc('init', 'demo', '--full')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-11-02T00:00:00Z' } } })
  r.put('specs/demo/tasks.md', `# Tasks: demo\n\n## Tasks\n\n${tasks}`)
  if (overview) r.put('specs/demo/architecture-overview.md', overview)
  return r.sdlc('request', 'demo').out
}
const TABLE = (sep, rows) => `## Systems under change\n\n| System / repo | Change type | Owner | Contract impact | Data impact | Deploy order |\n${sep}\n${rows.map(r => `| ${r.join(' | ')} |`).join('\n')}\n`

test('F-1: this repo is named by its origin, so a worktree or a renamed clone is still the same repo', () => {
  const out = atBuild('- [ ] T1 [R1] files: a.ts depends-on: []\n- [ ] T2 [R1] repos: [api] files: b.ts depends-on: []\n', TABLE('|---|---|---|---|---|---|', [['api', 'modified', 'api team', 'none', 'none', '1']]), 'https://github.com/acme/api.git')
  assert.doesNotMatch(out, /architecture-overview\.md:/, out)
  assert.doesNotMatch(out, /more than one repo/)
})

test('F-2: an aligned separator row is not a system', () => {
  const out = atBuild('- [ ] T1 [R1] repos: [api] files: a.ts depends-on: []\n- [ ] T2 [R1] repos: [web] files: b.ts depends-on: [T1]\n', TABLE('|:---|:---:|---|---|---|---:|', [['api', 'modified', 'a', 'none', 'none', '1'], ['web', 'modified', 'w', 'none', 'none', '2']]))
  assert.doesNotMatch(out, /:---/, out)
})

test('F-5: tasks written as "- T1", "1. [ ] T1" or "- [ ] **T1**" are still checked', () => {
  for (const line of ['- T1 [R1] files: a.ts', '1. [ ] T1 [R1] files: a.ts', '- [ ] **T1** [R1] files: a.ts']) {
    assert.match(atBuild(`${line}\n`), /tasks\.md: T1 has no "depends-on: \[\]"/, line)
  }
})

test('F-4: OAuth, login and email addresses in the security need route to the full lane', () => {
  for (const need of ['users sign in with OAuth', 'login sessions and email addresses']) {
    const r = makeRepo()
    r.sdlc('init', 'demo')
    r.say('sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves')
    r.put('specs/demo/prd.md', READY_PRD.replace('Security and privacy: None, because nothing new is stored', `Security and privacy: R1, ${need}`))
    r.put('specs/demo/acceptance.feature', READY_FEATURE)
    assert.match(r.sdlc('request', 'demo').out, /Security and privacy touches .+, which needs the full lane/, need)
  }
})
