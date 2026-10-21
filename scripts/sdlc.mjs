#!/usr/bin/env node
// The only way agents move a feature through the cycle. Approvals are not here:
// a human records them by typing "sdlc approve <feature> <stage>" in the prompt.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { STAGES, root, git, loadConfig, readState, writeState, listFeatures, missingHeadings, nextStage, isFrozen,
  stageSpec, section, matches, changedFiles, changedLines, createFeature, copyTemplate, TEMPLATES, overdueGates, overduePostmortems,
  KINDS, trustedGates, promotable, readTrust } from './lib.mjs'
import { check, relevant, writeIndex } from './knowledge.mjs'

const dir = root()
const [cmd, feature, ...rest] = process.argv.slice(2)
const flag = name => {
  const i = rest.indexOf(`--${name}`)
  return i === -1 ? undefined : rest[i + 1]
}
const fail = msg => {
  console.error(msg)
  process.exit(1)
}
const need = () => {
  const state = feature && readState(dir, feature)
  if (!state) fail(`No feature "${feature}". Run: sdlc init <feature>`)
  return state
}
const kinds = () => {
  const list = (flag('kind') ?? '').split(',').map(k => k.trim()).filter(Boolean)
  const unknown = list.filter(k => !KINDS[k])
  if (unknown.length) fail(`Unknown kind ${unknown.join(', ')}. Kinds: ${Object.keys(KINDS).join(', ')}`)
  return list
}
const kindNote = () => (kinds().length ? `, ${kinds().join(', ')}` : '')
const hours = (a, b = new Date().toISOString()) => Math.round((Date.parse(b) - Date.parse(a)) / 36e5 * 10) / 10

