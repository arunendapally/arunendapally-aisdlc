// The self-improvement loop: the retro miner, escaped bugs charged to their gates, and both eval suites.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'
import { runTask, regressions, loadTasks } from '../evals/run.mjs'
import { score, runAgentEvals, loadAgentTasks } from '../evals/agents.mjs'

const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()
const audit = (r, entries) => r.put('.ai-sdlc/audit.jsonl', entries.map(e => JSON.stringify({ at: new Date().toISOString(), ...e })).join('\n') + '\n')
const retro = (r, ...args) => JSON.parse(r.sdlc('retro', '--json', ...args).out)
const kinds = res => res.proposals.map(p => p.kind)

// A repo whose history shows every kind of problem the retro looks for.
function troubledRepo() {
  const r = makeRepo()
  r.sdlc('init', 'search')
  r.sdlc('init', 'checkout', '--full')
  r.setState('search', {
    retries: { '4:fix': 4 },
    gates: { 5: { status: 'approved', by: 'A', requestedAt: hoursAgo(80), approvedAt: hoursAgo(10) } },
  })
  r.setState('checkout', {
    gates: { 5: { status: 'approved', by: 'B', requestedAt: hoursAgo(60), approvedAt: hoursAgo(1) } },
  })
  audit(r, [
    { event: 'reject', feature: 'search', stage: 5, reason: 'no pagination test for empty results' },
    { event: 'reject', feature: 'checkout', stage: 5, reason: 'pagination breaks on the last page' },
    { event: 'reject', feature: 'checkout', stage: 2, reason: 'scope too wide' },
    ...Array.from({ length: 6 }, () => ({ event: 'pre-tool', tool: 'Bash', decision: 'deny', reason: '[ai-sdlc] --no-verify skips the checks. Fix the failure instead.' })),
  ])
  r.put('standards/traps.md', '# Traps\n\n### Timezone day boundary\n- **What happened:** x\n- **Guard now:** reviewers remember to check it.\n\n### Retry charges twice\n- **Guard now:** test retry.test.ts covers it.\n')
  return r
}

test('retro: each kind of evidence becomes a ranked proposal that names the plugin file to change', () => {
  const r = troubledRepo()
  r.sdlc('bug', 'double-charge', '--caused-by', 'checkout')
  const res = retro(r)

  const theme = res.proposals.find(p => p.kind === 'rejection-theme')
  assert.match(theme.title, /Gate 5 keeps rejecting work for "pagination"/)
  assert.equal(theme.evidence.length, 2)
  assert.equal(theme.change.target, 'templates/repo/standards/code-review-checklist.md')

  const esc = res.proposals.find(p => p.kind === 'escalation')
  assert.match(esc.title, /goal "fix" escalates/)
  assert.equal(esc.change.target, 'commands/build.md')

  const wait = res.proposals.find(p => p.kind === 'gate-wait')
  assert.match(wait.title, /Gate full:5 waits a median/)

  assert.match(res.proposals.find(p => p.kind === 'guard-friction').title, /fired 6 times/)
  const escape = res.proposals.find(p => p.kind === 'escape')
  assert.equal(escape.severity, 'high')
  assert.deepEqual(escape.evidence, ['checkout -> bug double-charge'])

  const trap = res.proposals.find(p => p.kind === 'unenforced-trap')
  assert.deepEqual(trap.evidence, ['Timezone day boundary: "reviewers remember to check it."'], 'a trap guarded by a test is not flagged')

  assert.equal(res.proposals[0].severity, 'high', 'highest severity first')
  assert.deepEqual(res.proposals.map(p => p.id), res.proposals.map((_, i) => `R${i + 1}`))
})

test('retro: one event is not a pattern, and a healthy repo gets no proposals', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  audit(r, [{ event: 'reject', feature: 'demo', stage: 1, reason: 'evidence too thin' }])
  r.setState('demo', { gates: { 1: { status: 'approved', by: 'A', requestedAt: hoursAgo(3), approvedAt: hoursAgo(2) } } })
  const res = retro(r)
  assert.deepEqual(res.proposals, [])
  assert.match(r.sdlc('retro').out, /No proposals/)
})

