#!/usr/bin/env node
// The only way agents move a feature through the cycle. Approvals are not here:
// a human records them by typing "sdlc approve <feature> <stage>" in the prompt.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { STAGES, root, git, loadConfig, readState, writeState, listFeatures, missingHeadings, isFrozen, destructiveMigrations,
  stageSpec, section, matches, changedFiles, changedLines, createFeature, copyTemplate, TEMPLATES, overdueGates, overduePostmortems,
  KINDS, trustedGates, promotable, readTrust, writeTrust, lessonPaid, lessonProblem, lessonsOwed, audit, withIntent, INTENT_PARTS, autonomy } from './lib.mjs'
import { check, conformance, OKF_VERSION, relevant, writeIndex } from './knowledge.mjs'
import { collect, analyze, report } from './retro.mjs'
import { lint, requirementsFrom } from './gherkin.mjs'
import { packet, packetText, parseLedger, ledgerProblems } from './review.mjs'
import { boardProblems } from './design-review.mjs'
import { matrix, matrixText } from './testmatrix.mjs'
import { factsGateProblems, assumptionProblems } from './facts.mjs'
import { erProblems, openapiProblems, breakingChanges } from './contracts.mjs'
import { runProof, proofProblems, releaseProblems, advanceFeature, overdueOutcomes, riskTier, gateFingerprint, unreviewedChanges, contentHashes, readTriggers, addTrigger, clearTriggers, repeatedFindings } from './loop.mjs'

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
// The gate, proof, review and Build or Verify requests judge the diff of the branch checked out, so
// they run only on the feature's own branch: otherwise one feature is judged by another's code.
const onBranch = state => {
  const here = git('rev-parse --abbrev-ref HEAD', dir)
  if (state.branch && here !== state.branch) fail(`${feature} lives on ${state.branch}, but ${here} is checked out, so its diff would be the wrong one. Switch first: git switch ${state.branch}`)
}
const kinds = () => {
  const list = (flag('kind') ?? '').split(',').map(k => k.trim()).filter(Boolean)
  const unknown = list.filter(k => !KINDS[k])
  if (unknown.length) fail(`Unknown kind ${unknown.join(', ')}. Kinds: ${Object.keys(KINDS).join(', ')}`)
  return list
}
// A bug that escaped a shipped feature is evidence against every gate that feature passed: each
// one loses its clean streak and any promotion. This only ever tightens, so agents may record it.
const chargeEscape = (causedBy, bug) => {
  const source = readState(dir, causedBy)
  const now = new Date().toISOString()
  source.escapes = [...(source.escapes ?? []), { bug, at: now }]
  writeState(dir, source)
  const ledger = readTrust(dir)
  const passed = Object.entries(source.gates).filter(([, g]) => g.status === 'approved').map(([stage]) => `${source.lane}:${stage}`)
  for (const key of passed) {
    const was = ledger[key] ?? {}
    ledger[key] = { ...was, streak: 0, promoted: false, escapes: (was.escapes ?? 0) + 1, ...(was.promoted ? { demotedAt: now, demotedBy: `escape: bug ${bug}` } : {}) }
  }
  writeTrust(dir, ledger)
  return `Charged to ${causedBy}: gates ${passed.join(', ') || 'none'} lose their streak${passed.some(k => readTrust(dir)[k]?.demotedBy === `escape: bug ${bug}`) ? ' and promotion' : ''}.`
}
// The Analyze gate needs acceptance.feature: valid Gherkin that covers every PRD requirement.
const acceptanceProblems = state => {
  const folder = path.join(dir, loadConfig(dir).specsDir, state.feature)
  const file = path.join(folder, 'acceptance.feature')
  if (!fs.existsSync(file)) return ['acceptance.feature does not exist: write every acceptance criterion as a Gherkin scenario']
  const prd = path.join(folder, 'prd.md')
  const reqs = fs.existsSync(prd) ? requirementsFrom(fs.readFileSync(prd, 'utf8')) : []
  // No parsable requirement ids would switch coverage off, so it is a problem in itself.
  const noIds = fs.existsSync(prd) && !reqs.length ? ['prd.md has no requirement ids (R1, R2, ...) in "## Requirements", so coverage cannot be checked'] : []
  return [...noIds, ...lint(fs.readFileSync(file, 'utf8'), reqs.length ? reqs : null).errors.map(e => `acceptance.feature line ${e.line}: ${e.message}`)]
}
// Data work shows its ER diagram and API work keeps a well-formed OpenAPI file: both only warn. A
// breaking API change against the base branch must be declared in the plan's Contracts section.
const openapiFile = state => path.join(dir, loadConfig(dir).specsDir, state.feature, 'openapi.yaml')
const openapiBreaks = state => {
  const file = openapiFile(state)
  const cfg = loadConfig(dir)
  const base = cfg.protectedBranches.map(b => git(`merge-base ${b} HEAD`, dir)).find(Boolean)
  const rel = path.relative(dir, file).split(path.sep).join('/')
  const before = base ? git(`show ${base}:${rel}`, dir) : ''
  return before ? breakingChanges(before, fs.readFileSync(file, 'utf8')) : []
}
const contractProblems = state => {
  const kinds = state.kinds ?? []
  const folder = path.join(dir, loadConfig(dir).specsDir, state.feature)
  const plan = path.join(folder, 'plan.md')
  const planText = fs.existsSync(plan) ? fs.readFileSync(plan, 'utf8') : ''
  const problems = []
  const warnings = []
  if (kinds.includes('data')) warnings.push(...erProblems(planText).map(p => `ER diagram: ${p}`))
  if (kinds.includes('api')) {
    const file = openapiFile(state)
    if (!fs.existsSync(file)) problems.push(`no ${path.relative(dir, file).split(path.sep).join('/')}: API work needs its OpenAPI contract (sdlc api ${state.feature})`)
    else {
      warnings.push(...openapiProblems(fs.readFileSync(file, 'utf8')).map(p => `openapi.yaml: ${p}`))
      const contracts = (section(planText, '## Contracts') ?? '').toLowerCase()
      for (const b of openapiBreaks(state)) if (!contracts.includes('breaking') || !contracts.includes(b.replace(/^removed /, '').split(' no longer')[0].toLowerCase())) problems.push(`openapi.yaml breaks clients (${b}): declare it as breaking in plan.md "## Contracts", with the version bump and migration path`)
    }
  }
  return { problems, warnings }
}
const kindNote = () => (kinds().length ? `, ${kinds().join(', ')}` : '')
const hours = (a, b = new Date().toISOString()) => Math.round((Date.parse(b) - Date.parse(a)) / 36e5 * 10) / 10

// Everything a feature's kinds need at Plan is put in front of the agent before it writes (issue #17):
// facts.md for brownfield and data work, and each kind's PRD sections in prd.md.
const scaffoldKinds = state => {
  if (!['full', 'light'].includes(state.lane)) return
  if ((state.kinds ?? []).some(k => ['brownfield', 'data'].includes(k))) copyTemplate(dir, feature, 'facts.md')
  const prd = path.join(dir, loadConfig(dir).specsDir, feature, 'prd.md')
  if (!fs.existsSync(prd)) return
  let text = fs.readFileSync(prd, 'utf8')
  for (const k of state.kinds ?? []) {
    for (const h of KINDS[k]?.headings?.[1] ?? []) if (!text.split(/\r?\n/).some(l => l.trim() === h)) text += `\n${h}\n\n<!-- Required for ${k} work. -->\n`
  }
  fs.writeFileSync(prd, text)
}

