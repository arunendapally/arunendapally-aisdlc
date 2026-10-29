// UserPromptSubmit: the only place a gate approval, a rejection or the kill switch is recorded.
// It fires on what a human typed, so an agent cannot approve its own work.
import fs from 'node:fs'
import path from 'node:path'
import { STAGES, root, git, loadConfig, readState, writeState, missingHeadings, isFrozen, createFeature, copyTemplate,
  readTrust, writeTrust, promotable, readStdin, audit, lessonPaid, overduePostmortems, parseIntent, INTENT_PARTS } from '../lib.mjs'
import { advanceFeature, gateFingerprint } from '../loop.mjs'

const input = readStdin()
const dir = root(input.cwd)
const raw = (input.prompt ?? '').replace(/\r\n/g, '\n')
// Checked on 27 Oct: a subagent's report reaches this hook as a prompt in the parent's session, wrapped
// in <agent-message>. It is another agent's text, never a person's: it records nothing and releases
// nothing.
if (/^\s*<agent-message\b/.test(raw)) process.exit(0)
// The app may put <system-reminder> blocks before what the person typed. Whole blocks, opening and
// closing on lines of their own, are dropped, so a command inside one, or after an indented closing tag
// quoted inside one, is never recorded.
const text = raw.replace(/^(\s*<system-reminder>\n[\s\S]*?\n<\/system-reminder>[ \t]*(\n|$))+/, '').trim()
const say = msg => {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: `[ai-sdlc] ${msg}` } }))
  process.exit(0)
}

// A human typed something, so a session held after repeated denials may act again (ADR-0004).
const denialsFile = path.join(dir, '.ai-sdlc', 'denials.json')
if (fs.existsSync(denialsFile)) {
  try {
    const all = JSON.parse(fs.readFileSync(denialsFile, 'utf8'))
    delete all[input.session_id ?? 'default']
    fs.writeFileSync(denialsFile, JSON.stringify(all, null, 2) + '\n')
  } catch {
    fs.rmSync(denialsFile, { force: true })
  }
}

const VERBS = 'approve|reject|lane|hotfix|intent|autonomy|trust|distrust|pause|resume|freeze|unfreeze|close'
const m = text.match(new RegExp(`^sdlc\\s+(${VERBS})\\b\\s*(\\S+)?\\s*(\\d)?\\s*(.*)$`, 'is'))
if (!m) {
  // A command anywhere else in the message is not recorded, and the person is told so, never left
  // thinking it worked.
  const later = text.match(new RegExp(`\\bsdlc\\s+(${VERBS})\\b`, 'i'))
  if (later) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: `[ai-sdlc] Nothing recorded: "sdlc ${later[1]}" counts only at the start of your message. Tell the person to send it again as a message of its own; never type it for them.` } }))
  }
  process.exit(0)
}
const [, verb, feature, stageText, note] = m
const who = git('config user.name', dir) || process.env.USERNAME || process.env.USER || 'unknown human'

// Earned autonomy: a human promotes a gate that has earned it, or demotes any gate.
if (verb === 'trust' || verb === 'distrust') {
  const cfg = loadConfig(dir)
  const key = `${feature}:${stageText}`
  if (!cfg.trust) say('Earned trust is off in this repo. A human turns it on with "trust": true in .ai-sdlc/config.json. Nothing recorded.')
  if (cfg.trustOwners.length && !cfg.trustOwners.includes(who)) say(`${who} cannot change autonomy (${cfg.trustOwners.join(', ')} can). Nothing recorded.`)
  const ledger = readTrust(dir)
  if (verb === 'distrust') {
    ledger[key] = { ...ledger[key], streak: 0, promoted: false, demotedAt: new Date().toISOString(), demotedBy: who }
    writeTrust(dir, ledger)
    audit(dir, { event: 'distrust', gate: key, by: who })
    say(`${who} demoted gate ${key}: a human approves it again.`)
  }
  if (cfg.neverTrust.includes(key)) say(`Gate ${key} is never promoted (merging a full feature, and every release, stay with humans). Nothing recorded.`)
  if (!promotable(dir).some(p => p.key === key)) say(`Gate ${key} has ${ledger[key]?.streak ?? 0} clean approvals; it needs ${cfg.trustThreshold}. Nothing recorded.`)
  ledger[key] = { ...ledger[key], promoted: true, promotedAt: new Date().toISOString(), promotedBy: who }
  writeTrust(dir, ledger)
  audit(dir, { event: 'trust', gate: key, by: who })
  say(`${who} promoted gate ${key}: it now runs on checks. Any rejection, "sdlc distrust ${feature} ${stageText}" or an error-budget freeze hands it back to a human.`)
}

