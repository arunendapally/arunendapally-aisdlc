// The AI SDLC autopilot: the parts of the process that shell hooks and MCP cannot do.
// - A gate board pane whose buttons put "sdlc approve ..." into the prompt for a human to send.
// - The current stage's rules, and a pointer to the knowledge index, in the system prompt on every turn.
// - An autopilot loop: after each turn that edited files, run the gate and, while it is red and
//   under the retry cap, start the next fix turn itself; past the cap, stop and call a human.
//   A refusal is an answer, not a red gate (ADR-0004): after a turn with a denied tool call, or an
//   aborted turn, it starts nothing and hands back.
// - A read-only tool, sdlc_board, so the model reads feature state as data.
// - A native notification when a gate waits past its review deadline.
// The ai-sdlc plugin's hooks still own approvals and guardrails; this mod never records a decision.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Autopilot, Board, Row } from '../types'

const PLUGIN = 'ai-sdlc-autopilot'
const PANE = 'ai-sdlc-board'
const TOOL = `mcp__${PLUGIN}__sdlc_board`
const STAGES = ['', 'Plan', '', 'Design', 'Build', 'Verify', 'Release']
// Copies of scripts/lib.mjs DEFAULT_CONFIG (the mod cannot import it); tests/hooks.test.mjs fails if they drift.
const SLA: Record<string, number> = { full: 24, light: 8, bug: 8, task: 8, hotfix: 1 }
const NEVER_TRUST = ['full:5', 'light:5', 'full:6', 'light:6', 'hotfix:5', 'hotfix:6']
const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])
const RULES: Record<number, string> = {
  1: 'Plan: ask the questions that would change the PRD before drafting it, mark every assumption confirmed or unconfirmed, and write acceptance.feature with a scenario per requirement. No code.',
  3: 'Design: plan, contracts and an ADR with two options and its review for each new datastore, dependency or service. No code.',
  4: 'Build: test first, smallest change, run the gate after each batch, never loosen or skip a test, stay under the PR size limit.',
  5: 'Verify: every AC has a test, the test proof passes, nothing open in the findings ledger, an honest PR body. Never merge.',
  6: 'Release: humans merge and deploy. Probe production read-only. Write what you learned to knowledge/.',
}

const board = atom({ plugin: 'ai-sdlc-autopilot', key: 'board' } as const, null)
const isHidden = atom({ plugin: 'ai-sdlc-autopilot', key: 'isHidden' } as const, false)
const autopilot = atom({ plugin: 'ai-sdlc-autopilot', key: 'autopilot' } as const, { isOn: false, attempts: 0, last: 'none' })
const notified = atom({ plugin: 'ai-sdlc-autopilot', key: 'notified' } as const, [])

let editsThisTurn = 0
let deniedThisTurn = 0
let turnStartedAt = 0

// Pre-tool denials the plugin's hook logged since this turn began, for sessions where they do not
// reach the mod as a refused call.
async function hookDenials($: EngineInterface) {
  if (!(await exists($, '.ai-sdlc/audit.jsonl'))) return 0
  const lines = (await $.fs.read('.ai-sdlc/audit.jsonl')).split('\n').slice(-200)
  return lines.filter(l => {
    try {
      const a = JSON.parse(l)
      return a.event === 'pre-tool' && a.decision === 'deny' && Date.parse(a.at) >= turnStartedAt
    } catch {
      return false
    }
  }).length
}

async function exists($: EngineInterface, p: string) {
  return $.fs.stat(p).then(() => true, () => false)
}

async function readJson($: EngineInterface, p: string) {
  return (await exists($, p)) ? JSON.parse(await $.fs.read(p)) : {}
}

