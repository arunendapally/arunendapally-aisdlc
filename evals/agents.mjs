#!/usr/bin/env node
// Agent evals: run real agents on small fixed tasks through `claude -p` with this plugin loaded, and
// score each answer against what it must and must not say. These cost tokens, so they are opt-in:
//   npm run eval:agents [-- --only <name>] [-- --json]
// A retro that changes an agent, command or skill must not lower this pass rate.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const plugin = path.join(here, '..')
const DASH = String.fromCharCode(0x2014)

export function loadAgentTasks(dir = path.join(here, 'agents')) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
}

// Every rule is a regex; house style (no em dash) applies to every answer.
export function score(task, output) {
  const failures = []
  // Multiline, so a rule anchored with ^ checks every line of the answer, not only the first.
  for (const re of task.mustMatch ?? []) if (!new RegExp(re, 'im').test(output)) failures.push(`missing /${re}/`)
  for (const re of task.mustNotMatch ?? []) if (new RegExp(re, 'im').test(output)) failures.push(`must not say /${re}/`)
  if (output.includes(DASH)) failures.push('uses an em dash')
  if (!output.trim()) failures.push('no answer')
  return { name: task.name, passed: failures.length === 0, failures }
}

// Run one task in a throwaway folder holding its fixture files, with the plugin loaded.
export function claudeRunner(task) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-sdlc-agent-eval-'))
  for (const [file, text] of Object.entries(task.files ?? {})) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    fs.writeFileSync(path.join(dir, file), text)
  }
  spawnSync('git', ['init', '-q'], { cwd: dir })
  const r = spawnSync('claude', ['-p', '--plugin-dir', plugin, '--max-turns', String(task.maxTurns ?? 8), task.prompt], {
    cwd: dir, encoding: 'utf8', timeout: (task.timeoutSeconds ?? 300) * 1000,
  })
  if (!r.stdout?.trim()) {
    const why = r.error ? r.error.message : `exit ${r.status}${r.signal ? `, ${r.signal}` : ''}`
    console.error(`[${task.name}] no answer (${why}): ${(r.stderr ?? '').trim().slice(0, 300)}`)
  }
  return `${r.stdout ?? ''}`
}

export function runAgentEvals(tasks, run = claudeRunner) {
  return tasks.map(task => score(task, run(task)))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
  const results = runAgentEvals(loadAgentTasks().filter(t => !only || t.name === only))
  if (args.includes('--json')) console.log(JSON.stringify(results, null, 2))
  else {
    for (const r of results) console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}${r.passed ? '' : `: ${r.failures.join('; ')}`}`)
    console.log(`\n${results.filter(r => r.passed).length}/${results.length} agent tasks pass.`)
  }
  process.exit(results.every(r => r.passed) ? 0 : 1)
}
