// SessionStart: every session cold-starts from the repo, so tell it where the work stands.
import { STAGES, root, isPaused, isFrozen, listFeatures, stageSpec, overdueGates, overduePostmortems, promotable, readStdin, lessonsOwed } from '../lib.mjs'
import { check } from '../knowledge.mjs'
import { overdueOutcomes } from '../loop.mjs'

const dir = root(readStdin().cwd)
const lines = ['[ai-sdlc] This repo runs the org AI SDLC. Process: the org-ai-sdlc skill. Humans own every gate.']
if (isPaused(dir)) lines.push('AGENTS ARE PAUSED by a human. Do not write or run anything until a human types "sdlc resume".')
if (isFrozen(dir)) lines.push('The error budget is spent: no new full or light features (sdlc init is refused); bug, hotfix and reliability work comes first.')
for (const s of listFeatures(dir).filter(s => !s.closedAt)) {
  const gate = s.gates[s.stage]?.status ?? 'not requested'
  lines.push(`- ${s.feature}: stage ${s.stage} ${STAGES[s.stage].name}, ${s.lane} lane, branch ${s.branch}, gate ${gate} (owner: ${stageSpec(s).owner})`)
}
for (const o of overdueGates(dir)) lines.push(`OVERDUE: ${o.feature} gate ${o.stage} has waited ${o.hours}h (deadline ${o.limit}h) on ${o.owner}. Tell the human and suggest a backup reviewer.`)
for (const s of overduePostmortems(dir)) lines.push(`POSTMORTEM OVERDUE: hotfix ${s.feature} shipped without one. Run /ai-sdlc:incident ${s.feature}.`)
for (const s of overdueOutcomes(dir)) lines.push(`OUTCOME OVERDUE: ${s.feature} shipped and "${s.outcome.metric}" was due to be read by ${s.outcome.due.slice(0, 10)} (owner: ${s.outcome.owner}). Ask them, then record it: sdlc outcome ${s.feature} met|missed|breach.`)
for (const s of lessonsOwed(dir)) lines.push(`LESSON OWED: ${s.feature} (${s.lane}) needs a trap in standards/traps.md with "- **Source:** ${s.feature}" and a guard that is a check.`)
const kb = check(dir)
if (kb.count) {
  lines.push(`Knowledge: ${kb.count} pages in knowledge/ (index: knowledge/INDEX.md), ${kb.stale.length} stale. Before changing an area, run "sdlc.mjs knowledge for <files>" and read what it lists. After learning something durable, write or update a page.`)
} else {
  lines.push('Knowledge: knowledge/ is empty. As you learn this codebase, write pages there (see the knowledge template) so the next session starts knowing it.')
}
for (const p of promotable(dir)) lines.push(`AUTONOMY: gate ${p.key} has ${p.streak} clean approvals in a row. Tell the human they can promote it with "sdlc trust ${p.key.replace(':', ' ')}".`)
lines.push('Gates are approved only by a human typing "sdlc approve <feature> <stage>". Never claim a gate is passed.')
console.log(lines.join('\n'))