// Only a human declares a hotfix: it skips planning and design because production is hurting.
if (verb === 'hotfix') {
  if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) say('Usage: sdlc hotfix <slug> <what is broken in production>. Nothing recorded.')
  if (!note.trim()) say(`A hotfix needs the incident: sdlc hotfix ${feature} <what is broken>. Nothing recorded.`)
  if (readState(dir, feature)) say(`"${feature}" already exists. Nothing recorded.`)
  createFeature(dir, { feature, lane: 'hotfix', extra: { incident: note.trim(), declaredBy: who, lessonOwed: true } })
  const doc = copyTemplate(dir, feature, 'hotfix.md')
  audit(dir, { event: 'hotfix', feature, by: who, incident: note.trim() })
  say(`${who} declared hotfix ${feature}: "${note.trim()}". It starts at Build on branch hotfix/${feature}, cut from main. Fill ${doc}, fix, run the gate, then request. Review deadline ${loadConfig(dir).reviewSlaHours.hotfix}h.`)
}

// Only a person states what the work is for. Agents build to it, show it back at every approval, and
// never draft, suggest or reword it.
if (verb === 'intent') {
  const usage = `sdlc intent ${feature ?? '<feature>'} change: <what changes for the user>; smallest: <the smallest version that tells us it works>; drop if: <the result that would make us drop it>`
  if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) say(`Usage: ${usage}. Nothing recorded.`)
  const intent = parseIntent(`${stageText ?? ''}${note}`)
  const missing = INTENT_PARTS.filter(([k]) => !intent[k]).map(([, label]) => label.toLowerCase())
  if (missing.length) say(`An intent needs all three parts, and ${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} missing. Type: ${usage}. Nothing recorded.`)
  let state = readState(dir, feature)
  if (state && !['full', 'light'].includes(state.lane)) say(`${feature} is in the ${state.lane} lane, where the report is the intent. Nothing recorded.`)
  if (state && state.stage > 1) say(`${feature} is past Plan (stage ${state.stage}); its intent was settled when gate 1 was approved. Nothing recorded.`)
  const created = !state
  if (created) {
    if (isFrozen(dir)) say('The error budget is spent, so new features wait until a human unfreezes it. Nothing recorded.')
    state = createFeature(dir, { feature, lane: 'light', extra: { kinds: [] } })
    copyTemplate(dir, feature, 'prd.md')
    copyTemplate(dir, feature, 'acceptance.feature')
  }
  state.intent = { ...intent, by: who, at: new Date().toISOString() }
  writeState(dir, state)
  audit(dir, { event: 'intent', feature, by: who, ...intent })
  say(`${who} set the intent for ${feature}: change: ${intent.change}; smallest: ${intent.smallest}; drop if: ${intent.dropIf}.${created ? ' It starts at stage 1 (Plan) in the light lane.' : ''} Build the PRD to it; do not reword it.`)
}

