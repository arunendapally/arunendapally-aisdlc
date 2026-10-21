// Retro: read what the process recorded in one or more product repos and turn the patterns into
// proposed changes to the plugin itself. It proposes; a human approves the PR that applies them.
import fs from 'node:fs'
import path from 'node:path'
import { listFeatures, loadConfig, readTrust, promotable } from './lib.mjs'

export const STAGE_COMMAND = { 1: 'commands/plan.md', 2: 'commands/analyze.md', 3: 'commands/design.md', 4: 'commands/build.md', 5: 'commands/verify.md', 6: 'commands/release.md' }
const CHECKLIST = 'skills/ai-sdlc/standards/code-review-checklist.md'
const STOP = new Set(['about', 'after', 'again', 'also', 'because', 'before', 'being', 'does', 'from', 'have', 'into', 'just', 'missed', 'missing', 'more', 'needs', 'only', 'other', 'should', 'some', 'that', 'their', 'there', 'these', 'this', 'when', 'where', 'which', 'with', 'without', 'would', 'still', 'what', 'were', 'will', 'been', 'than', 'then', 'they', 'them', 'your'])

const median = xs => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0
}
const hoursBetween = (a, b) => (Date.parse(b) - Date.parse(a)) / 36e5

function readAudit(dir) {
  const file = path.join(dir, '.ai-sdlc', 'audit.jsonl')
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap(line => {
    try {
      return [JSON.parse(line)]
    } catch {
      return []
    }
  })
}

// Traps in the "### name / - **Guard now:** ..." format of standards/traps.md.
export function readTraps(dir) {
  const file = path.join(dir, 'standards', 'traps.md')
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').split(/^### /m).slice(1).map(block => {
    const name = block.split('\n')[0].trim()
    const guard = block.match(/\*\*Guard now:\*\*\s*(.*)/)?.[1]?.trim() ?? ''
    return { name, guard }
  })
}

// Everything one repo recorded, since a point in time.
export function collect(dir, sinceMs = 0) {
  const after = at => !at || Date.parse(at) >= sinceMs
  return {
    repo: dir,
    sla: loadConfig(dir).reviewSlaHours,
    cap: loadConfig(dir).retryCap,
    features: listFeatures(dir).filter(s => after(s.updatedAt ?? s.createdAt)),
    audit: readAudit(dir).filter(e => after(e.at)),
    traps: readTraps(dir),
    promotable: promotable(dir),
    trust: readTrust(dir),
  }
}

