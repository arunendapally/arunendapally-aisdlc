import { expect, test } from 'claude-code/testing'

// A repo with one bug in Build on the current branch, and a gate that is red until "fixed".
function world($, on, { isGreen = () => false, extraFiles = {} } = {}) {
  const files = {
    '.ai-sdlc/config.json': JSON.stringify({ gateCommand: 'npm test', retryCap: 2 }),
    'specs/demo/state.json': JSON.stringify({ feature: 'demo', lane: 'bug', stage: 4, branch: 'bug/demo', gates: {} }),
    'knowledge/INDEX.md': '# Knowledge index\n- payments-retry: never charge twice',
    ...extraFiles,
  }
  const dirs = { specs: [{ name: 'demo', kind: 'dir', size: 0, mtimeMs: 0, isLink: false }] }
  const submitted: string[] = []
  const fills: string[] = []
  // Paths reach the engine resolved against the test's folder, so match them by their repo-relative end.
  const key = (p: string, table: object) => Object.keys(table).find(k => p.split(String.fromCharCode(92)).join('/').endsWith(`/${k}`) || p === k)
  on('fs.stat', (_, e) => {
    const f = key(e.path, files)
    const d = key(e.path, dirs)
    if (!f && !d) throw new Error(`ENOENT ${e.path}`)
    return { value: { kind: d ? 'dir' : 'file', size: 1, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', (_, e) => ({ value: files[key(e.path, files)] }))
  on('fs.list', (_, e) => ({ value: dirs[key(e.path, dirs)] ?? [] }))
  on('clock.now', () => ({ value: Date.parse('2026-10-21T12:00:00Z') }))
  on('process.run', (_, e) => {
    if (e.argv[0] === 'git') return { value: { exitCode: 0, stdout: 'bug/demo\n', stderr: '' } }
    return { value: isGreen() ? { exitCode: 0, stdout: '12 passing\n', stderr: '' } : { exitCode: 1, stdout: 'FAIL retry charges twice\n', stderr: '' } }
  })
  on('prompt.submit', (_, e) => {
    submitted.push(e.text)
    return { text: e.text }
  })
  on('prompt.fill', (_, e) => {
    fills.push(e.text)
    return { isFilled: true }
  })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('tool.register', (_, e) => ({ value: { tool: `mcp__ai-sdlc-autopilot__${e.name}` } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.notify', () => ({ value: { isSent: true, channel: 'test' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  return { submitted, fills }
}

const turn = { answer: '', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer' } as const
const edit = { tool: 'Edit', file_path: 'src/retry.ts', old_string: 'a', new_string: 'b' } as const

test('autopilot: a red gate after an edit starts the next fix turn, and stops at the cap', async ($, on) => {
  const { submitted } = world($, on)
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'sdlc-autopilot', args: '' })

  for (let i = 0; i < 2; i++) {
    await $.prompt.submit({ text: 'go' })
    await $.tool.call(edit)
    await $.turn.complete(turn)
  }
  const fixes = submitted.filter(t => t.startsWith('[autopilot] The gate is red'))
  expect(fixes.length).toBe(2)
  expect(fixes[0]).toContain('attempt 1 of 2')
  expect(fixes[0]).toContain('FAIL retry charges twice')
  expect(fixes[0]).toContain('Never skip, weaken or delete a test')

  await $.prompt.submit({ text: 'go' })
  await $.tool.call(edit)
  await $.turn.complete(turn)
  expect(submitted.some(t => t.includes('Stop fixing. Write an escalation note'))).toBe(true)

  // Off now: another red turn starts nothing.
  const before = submitted.length
  await $.prompt.submit({ text: 'go' })
  await $.tool.call(edit)
  await $.turn.complete(turn)
  expect(submitted.length).toBe(before + 1)
})

test('autopilot: a turn that changed nothing does not loop', async ($, on) => {
  const { submitted } = world($, on)
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'sdlc-autopilot', args: '' })
  await $.prompt.submit({ text: 'go' })
  await $.turn.complete(turn)
  expect(submitted.filter(t => t.startsWith('[autopilot]')).length).toBe(0)
})

test('autopilot: a green gate says so once and resets the attempts', async ($, on) => {
  let fixed = false
  const { submitted } = world($, on, { isGreen: () => fixed })
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'sdlc-autopilot', args: '' })
  await $.prompt.submit({ text: 'go' })
  await $.tool.call(edit)
  await $.turn.complete(turn)
  fixed = true
  await $.prompt.submit({ text: 'go' })
  await $.tool.call(edit)
  await $.turn.complete(turn)
  expect(submitted.some(t => t.startsWith('[autopilot] The gate is green for demo'))).toBe(true)
})

test('autopilot: paused agents stop the loop', async ($, on) => {
  const { submitted } = world($, on, { extraFiles: { '.ai-sdlc/PAUSED': 'x' } })
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'sdlc-autopilot', args: '' })
  await $.prompt.submit({ text: 'go' })
  await $.tool.call(edit)
  await $.turn.complete(turn)
  expect(submitted.filter(t => t.startsWith('[autopilot]')).length).toBe(0)
})

test('every turn carries the stage rules and a pointer to the knowledge, not the whole index', async ($, on) => {
  world($, on)
  on('prompt.compose', () => ({ sections: [] }))
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  const { sections } = await $.prompt.compose({ model: 'm', promptModel: 'm', surfaces: ['terminal'], tools: [], outputStyle: null, traits: [] })
  const mine = sections.find(s => s.id === 'ai-sdlc-context')
  expect(mine?.text).toContain('demo, bug lane, stage 4 Build')
  expect(mine?.text).toContain('never loosen or skip a test')
  expect(mine?.text).toContain('knowledge for <files>')
  expect(mine?.text).not.toContain('payments-retry')
})

test('the board puts an approval in the prompt for a human to send, never records it', async ($, on) => {
  const waiting = JSON.stringify({ feature: 'demo', lane: 'bug', stage: 5, branch: 'bug/demo', gates: { 5: { status: 'waiting', requestedAt: '2026-10-21T00:00:00Z' } } })
  const { fills, submitted } = world($, on, { extraFiles: { 'specs/demo/state.json': waiting } })
  await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true })
  await $.command.run({ command: 'sdlc-board', args: '' })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'ai-sdlc-autopilot', component: 'Pane', requestId: 'ai-sdlc-board', surface,
      props: { title: 'AI SDLC gates', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
    })
    await ui.press({ key: 'approve-demo' })
    await ui.unmount()
  }
  expect(fills).toContain('sdlc approve demo 5')
  expect(submitted.some(t => t.includes('sdlc approve'))).toBe(false)
})

test('the model can read the board through the sdlc_board tool', async ($, on) => {
  world($, on)
  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  const r = await $.tool.call({ tool: 'mcp__ai-sdlc-autopilot__sdlc_board' })
  expect(r.text).toContain('"feature": "demo"')
  expect(typeof r.result).toBe('string')
})
