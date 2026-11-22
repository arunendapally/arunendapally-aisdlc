// The requirements index (trace-index): each requirement of a capability, named "<feature>/R<n>", with its
// scenarios, tests, decisions and ADRs, read from the files on demand and written nowhere (PRD A2).
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig, slicesOf, decisionsOf } from './lib.mjs'
import { requirementsFrom } from './gherkin.mjs'
import { matrix } from './testmatrix.mjs'

const read = file => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '')
// The R ids a Changes cell names for a feature: "save-list R1", "save-list/R1", "R1, R4", "R1 to R5", "R2-R4".
const idsIn = (changes, slug) => [...changes.matchAll(new RegExp(`(?<![\\w-])${slug}[ /](R\\d+(?:\\s*(?:,|and|to|-)\\s*R?\\d+)*)`, 'g'))]
  .flatMap(([, list]) => [...list.matchAll(/R?(\d+)(?:\s*(?:to|-)\s*R?(\d+))?/g)].flatMap(([, a, b]) => Array.from({ length: (b ?? a) - a + 1 }, (_, i) => `R${+a + i}`)))

export function trace(dir, capability) {
  const specs = path.join(dir, loadConfig(dir).specsDir)
  const decisions = decisionsOf(read(path.join(specs, capability, 'architecture-overview.md')))
  const adrDir = path.join(dir, 'docs', 'adr')
  const adrs = (fs.existsSync(adrDir) ? fs.readdirSync(adrDir) : []).filter(f => f.endsWith('.md'))
    .map(f => ({ file: `docs/adr/${f}`, text: read(path.join(adrDir, f)) }))
  return slicesOf(read(path.join(specs, capability, 'slices.md'))).flatMap(({ slug }) => {
    const rows = matrix(dir, slug).rows
    return requirementsFrom(read(path.join(specs, slug, 'prd.md'))).map(r => {
      const id = `${slug}/${r}`
      const mine = rows.filter(row => row.requirements.includes(r))
      return {
        id,
        scenarios: mine.map(row => row.ac),
        tests: [...new Set(mine.flatMap(row => row.tests.map(t => t.replace(/ \(\w+\)$/, ''))))],
        decisions: decisions.filter(d => idsIn(d.changes ?? '', slug).includes(r)).map(d => `decision:${d.date} ${d.decision}`),
        adrs: adrs.filter(a => new RegExp(`(?<![\\w-])${id}\\b`).test(a.text)).map(a => a.file),
      }
    })
  })
}

export const traceText = reqs => reqs.map(q => `${q.id}  scenarios: ${q.scenarios.join(', ') || 'no scenario'}  tests: ${q.tests.join(', ') || 'no test'}` +
  `  decisions: ${q.decisions.map(d => d.slice(9)).join('; ') || 'none'}  ADRs: ${q.adrs.join(', ') || 'none'}`).join('\n')

// R3: every capability's index read backwards, for a test file, an ADR or "decision:<date> <text>".
export function traceBack(dir, ref) {
  const specs = path.join(dir, loadConfig(dir).specsDir)
  const caps = fs.readdirSync(specs).filter(c => fs.existsSync(path.join(specs, c, 'slices.md')))
  return caps.flatMap(c => trace(dir, c)).filter(q => [...q.tests, ...q.adrs, ...q.decisions].includes(ref)).map(q => q.id)
}