// Turn the evidence into ranked proposals. Each names the plugin file to change, what to change,
// the evidence, and how to prove the change helps.
export function analyze(evidence) {
  const proposals = []
  const add = p => proposals.push({ id: `R${proposals.length + 1}`, ...p })
  const repos = evidence.map(e => path.basename(e.repo)).join(', ')

  // 1. Rejections that share a theme at the same gate: the agents keep missing the same thing.
  const rejections = evidence.flatMap(e => {
    const fromAudit = e.audit.filter(a => a.event === 'reject').map(a => ({ feature: a.feature, stage: a.stage, reason: a.reason ?? '' }))
    const seen = new Set(fromAudit.map(r => `${r.feature}:${r.stage}:${r.reason}`))
    const fromState = e.features.flatMap(s => Object.entries(s.gates).filter(([, g]) => g.reason).map(([stage, g]) => ({ feature: s.feature, stage: Number(stage), reason: g.reason })))
      .filter(r => !seen.has(`${r.feature}:${r.stage}:${r.reason}`))
    return [...fromAudit, ...fromState]
  })
  const themes = {}
  for (const r of rejections) {
    for (const word of new Set(r.reason.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [])) {
      if (STOP.has(word)) continue
      const key = `${r.stage}:${word}`
      themes[key] = [...(themes[key] ?? []), r]
    }
  }
  const usedRejections = new Set()
  for (const [key, list] of Object.entries(themes).sort((a, b) => b[1].length - a[1].length)) {
    const fresh = list.filter(r => !usedRejections.has(r))
    if (fresh.length < 2) continue
    fresh.forEach(r => usedRejections.add(r))
    const [stage, word] = key.split(':')
    add({
      kind: 'rejection-theme', severity: fresh.length >= 3 ? 'high' : 'medium',
      title: `Gate ${stage} keeps rejecting work for "${word}"`,
      evidence: fresh.map(r => `${r.feature}: "${r.reason}"`),
      change: {
        target: Number(stage) >= 4 ? CHECKLIST : STAGE_COMMAND[stage],
        what: `Add an explicit check for "${word}" so agents catch it before the gate, and name the test or lint rule that enforces it.`,
      },
      verify: `Add a golden eval scenario where the artefact misses "${word}" and the gate must refuse it.`,
    })
  }

  // 2. Goals that escalated past the retry cap: the instructions for that step are not enough.
  const escalations = {}
  for (const e of evidence) {
    for (const s of e.features) {
      for (const [key, n] of Object.entries(s.retries ?? {})) {
        if (n > e.cap) escalations[key] = [...(escalations[key] ?? []), s.feature]
      }
    }
  }
  for (const [key, features] of Object.entries(escalations)) {
    const [stage, goal] = key.split(':')
    add({
      kind: 'escalation', severity: features.length >= 2 ? 'high' : 'medium',
      title: `Stage ${stage} goal "${goal}" escalates past the retry cap`,
      evidence: features.map(f => `${f}: escalated on "${goal}"`),
      change: { target: STAGE_COMMAND[stage], what: `Break "${goal}" into smaller checked steps, or give the agent the missing context that made it fail three times.` },
      verify: 'Run the agent eval for this stage before and after the change; the success rate must not drop.',
    })
  }

  // 3. Gates that wait past their deadline: the bottleneck the process exists to remove.
  const waits = {}
  for (const e of evidence) {
    for (const s of e.features) {
      for (const [stage, g] of Object.entries(s.gates)) {
        if (g.auto || !g.requestedAt || !g.approvedAt) continue
        const key = `${s.lane}:${stage}`
        waits[key] = { sla: e.sla[s.lane] ?? e.sla.full, hours: [...(waits[key]?.hours ?? []), hoursBetween(g.requestedAt, g.approvedAt)] }
      }
    }
  }
  for (const [key, w] of Object.entries(waits)) {
    const m = median(w.hours)
    if (m <= w.sla) continue
    add({
      kind: 'gate-wait', severity: m > 2 * w.sla ? 'high' : 'medium',
      title: `Gate ${key} waits a median ${m.toFixed(1)}h against a ${w.sla}h deadline`,
      evidence: [`${w.hours.length} approvals, median ${m.toFixed(1)}h, longest ${Math.max(...w.hours).toFixed(1)}h`],
      change: {
        target: 'agents/pre-reviewer.md',
        what: 'Shorten what the human must read: tighter "Look here first" pointers, a smaller PR limit for this lane, and a named backup reviewer in config.',
      },
      verify: 'Compare the median wait in the next retro; it must fall below the deadline.',
    })
  }

  // 4. Guards that fire again and again: either agents do not know the rule, or the guard is wrong.
  const friction = {}
  for (const e of evidence) {
    for (const a of e.audit.filter(a => a.event === 'pre-tool' && a.decision !== 'allow')) {
      const reason = (a.reason ?? '').replace(/^\[ai-sdlc\]\s*/, '').replace(/"[^"]*"/g, '"..."').slice(0, 90)
      friction[reason] = (friction[reason] ?? 0) + 1
    }
  }
  for (const [reason, n] of Object.entries(friction).filter(([, n]) => n >= 5)) {
    add({
      kind: 'guard-friction', severity: n >= 20 ? 'high' : 'low',
      title: `A guard fired ${n} times: ${reason.slice(0, 60)}`,
      evidence: [`${n} refusals or prompts: ${reason}`],
      change: {
        target: 'skills/org-ai-sdlc/SKILL.md',
        what: 'Tell agents the rule up front so they stop trying, or, if the refusals were wrong, narrow the guard in scripts/hooks/pre-tool.mjs with a test for the legitimate case.',
      },
      verify: 'The guard tests still pass, and the count falls in the next retro.',
    })
  }

  // 5. Bugs that escaped shipped work: the strongest signal there is.
  const escapes = {}
  for (const e of evidence) {
    for (const s of e.features.filter(s => s.escapes?.length)) escapes[s.lane] = [...(escapes[s.lane] ?? []), ...s.escapes.map(x => `${s.feature} -> bug ${x.bug}`)]
  }
  for (const [lane, list] of Object.entries(escapes)) {
    add({
      kind: 'escape', severity: 'high',
      title: `${list.length} bug${list.length > 1 ? 's' : ''} escaped work shipped in the ${lane} lane`,
      evidence: list,
      change: {
        target: lane === 'full' || lane === 'light' ? 'commands/verify.md' : `commands/${lane}.md`,
        what: 'Add the check that would have caught each escape (a test level, a pre-review item, a probe), and turn each root cause into a trap with an enforced guard.',
      },
      verify: 'Add one golden eval scenario per escape that must now be refused or caught.',
    })
  }

  // 6. Traps whose guard is only words: a rule in prose is a request.
  const weak = evidence.flatMap(e => e.traps.filter(t => !/\b(tests?|hooks?|lint|ci|ruleset|workflow|assert(ion)?s?)\b/i.test(t.guard)))
  if (weak.length) {
    add({
      kind: 'unenforced-trap', severity: weak.length >= 3 ? 'medium' : 'low',
      title: `${weak.length} trap${weak.length > 1 ? 's are' : ' is'} guarded only by prose or a checklist line`,
      evidence: weak.map(t => `${t.name}: "${t.guard || 'no guard'}"`),
      change: { target: 'scripts/hooks/pre-tool.mjs', what: 'Turn each into a hook rule, a CI check or a test, so it fails instead of being remembered.' },
      verify: 'Each new guard gets a test that fails when the guard is removed.',
    })
  }

  // 7. Gates that have earned more autonomy.
  const ready = evidence.flatMap(e => e.promotable)
  if (ready.length) {
    add({
      kind: 'autonomy', severity: 'low',
      title: `${ready.length} gate${ready.length > 1 ? 's have' : ' has'} earned promotion`,
      evidence: ready.map(p => `${p.key}: ${p.streak} clean approvals`),
      change: { target: '.ai-sdlc/config.json (per repo, human only)', what: 'A trust owner may type "sdlc trust <lane> <stage>" for each.' },
      verify: 'Watch for escapes from those gates in the next retro.',
    })
  }

  const rank = { high: 0, medium: 1, low: 2 }
  proposals.sort((a, b) => rank[a.severity] - rank[b.severity])
  proposals.forEach((p, i) => (p.id = `R${i + 1}`))
  return {
    repos,
    stats: {
      features: evidence.reduce((n, e) => n + e.features.length, 0),
      rejections: rejections.length,
      escalations: Object.values(escalations).flat().length,
      escapes: Object.values(escapes).flat().length,
      guardEvents: Object.values(friction).reduce((a, b) => a + b, 0),
      traps: evidence.reduce((n, e) => n + e.traps.length, 0),
    },
    proposals,
  }
}

export function report({ repos, stats, proposals }, date = new Date().toISOString().slice(0, 10)) {
  const lines = [
    `# Retro ${date}`,
    '',
    `Repos: ${repos}. Features: ${stats.features}, rejections: ${stats.rejections}, escalations: ${stats.escalations}, escapes: ${stats.escapes}, guard events: ${stats.guardEvents}, traps: ${stats.traps}.`,
    '',
    proposals.length ? '## Proposed changes to the plugin' : 'No proposals: nothing in the evidence repeats or slows the work.',
    '',
  ]
  for (const p of proposals) {
    lines.push(`### ${p.id} (${p.severity}) ${p.title}`, '', `- **Change:** \`${p.change.target}\`: ${p.change.what}`, `- **Prove it:** ${p.verify}`, '- **Evidence:**', ...p.evidence.map(e => `  - ${e}`), '')
  }
  return lines.join('\n')
}