// Everything the board, the band, the prompt section and the tool show, read from the repo.
async function load($: EngineInterface): Promise<Board> {
  const config = await readJson($, '.ai-sdlc/config.json')
  const specsDir = config.specsDir ?? 'specs'
  const sla = { ...SLA, ...(config.reviewSlaHours ?? {}) }
  const branch = (await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])).stdout.trim()
  const now = await $.clock.now()
  const rows: Row[] = []
  const entries = (await exists($, specsDir)) ? await $.fs.list(specsDir) : []
  for (const entry of entries.filter(e => e.kind === 'dir')) {
    const file = `${specsDir}/${entry.name}/state.json`
    if (!(await exists($, file))) continue
    const s = JSON.parse(await $.fs.read(file))
    const gate = s.gates?.[s.stage]
    const waitingHours = gate?.status === 'waiting' ? Math.round((now - Date.parse(gate.requestedAt)) / 36e5) : null
    const slaHours = sla[s.lane] ?? sla.full
    rows.push({
      feature: s.feature, stage: s.stage, lane: s.lane, kinds: s.kinds ?? [],
      gate: gate?.status ?? 'not requested', waitingHours, slaHours,
      isOverdue: waitingHours !== null && waitingHours > slaHours,
      isCurrent: s.branch === branch, isClosed: Boolean(s.closedAt),
    })
  }
  const trust = await readJson($, '.ai-sdlc/trust.json')
  const threshold = config.trustThreshold ?? 10
  const never = [...NEVER_TRUST, ...(config.neverTrust ?? [])]
  // Earned trust is optional and off unless the repo turns it on.
  const promotable = !config.trust ? [] : Object.entries(trust)
    .filter(([key, t]: [string, any]) => !t.promoted && t.streak >= threshold && !never.includes(key))
    .map(([key]) => key)
  const index = (await exists($, 'knowledge/INDEX.md')) ? await $.fs.read('knowledge/INDEX.md') : ''
  return {
    rows, branch, promotable,
    isPaused: await exists($, '.ai-sdlc/PAUSED'),
    isFrozen: await exists($, '.ai-sdlc/BUDGET_FROZEN'),
    gateCommand: config.gateCommand ?? '',
    retryCap: config.retryCap ?? 3,
    knowledgeIndex: index.split('\n').slice(0, 60).join('\n'),
  }
}

async function refresh($: EngineInterface) {
  const b = await load($)
  await update($, board, () => b)
  const waiting = b.rows.filter(r => r.gate === 'waiting')
  const overdue = waiting.filter(r => r.isOverdue)
  $.ui.status(waiting.length ? `ai-sdlc: ${waiting.length} waiting${overdue.length ? `, ${overdue.length} overdue` : ''}` : undefined)
  const already = await read($, notified)
  for (const r of overdue) {
    const key = `${r.feature}:${r.stage}`
    if (already.includes(key)) continue
    await $.ui.notify(`${r.feature} gate ${r.stage} has waited ${r.waitingHours}h (deadline ${r.slaHours}h).`, { title: 'Review overdue' })
    await update($, notified, list => [...list, key])
  }
  return b
}

// Run the repo's gate command through the platform's shell, by way of node so it works everywhere.
async function runGate($: EngineInterface, command: string) {
  const script = "const r=require('child_process').spawnSync(process.argv[1],{shell:true,encoding:'utf8'});process.stdout.write((r.stdout||'')+(r.stderr||''));process.exit(r.status===null?1:r.status)"
  const r = await $.process.run(['node', '-e', script, command])
  return { isGreen: r.exitCode === 0, tail: r.stdout.split('\n').slice(-40).join('\n') }
}