test('retro: --write saves the report, and --repos mines several repos together', () => {
  const a = makeRepo()
  const b = troubledRepo()
  a.sdlc('init', 'one')
  const res = retro(a, '--repos', b.repo)
  assert.equal(res.stats.features, 3)
  assert.ok(kinds(res).includes('rejection-theme'), 'evidence from the other repo counts')
  const out = a.sdlc('retro', '--write').out
  assert.match(out, /Wrote docs\/retro\/\d{4}-\d{2}-\d{2}\.md/)
  assert.ok(fs.readdirSync(path.join(a.repo, 'docs', 'retro')).length === 1)
})

test('an escaped bug is charged to every gate the shipped work passed, and costs its promotion', () => {
  const r = makeRepo()
  r.sdlc('init', 'checkout', '--full')
  r.setState('checkout', { gates: { 1: { status: 'approved' }, 2: { status: 'approved' }, 5: { status: 'approved', auto: true } } })
  r.put('.ai-sdlc/trust.json', JSON.stringify({ 'full:2': { streak: 7, promoted: false }, 'full:5': { streak: 12, promoted: true } }))
  const out = r.sdlc('bug', 'double-charge', '--caused-by', 'checkout')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /Charged to checkout: gates full:1, full:2, full:5 lose their streak and promotion/)
  const ledger = JSON.parse(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'trust.json'), 'utf8'))
  assert.equal(ledger['full:2'].streak, 0)
  assert.equal(ledger['full:5'].promoted, false)
  assert.equal(ledger['full:5'].escapes, 1)
  assert.equal(r.state('double-charge').causedBy, 'checkout')
  assert.match(r.sdlc('bug', 'other', '--caused-by', 'nothing').out, /No feature "nothing"/)
})

test('golden evals: a task passes or names the step that failed, and regressions are caught', () => {
  const pass = runTask({ name: 'push-guard', steps: [{ bash: 'git push origin main', expect: 'deny' }] })
  assert.deepEqual(pass, { name: 'push-guard', passed: true, steps: 1 })
  const fail = runTask({ name: 'wrong', steps: [{ bash: 'npm test', expect: 'allow' }, { bash: 'npm test', expect: 'deny', why: 'deliberately wrong' }] })
  assert.equal(fail.passed, false)
  assert.equal(fail.step, 2)
  assert.match(fail.why, /deliberately wrong: bash "npm test" was allow, expected deny/)

  const lost = regressions([{ name: 'a', passed: false }, { name: 'b', passed: false }], [{ name: 'a', passed: true }, { name: 'b', passed: false }])
  assert.deepEqual(lost.map(l => l.name), ['a'])

  const tasks = loadTasks()
  assert.ok(tasks.length >= 12)
  assert.ok(tasks.every(t => t.name && t.promise && t.steps.length), 'every golden task states its promise')
  const baseline = JSON.parse(fs.readFileSync(new URL('../evals/baseline.json', import.meta.url), 'utf8'))
  assert.deepEqual(baseline.map(b => b.name).sort(), tasks.map(t => t.name).sort(), 'the baseline covers every golden task')
})

test('agent evals: answers are scored against must and must-not rules, and house style', () => {
  const task = { name: 't', mustMatch: ['Risk:\\s*(low|medium|high)'], mustNotMatch: ['sdlc approve'] }
  assert.equal(score(task, 'Risk: low\nOpen findings: 0').passed, true)
  assert.deepEqual(score(task, 'Risk: unknown').failures, ['missing /Risk:\\s*(low|medium|high)/'])
  assert.match(score(task, 'Risk: low. I ran sdlc approve x 5').failures[0], /must not say/)
  assert.deepEqual(score(task, `Risk: low ${String.fromCharCode(0x2014)} fine`).failures, ['uses an em dash'])
  assert.ok(score(task, '').failures.includes('no answer'))
  assert.equal(score({ name: 'n', mustMatch: ['^\\W*1[.)]'] }, 'Requirements\n1. Save an item').passed, true, 'anchored rules check every line')

  const fake = t => (t.name === 'good' ? 'Risk: high' : 'nothing')
  const results = runAgentEvals([{ ...task, name: 'good' }, { ...task, name: 'bad' }], fake)
  assert.deepEqual(results.map(r => r.passed), [true, false])
  assert.ok(loadAgentTasks().every(t => t.name && t.role && t.prompt && t.mustMatch?.length), 'every agent task has a role, a prompt and rules')
})
