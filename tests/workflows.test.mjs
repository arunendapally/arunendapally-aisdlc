// The plugin's dynamic workflows (workflows/*.js): each loads the way Claude Code loads it, with a
// literal meta block first, and its body is valid JavaScript with top-level await and return.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { plugin } from './helpers.mjs'

const dir = path.join(plugin, 'workflows')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

test('every workflow has a literal meta block first and a body that parses', () => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
  assert.ok(files.includes('council.js'))
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8')
    const meta = src.match(/^export const meta = (\{[\s\S]*?\n\})/)
    assert.ok(meta, `${f}: export const meta must be the first statement`)
    assert.doesNotMatch(meta[1], /\$\{|\.\.\.|\(/, `${f}: meta must hold only literal values`)
    assert.match(meta[1], /name: '[a-z-]+'/, `${f}: meta needs a name`)
    assert.match(meta[1], /description: '/, `${f}: meta needs a description`)
    assert.doesNotMatch(src, /\bimport\(|Date\.now\(|Math\.random\(|new Date\(\)/, `${f}: no imports, clocks or randomness in a workflow`)
    new AsyncFunction('args', 'agent', 'pipeline', 'parallel', 'phase', 'log', src.replace(/^export const meta/, 'const meta'))
  }
})

test('the council refuses to run without its question, record and date, and only advises', async () => {
  const src = fs.readFileSync(path.join(dir, 'council.js'), 'utf8').replace(/^export const meta/, 'const meta')
  const run = new AsyncFunction('args', 'agent', 'pipeline', 'parallel', 'phase', 'log', src)
  const none = async () => null
  await assert.rejects(run({ question: 'x' }, none, async () => [], none, () => {}, () => {}), /needs args\.question, args\.record and args\.date/)

  // A dry run with fake agents: experts, then a sceptic per review, then the CTO.
  const prompts = []
  const agent = async (prompt, opts) => {
    prompts.push({ label: opts.label, prompt })
    if (opts.label === 'cto') return { agreed: ['split first'], contested: [], record: 'docs/decisions/x.md' }
    if (opts.label.startsWith('check')) return { verdicts: [{ title: 'r1', verdict: 'wrong', why: 'the code says otherwise' }] }
    return { position: 'p', recommendations: [{ title: 'r1', rule: 'r', where: 'hook', why: 'w', evidence: ['a.js:1'] }], mustStayHuman: [], doNotDo: [] }
  }
  const pipeline = (items, fn) => Promise.all(items.map(fn))
  const result = await run({ question: 'Q?', record: 'docs/decisions/x.md', date: '2026-10-23', experts: ['sre', 'qa-engineer'] }, agent, pipeline, none, () => {}, () => {})
  assert.deepEqual(prompts.map(p => p.label), ['sre', 'qa-engineer', 'check sre', 'check qa-engineer', 'cto'])
  assert.match(prompts[0].prompt, /Read agents\/sre\.md first/)
  assert.match(prompts.find(p => p.label === 'cto').prompt, /It is a proposal: a human accepts it, and you never claim a gate is passed/)
  assert.deepEqual(result.unsupported, ['sre: r1 (wrong)', 'qa-engineer: r1 (wrong)'])
})