const commands = {
  // Create a feature at stage 1 in the full lane. Only a human moves it to light ("sdlc lane").
  init() {
    if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) fail('Usage: sdlc init <feature-slug> [--branch <name>]')
    if (readState(dir, feature)) fail(`Feature "${feature}" already exists.`)
    createFeature(dir, { feature, lane: 'full', branch: flag('branch'), extra: { kinds: kinds() } })
    const brief = copyTemplate(dir, feature, 'brief.md')
    console.log(`Created ${feature} at stage 1 (Plan), full lane${kindNote()}. Brief template: ${brief}`)
  },

  // A small change with no new behaviour to specify (a dependency bump, config, a refactor, docs).
  task() {
    if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) fail('Usage: sdlc task <task-slug>')
    if (readState(dir, feature)) fail(`"${feature}" already exists.`)
    if (kinds().includes('data')) fail('Data work runs in the full lane. Use: sdlc init <slug> --kind data')
    createFeature(dir, { feature, lane: 'task', branch: flag('branch'), extra: { kinds: kinds() } })
    const doc = copyTemplate(dir, feature, 'task.md')
    console.log(`Created task ${feature} at stage 4 (Build)${kindNote()}. Document: ${doc}`)
  },

  // Add a kind to work already started. Kinds only add sections and owners, so agents may add them
  // but never remove one.
  kind() {
    const state = need()
    const add = rest[0]
    if (!KINDS[add]) fail(`Kinds: ${Object.keys(KINDS).join(', ')}`)
    if (KINDS[add].lane && state.lane !== KINDS[add].lane) fail(`${add} work runs in the ${KINDS[add].lane} lane. Start it with: sdlc init <slug> --kind ${add}`)
    state.kinds = [...new Set([...(state.kinds ?? []), add])]
    writeState(dir, state)
    console.log(`${feature} is now: ${state.kinds.join(', ')}.`)
  },

  // A bug fix: one document, starts at Build, and its only human gate is the PR review.
  bug() {
    if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) fail('Usage: sdlc bug <bug-slug>')
    if (readState(dir, feature)) fail(`"${feature}" already exists.`)
    if (kinds().includes('data')) fail('A bug that needs a data change is a feature. Use: sdlc init <slug> --kind data')
    createFeature(dir, { feature, lane: 'bug', branch: flag('branch'), extra: { kinds: kinds() } })
    const doc = copyTemplate(dir, feature, 'bug.md')
    console.log(`Created bug ${feature} at stage 4 (Build). Write the repro test first and run "sdlc gate ${feature}": it must fail before the fix. Document: ${doc}`)
  },

  // Check the artefact and the lane's rules. Checks pass an automatic gate; any other waits for its human owner.
  request() {
    const state = need()
    const cfg = loadConfig(dir)
    const spec = stageSpec(state, state.stage, trustedGates(dir))
    const missing = missingHeadings(dir, state)
    if ([4, 5].includes(state.stage) && !(state.kinds ?? []).includes('data')) {
      const schema = changedFiles(dir, cfg).filter(f => matches(f.file, ['**/migrations/**', '**/*.sql', '**/schema.prisma'])).map(f => f.file)
      if (schema.length) missing.push(`${schema.join(', ')} change the schema: this is data work. Run "sdlc kind ${feature} data" (full lane, DBA review)`)
    }
    if ([4, 5].includes(state.stage)) {
      const run = state.gateRuns?.[state.stage]
      if (!run?.ok) missing.push(`the full gate has not passed at this stage. Run: sdlc gate ${feature}`)
      else if (run.count < (state.baseline ?? 0)) missing.push(`${run.count} passing tests is below the baseline of ${state.baseline}`)
    }
    if (state.lane === 'bug' && state.stage === 4) {
      if (!state.reproRedAt) missing.push('no failing gate run before the fix: a bug fix starts with a test that reproduces it')
      const forbidden = changedFiles(dir, cfg).filter(f => matches(f.file, cfg.bugForbidPaths)).map(f => f.file)
      if (forbidden.length) missing.push(`a bug fix may not change ${forbidden.join(', ')}. Open a feature instead`)
    }
    if (state.stage === 5 || spec.isAuto) {
      const lines = changedLines(dir, cfg)
      const max = cfg.maxPrLines[state.lane] ?? cfg.maxPrLines.full
      if (lines > max) missing.push(`${lines} changed lines is over the ${state.lane} lane limit of ${max}. Split it into smaller PRs, one slice each`)
    }
    if (state.stage === 5) {
      const file = path.join(dir, cfg.specsDir, feature, spec.artefact)
      const pre = (fs.existsSync(file) && section(fs.readFileSync(file, 'utf8'), '## Pre-review')) || ''
      if (pre && !/Risk:\s*(low|medium|high)\b/i.test(pre)) missing.push('the pre-review gives no "Risk: low|medium|high"')
      if (pre && !/Open findings:\s*0\b/i.test(pre)) missing.push('the pre-review still has open findings ("Open findings: 0" is required)')
    }
    if (missing.length) fail(`Gate ${state.stage} cannot be requested:\n- ${missing.join('\n- ')}`)
    const gate = state.gates[state.stage]
    if (gate?.status === 'approved') fail(`Gate ${state.stage} is already approved. Run: sdlc advance ${feature}`)
    const now = new Date().toISOString()
    if (spec.isAuto) {
      const earned = trustedGates(dir).includes(`${state.lane}:${state.stage}`) ? 'earned trust' : spec.owner
      state.gates[state.stage] = { status: 'approved', by: `checks: ${earned}`, requestedAt: now, approvedAt: now, auto: true }
      writeState(dir, state)
      return console.log(`Gate ${state.stage} (${spec.name}) passed on checks (${earned}) in the ${state.lane} lane. Run: sdlc advance ${feature}`)
    }
    state.gates[state.stage] = { status: 'waiting', requestedAt: now }
    writeState(dir, state)
    const sla = cfg.reviewSlaHours[state.lane] ?? cfg.reviewSlaHours.full
    console.log(`Gate ${state.stage} (${spec.name}) is waiting on: ${spec.owner}. Review deadline: ${sla}h.\nArtefact: ${cfg.specsDir}/${feature}/${spec.artefact}\nThe owner approves by typing: sdlc approve ${feature} ${state.stage}`)
  },

  // Move to the lane's next stage once the gate is approved; past the last stage, close the run.
  advance() {
    const state = need()
    if (state.closedAt) fail(`${feature} is complete.`)
    if (state.gates[state.stage]?.status !== 'approved') fail(`Gate ${state.stage} is not approved. Nothing moved.`)
    if (state.stage === 2 && state.lane === 'light' && isFrozen(dir)) {
      state.lane = 'full'
      console.log('The error budget is spent, so this feature moves to the full lane.')
    }
    const now = new Date().toISOString()
    state.stages[state.stage].leftAt = now
    const next = nextStage(state)
    if (next === undefined) {
      state.closedAt = now
      if (state.lane === 'hotfix') state.postmortemDue = new Date(Date.now() + loadConfig(dir).postmortemDays * 864e5).toISOString()
      writeState(dir, state)
      const due = state.postmortemDue ? ` Postmortem due by ${state.postmortemDue.slice(0, 10)}: sdlc incident ${feature}` : ''
      return console.log(`${feature} is complete.${due}`)
    }
    state.stage = next
    state.stages[state.stage] = { enteredAt: now }
    writeState(dir, state)
    console.log(`${feature} is now at stage ${state.stage} (${STAGES[state.stage].name}).`)
  },

  // Run the repo's full gate and record the passing count. The first run in Build is the baseline.
  // In the bug and hotfix lanes, a red run before any green one records the reproduction.
  gate() {
    const state = need()
    const { gateCommand, testCountPattern } = loadConfig(dir)
    if (!gateCommand) fail('No gateCommand in .ai-sdlc/config.json. A human sets it, for example "npm run gate".')
    const r = spawnSync(gateCommand, { cwd: dir, shell: true, encoding: 'utf8' })
    const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
    const counts = [...out.matchAll(new RegExp(testCountPattern, 'gi'))].map(m => Number(m[1] ?? m[2]))
    const count = counts.length ? counts[counts.length - 1] : 0
    const ok = r.status === 0
    const now = new Date().toISOString()
    const hadGreen = state.gateRuns?.[state.stage]?.ok
    state.gateRuns = { ...state.gateRuns, [state.stage]: { ok, count, at: now } }
    if (state.stage === 4 && state.baseline === undefined) state.baseline = count
    if (!ok && !hadGreen && !state.reproRedAt && state.stage === 4 && ['bug', 'hotfix'].includes(state.lane)) {
      state.reproRedAt = now
      writeState(dir, state)
      return console.log(`Repro recorded: the gate is red before the fix (${count} passing). Now fix it and run the gate again.`)
    }
    writeState(dir, state)
    console.log(out.split('\n').slice(-15).join('\n'))
    const verdict = `Gate ${ok ? 'green' : 'RED'}: ${count} passing (baseline ${state.baseline ?? 'not set'}).`
    if (!ok || count < (state.baseline ?? 0)) fail(verdict)
    console.log(verdict)
  },

  // Count a failed attempt at a goal; past the cap the agent must escalate, never loosen the goal.
  retry() {
    const state = need()
    const goal = rest[0]
    if (!goal) fail('Usage: sdlc retry <feature> <goal-id>')
    const key = `${state.stage}:${goal}`
    state.retries[key] = (state.retries[key] ?? 0) + 1
    writeState(dir, state)
    const cap = loadConfig(dir).retryCap
    if (state.retries[key] > cap) fail(`ESCALATE: "${goal}" failed ${state.retries[key]} times (cap ${cap}). Stop, write what was tried and what failed, and ask the gate owner.`)
    console.log(`Attempt ${state.retries[key]} of ${cap} on "${goal}".`)
  },

  status() {
    const features = feature ? [need()] : listFeatures(dir)
    if (rest.includes('--json') || feature === '--json') return console.log(JSON.stringify(features, null, 2))
    if (!features.length) return console.log('No features in flight. Start one with /ai-sdlc:kickoff.')
    const overdue = overdueGates(dir)
    const noPostmortem = overduePostmortems(dir).map(s => s.feature)
    for (const s of features) {
      if (s.closedAt) {
        const due = noPostmortem.includes(s.feature) ? `, POSTMORTEM OVERDUE (due ${s.postmortemDue.slice(0, 10)})` : ''
        console.log(`${s.feature}: complete (${s.lane} lane)${due}`)
        continue
      }
      const gate = s.gates[s.stage]
      const late = overdue.find(o => o.feature === s.feature)
      const deadline = late ? ` OVERDUE (deadline ${late.limit}h): escalate to a backup reviewer` : ''
      const wait = gate?.status === 'waiting' ? `, waiting on ${stageSpec(s).owner} for ${hours(gate.requestedAt)}h${deadline}` : ''
      console.log(`${s.feature}: stage ${s.stage} ${STAGES[s.stage].name} (${s.lane} lane), gate ${gate?.status ?? 'not requested'}${wait}`)
    }
  },

  // Earned autonomy: each gate's run of clean human approvals, what is promoted, and what has
  // earned promotion. Only a human promotes, by typing "sdlc trust <lane> <stage>".
  trust() {
    const ledger = readTrust(dir)
    const keys = Object.keys(ledger)
    if (!keys.length) return console.log('No gate history yet. Every human approval without a rejection adds to its gate\'s streak.')
    const trusted = trustedGates(dir)
    for (const key of keys.sort()) {
      const t = ledger[key]
      const mark = t.promoted ? (trusted.includes(key) ? 'promoted: runs on checks' : 'promoted, suspended while the error budget is frozen') : `${t.streak} clean in a row`
      console.log(`${key}: ${mark}`)
    }
    for (const p of promotable(dir)) console.log(`READY: ${p.key} has ${p.streak} clean approvals. A human can promote it: sdlc trust ${p.key.replace(':', ' ')}`)
  },

  // The knowledge base: "check" fails on unusable pages and lists stale ones; "index" rebuilds
  // knowledge/INDEX.md; "for <file>..." lists the pages to read before touching those files.
  knowledge() {
    const sub = feature
    if (sub === 'index') return console.log(`Wrote knowledge/INDEX.md (${writeIndex(dir)} lines).`)
    if (sub === 'for') {
      const found = relevant(dir, rest)
      return console.log(found.length ? found.map(p => `${p.file}: ${p.meta.description}`).join('\n') : 'No pages cover these files yet. Write one after you learn the area.')
    }
    if (sub !== 'check') fail('Usage: sdlc knowledge <check|index|for <file>...>')
    const { invalid, stale, count } = check(dir)
    console.log(`${count} pages, ${invalid.length} invalid, ${stale.length} stale.`)
    for (const s of stale) console.log(`STALE ${s.file}: ${s.why}`)
    if (invalid.length) fail(invalid.map(i => `INVALID ${i}`).join('\n'))
  },

  // The four flow numbers: lead time, cycle time per stage, gate wait, rework.
  metrics() {
    for (const s of feature ? [need()] : listFeatures(dir)) {
      const cycle = Object.entries(s.stages).map(([n, t]) => `${STAGES[n].name} ${hours(t.enteredAt, t.leftAt)}h`).join(', ')
      const waits = Object.entries(s.gates).filter(([, g]) => g.approvedAt && g.requestedAt)
        .map(([n, g]) => `${n}:${hours(g.requestedAt, g.approvedAt)}h`).join(', ') || 'none yet'
      const rework = Object.values(s.retries).reduce((a, b) => a + b, 0) + Object.values(s.gates).filter(g => g.rejections).reduce((a, g) => a + g.rejections, 0)
      console.log(`${s.feature}\n  lead time ${hours(s.createdAt)}h\n  cycle ${cycle}\n  gate wait ${waits}\n  rework ${rework}`)
    }
  },

  // Open a blameless postmortem. Its actions re-enter the cycle as new briefs or new checks.
  incident() {
    if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) fail('Usage: sdlc incident <slug>')
    const date = new Date().toISOString().slice(0, 10)
    const file = path.join(dir, 'docs', 'incidents', `${date}-${feature}.md`)
    if (fs.existsSync(file)) fail(`${path.relative(dir, file)} already exists.`)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.copyFileSync(path.join(TEMPLATES, 'incident.md'), file)
    console.log(`Postmortem: ${path.relative(dir, file)}`)
  },

  // Copy rules and GitHub templates into this repo, never overwriting what is there.
  'init-repo'() {
    const plugin = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
    const copied = []
    const walk = (src, rel, dest) => {
      for (const entry of fs.readdirSync(path.join(src, rel), { withFileTypes: true })) {
        const from = path.join(rel, entry.name)
        const to = path.join(dir, dest, from)
        if (entry.isDirectory()) walk(src, from, dest)
        else if (!fs.existsSync(to)) {
          fs.mkdirSync(path.dirname(to), { recursive: true })
          fs.copyFileSync(path.join(src, from), to)
          copied.push(path.join(dest, from).split(path.sep).join('/'))
        }
      }
    }
    walk(path.join(plugin, 'templates', 'repo'), '', '')
    walk(path.join(plugin, 'skills', 'ai-sdlc', 'standards'), '', 'standards')
    console.log(copied.length ? `Added:\n- ${copied.join('\n- ')}` : 'Nothing to add: every file already exists.')
    if (!git('rev-parse --is-inside-work-tree', dir)) console.log('Note: this folder is not a git repository.')
  },
}

if (!commands[cmd]) {
  fail('Usage: sdlc <init|bug|task|kind|request|advance|gate|retry|status|trust|metrics|incident|knowledge|init-repo> [feature] [...]')
}
commands[cmd]()
