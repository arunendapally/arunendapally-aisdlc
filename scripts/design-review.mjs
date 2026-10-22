// Design review: every ADR the plan names is a real decision, cross-questioned before the Design gate.
// The questions and their answers live in the ADR's own "## Review" section, so there is no separate
// board record (ADR-0003). A plan that names no ADR has nothing for the board to question.
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig, section } from './lib.mjs'

// An ADR worth reviewing has its sections, a status and at least two options.
export function adrProblems(text, name) {
  const problems = []
  for (const h of ['## Context', '## Options', '## Decision', '## Consequences']) {
    const body = section(text, h)
    if (body === null) problems.push(`${name} has no "${h}" section`)
    else if (!body) problems.push(`${name} section "${h}" is empty`)
  }
  if (!/^Status:\s*(proposed|accepted|superseded)/im.test(text)) problems.push(`${name} has no "Status: proposed|accepted|superseded" line`)
  // Only top-level bullets or ### headings are options; a sub-bullet is a pro or con (finding F4).
  const options = (section(text, '## Options') ?? '').split('\n').filter(l => /^(###\s+|[-*]\s+|\d+\.\s+)\S/.test(l))
  if (options.length < 2) problems.push(`${name} weighs ${options.length} option${options.length === 1 ? '' : 's'}; a decision needs at least two`)
  return problems
}

// The decisions a plan makes: ADR ids it names in "## Decisions".
export function decisionsIn(planText) {
  return [...new Set([...(section(planText, '## Decisions') ?? '').matchAll(/\bADR-(\d{1,4})\b/gi)].map(m => `ADR-${m[1].padStart(4, '0')}`))]
}

function findAdr(dir, id) {
  const folder = path.join(dir, 'docs', 'adr')
  if (!fs.existsSync(folder)) return null
  const num = id.slice(4)
  const file = fs.readdirSync(folder).find(f => f.startsWith(num) || f.toUpperCase().startsWith(id))
  return file ? path.join(folder, file) : null
}

export function boardProblems(dir, feature) {
  const plan = path.join(dir, loadConfig(dir).specsDir, feature, 'plan.md')
  const decisions = fs.existsSync(plan) ? decisionsIn(fs.readFileSync(plan, 'utf8')) : []
  const problems = []
  for (const id of decisions) {
    const file = findAdr(dir, id)
    if (!file) {
      problems.push(`plan.md names ${id}, but docs/adr/ has no file for it`)
      continue
    }
    const text = fs.readFileSync(file, 'utf8')
    problems.push(...adrProblems(text, id))
    if (!section(text, '## Review')) problems.push(`${id} has no "## Review": record who questioned it, what they asked and the answers (/ai-sdlc:design)`)
  }
  return problems
}