const commands = {
  // Create a feature at stage 1, in the light lane unless --full. Starting full is always allowed
  // (it only adds the Design gate); only a human moves a feature from full to light ("sdlc lane").
  init() {
    if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) fail('Usage: sdlc init <feature-slug> [--full] [--kind a,b] [--branch <name>] [--capability <capability>]')
    if (readState(dir, feature)) fail(`Feature "${feature}" already exists.`)
    if (isFrozen(dir)) fail('The error budget is spent, so new features wait until a human unfreezes it. Bug, hotfix and reliability tasks stay open (sdlc bug, sdlc task).')
    // A slice of a big capability (issue #28) names it, so status can show the capability's slices.
    const capability = flag('capability')
    const slices = capability && `${loadConfig(dir).specsDir}/${capability}/slices.md`
    if (capability && !fs.existsSync(path.join(dir, slices))) fail(`No ${slices}: write the capability's outcome and slices there first (template: slices.md).`)
    const lane = rest.includes('--full') ? 'full' : 'light'
    const state = createFeature(dir, { feature, lane, branch: flag('branch'), extra: { kinds: kinds(), ...(capability ? { capability } : {}) } })
    const prd = copyTemplate(dir, feature, 'prd.md')
    const feat = copyTemplate(dir, feature, 'acceptance.feature')
    // The script writes the line: the PRD itself waits for the person's intent.
    if (capability) fs.writeFileSync(path.join(dir, prd), fs.readFileSync(path.join(dir, prd), 'utf8').replace(/^(# PRD: .*\n)/, `$1\nCapability: ${capability} (${slices})\n`))
    scaffoldKinds(state)
    console.log(`Created ${feature} at stage 1 (Plan), ${lane} lane${kindNote()}. Write ${prd} and ${feat}; one approval covers both.`)
  },

  // A small change with no new behaviour to specify (a dependency bump, config, a refactor, docs).
  task() {
    if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) fail('Usage: sdlc task <task-slug>')
    if (readState(dir, feature)) fail(`"${feature}" already exists.`)
    if (kinds().includes('data')) fail('Data work is a feature, so the DBA reviews it. Use: sdlc init <slug> --kind data')
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
    if (add === 'data' && !['full', 'light'].includes(state.lane)) fail('Data work is a feature, so the DBA reviews it. Start it with: sdlc init <slug> --kind data')
    state.kinds = [...new Set([...(state.kinds ?? []), add])]
    writeState(dir, state)
    scaffoldKinds(state)
    console.log(`${feature} is now: ${state.kinds.join(', ')}.`)
  },

  // A bug fix: one document, starts at Build, and its only human gate is the PR review.
  bug() {
    if (!feature || !/^[a-z0-9][a-z0-9-]*$/.test(feature)) fail('Usage: sdlc bug <bug-slug>')
    if (readState(dir, feature)) fail(`"${feature}" already exists.`)
    if (kinds().includes('data')) fail('A bug that needs a data change is a feature. Use: sdlc init <slug> --kind data')
    const causedBy = flag('caused-by')
    if (causedBy && !readState(dir, causedBy)) fail(`No feature "${causedBy}" to charge this bug to.`)
    createFeature(dir, { feature, lane: 'bug', branch: flag('branch'), extra: { kinds: kinds(), ...(causedBy ? { causedBy, lessonOwed: true } : {}) } })
    const doc = copyTemplate(dir, feature, 'bug.md')
    console.log(`Created bug ${feature} at stage 4 (Build). Write the repro test first and run "sdlc gate ${feature}": it must fail before the fix. Document: ${doc}`)
    if (causedBy) console.log(chargeEscape(causedBy, feature))
  },

  // Check the artefact and the lane's rules. Checks pass an automatic gate and move on; any other gate
  // waits for its human owner.
  request() {
    const state = need()
    const cfg = loadConfig(dir)
    if ([4, 5].includes(state.stage)) onBranch(state)
    // With autonomy granted by a person, every gate passes on its checks, recorded as granted by them.
    const granted = autonomy(dir)
    const next = n => (granted ? `Request gate ${n} again: it passes on its checks under autonomy.` : `Request gate ${n} again so a person approves the new version.`)
    // A spec or plan edited after it was approved has not been seen by a person: back to that stage,
    // not on to ship. The approvals after it went with the old version, so they go too.
    const drifted = [[1, 'Plan', 'the spec (prd.md or acceptance.feature)'], [3, 'Design', 'the plan (plan.md)']]
      .find(([s]) => state.stage > s && state.gates[s]?.status === 'approved' && state.gates[s].fingerprint && state.gates[s].fingerprint !== gateFingerprint(dir, state, s, cfg))
    if (drifted) {
      const [back, name, what] = drifted
      const now = new Date().toISOString()
      state.stages[state.stage] = { ...state.stages[state.stage], leftAt: now }
      for (const s of Object.keys(state.gates)) if (Number(s) >= back) delete state.gates[s]
      state.stage = back
      state.stages[back] = { enteredAt: now }
      writeState(dir, state)
      audit(dir, { event: back === 1 ? 'spec-drift' : 'plan-drift', feature })
      fail(`${what[0].toUpperCase()}${what.slice(1)} has changed since gate ${back} was approved, so ${feature} goes back to stage ${back} (${name}). ${next(back)} Tests already written stay.`)
    }
    const spec = granted ? { ...stageSpec(state, state.stage, trustedGates(dir)), isAuto: true, owner: `autonomy granted by ${granted.by}` } : stageSpec(state, state.stage, trustedGates(dir))
    const missing = missingHeadings(dir, state)
    const warnings = []
    // A spec or design approved before comes back as the next revision, and says what changed and why.
    const revision = state.revisions?.[state.stage] ?? 0
    if ([1, 3].includes(state.stage) && revision) {
      const doc = state.stage === 1 ? 'prd.md' : 'plan.md'
      const text = fs.existsSync(path.join(dir, cfg.specsDir, feature, doc)) ? fs.readFileSync(path.join(dir, cfg.specsDir, feature, doc), 'utf8') : ''
      if (!section(text, `## Changes since v${revision}`)) missing.push(`${doc} was approved as v${revision}: add "## Changes since v${revision}" saying what changed and why (the change request), so v${revision + 1} can be approved`)
    }
    if ([4, 5].includes(state.stage) && !(state.kinds ?? []).includes('data')) {
      const schema = changedFiles(dir, cfg).filter(f => matches(f.file, ['**/migrations/**', '**/*.sql', '**/schema.prisma'])).map(f => f.file)
      if (schema.length) missing.push(`${schema.join(', ')} change the schema: this is data work. Run "sdlc kind ${feature} data" (the DBA reviews the PR)`)
    }
    // The light lane is for additive, low-risk work: altering or dropping data, or a high-risk path,
    // needs the Design gate of the full lane.
    if (state.lane === 'light' && [4, 5].includes(state.stage)) {
      const destructive = destructiveMigrations(dir, cfg)
      // Migrations are judged by what they do (above), not by where they live.
      const risky = changedFiles(dir, cfg).map(f => f.file).filter(f => matches(f, cfg.highRiskPaths) && !matches(f, ['**/migrations/**']))
      // Under autonomy the move to the full lane is made here: it only adds checks, so it needs no person.
      if (granted && (destructive.length || risky.length)) {
        const now = new Date().toISOString()
        state.stages[state.stage] = { ...state.stages[state.stage], leftAt: now }
        for (const s of Object.keys(state.gates)) if (Number(s) >= 3) delete state.gates[s]
        Object.assign(state, { lane: 'full', laneSetBy: `autonomy granted by ${granted.by}`, stage: 3 })
        state.stages[3] = { enteredAt: now }
        writeState(dir, state)
        audit(dir, { event: 'lane', feature, lane: 'full', by: `autonomy granted by ${granted.by}` })
        const why = destructive.length ? `${destructive.join(', ')} alter or drop existing data` : `${risky.slice(0, 5).join(', ')} are high-risk paths`
        fail(`${why}, so ${feature} moves to the full lane and goes back to stage 3 (Design): write plan.md, then request gate 3.`)
      }
      if (destructive.length) missing.push(`${destructive.join(', ')} alter or drop existing data, which needs the full lane: ask a human to type "sdlc lane ${feature} full"`)
      if (risky.length) missing.push(`${risky.slice(0, 5).join(', ')} are high-risk paths, which need the full lane: ask a human to type "sdlc lane ${feature} full"`)
    }
    if ([4, 5].includes(state.stage)) {
      const run = state.gateRuns?.[state.stage]
      if (!run?.ok) missing.push(`the full gate has not passed at this stage. Run: sdlc gate ${feature}`)
      else if (run.count < (state.baseline ?? 0)) missing.push(`${run.count} passing tests is below the baseline of ${state.baseline}`)
    }
    // One spec gate: the PRD, its acceptance criteria, and facts when the work changes what exists.
    if (state.stage === 1) {
      const prd = path.join(dir, cfg.specsDir, feature, 'prd.md')
      // The PRD carries the person's intent verbatim, whatever an agent wrote in its place.
      // With autonomy, the agent writes the intent into the PRD itself; it is still required.
      const prdText = fs.existsSync(prd) ? fs.readFileSync(prd, 'utf8') : ''
      if (state.intent && prdText) fs.writeFileSync(prd, withIntent(prdText, state.intent))
      else if (granted && !section(prdText, '## Intent')) missing.push('the PRD has no "## Intent" (change, smallest, drop if): with autonomy the agent writes it, and the request still checks it')
      else if (!granted && !state.intent) missing.push(`no intent from a person yet. Run "sdlc ask ${feature}" and ask its three questions with the question tool`)
      if (fs.existsSync(prd)) missing.push(...assumptionProblems(fs.readFileSync(prd, 'utf8')).map(p => `prd.md: ${p}`))
      missing.push(...acceptanceProblems(state))
      // Slice before building, not after: the PR line limit otherwise fires at the end of Build.
      const feat = path.join(dir, cfg.specsDir, feature, 'acceptance.feature')
      const scenarios = fs.existsSync(feat) ? lint(fs.readFileSync(feat, 'utf8')).scenarios.filter(s => s.ac).length : 0
      if (scenarios > cfg.sliceScenarios) warnings.push(`${scenarios} scenarios is more than one slice usually holds (${cfg.sliceScenarios}). Consider splitting the feature now: each slice is built and reviewed as one PR of at most ${cfg.maxPrLines[state.lane] ?? cfg.maxPrLines.full} code lines.`)
      const kinds = state.kinds ?? []
      if (kinds.includes('brownfield') || kinds.includes('data') || fs.existsSync(path.join(dir, cfg.specsDir, feature, 'facts.md'))) missing.push(...factsGateProblems(dir, state))
    }
    if (state.stage === 3) {
      missing.push(...boardProblems(dir, feature))
      const contracts = contractProblems(state)
      missing.push(...contracts.problems)
      warnings.push(...contracts.warnings)
    }
    if (state.lane === 'bug' && state.stage === 4) {
      // With a proofCommand, the repro test itself must fail on the base code; otherwise any red gate run counts.
      if (cfg.proofCommand) {
        if (!state.proof?.ok) missing.push(`the repro is not proved: sdlc proof ${feature} --files <repro test> (it must pass here and fail on the base code)`)
      } else if (!state.reproRedAt) missing.push('no failing gate run before the fix: a bug fix starts with a test that reproduces it')
      const forbidden = changedFiles(dir, cfg).filter(f => matches(f.file, cfg.bugForbidPaths)).map(f => f.file)
      if (forbidden.length) missing.push(`a bug fix may not change ${forbidden.join(', ')}. Open a feature instead`)
    }
    // A bug that escaped shipped work merges only once its lesson is a guard (ADR-0004).
    if (state.lane === 'bug' && state.stage === 5 && state.lessonOwed && !lessonPaid(dir, feature)) missing.push(lessonProblem(feature))
    if (state.stage === 5 || spec.isAuto) {
      const lines = changedLines(dir, cfg)
      const max = cfg.maxPrLines[state.lane] ?? cfg.maxPrLines.full
      // Once a PR's size passed at Build or Verify, the fixes its review asks for get 20% room: refusing the
      // review's own fix for size is the process fighting itself.
      const room = state.sizeChecked ? Math.max(max, Math.round(state.sizeChecked * 1.2)) : max
      if (lines > room) missing.push(`${lines} changed lines is over the ${state.lane} lane limit of ${max}. Split it into smaller PRs, one slice each`)
      else if (lines > max) warnings.push(`${lines} changed lines is over the ${state.lane} lane limit of ${max}, within the room for review fixes (${room}) because ${state.sizeChecked} lines passed at Verify.`)
      else if ([4, 5].includes(state.stage) && state.sizeChecked === undefined) state.sizeChecked = lines
    }
    if (state.stage === 5) {
      // Review has to converge (ADR-0005): past the round cap, step back instead of another round.
      if ((state.reviewRounds ?? 0) >= cfg.reviewRoundCap) fail(`Gate 5 has been refused ${state.reviewRounds} times. Stop fixing finding by finding: step back, rethink the approach, and ask a human. They reset it by typing: sdlc reject ${feature} 5 rethink: <the new approach>`)
      const folder = path.join(dir, cfg.specsDir, feature)
      const file = path.join(folder, spec.artefact)
      const pre = (fs.existsSync(file) && section(fs.readFileSync(file, 'utf8'), '## Pre-review')) || ''
      // The change sets the risk tier; the pre-review's label may raise it, never lower it.
      const risk = riskTier(dir, changedFiles(dir, cfg).map(f => f.file), pre, cfg)
      if (risk.label && risk.label !== risk.tier) missing.push(`the pre-review says "Risk: ${risk.label}", but the change is ${risk.tier}: ${risk.why.join('; ')}`)
      state.riskTier = risk.tier
      const highRisk = risk.tier === 'high'
      // A packet built before later commits is a stale map of the change: rebuild it rather than refuse.
      const packetFile = path.join(folder, 'review-packet.md')
      const built = fs.existsSync(packetFile) ? fs.readFileSync(packetFile, 'utf8').match(/built at ([0-9a-f]+)/)?.[1] : null
      if (built !== git('rev-parse --short HEAD', dir)) {
        const p = packet(dir, state)
        fs.writeFileSync(packetFile, packetText(p))
        state.lastPacketHead = p.head
        copyTemplate(dir, feature, 'review.md')
        console.log(`Rebuilt ${cfg.specsDir}/${feature}/review-packet.md at HEAD.`)
      }
      const ledger = path.join(folder, 'review.md')
      // Remember every finding id the gate has seen, so a row cannot be deleted instead of closed.
      const findings = parseLedger(fs.readFileSync(ledger, 'utf8'))
      missing.push(...ledgerProblems(dir, findings, state.ledgerIds ?? [], { strictFixes: highRisk }).map(p => `review.md: ${p}`))
      state.ledgerIds = [...new Set([...(state.ledgerIds ?? []), ...findings.map(f => f.id)])]
      writeState(dir, state)
      if (fs.existsSync(path.join(folder, 'acceptance.feature'))) missing.push(...matrix(dir, feature).problems.map(p => `test matrix: ${p}`))
      if (pre && !/Risk:\s*(low|medium|high)\b/i.test(pre)) missing.push('the pre-review gives no "Risk: low|medium|high"')
      if (pre && !/Open findings:\s*0\b/i.test(pre)) missing.push('the pre-review still has open findings ("Open findings: 0" is required)')
      // A ledger with no rows reads the same as a skipped review, so the pre-review says what ran (F10).
      if (pre && !/Lenses run:\s*\S/i.test(pre)) missing.push('the pre-review does not say which lenses ran ("Lenses run: ...")')
      if (pre && !/Revert:\s*\S/i.test(pre)) missing.push('the pre-review does not say how to undo this ("Revert: <command or flag>")')
      const proof = proofProblems(dir, state, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '', cfg)
      if (proof.warning) warnings.push(proof.warning)
      missing.push(...proof.problems)
      // The same serious finding in two features is a gap in the process: the retro is due now.
      for (const r of repeatedFindings(dir, cfg)) addTrigger(dir, `"${r.item}" found again (${r.features.join(', ')})`)
    }
    if (state.stage === 6) {
      const file = path.join(dir, cfg.specsDir, feature, spec.artefact)
      const release = releaseProblems(dir, state, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '', cfg)
      missing.push(...release.problems)
      warnings.push(...release.warnings)
      const unreviewed = unreviewedChanges(dir, state, cfg)
      if (unreviewed.length) missing.push(`${unreviewed.slice(0, 5).join(', ')} changed after Verify reviewed ${state.reviewedSha.slice(0, 7)}: that code never reached a reviewer. Request gate 5 again`)
    }
    for (const w of warnings) console.log(`WARNING: ${w}`)
    if (state.stage === 5) {
      // A round is a request the review itself refused (the ledger, the pre-review or its risk), not a red gate.
      if (missing.some(m => m.startsWith('review.md:') || m.startsWith('the pre-review'))) state.reviewRounds = (state.reviewRounds ?? 0) + 1
      writeState(dir, state)
      console.log(`Risk tier: ${state.riskTier}. Review round ${state.reviewRounds ?? 0} of ${cfg.reviewRoundCap}.`)
    }
    // A refusal leaves a trace for status, and under autonomy says what to do, since no one approves.
    if (missing.length) {
      state.lastRefusal = { stage: state.stage, at: new Date().toISOString(), reasons: missing.slice(0, 5) }
      writeState(dir, state)
      fail(`Gate ${state.stage} cannot be requested:\n- ${missing.join('\n- ')}${granted ? '\nUnder autonomy no one approves around a check: fix each reason above and request again. A check you believe is wrong is a finding for the plugin (record it for the retro), never a reason to work around it.' : ''}`)
    }
    delete state.lastRefusal
    const gate = state.gates[state.stage]
    if (gate?.status === 'approved') fail(`Gate ${state.stage} is already approved. Run: sdlc advance ${feature}`)
    const now = new Date().toISOString()
    // The commit the reviewer sees is the one Release must find on the remote's main (ADR-0004).
    if (state.stage === 5) {
      state.reviewedSha = git('rev-parse HEAD', dir)
      // After the merge the branch shows no diff against main, so Release reads what was reviewed.
      state.reviewedFiles = changedFiles(dir, cfg).map(f => f.file)
      state.reviewedHashes = contentHashes(dir, state.reviewedFiles.filter(f => !f.startsWith(`${cfg.specsDir}/`) && !f.startsWith('.ai-sdlc/')))
    }
    if (spec.isAuto) {
      const earned = trustedGates(dir).includes(`${state.lane}:${state.stage}`) ? 'earned trust' : spec.owner
      // The fingerprint lets spec or plan drift send the work back even when no person approved it.
      state.gates[state.stage] = { status: 'approved', by: `checks: ${earned}`, requestedAt: now, approvedAt: now, auto: true, fingerprint: gateFingerprint(dir, state, state.stage, cfg) }
      if ([1, 3].includes(state.stage)) state.revisions = { ...state.revisions, [state.stage]: (state.revisions?.[state.stage] ?? 0) + 1 }
      return console.log(`Gate ${state.stage} (${spec.name}) passed on checks (${earned}) in the ${state.lane} lane. ${advanceFeature(dir, state)}`)
    }
    // The approval covers what was checked: the gate lapses if that changes before a human approves.
    state.gates[state.stage] = { status: 'waiting', requestedAt: now, fingerprint: gateFingerprint(dir, state, state.stage, cfg) }
    writeState(dir, state)
    const sla = cfg.reviewSlaHours[state.lane] ?? cfg.reviewSlaHours.full
    console.log(`Gate ${state.stage} (${spec.name}) is waiting on: ${spec.owner}. Review deadline: ${sla}h.\nArtefact: ${cfg.specsDir}/${feature}/${spec.artefact}\nAsk the owner: run "sdlc ask ${feature}" and put its question to them with the question tool. Never ask them to type a command.`)
    // What the person judges it against, from what the scripts hold, never the agent's account of itself.
    const doc = f => (fs.existsSync(path.join(dir, cfg.specsDir, feature, f)) ? fs.readFileSync(path.join(dir, cfg.specsDir, feature, f), 'utf8') : '')
    if (state.intent) console.log(`\nYour intent:\n${INTENT_PARTS.map(([k, label]) => `- ${label}: ${state.intent[k]}`).join('\n')}`)
    if (state.stage === 1) {
      const unconfirmed = (section(doc('prd.md'), '## Assumptions') ?? '').split('\n').filter(l => /\[unconfirmed\]/i.test(l)).map(l => l.match(/A\d+/i)?.[0].toUpperCase()).filter(Boolean)
      console.log(`Unconfirmed assumptions: ${unconfirmed.join(', ') || 'none'}`)
    }
    if (state.stage === 5) console.log(`Risk tier: ${state.riskTier}. Files reviewed: ${state.reviewedFiles.length}.\nNot verified: ${section(doc(spec.artefact), '## Not verified') || 'nothing listed'}`)
  },

  // The question a person answers with a click instead of typing a command (owner feedback, 29 Oct).
  // Prints the AskUserQuestion input; the agent asks it, and the answers hook records the choice. The
  // marker binds the question to this feature, gate and fingerprint, so a stale one records nothing.
  ask() {
    const state = need()
    const gate = state.gates[state.stage]
    if (gate?.status === 'waiting') {
      const spec = stageSpec(state, state.stage)
      const intent = state.intent ? ` Your intent: ${state.intent.change}.` : ''
      // A spec or design approved before is asked as its next revision, with what changed.
      const revision = state.revisions?.[state.stage] ?? 0
      const docText = fs.existsSync(path.join(dir, loadConfig(dir).specsDir, feature, spec.artefact)) ? fs.readFileSync(path.join(dir, loadConfig(dir).specsDir, feature, spec.artefact), 'utf8') : ''
      const changed = revision ? (section(docText, `## Changes since v${revision}`) ?? '').split('\n').find(l => l.trim()) : ''
      const name = revision ? `${spec.name} v${revision + 1}` : spec.name
      return console.log(JSON.stringify({
        questions: [{
          header: `Gate ${state.stage}`,
          question: `Approve ${name} for ${feature}?${changed ? ` Changed since v${revision}: ${changed.trim()}` : ''} It covers ${loadConfig(dir).specsDir}/${feature}/${spec.artefact}.${intent} [gate ${feature} ${state.stage} ${(gate.fingerprint ?? '').slice(0, 8)}]`,
          multiSelect: false,
          options: [
            { label: 'Approve', description: 'Record your approval; the feature moves on by itself.' },
            { label: 'Send back', description: 'Record a rejection. To say why, choose Other and write it.' },
          ],
        }],
      }, null, 2))
    }
    if (state.stage === 1 && ['full', 'light'].includes(state.lane) && !state.intent) {
      const q = (header, question) => ({ header, question: `${question} [intent ${feature}]`, multiSelect: false, options: [] })
      return console.log(JSON.stringify({
        instructions: 'Fill each question\'s options with 2 or 3 answers in the person\'s own words from the conversation, plus nothing they did not say. They can always write their own under Other.',
        questions: [
          q('Change', 'What should change for the people who use it?'),
          q('Smallest', 'What is the smallest version that would tell us it works?'),
          q('Drop if', 'What result would make us drop it?'),
        ],
      }, null, 2))
    }
    fail(`Nothing to ask the person for ${feature}: no gate is waiting${state.stage === 1 && !state.intent ? '' : ' and the intent is set'}. Run sdlc request ${feature} first.`)
  },

  // With autonomy, the merge a person makes on GitHub: push exactly the commit Verify reviewed to main,
  // fast-forward only. If main has moved, the branch takes main and goes through Verify again.
  merge() {
    const state = need()
    const granted = autonomy(dir)
    if (!granted) fail(`Merging ${feature} needs autonomy (a person types "sdlc autonomy on <reason>"). Without it, a person merges the PR.`)
    if (state.gates[5]?.status !== 'approved' || !state.reviewedSha) fail(`${feature} has not passed Verify (gate 5), so there is no reviewed commit to merge.`)
    onBranch(state)
    const head = git('rev-parse HEAD', dir)
    if (head !== state.reviewedSha) fail(`HEAD ${head.slice(0, 7)} is not the commit Verify reviewed (${state.reviewedSha.slice(0, 7)}). Request gate 5 again, or reset to it.`)
    const r = spawnSync('git', ['push', '-q', 'origin', `${head}:refs/heads/main`], { cwd: dir, encoding: 'utf8' })
    if (r.status !== 0) fail(`main has moved, so ${head.slice(0, 7)} is not a fast-forward. Merge origin/main into ${state.branch}, then request gate 5 again.\n${r.stderr.trim()}`)
    audit(dir, { event: 'merge', feature, sha: head, by: `autonomy granted by ${granted.by}` })
    console.log(`Merged ${feature} (${head.slice(0, 7)}, the reviewed commit) into main, under autonomy granted by ${granted.by}. Release can now find it on origin/main.`)
  },

  // Approvals and gates passed on checks move the feature on by themselves; this is for a feature whose
  // gate was approved before that, or by hand.
  advance() {
    const state = need()
    if (state.closedAt) fail(`${feature} is complete.`)
    if (state.gates[state.stage]?.status !== 'approved') fail(`Gate ${state.stage} is not approved. Nothing moved.`)
    console.log(advanceFeature(dir, state))
  },

  // Run the repo's full gate and record the passing count. The first run in Build is the baseline.
  // In the bug and hotfix lanes, a red run before any green one records the reproduction.
  gate() {
    const state = need()
    onBranch(state)
    const { gateCommand, testCountPattern, dataCheckCommand, gateRepeats } = loadConfig(dir)
    if (!gateCommand) fail('No gateCommand in .ai-sdlc/config.json. A human sets it, for example "npm run gate".')
    // --repeat N (or config gateRepeats) runs the gate N times: a flaky test shows up as a red run or a
    // changed count. dataCheckCommand (optional) runs after each pass and must exit 0: it proves the
    // tests tore down their data (for example, no rows left in the test schema).
    const repeats = Number(flag('repeat') ?? gateRepeats ?? 1)
    if (!Number.isInteger(repeats) || repeats < 1 || repeats > 20) fail('--repeat takes a whole number from 1 to 20.')
    const runs = []
    for (let i = 0; i < repeats; i++) {
      const r = spawnSync(gateCommand, { cwd: dir, shell: true, encoding: 'utf8' })
      const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
      const counts = [...out.matchAll(new RegExp(testCountPattern, 'gi'))].map(m => Number(m[1] ?? m[2]))
      const leak = dataCheckCommand ? spawnSync(dataCheckCommand, { cwd: dir, shell: true, encoding: 'utf8' }) : null
      runs.push({ ok: r.status === 0, count: counts.length ? counts[counts.length - 1] : 0, out, leaked: leak ? leak.status !== 0 : false, leakOut: leak ? `${leak.stdout}${leak.stderr}` : '' })
      if (r.status !== 0 && repeats === 1) break
    }
    const out = runs[runs.length - 1].out
    const count = runs[0].count
    const flaky = runs.length > 1 && (new Set(runs.map(r => r.ok)).size > 1 || new Set(runs.map(r => r.count)).size > 1)
    const leaked = runs.some(r => r.leaked)
    const ok = runs.every(r => r.ok) && !leaked
    const now = new Date().toISOString()
    const hadGreen = state.gateRuns?.[state.stage]?.ok
    state.gateRuns = { ...state.gateRuns, [state.stage]: { ok, count, at: now, runs: runs.length, ...(flaky ? { flaky } : {}), ...(leaked ? { leaked } : {}) } }
    if (flaky) console.log(`FLAKY: ${runs.length} runs gave ${runs.map(r => `${r.ok ? 'green' : 'red'} ${r.count}`).join(', ')}. Quarantine with an owner and a date, or fix it; never retry until green.`)
    if (leaked) console.log(`TEST DATA LEAKED: the data check failed after a run. Each test must tear down what it creates.\n${runs.find(r => r.leaked).leakOut.trim().slice(0, 400)}`)
    if (state.stage === 4 && state.baseline === undefined) state.baseline = count
    // The baseline ratchets: a green run raises it, so tests the feature has passed cannot quietly go.
    const floor = state.baseline ?? 0
    if (ok && count > floor && state.baseline !== undefined) state.baseline = count
    // The code before any fix: a hotfix proves its repro against it after the merge.
    if (state.stage === 4 && !state.proofBase) state.proofBase = loadConfig(dir).protectedBranches.map(b => git(`merge-base ${b} HEAD`, dir)).find(Boolean)
    if (!ok && !flaky && !leaked && !hadGreen && !state.reproRedAt && state.stage === 4 && ['bug', 'hotfix'].includes(state.lane)) {
      state.reproRedAt = now
      writeState(dir, state)
      return console.log(`Repro recorded: the gate is red before the fix (${count} passing). Now fix it and run the gate again.`)
    }
    writeState(dir, state)
    console.log(out.split('\n').slice(-15).join('\n'))
    const cfg = loadConfig(dir)
    const size = `PR size: ${changedLines(dir, cfg)} of ${cfg.maxPrLines[state.lane] ?? cfg.maxPrLines.full} code lines.`
    if (ok && count < floor) fail(`Gate RED: ${count} passing is below the ${floor} this feature has reached: a test was removed or skipped. Restore it, or replace it with one that proves the same criterion. ${size}`)
    const verdict = `Gate ${ok ? 'green' : 'RED'}: ${count} passing (baseline ${state.baseline ?? 'not set'}). ${size}`
    if (!ok) fail(verdict)
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
    if (state.retries[key] > cap) addTrigger(dir, `${feature} escalated "${goal}" past the retry cap`)
    if (state.retries[key] > cap) fail(`ESCALATE: "${goal}" failed ${state.retries[key]} times (cap ${cap}). Stop, write what was tried and what failed, and ask the gate owner.`)
    console.log(`Attempt ${state.retries[key]} of ${cap} on "${goal}".`)
  },

  status() {
    const features = feature ? [need()] : listFeatures(dir)
    if (rest.includes('--json') || feature === '--json') return console.log(JSON.stringify(features, null, 2))
    const granted = autonomy(dir)
    if (granted) console.log(`AUTONOMY: granted by ${granted.by} on ${granted.at.slice(0, 10)}: "${granted.reason}". Gates pass on their checks.`)
    // Each capability with its slices (issue #28): a slice that is a feature shows its stage, one not
    // started shows the status written in slices.md.
    const specs = path.join(dir, loadConfig(dir).specsDir)
    for (const cap of feature || !fs.existsSync(specs) ? [] : fs.readdirSync(specs).filter(c => fs.existsSync(path.join(specs, c, 'slices.md')))) {
      const text = fs.readFileSync(path.join(specs, cap, 'slices.md'), 'utf8')
      console.log(`Capability ${cap}: ${(section(text, '## Outcome') ?? '').split('\n')[0] || 'no outcome written'}`)
      for (const [, slug, line] of (section(text, '## Slices') ?? '').matchAll(/^\s*[-*]\s*([a-z0-9][a-z0-9-]*):\s*(.*)$/gm)) {
        const s = readState(dir, slug)
        const after = line.match(/Depends on:\s*([^.]+)/i)?.[1].trim()
        const waits = after && !/^none$/i.test(after) ? `, depends on ${after}` : ''
        const where = s ? (s.closedAt ? `complete (${s.lane} lane)` : `stage ${s.stage} ${STAGES[s.stage].name} (${s.lane} lane)`) : `not started (${line.match(/Status:\s*([^.\n]+)/i)?.[1].trim() ?? 'no status'})`
        console.log(`  ${slug}: ${where}${waits}`)
      }
    }
    if (!features.length) return console.log('No features in flight. Start one with /ai-sdlc:start.')
    const overdue = overdueGates(dir)
    const noPostmortem = overduePostmortems(dir).map(s => s.feature)
    const lateOutcomes = overdueOutcomes(dir).map(s => s.feature)
    for (const s of features) {
      if (s.closedAt) {
        const noProof = loadConfig(dir).proofCommand && !s.proof?.ok ? '; the test proof has not passed' : ''
        const due = noPostmortem.includes(s.feature) ? `, POSTMORTEM OVERDUE (due ${s.postmortemDue.slice(0, 10)}${noProof})` : ''
        const open = s.outcome?.status === 'open' ? `, OUTCOME ${lateOutcomes.includes(s.feature) ? 'OVERDUE' : 'DUE'} ${s.outcome.due.slice(0, 10)} (${s.outcome.owner})` : ''
        const outcome = open || (s.outcome ? `, outcome ${s.outcome.status}` : '')
        const how = s.closedReason ? `closed at stage ${s.stage} by ${s.closedBy}: ${s.closedReason}` : 'complete'
        console.log(`${s.feature}: ${how} (${s.lane} lane)${due}${outcome}`)
        continue
      }
      const gate = s.gates[s.stage]
      const late = overdue.find(o => o.feature === s.feature)
      const deadline = late ? ` OVERDUE (deadline ${late.limit}h): escalate to a backup reviewer` : ''
      const wait = gate?.status === 'waiting' ? `, waiting on ${stageSpec(s).owner} for ${hours(gate.requestedAt)}h${deadline}` : ''
      const revisions = Object.entries(s.revisions ?? {}).map(([n, v]) => `${STAGES[n].name} v${v}`).join(', ')
      console.log(`${s.feature}: stage ${s.stage} ${STAGES[s.stage].name} (${s.lane} lane)${s.spike ? ', SPIKE' : ''}, gate ${gate?.status ?? 'not requested'}${wait}${revisions ? ` [${revisions}]` : ''}`)
      if (s.lastRefusal?.stage === s.stage) console.log(`  last request refused ${hours(s.lastRefusal.at)}h ago: ${s.lastRefusal.reasons.join('; ')}`)
    }
    for (const t of readTriggers(dir)) console.log(`RETRO DUE: ${t.reason}. Run: sdlc retro`)
    for (const s of lessonsOwed(dir)) console.log(`LESSON OWED: ${s.feature}: ${lessonProblem(s.feature)}`)
    // Which version is live: the last release's build, as its probe read it.
    const last = listFeatures(dir).filter(s => s.liveSha).sort((a, b) => Date.parse(b.closedAt) - Date.parse(a.closedAt))[0]
    if (last) console.log(`Live: ${last.liveSha.slice(0, 7)} (${last.feature}, released ${last.closedAt.slice(0, 10)})`)
  },

  // The test proof (ADR-0002): the traced tests are green here and red against the base code.
  // "sdlc proof <feature> [--files a,b] [--base <commit>]"; a hotfix names its repro tests.
  proof() {
    const state = need()
    // A hotfix proves itself after the merge, on the protected branch.
    if (!state.closedAt) onBranch(state)
    const cfg = loadConfig(dir)
    if (!cfg.proofCommand) fail('No proofCommand in .ai-sdlc/config.json. A human sets it, for example "npx jest {files}" or "pytest {files}". Until then, the PR says under "## Not verified" that the proof did not run.')
    if (state.lane === 'hotfix' && !state.closedAt) fail('A hotfix proves its repro after the merge, so the fix is never held up: run this once it has shipped.')
    const files = flag('files')?.split(',').map(f => f.trim()).filter(Boolean)
    if (!fs.existsSync(path.join(dir, cfg.specsDir, feature, 'acceptance.feature')) && !files?.length) fail(`${feature} has no acceptance.feature: name the tests to prove with --files a,b`)
    const base = flag('base') ?? (state.lane === 'hotfix' ? state.proofBase : undefined)
    const result = runProof(dir, state, { files, base }, cfg)
    state.proof = result
    writeState(dir, state)
    if (!result.ok) fail(`Proof FAILED${result.base ? ` against ${result.base}` : ''}:\n- ${result.problems.join('\n- ')}`)
    console.log(`Proof passed against ${result.base}: ${result.acs.join(', ')} ${result.perTest ? 'each failed' : 'failed'} on the base code and pass here. Locked ${Object.keys(result.files).length} test file(s); changing one means proving again.`)
  },

  // A spike may skip the red-first habit inside a slice, never the proof; its code cannot merge.
  spike() {
    const state = need()
    state.spike = !rest.includes('--off')
    writeState(dir, state)
    console.log(state.spike ? `${feature} is a spike: it cannot pass Verify until a non-spike slice replaces it (sdlc spike ${feature} --off).` : `${feature} is no longer a spike.`)
  },

  // Close the outcome follow-up, or raise a breach. Only a human declares a hotfix.
  outcome() {
    const state = need()
    const result = rest[0]
    if (!state.outcome) fail(`${feature} has no outcome follow-up: one opens when a full or light feature is released.`)
    if (!['met', 'missed', 'breach'].includes(result)) fail('Usage: sdlc outcome <feature> met|missed|breach [note]')
    const note = rest.slice(1).join(' ')
    if (result === 'breach') {
      state.outcome.breaches = [...(state.outcome.breaches ?? []), { at: new Date().toISOString(), note }]
      writeState(dir, state)
      return console.log(`ALERT: ${feature} breached "${state.outcome.metric}". Notify the incident commander, who decides whether to declare a hotfix (a human types: sdlc hotfix <slug>).`)
    }
    state.outcome = { ...state.outcome, status: result, closedAt: new Date().toISOString(), ...(note ? { note } : {}) }
    writeState(dir, state)
    console.log(`Outcome for ${feature}: ${result}.${result === 'missed' ? ' Feed it to the next retro and, if it still matters, a new PRD.' : ''}`)
  },

  // Earned autonomy: each gate's run of clean human approvals, what is promoted, and what has
  // earned promotion. Only a human promotes, by typing "sdlc trust <lane> <stage>".
  trust() {
    if (!loadConfig(dir).trust) return console.log('Earned trust is off in this repo (optional, ADR-0003). A human turns it on with "trust": true in .ai-sdlc/config.json; approvals are counted either way.')
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
  // knowledge/index.md and logs changes in knowledge/log.md; "for <file>..." lists the pages to read
  // before touching those files. "check" also reports files that are not Open Knowledge Format.
  knowledge() {
    const sub = feature
    if (sub === 'index') {
      const { lines, logged } = writeIndex(dir)
      return console.log(`Wrote knowledge/index.md (${lines} lines)${logged ? ` and ${logged} entries in knowledge/log.md` : ''}.`)
    }
    if (sub === 'for') {
      const found = relevant(dir, rest)
      return console.log(found.length ? found.map(p => `${p.file}: ${p.meta.description}`).join('\n') : 'No pages cover these files yet. Write one after you learn the area.')
    }
    if (sub !== 'check') fail('Usage: sdlc knowledge <check|index|for <file>...>')
    const { invalid, stale, count } = check(dir)
    console.log(`${count} pages, ${invalid.length} invalid, ${stale.length} stale.`)
    for (const s of stale) console.log(`STALE ${s.file}: ${s.why}`)
    const okf = conformance(dir)
    if (okf.files) console.log(`OKF: ${okf.files - okf.problems.length} of ${okf.files} files conform to Open Knowledge Format ${OKF_VERSION}.`)
    for (const p of okf.problems) console.log(`NOT OKF ${p}`)
    if (invalid.length) fail(invalid.map(i => `INVALID ${i}`).join('\n'))
  },

  // The API contract: start openapi.yaml from the template, lint it, list breaking changes against the
  // base branch, and put swagger.html beside it so it opens in Swagger UI.
  api() {
    const state = need()
    const folder = path.join(dir, loadConfig(dir).specsDir, feature)
    const created = !fs.existsSync(path.join(folder, 'openapi.yaml'))
    copyTemplate(dir, feature, 'openapi.yaml')
    // Rewrite the viewer each run with the current contract embedded, so it opens straight from disk.
    const yaml = fs.readFileSync(path.join(folder, 'openapi.yaml'), 'utf8').replace(/\r\n/g, '\n').replace(/<\/script/gi, '<\\/script')
    const viewer = fs.readFileSync(path.join(TEMPLATES, 'swagger.html'), 'utf8')
      .replace(/\/\*OPENAPI_YAML_START\*\/[\s\S]*?\/\*OPENAPI_YAML_END\*\//, () => `/*OPENAPI_YAML_START*/\n${yaml.trimEnd()}\n/*OPENAPI_YAML_END*/`)
    fs.writeFileSync(path.join(folder, 'swagger.html'), viewer)
    if (!(state.kinds ?? []).includes('api')) {
      state.kinds = [...(state.kinds ?? []), 'api']
      writeState(dir, state)
    }
    const problems = openapiProblems(fs.readFileSync(path.join(folder, 'openapi.yaml'), 'utf8'))
    const breaks = openapiBreaks(state)
    const where = path.relative(dir, folder).split(path.sep).join('/')
    if (created) console.log(`Started ${where}/openapi.yaml from the template: replace the example with this change's contract.`)
    for (const b of breaks) console.log(`BREAKING: ${b}`)
    console.log(`View it in Swagger: open ${where}/swagger.html (the contract is embedded; run "sdlc api ${feature}" again after editing openapi.yaml), or serve the folder to read the live file: npx --yes http-server ${where} -p 8080`)
    if (problems.length) fail(problems.map(p => `openapi.yaml: ${p}`).join('\n'))
    console.log(`openapi.yaml is well formed${breaks.length ? `; ${breaks.length} breaking change${breaks.length > 1 ? 's' : ''} to declare in plan.md` : ''}.`)
  },

  // The test matrix: each Gherkin criterion, its level, and the tests that name it.
  tests() {
    need()
    const m = matrix(dir, feature)
    const text = matrixText(m)
    fs.writeFileSync(path.join(dir, loadConfig(dir).specsDir, feature, 'test-matrix.md'), `# Test matrix: ${feature}\n\nGenerated by "sdlc tests". A test proves a criterion by naming its ID (AC-1) in its title.\n\n${text}\n`)
    console.log(text)
    if (m.problems.length) fail(`${m.problems.length} criteria are not tested at their level.`)
  },

  // Build the review packet (the shared map of the change) and start the findings ledger.
  review() {
    const state = need()
    onBranch(state)
    const folder = path.join(dir, loadConfig(dir).specsDir, feature)
    const p = packet(dir, state)
    const text = packetText(p)
    fs.writeFileSync(path.join(folder, 'review-packet.md'), text)
    state.lastPacketHead = p.head
    copyTemplate(dir, feature, 'review.md')
    // Remember the ids already in the ledger, so a row deleted before the gate is caught (finding F3).
    const ids = parseLedger(fs.readFileSync(path.join(folder, 'review.md'), 'utf8')).map(f => f.id)
    state.ledgerIds = [...new Set([...(state.ledgerIds ?? []), ...ids])]
    writeState(dir, state)
    console.log(text)
    console.log(`Wrote specs/${feature}/review-packet.md. Record every finding in specs/${feature}/review.md.`)
  },

  // Lint acceptance.feature against the PRD and print the scenario matrix (criterion, requirements, level).
  gherkin() {
    const state = need()
    const folder = path.join(dir, loadConfig(dir).specsDir, feature)
    const file = path.join(folder, 'acceptance.feature')
    if (!fs.existsSync(file)) fail(`No ${path.relative(dir, file)}. Copy the template: it is in the plugin's skills/org-ai-sdlc/templates/.`)
    const prd = path.join(folder, 'prd.md')
    const reqs = fs.existsSync(prd) ? requirementsFrom(fs.readFileSync(prd, 'utf8')) : []
    const { errors, warnings, scenarios } = lint(fs.readFileSync(file, 'utf8'), reqs.length ? reqs : null)
    for (const s of scenarios) console.log(`${s.ac ?? '(no AC)'}  ${s.level ?? '(no level)'}  ${s.requirements.join(',') || '(no R)'}  ${s.name}`)
    for (const w of warnings) console.log(`warning line ${w.line}: ${w.message}`)
    console.log(`${scenarios.length} scenarios, ${errors.length} errors, ${warnings.length} warnings${reqs.length ? `, PRD requirements ${reqs.join(', ')}` : ''}. Lane: ${state.lane}.`)
    if (errors.length) fail(errors.map(e => `error line ${e.line}: ${e.message}`).join('\n'))
  },

  // Mine this repo (and any others named with --repos a,b) into proposed plugin changes.
  // "sdlc retro [--since <days>] [--repos <paths>] [--json] [--write]"
  retro() {
    const args = [feature, ...rest].filter(Boolean)
    const opt = name => {
      const i = args.indexOf(`--${name}`)
      return i === -1 ? undefined : args[i + 1]
    }
    const days = Number(opt('since') ?? 30)
    const sinceMs = Date.now() - days * 864e5
    const repos = [dir, ...(opt('repos') ?? '').split(',').filter(Boolean).map(p => root(path.resolve(p)))]
    const result = analyze(repos.map(r => collect(r, sinceMs)))
    const triggers = readTriggers(dir)
    clearTriggers(dir)
    if (triggers.length && !args.includes('--json')) console.log(`Triggered by: ${triggers.map(t => t.reason).join('; ')}\n`)
    if (args.includes('--json')) return console.log(JSON.stringify(result, null, 2))
    const text = report(result)
    if (args.includes('--write')) {
      const file = path.join(dir, 'docs', 'retro', `${new Date().toISOString().slice(0, 10)}.md`)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, text)
      console.log(`Wrote ${path.relative(dir, file).split(path.sep).join('/')}`)
    }
    console.log(text)
  },

  // The four flow numbers: lead time, cycle time per stage, gate wait, rework.
  metrics() {
    for (const s of feature ? [need()] : listFeatures(dir)) {
      const cycle = Object.entries(s.stages).map(([n, t]) => `${STAGES[n].name} ${hours(t.enteredAt, t.leftAt)}h`).join(', ')
      const waits = Object.entries(s.gates).filter(([, g]) => g.approvedAt && g.requestedAt)
        .map(([n, g]) => `${n}:${hours(g.requestedAt, g.approvedAt)}h`).join(', ') || 'none yet'
      const rework = Object.values(s.retries).reduce((a, b) => a + b, 0) + Object.values(s.gates).filter(g => g.rejections).reduce((a, g) => a + g.rejections, 0)
      // Closed but not done: the outcome follow-up's age is a flow number of its own.
      const outcome = s.outcome ? `\n  outcome ${s.outcome.status} after ${hours(s.outcome.openedAt, s.outcome.closedAt)}h` : ''
      // Review convergence (ADR-0005): rounds the review refused, and work retired without shipping.
      const rounds = s.reviewRounds !== undefined ? `\n  review rounds ${s.reviewRounds}${s.riskTier ? ` (risk ${s.riskTier})` : ''}` : ''
      const closed = s.closedReason ? `\n  closed without shipping: ${s.closedReason}` : ''
      console.log(`${s.feature}\n  lead time ${hours(s.createdAt)}h\n  cycle ${cycle}\n  gate wait ${waits}\n  rework ${rework}${rounds}${outcome}${closed}`)
    }
  },

  // Open a blameless postmortem. Its actions re-enter the cycle as new PRDs or new checks.
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
    console.log(copied.length ? `Added:\n- ${copied.join('\n- ')}` : 'Nothing to add: every file already exists.')
    if (!git('rev-parse --is-inside-work-tree', dir)) console.log('Note: this folder is not a git repository.')
  },
}

// A person's own terminal, for when the chat hook is not there (issue #15). The same hook records the
// verb with the same checks and the same git user.name; the pre-tool guard refuses these to agents.
const HUMAN_VERBS = ['intent', 'autonomy', 'approve', 'reject', 'lane', 'hotfix', 'distrust', 'pause', 'resume', 'freeze', 'unfreeze', 'close']
if (HUMAN_VERBS.includes(cmd)) {
  const prompt = ['sdlc', cmd, feature, ...rest].filter(Boolean).join(' ')
  const hook = path.join(path.dirname(fileURLToPath(import.meta.url)), 'hooks', 'user-prompt.mjs')
  const r = spawnSync('node', [hook], { cwd: dir, input: JSON.stringify({ prompt, cwd: dir, session_id: 'terminal' }), encoding: 'utf8' })
  const said = r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext.replace(/^\[ai-sdlc\] /, '') : 'Nothing recorded.'
  if (/Nothing recorded|^Usage:/.test(said)) fail(said)
  console.log(said)
  process.exit(0)
}

if (!commands[cmd]) {
  fail(`Usage: sdlc <init|bug|task|kind|request|advance|gate|tests|proof|spike|review|gherkin|api|retry|status|outcome|trust|metrics|retro|incident|knowledge|init-repo> [feature] [...]\nA person, in their own terminal: sdlc <${HUMAN_VERBS.join('|')}> ...`)
}
commands[cmd]()
