#!/usr/bin/env node
// Golden-task evals for the process itself. Each file in evals/golden/ is one promise the plugin makes
// ("an agent cannot approve its own work", "a bug fix needs a repro"), replayed step by step in a
// throwaway repo. A retro's proposed change must keep every golden task that passed before.
//
// node evals/run.mjs [--json] [--save] [--baseline evals/baseline.json] [--only <name>]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { makeRepo, switchableGate } from '../tests/helpers.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const pick = (obj, dotted) => dotted.split('.').reduce((o, k) => o?.[k], obj)

// Run one step and return a failure message, or null when it met its expectation.
function step(r, gate, s) {
  const re = text => new RegExp(text, 'i')
  // "$HEAD" in a file's content becomes the repo's current short commit.
  if (s.put) return (r.put(s.put[0], s.put[1].replaceAll('$HEAD', () => r.git('rev-parse', '--short', 'HEAD'))), null)
  if (s.fill) return (r.fill(s.fill[0], s.fill[1], s.fill[2] ?? ''), null)
  if (s.config) return (r.config(s.config), null)
  if (s.git) return (r.git(...s.git), null)
  if (s.gate) return (gate[s.gate](), null)
  if (s.setState) return (r.setState(s.setState[0], s.setState[1]), null)
  if (s.sdlc) {
    const out = r.sdlc(...s.sdlc)
    if (s.ok === true && out.status !== 0) return `sdlc ${s.sdlc.join(' ')} failed: ${out.out.trim().slice(0, 200)}`
    if (s.ok === false && out.status === 0) return `sdlc ${s.sdlc.join(' ')} should have been refused`
    if (s.out && !re(s.out).test(out.out)) return `sdlc ${s.sdlc.join(' ')} said "${out.out.trim().slice(0, 200)}", expected /${s.out}/`
    return null
  }
  if (s.say) {
    const out = r.say(s.say)
    return s.out && !re(s.out).test(out) ? `"${s.say}" answered "${out.slice(0, 200)}", expected /${s.out}/` : null
  }
  if (s.bash) {
    const got = r.bash(s.bash)
    return got === s.expect ? null : `bash "${s.bash}" was ${got}, expected ${s.expect}`
  }
  if (s.write) {
    const got = r.write(s.write[0], s.write[1] ?? 'x')
    return got === s.expect ? null : `write ${s.write[0]} was ${got}, expected ${s.expect}`
  }
  if (s.state) {
    const [feature, key, want] = s.state
    const got = pick(r.state(feature), key)
    return JSON.stringify(got) === JSON.stringify(want) ? null : `state ${feature}.${key} is ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`
  }
  if (s.trust) {
    const [key, field, want] = s.trust
    const ledger = JSON.parse(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'trust.json'), 'utf8'))
    const got = ledger[key]?.[field]
    return JSON.stringify(got) === JSON.stringify(want) ? null : `trust ${key}.${field} is ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`
  }
  return `unknown step ${JSON.stringify(s)}`
}

export function runTask(task) {
  const r = makeRepo(task.branch ?? 'feature/demo')
  const gate = switchableGate(r)
  for (const [i, s] of task.steps.entries()) {
    let failure
    try {
      failure = step(r, gate, s)
    } catch (err) {
      failure = `threw: ${err.message}`
    }
    if (failure) return { name: task.name, passed: false, step: i + 1, why: s.why ? `${s.why}: ${failure}` : failure }
  }
  return { name: task.name, passed: true, steps: task.steps.length }
}

export function loadTasks(dir = path.join(here, 'golden')) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }))
}

// Regressions: golden tasks that passed in the baseline and fail now.
export function regressions(results, baseline) {
  const before = new Set(baseline.filter(b => b.passed).map(b => b.name))
  return results.filter(r => !r.passed && before.has(r.name))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
  const tasks = loadTasks().filter(t => !only || t.name === only)
  const results = tasks.map(runTask)
  const passed = results.filter(r => r.passed).length
  if (args.includes('--json')) console.log(JSON.stringify(results, null, 2))
  else {
    for (const r of results) console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.passed ? '' : ` (step ${r.step}): ${r.why}`}`)
    console.log(`\n${passed}/${results.length} golden tasks pass.`)
  }
  const baselineFile = args.includes('--baseline') ? args[args.indexOf('--baseline') + 1] : null
  let failed = passed < results.length
  if (baselineFile && fs.existsSync(baselineFile)) {
    const lost = regressions(results, JSON.parse(fs.readFileSync(baselineFile, 'utf8')))
    if (lost.length) console.log(`REGRESSION: ${lost.map(l => l.name).join(', ')} passed in the baseline and fail now.`)
    failed = lost.length > 0
  }
  if (args.includes('--save')) {
    fs.writeFileSync(path.join(here, 'baseline.json'), JSON.stringify(results.map(({ name, passed }) => ({ name, passed })), null, 2) + '\n')
    console.log('Saved evals/baseline.json')
  }
  process.exit(failed ? 1 : 0)
}