// Only a person grants a repo autonomy, with the reason it is safe, and only a person takes it back.
// With it, every gate passes on its checks; the guards stay.
if (verb === 'autonomy') {
  const file = path.join(dir, '.ai-sdlc', 'AUTONOMY')
  const reason = `${stageText ?? ''}${note}`.trim()
  if (feature === 'off') {
    fs.rmSync(file, { force: true })
    audit(dir, { event: 'autonomy-off', by: who })
    say(`${who} took autonomy back: every gate waits for its human owner again.`)
  }
  if (feature !== 'on' || !reason) say('Autonomy needs a reason: sdlc autonomy on <why this repo can run without a person at its gates>, or sdlc autonomy off. Nothing recorded.')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify({ by: who, at: new Date().toISOString(), reason }, null, 2) + '\n')
  audit(dir, { event: 'autonomy-on', by: who, reason })
  say(`${who} granted autonomy: "${reason}". Every gate in this repo now passes on its checks, recorded as granted by ${who}. The guards (secrets, force pushes, deploys, guardrail files) stay. "sdlc autonomy off" takes it back.`)
}

// Repo-wide flags only a human sets: the kill switch, and the error-budget freeze.
const flags = {
  pause: ['PAUSED', true, 'paused all agents. Every write and command is refused until a human types "sdlc resume".'],
  resume: ['PAUSED', false, 'resumed agents.'],
  freeze: ['BUDGET_FROZEN', true, 'froze new features: the error budget is spent, so only bugs, hotfixes and reliability tasks start.'],
  unfreeze: ['BUDGET_FROZEN', false, 'lifted the error-budget freeze.'],
}
if (flags[verb]) {
  const [name, on, msg] = flags[verb]
  const flagFile = path.join(dir, '.ai-sdlc', name)
  fs.mkdirSync(path.dirname(flagFile), { recursive: true })
  if (on) fs.writeFileSync(flagFile, `${who} ${new Date().toISOString()} ${feature ?? ''} ${note}\n`)
  else fs.rmSync(flagFile, { force: true })
  audit(dir, { event: verb, by: who })
  say(`${who} ${msg}`)
}

const state = feature && readState(dir, feature)
if (!state) say(`No feature "${feature}" to ${verb}. Nothing recorded.`)

// The lane decides whether the Design gate runs, so a human sets it. Moving to full during Build sends
// the feature back to Design; light is only open before Build.
// A human retires work that will not go further: finished elsewhere, abandoned or superseded. It keeps
// its history and leaves the board; nothing is released, so no outcome or postmortem opens.
if (verb === 'close') {
  const reason = `${stageText ?? ''} ${note}`.trim()
  if (!reason) say(`Closing needs a reason: sdlc close ${feature} <why>. Nothing recorded.`)
  if (state.closedAt && !state.postmortemDue) say(`${feature} is already complete. Nothing recorded.`)
  // Closing never buries an escape: a lesson owed or an open postmortem has to be paid first (ADR-0004).
  if (state.lessonOwed && !lessonPaid(dir, feature)) say(`${feature} owes a lesson: add its trap to standards/traps.md first. Nothing recorded.`)
  if (overduePostmortems(dir, Infinity).some(s => s.feature === feature)) say(`${feature}'s postmortem is not done. Nothing recorded.`)
  if (state.closedAt) say(`${feature} is already complete. Nothing recorded.`)
  const now = new Date().toISOString()
  if (state.stages[state.stage]) state.stages[state.stage].leftAt = now
  state.closedAt = now
  state.closedBy = who
  state.closedReason = reason
  writeState(dir, state)
  audit(dir, { event: 'close', feature, by: who, reason })
  say(`${who} closed ${feature} at stage ${state.stage}: "${reason}". It keeps its history and leaves the board.`)
}

if (verb === 'lane') {
  const lane = note.trim().toLowerCase()
  if (!['full', 'light'].includes(lane)) say('Usage: sdlc lane <feature> full|light. Nothing recorded.')
  if (state.stage > 4 || (lane === 'light' && state.stage > 1)) say(`${feature} is at stage ${state.stage}; it can no longer move to the ${lane} lane. Nothing recorded.`)
  if (lane === 'light' && isFrozen(dir)) say('The error budget is frozen, so only the full lane is open. Nothing recorded.')
  const back = lane === 'full' && state.stage === 4
  if (back) {
    state.stages[4].leftAt = new Date().toISOString()
    state.stage = 3
    state.stages[3] = { enteredAt: new Date().toISOString() }
  }
  state.lane = lane
  state.laneSetBy = who
  writeState(dir, state)
  audit(dir, { event: 'lane', feature, lane, by: who })
  say(`${who} set ${feature} to the ${lane} lane.${back ? ' It goes back to stage 3 (Design): write plan.md, then request the gate.' : ''}`)
}