// One autopilot step after a turn: test what changed, and either start the next fix or stop.
async function step($: EngineInterface, b: Board) {
  const ap: Autopilot = await read($, autopilot)
  if (!ap.isOn) return
  const off = async (last: Autopilot['last'], why: string) => {
    await update($, autopilot, a => ({ ...a, isOn: false, last }))
    $.ui.toast(`Autopilot stopped: ${why}`)
  }
  const cur = b.rows.find(r => r.isCurrent && !r.isClosed && (r.stage === 4 || r.stage === 5))
  if (b.isPaused) return off('stopped', 'agents are paused')
  if (!cur) return off('stopped', 'this branch has no feature in Build or Verify')
  if (!b.gateCommand) return off('stopped', 'set gateCommand in .ai-sdlc/config.json')
  if (deniedThisTurn > 0 || (await hookDenials($)) > 0) {
    await $.ui.notify(`${cur.feature}: a guardrail refused a step. Read the reason and run it yourself if it is right.`, { title: 'Autopilot handed back' })
    return off('denied', 'a guardrail refused a step, so this is yours now')
  }
  if (editsThisTurn === 0) {
    if (ap.last === 'red') {
      await $.ui.notify(`${cur.feature}: the gate is red and the last turn changed nothing.`, { title: 'Autopilot needs you' })
      return off('stopped', 'the gate is red and the last turn changed nothing')
    }
    return
  }
  const gate = await runGate($, b.gateCommand)
  // Green ends the loop: it says so, and starts nothing, so a green turn can never restart itself.
  if (gate.isGreen) {
    await update($, autopilot, a => ({ ...a, attempts: 0, last: 'green' }))
    $.ui.toast(`${cur.feature}: gate green. Record it with "sdlc.mjs gate ${cur.feature}" and request the gate.`)
    return
  }
  const attempts = ap.attempts + 1
  if (attempts > b.retryCap) {
    await update($, autopilot, a => ({ ...a, isOn: false, attempts, last: 'stopped' }))
    await $.ui.notify(`${cur.feature}: the gate is still red after ${b.retryCap} fix attempts.`, { title: 'Autopilot needs you' })
    await $.prompt.submit({
      text: `[autopilot] The gate is still red after ${b.retryCap} attempts on ${cur.feature}. Stop fixing. Write an escalation note: what failed, what you tried, and what you need from a human.`,
    })
    return
  }
  await update($, autopilot, a => ({ ...a, attempts, last: 'red' }))
  await $.prompt.submit({
    text: [
      `[autopilot] The gate is red for ${cur.feature} (attempt ${attempts} of ${b.retryCap}). Fix the cause in the code, not the test.`,
      'Never skip, weaken or delete a test, and never loosen the goal. If the spec is wrong, stop and say so.',
      'Last lines of the gate output:',
      '```',
      gate.tail,
      '```',
    ].join('\n'),
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    await $.command.register({ name: 'sdlc-board', description: 'Open the AI SDLC gate board' })
    await $.command.register({ name: 'sdlc-autopilot', description: 'Turn the autopilot test-and-fix loop on or off' })
    await $.tool.register({
      name: 'sdlc_board',
      description: 'Read the AI SDLC state of this repo: every feature with its lane, kinds, stage and gate, the current branch feature, review deadlines, gates that earned promotion, and the knowledge index. Read-only.',
      isDeferred: false,
    })
    await refresh($).catch(() => undefined)
    return ran
  })

  on('prompt.submit', async ($, e, next) => {
    editsThisTurn = 0
    deniedThisTurn = 0
    turnStartedAt = await $.clock.now()
    return next(e)
  })

  // An edit counts only once the tool ran without being refused or failing.
  on('tool.call', async ($, e, next) => {
    const r = await next(e)
    if (r?.deny) deniedThisTurn += 1
    else if (EDIT_TOOLS.has(e.tool) && !r?.isError) editsThisTurn += 1
    return r
  })

  on('tool.call', { tool: TOOL }, async $ => {
    // A live session requires a tool result to be text (or content blocks), not an object.
    const json = JSON.stringify(await refresh($), null, 2)
    return { result: json, text: json, isReadOnly: true }
  })

  // An interrupted or failed turn is the person's to steer, never a reason to start another.
  on('turn.complete', async ($, e, next) => {
    if (e.isAborted || e.reason !== 'answer') return next(e)
    const b = await refresh($).catch(() => null)
    if (b) {
      await step($, b).catch(async err => {
        await update($, autopilot, a => ({ ...a, isOn: false, last: 'stopped' }))
        $.ui.toast(`Autopilot stopped: ${err?.message ?? err}`)
      })
    }
    return next(e)
  })

  // The stage's rules and where the team's knowledge is, on every turn, without adding to the transcript.
  // The index itself is read on demand (sdlc.mjs knowledge for <files>), not paid for on every turn.
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const b = await read($, board)
    const cur = b?.rows.find(r => r.isCurrent && !r.isClosed)
    if (!b || (!cur && !b.knowledgeIndex)) return composed
    const lines = ['# AI SDLC context (from the ai-sdlc-autopilot mod)']
    if (b.isPaused) lines.push('Agents are PAUSED by a human. Do not write or run anything.')
    if (cur) {
      lines.push(`Current work: ${cur.feature}, ${cur.lane} lane${cur.kinds.length ? `, ${cur.kinds.join(', ')}` : ''}, stage ${cur.stage} ${STAGES[cur.stage]}, gate ${cur.gate}.`)
      lines.push(RULES[cur.stage] ?? '')
    }
    if (b.knowledgeIndex) lines.push('Knowledge: before changing an area, run "sdlc.mjs knowledge for <files>" and read the pages it lists.')
    return { sections: [...composed.sections, { id: 'ai-sdlc-context', text: lines.join('\n'), scope: 'session' }] }
  })

  on('command.run', { command: 'sdlc-board' }, async $ => {
    await refresh($)
    await $.ui.open({ id: PANE, title: 'AI SDLC gates' })
    return { text: 'Gate board opened.' }
  })

  on('command.run', { command: 'sdlc-autopilot' }, async $ => {
    const ap = await update($, autopilot, a => ({ isOn: !a.isOn, attempts: 0, last: 'none' }))
    return { text: `Autopilot ${ap.isOn ? 'on: after each turn that edits files, it runs the gate and starts the next fix until green or the cap.' : 'off.'}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const b = await read($, board)
    const ap = await read($, autopilot)
    const fill = async (text: string) => {
      await $.prompt.fill({ text, mode: 'replace' })
      $.ui.toast('Check the prompt, then press Enter to record it as yours.')
    }
    if (!b) return <Text dimColor>Reading the repo...</Text>
    return (
      <Box flexDirection="column">
        {b.isPaused && <Text color="red">Agents are paused. Type "sdlc resume" to continue.</Text>}
        {b.isFrozen && <Text color="yellow">Error budget frozen: no new features, promotions suspended.</Text>}
        <Box>
          <Text>Autopilot: {ap.isOn ? `on (attempt ${ap.attempts}, last ${ap.last})` : 'off'} </Text>
          <Button key="autopilot" label={ap.isOn ? 'Turn off' : 'Turn on'} onPress={() => update($, autopilot, a => ({ isOn: !a.isOn, attempts: 0, last: 'none' }))} />
        </Box>
        {b.rows.length === 0 && <Text dimColor>No work in flight. Start with /ai-sdlc:start.</Text>}
        {b.rows.filter(r => !r.isClosed).map(r => (
          <Box key={`row-${r.feature}`}>
            <Text color={r.isOverdue ? 'red' : undefined} dimColor={r.gate !== 'waiting'}>
              {r.isCurrent ? '> ' : '  '}{r.feature}: {r.stage} {STAGES[r.stage]} ({r.lane}), gate {r.gate}
              {r.waitingHours !== null ? `, ${r.waitingHours}h of ${r.slaHours}h` : ''}{' '}
            </Text>
            {r.gate === 'waiting' && <Button key={`approve-${r.feature}`} label="Approve" onPress={() => fill(`sdlc approve ${r.feature} ${r.stage}`)} />}
            {r.gate === 'waiting' && <Button key={`reject-${r.feature}`} label="Reject" onPress={() => fill(`sdlc reject ${r.feature} ${r.stage} `)} />}
          </Box>
        ))}
        {b.promotable.map(key => (
          <Box key={`trust-${key}`}>
            <Text>Gate {key} has earned autonomy. </Text>
            <Button key={`promote-${key}`} label="Promote" onPress={() => fill(`sdlc trust ${key.replace(':', ' ')}`)} />
          </Box>
        ))}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const b = await read($, board)
    const ap = await read($, autopilot)
    const active = b?.rows.filter(r => !r.isClosed && (r.isCurrent || r.gate === 'waiting')) ?? []
    if (e.props.hasSurvey || !b || (active.length === 0 && !b.isPaused && !ap.isOn) || (await read($, isHidden))) {
      return next(e)
    }
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {b.isPaused && <Text color="red">Agents paused by a human.</Text>}
        {active.map(r => (
          <Text key={`band-${r.feature}`} color={r.isOverdue ? 'red' : undefined} dimColor={r.gate !== 'waiting'}>
            {r.feature}: {r.stage} {STAGES[r.stage]} ({r.lane}), gate {r.gate}
            {r.waitingHours !== null ? `, ${r.waitingHours}h of ${r.slaHours}h${r.isOverdue ? ' OVERDUE' : ''}` : ''}
          </Text>
        ))}
        <Box>
          <Text dimColor>Autopilot {ap.isOn ? `on, attempt ${ap.attempts}` : 'off'}. /sdlc-board for gates. </Text>
          <Button key="hide" label="Hide" onPress={() => update($, isHidden, () => true)} />
        </Box>
      </Box>
    )
  })
}
