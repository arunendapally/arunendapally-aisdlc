// The design review board: every decision in the plan is cross-questioned by reviewers from other
// disciplines before the Design gate. The record (design-review.md) has one section per decision:
//   ## ADR-0003: <title>      (or "## Plan" when the plan records no ADRs)
//   | Q1 | reviewer | question | answer | resolved |
//   Verdict: accept | revise | reject
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig, section } from './lib.mjs'

export const MIN_REVIEWERS = 3

// An ADR worth reviewing names at least two options and admits its downsides.
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
  // A downside line counts unless it denies one ("No real cost.").
  const downside = (section(text, '## Consequences') ?? '').split('\n')
    .some(l => /(downside|negative|cost|risk|trade-?off|worse|lose|harder)/i.test(l) && !/\b(no|none|without|zero)\b[^.]*\b(downside|cost|risk|trade-?off)/i.test(l))
  if (!downside) problems.push(`${name} names no downside in Consequences; every decision costs something`)
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

export function parseBoard(text) {
  return text.split(/^## /m).slice(1).map(block => {
    const subject = block.split('\n')[0].trim()
    const id = subject.match(/^(ADR-\d{1,4}|Plan)\b/i)?.[1]
    const questions = block.split('\n').filter(l => /^\|\s*Q\d+\s*\|/.test(l)).map(l => {
      const [q, reviewer, question, answer, resolved] = l.split('|').slice(1, -1).map(c => c.trim())
      // "yes (residual: ...)" is resolved: reviewers note what risk remains (dogfood finding).
      return { q, reviewer: reviewer?.toLowerCase(), question, answer, resolved: /^(yes|resolved|y)\b/i.test(resolved ?? '') }
    })
    const verdict = block.match(/^Verdict:\s*(\w+)/im)?.[1]?.toLowerCase() ?? null
    return { subject, id: id ? (id.toUpperCase() === 'PLAN' ? 'Plan' : `ADR-${id.slice(4).padStart(4, '0')}`) : null, questions, verdict }
  })
}

export function boardProblems(dir, feature) {
  const folder = path.join(dir, loadConfig(dir).specsDir, feature)
  const plan = path.join(folder, 'plan.md')
  const decisions = fs.existsSync(plan) ? decisionsIn(fs.readFileSync(plan, 'utf8')) : []
  const problems = []
  for (const id of decisions) {
    const file = findAdr(dir, id)
    if (!file) problems.push(`plan.md names ${id}, but docs/adr/ has no file for it`)
    else problems.push(...adrProblems(fs.readFileSync(file, 'utf8'), id))
  }
  const boardFile = path.join(folder, 'design-review.md')
  if (!fs.existsSync(boardFile)) return [...problems, 'no design-review.md: the board has not cross-questioned the design (/ai-sdlc:design-review)']
  const board = parseBoard(fs.readFileSync(boardFile, 'utf8'))
  const subjects = decisions.length ? decisions : ['Plan']
  for (const id of subjects) {
    const entry = board.find(b => b.id === id)
    if (!entry) {
      problems.push(`the board has no section for ${id}`)
      continue
    }
    const reviewers = new Set(entry.questions.map(q => q.reviewer).filter(Boolean))
    if (reviewers.size < MIN_REVIEWERS) problems.push(`${id}: ${reviewers.size} reviewer${reviewers.size === 1 ? '' : 's'} questioned it; the board needs at least ${MIN_REVIEWERS} disciplines`)
    for (const q of entry.questions) {
      if (!q.answer) problems.push(`${id} ${q.q} (${q.reviewer}) has no answer`)
      else if (!q.resolved) problems.push(`${id} ${q.q} (${q.reviewer}) is answered but not resolved`)
    }
    if (entry.verdict !== 'accept') problems.push(`${id}: the board's verdict is ${entry.verdict ?? 'missing'}; the Design gate needs "Verdict: accept"`)
  }
  return problems
}
