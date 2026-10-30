// System facts: what is true about the current system, each fact pinned to the code that shows it.
//   - F1: Orders are soft-deleted (deleted_at), never removed. Source: src/orders/repo.ts:42. Verified: 1a2b3c4.
// A fact whose source no longer exists, or changed since it was verified, is stale. Requirements cite
// facts by id (F1), so a requirement resting on a stale or missing fact is caught at the Plan gate.
// The PRD's assumptions are the other side: what we believe but have not pinned to code or a person.
import fs from 'node:fs'
import path from 'node:path'
import { git, loadConfig, section, matches } from './lib.mjs'

// Sources that describe the system without being it.
const NOT_IMPLEMENTATION = ['docs/**', '**/*.md', '**/*.sql', '**/schema.prisma', '**/*.schema.json', '**/*.graphql', '**/*.yaml', '**/*.yml', '**/*.json', '**/migrations/**']

const FACT = /^\s*[-*]\s*(F\d+):\s*(.+?)\s*Source:\s*([^\s:]+):(\d+)(?:-(\d+))?\.?\s*Verified:\s*([0-9a-f]{4,40})\.?\s*$/i

export function parseFacts(text) {
  const facts = []
  const malformed = []
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    // Anything that starts like a fact ("- F1:", "- **F1.", "* F2 ") is one; say so if its shape is off.
    if (!/^\s*[-*]\s*(\*\*|__)?F\d+\b/i.test(line)) continue
    const m = line.match(FACT)
    if (!m) malformed.push(`line ${i + 1} looks like a fact but is not in the expected shape: "- F<n>: <statement>. Source: <path:line>. Verified: <commit>." (see the comment at the top of the facts.md template)`)
    else facts.push({ id: m[1].toUpperCase(), statement: m[2].replace(/\.$/, ''), file: m[3], line: Number(m[4]), end: Number(m[5] ?? m[4]), verified: m[6] })
  }
  return { facts, malformed }
}

export function factProblems(dir, facts) {
  const problems = []
  const ids = new Set()
  for (const f of facts) {
    if (ids.has(f.id)) problems.push(`${f.id} is defined twice`)
    ids.add(f.id)
    const full = path.join(dir, f.file)
    if (!fs.existsSync(full)) {
      problems.push(`${f.id}: ${f.file} does not exist`)
      continue
    }
    const length = fs.readFileSync(full, 'utf8').split('\n').length
    if (f.end > length) problems.push(`${f.id}: ${f.file} has ${length} lines, so line ${f.end} cannot be the source`)
    if (git(`cat-file -t ${f.verified}`, dir) !== 'commit') problems.push(`${f.id}: ${f.verified} is not a commit in this repo`)
    else if (git(`diff --name-only ${f.verified} -- "${f.file}"`, dir)) problems.push(`${f.id} is stale: ${f.file} changed since ${f.verified}; re-read it and re-verify`)
  }
  return problems
}

// Fact ids cited anywhere in a text (requirements, data needs, the spec).
export const citedFacts = text => [...new Set([...text.matchAll(/\b(F\d+)\b/g)].map(m => m[1].toUpperCase()))]

// The Plan gate, for brownfield and data work: facts.md exists, every fact is well formed, current and
// pinned to real code, and every fact the PRD cites is defined. Brownfield work needs at least one fact.
export function factsGateProblems(dir, state) {
  const folder = path.join(dir, loadConfig(dir).specsDir, state.feature)
  const file = path.join(folder, 'facts.md')
  if (!fs.existsSync(file)) return ['facts.md does not exist: pin what is true about the current system to the code (or write "None, because ..." for greenfield)']
  const text = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const { facts, malformed } = parseFacts(text)
  const problems = [...malformed.map(m => `facts.md ${m}`), ...factProblems(dir, facts).map(p => `facts.md: ${p}`)]
  // A malformed fact explains a missing one; do not report the same cause three ways.
  if (!facts.length && !malformed.length && !/None, because\s+\S/i.test(text)) problems.push('facts.md has no facts: write each as "- F<n>: <statement>. Source: <path:line>. Verified: <commit>." under "## Facts", or "None, because ..." if there is truly no current system')
  if ((state.kinds ?? []).includes('brownfield') && !facts.length && !malformed.length) problems.push('brownfield work needs at least one fact about the current system')
  // Read what governs before designing against it (ADR-0004, failure F2): one fact is the implementation
  // the design must follow, pinned to code rather than to a document, a schema or a spec.
  const changesWhatExists = ['brownfield', 'data'].some(k => (state.kinds ?? []).includes(k))
  if (changesWhatExists && facts.length && !facts.some(f => /\[governing\]/i.test(f.statement) && !matches(f.file, NOT_IMPLEMENTATION))) {
    problems.push('facts.md has no "[governing]" fact pinned to implementation code: read the code that governs this behaviour first, then mark that fact "[governing]" (a document, schema or spec does not count)')
  }
  const defined = new Set(facts.map(f => f.id))
  for (const name of ['prd.md']) {
    const p = path.join(folder, name)
    if (!fs.existsSync(p)) continue
    if (malformed.length) continue
    for (const id of citedFacts(fs.readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, ''))) if (!defined.has(id)) problems.push(`${name} cites ${id}, which facts.md does not define`)
  }
  return problems
}

// The Plan gate: every assumption is marked confirmed or unconfirmed, and the questions asked have answers.
export function assumptionProblems(prdText) {
  const problems = []
  const assumptions = (section(prdText, '## Assumptions') ?? '').split('\n').filter(l => /^\s*[-*]\s*A\d+/i.test(l))
  // The tag may name its evidence: [confirmed], [confirmed: src/a.ts:3], [confirmed, code].
  for (const a of assumptions) if (!/\[(confirmed|unconfirmed)(\s*[:,][^\]]*)?\]/i.test(a)) problems.push(`assumption "${a.trim().slice(0, 50)}" is not marked: end it with [confirmed] or [unconfirmed], optionally with evidence, for example [confirmed: src/a.ts:3]`)
  const asked = section(prdText, '## Questions asked') ?? ''
  for (const q of asked.split('\n').filter(l => /^\s*[-*]\s*Q\d+/i.test(l))) {
    if (!/\bA:\s*\S/.test(q) && !/unanswered/i.test(q)) problems.push(`question "${q.trim().slice(0, 50)}" has no "A: ..." and is not marked unanswered`)
  }
  const unconfirmed = assumptions.filter(a => /\[unconfirmed(\s*[:,][^\]]*)?\]/i.test(a)).map(a => a.match(/A\d+/i)[0].toUpperCase())
  const open = section(prdText, '## Open questions') ?? ''
  for (const id of unconfirmed) if (!new RegExp(`\\b${id}\\b`, 'i').test(open)) problems.push(`${id} is unconfirmed, so it must appear in Open questions with who can confirm it`)
  return problems
}
