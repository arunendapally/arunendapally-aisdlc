// A person who starts a session with bypassPermissions has decided no guard should stop it (ADR-0006).
// The guards still judge every call and record what they would have refused, so the PR review sees it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo } from './helpers.mjs'

const parse = out => (out ? JSON.parse(out).hookSpecificOutput : undefined)

function setup() {
  const api = makeRepo()
  const pre = (tool_name, tool_input, permission_mode) =>
    parse(api.hook('pre-tool', { tool_name, tool_input, ...(permission_mode ? { permission_mode } : {}) }))
  const audit = () => fs.readFileSync(path.join(api.repo, '.ai-sdlc', 'audit.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l))
  return { api, pre, audit }
}

test('in bypassPermissions no guard refuses or asks', () => {
  const { api, pre } = setup()
  const config = path.join(api.repo, '.ai-sdlc', 'config.json')
  for (const [tool, input] of [
    ['Write', { file_path: config, content: '{}' }],
    ['Bash', { command: 'git push origin main' }],
    ['Bash', { command: 'gh pr merge 12' }],
    ['Bash', { command: 'sed -i s/a/b/ .ai-sdlc/config.json' }],
  ]) {
    assert.equal(pre(tool, input, 'default')?.permissionDecision, 'deny', `${tool} ${JSON.stringify(input)} is refused by default`)
    const out = pre(tool, input, 'bypassPermissions')
    assert.equal(out?.permissionDecision ?? 'allow', 'allow', `${tool} ${JSON.stringify(input)} passes in bypass`)
  }
})

test('a bypassed refusal is audited and never counts toward holding the session', () => {
  const { pre, audit } = setup()
  for (let i = 0; i < 5; i++) pre('Bash', { command: 'git push origin main' }, 'bypassPermissions')
  const bypassed = audit().filter(e => e.decision === 'bypassed')
  assert.equal(bypassed.length, 5)
  assert.equal(bypassed[0].rule, 'push-protected')
  assert.equal(bypassed[0].mode, 'bypassPermissions')
  assert.equal(pre('Bash', { command: 'ls' }, 'bypassPermissions')?.permissionDecision ?? 'allow', 'allow')
})

test('other modes keep the guards', () => {
  const { pre } = setup()
  for (const mode of ['default', 'acceptEdits', 'plan', undefined]) {
    assert.equal(pre('Bash', { command: 'git push origin main' }, mode)?.permissionDecision, 'deny', String(mode))
  }
})

test('a human pause still stops a bypass session', () => {
  const { api, pre } = setup()
  api.put('.ai-sdlc/PAUSED', 'stop\n')
  assert.equal(pre('Bash', { command: 'ls' }, 'bypassPermissions')?.permissionDecision, 'deny')
})