const stage = Number(stageText)
if (state.closedAt) say(`${feature} is complete. Nothing recorded.`)
if (stage !== state.stage) say(`${feature} is at stage ${state.stage}, not ${stageText}. Nothing recorded.`)
const owners = loadConfig(dir).gateOwners[stage] ?? []
if (owners.length && !owners.includes(who)) say(`${who} is not an owner of gate ${stage} (${owners.join(', ')}). Nothing recorded.`)

const now = new Date().toISOString()
const gate = state.gates[stage] ?? {}
if (verb === 'approve') {
  // Approving needs a request first, because the request runs the checks (gate, PR size, pre-review).
  if (gate.status !== 'waiting') say(`Gate ${stage} has not been requested, so its checks have not run. Ask the agent to run "sdlc request ${feature}" first. Nothing recorded.`)
  const missing = missingHeadings(dir, state, stage)
  if (missing.length) say(`Gate ${stage} not approved, the artefact is incomplete: ${missing.join('; ')}.`)
  // An approval covers what the request checked (ADR-0005). If that changed since, the gate lapses.
  if (gate.fingerprint && gate.fingerprint !== gateFingerprint(dir, state, stage)) {
    state.gates[stage] = { ...gate, status: 'lapsed', lapsedAt: now }
    writeState(dir, state)
    audit(dir, { event: 'lapse', feature, stage, by: who })
    say(`Gate ${stage} not approved: what it checked has changed since the request, so it has lapsed. Ask the agent to run "sdlc request ${feature}" again, then review what changed.`)
  }
  state.gates[stage] = { ...gate, status: 'approved', by: who, approvedAt: now, requestedAt: gate.requestedAt ?? now, note: note || undefined }
  // Each approval of the spec or the design is a revision: v1, then v2 after a change request.
  if ([1, 3].includes(stage)) state.revisions = { ...state.revisions, [stage]: (state.revisions?.[stage] ?? 0) + 1 }
  writeState(dir, state)
  // A first-time approval with no rework adds to the gate's clean streak.
  const ledger = readTrust(dir)
  const key = `${state.lane}:${stage}`
  const clean = !gate.rejections
  ledger[key] = { ...ledger[key], streak: clean ? (ledger[key]?.streak ?? 0) + 1 : 0, promoted: ledger[key]?.promoted ?? false }
  writeTrust(dir, ledger)
  audit(dir, { event: 'approve', feature, stage, by: who, note })
  say(`${who} approved gate ${stage} (${STAGES[stage].name}) for ${feature}. ${advanceFeature(dir, state)}`)
}
if (!note) say(`A rejection needs a reason: sdlc reject ${feature} ${stage} <reason>. Nothing recorded.`)
state.gates[stage] = { ...gate, status: 'rejected', by: who, rejectedAt: now, reason: note, rejections: (gate.rejections ?? 0) + 1 }
// A person has looked and given direction, so the review rounds start again (ADR-0005).
if (stage === 5) state.reviewRounds = 0
writeState(dir, state)
// A rejection resets the gate's streak and takes back any promotion.
const ledger = readTrust(dir)
const key = `${state.lane}:${stage}`
ledger[key] = { ...ledger[key], streak: 0, promoted: false, ...(ledger[key]?.promoted ? { demotedAt: now, demotedBy: `rejection by ${who}` } : {}) }
writeTrust(dir, ledger)
audit(dir, { event: 'reject', feature, stage, by: who, reason: note })
say(`${who} rejected gate ${stage} for ${feature}: "${note}". Rework the artefact, then request the gate again.`)
