// Shared helpers: each test gets a throwaway git repo and drives the hooks and CLI as Claude Code would.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const plugin = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

export function makeRepo(branch = 'feature/demo') {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-sdlc-'))
  const g = (...a) => execFileSync('git', a, { cwd: repo, stdio: 'ignore' })
  g('init', '-b', 'main')
  g('config', 'user.name', 'Test Human')
  g('config', 'user.email', 'test@example.com')
  fs.writeFileSync(path.join(repo, 'README.md'), 'hi\n')
  g('add', '.')
  g('commit', '-m', 'init')
  g('checkout', '-b', branch)

  const hook = (name, input) => spawnSync('node', [path.join(plugin, 'scripts', 'hooks', `${name}.mjs`)], {
    cwd: repo, input: JSON.stringify({ cwd: repo, ...input }),
  }).stdout.toString().trim()
  const decision = out => (out ? JSON.parse(out).hookSpecificOutput?.permissionDecision : 'allow')
  const api = {
    repo,
    git: (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8' }).trim(),
    hook,
    sdlc: (...args) => {
      const r = spawnSync('node', [path.join(plugin, 'scripts', 'sdlc.mjs'), ...args], { cwd: repo, encoding: 'utf8' })
      return { status: r.status, out: `${r.stdout}${r.stderr}` }
    },
    say: prompt => hook('user-prompt', { prompt }),
    bash: command => decision(hook('pre-tool', { tool_name: 'Bash', tool_input: { command } })),
    write: (file, content = 'x') => decision(hook('pre-tool', { tool_name: 'Write', tool_input: { file_path: path.join(repo, file), content } })),
    state: f => JSON.parse(fs.readFileSync(path.join(repo, 'specs', f, 'state.json'), 'utf8')),
    setState: (f, change) => {
      const file = path.join(repo, 'specs', f, 'state.json')
      fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), ...change }))
    },
    put: (file, text) => {
      fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true })
      fs.writeFileSync(path.join(repo, file), text)
    },
    config: cfg => api.put('.ai-sdlc/config.json', JSON.stringify(cfg)),
    // Fill a document's sections with content, in the given order.
    fill: (file, headings, extra = '') => api.put(file, headings.map(h => `${h}\n\nFilled.\n`).join('\n') + extra),
  }
  return api
}

// A spec the Plan gate accepts: every PRD section filled, one requirement, and its scenario.
export const READY_PRD = ['## Problem', '## Users and jobs', '## Questions asked', '## Assumptions', '## Never', '## Out of scope', '## Outcome metric', '## Open questions']
  .map(h => `${h}\n\nFilled.\n`).join('\n') + '\n## Requirements\n\n- R1. (must) Save an item.\n'
export const READY_FEATURE = 'Feature: Save\n  As a shopper\n  I want to save items\n  So that I buy later\n\n  @R1 @AC-1 @unit\n  Scenario: Save an item\n    Given an item\n    When I save it\n    Then it is saved\n'

// A gate command whose result the test flips: node reads a file to decide pass or fail.
export function switchableGate(api) {
  api.put('gate.cjs', "const fs=require('fs');const ok=fs.existsSync('GREEN');console.log((ok?12:11)+' passing');process.exit(ok?0:1)\n")
  return { green: () => api.put('GREEN', 'y'), red: () => fs.rmSync(path.join(api.repo, 'GREEN'), { force: true }) }
}
