// Code review support. Review is where agent speed meets human attention, so two things here:
// - packet(): a deterministic map of the change, so the agent reviewer and the human start from the
//   same facts: what changed, where the risk is, which criteria have no test, which lenses to run.
// - the findings ledger (review.md): every finding with a severity, a file:line, a checklist item, a
//   status and who found it. The gate refuses open blockers, majors and minors (a nit may stay); the
//   retro learns from what only humans found.
import fs from 'node:fs'
import path from 'node:path'
import { git, loadConfig, matches, changedFiles } from './lib.mjs'
import { matrix } from './testmatrix.mjs'

const TEST_FILE = /(^|\/)(tests?|__tests__|spec|e2e|cypress|playwright)\/|\.(test|spec|e2e)\.[a-z]+$|_test\.(go|py)$|(^|\/)test_[^/]+\.py$|\.postman_collection\.json$/i
const DEPENDENCY = /(^|\/)(package\.json|requirements[^/]*\.txt|pyproject\.toml|go\.mod|cargo\.toml|pom\.xml|build\.gradle[^/]*|gemfile|composer\.json)$/i
const SCHEMA = /(^|\/)migrations\/|\.sql$|schema\.prisma$/i
const PLATFORM = /^(\.github\/|infra\/|terraform\/|helm\/|k8s\/)|dockerfile$/i
const CONTRACT = /(^|\/)(openapi|swagger)[^/]*\.(ya?ml|json)$|\.proto$|(^|\/)schema\.graphql$/i
const LEFTOVER = /\b(debugger|TODO|FIXME|XXX)\b|\.only\(/
// Debug prints count as leftovers only where printing is not the program's job (not a CLI, script or test).
const DEBUG_PRINT = /\b(console\.log|print\(|fmt\.Println)/
const PRINTS_BY_DESIGN = /(^|\/)(scripts|bin|cli|tools)\//

export const SEVERITIES = ['blocker', 'major', 'minor', 'nit']
export const SOURCES = /^(pre-review|human|lens:[a-z-]+)$/

// Lines added per file on this branch, with their line numbers in the new file.
// Dependency names declared in a manifest, so the packet can name exactly what a change adds.
// null means the format is not understood here; the file still gets the generic dependency signal.
export function dependencyNames(file, text) {
  if (!text) return []
  const name = path.basename(file).toLowerCase()
  if (name === 'package.json') {
    try {
      const pkg = JSON.parse(text)
      return ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].flatMap(k => Object.keys(pkg[k] ?? {}))
    } catch {
      return null
    }
  }
  if (/^requirements[^/]*\.txt$/.test(name)) {
    return text.split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(l => l && !l.startsWith('-'))
      .map(l => l.split(/[<>=!~;\[\s]/)[0].toLowerCase())
  }
  if (name === 'go.mod') {
    return [...text.matchAll(/^\s*(?:require\s+)?([\w.-]+\.[\w./-]+)\s+v[\d.]+/gm)].map(m => m[1]).filter(m => !/^module\b/.test(m))
  }
  return null
}

// Changes that do more than the requirement asks: more code lines per acceptance criterion than this.
export const OVERSIZED_PER_CRITERION = 150

function addedLines(dir, base) {
  const out = {}
  let file = null
  let at = 0
  for (const line of git(`diff -U0 --no-color ${base}`, dir).split('\n')) {
    if (line.startsWith('+++ ')) file = line.slice(6)
    else if (line.startsWith('@@')) at = Number(line.match(/\+(\d+)/)?.[1] ?? 0)
    else if (line.startsWith('+') && file) (out[file] ??= []).push({ n: at++, text: line.slice(1) })
  }
  // New files not yet added are all added lines; git diff does not show them.
  for (const f of git('ls-files --others --exclude-standard', dir).split('\n').filter(Boolean)) {
    const full = path.join(dir, f)
    if (fs.statSync(full).size > 1e6) continue
    out[f] = fs.readFileSync(full, 'utf8').split('\n').map((text, i) => ({ n: i + 1, text }))
  }
  return out
}

export function packet(dir, state) {
  const cfg = loadConfig(dir)
  const base = cfg.protectedBranches.map(b => git(`merge-base ${b} HEAD`, dir)).find(Boolean)
  const allChanged = changedFiles(dir, cfg)
  const planChanged = allChanged.some(f => f.file === `${cfg.specsDir}/${state.feature}/plan.md`)
  const files = allChanged.filter(f => !f.file.startsWith('.ai-sdlc/') && (!f.file.startsWith(`${cfg.specsDir}/`) || CONTRACT.test(f.file)))
  const added = base ? addedLines(dir, base) : {}
  const tests = files.filter(f => TEST_FILE.test(f.file))
  const code = files.filter(f => !TEST_FILE.test(f.file) && !/\.md$/i.test(f.file))
  const deletedTests = git(`diff --name-only --diff-filter=D ${base ?? 'HEAD'}`, dir).split('\n').filter(f => f && TEST_FILE.test(f))

  // A code file counts as tested when a changed test file is named after it or mentions it.
  const testTexts = tests.map(t => {
    const full = path.join(dir, t.file)
    return fs.existsSync(full) && fs.statSync(full).size < 2e6 ? `${t.file}\n${fs.readFileSync(full, 'utf8')}` : t.file
  }).join('\n')
  const rows = files.map(f => {
    const signals = []
    if (matches(f.file, cfg.highRiskPaths)) signals.push('high-risk path')
    if (DEPENDENCY.test(f.file)) signals.push('dependency change')
    if (SCHEMA.test(f.file)) signals.push('schema or data change')
    if (SCHEMA.test(f.file) && !planChanged) signals.push('schema changed but the plan and its ER diagram did not')
    if (CONTRACT.test(f.file)) signals.push('API contract change')
    if (PLATFORM.test(f.file)) signals.push('CI or infrastructure')
    const stem = path.basename(f.file).replace(/\.[^.]+$/, '')
    const isCode = !TEST_FILE.test(f.file) && !/\.(md|json|ya?ml|txt|feature)$/i.test(f.file)
    if (isCode && !new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(testTexts)) signals.push('no changed test mentions it')
    if (f.lines > 150) signals.push(`large change (${f.lines} lines)`)
    const printsOk = PRINTS_BY_DESIGN.test(f.file) || TEST_FILE.test(f.file)
    const leftovers = (added[f.file] ?? []).filter(l => LEFTOVER.test(l.text) || (!printsOk && DEBUG_PRINT.test(l.text)))
    if (leftovers.length) signals.push(`${leftovers.length} leftover${leftovers.length > 1 ? 's' : ''} (${leftovers.slice(0, 3).map(l => `line ${l.n}: ${l.text.trim().slice(0, 40)}`).join('; ')}${leftovers.length > 3 ? '; ...' : ''})`)
    const weight = { 'high-risk path': 5, 'schema or data change': 5, 'dependency change': 3, 'CI or infrastructure': 4, 'no changed test mentions it': 2 }
    const score = signals.reduce((s, x) => s + (weight[x] ?? 1), 0) + Math.min(5, Math.floor(f.lines / 50))
    return { file: f.file, lines: f.lines, signals, score }
  }).sort((a, b) => b.score - a.score)

  // Acceptance criteria with no test at their level, scoped to this feature (finding F1).
  const traceRows = matrix(dir, state.feature).rows
  const untested = traceRows.filter(r => !r.traced)

  const all = rows.flatMap(r => r.signals)
  // Simplicity: what new dependencies this change adds, and whether it is large for what it delivers.
  const newDeps = files.filter(f => DEPENDENCY.test(f.file)).flatMap(f => {
    const now = fs.existsSync(path.join(dir, f.file)) ? fs.readFileSync(path.join(dir, f.file), 'utf8') : ''
    const before = base ? git(`show ${base}:${f.file}`, dir) : ''
    const after = dependencyNames(f.file, now)
    if (after === null) return []
    const had = new Set(dependencyNames(f.file, before) ?? [])
    return after.filter(d => !had.has(d)).map(d => ({ manifest: f.file, name: d }))
  })
  for (const r of rows) {
    const mine = newDeps.filter(d => d.manifest === r.file).map(d => d.name)
    if (mine.length) {
      r.signals.push(`new dependenc${mine.length > 1 ? 'ies' : 'y'}: ${mine.join(', ')}`)
      r.score += 3
    }
  }
  rows.sort((a, b) => b.score - a.score)
  const codeLines = files.filter(f => !TEST_FILE.test(f.file) && !/\.(md|json|ya?ml|txt|feature|lock)$/i.test(f.file)).reduce((n, f) => n + f.lines, 0)
  const criteria = traceRows.length
  const oversized = criteria && codeLines / criteria > OVERSIZED_PER_CRITERION
    ? { codeLines, criteria, perCriterion: Math.round(codeLines / criteria) } : null

  const lenses = ['correctness against the spec (pre-reviewer)', 'simplicity: the ladder, checklist G (pre-reviewer)', 'test quality (qa-engineer)']
  if (all.some(s => /high-risk|dependency|CI or infra/.test(s))) lenses.push('security (safe-ai-sdlc-expert)')
  if (all.includes('schema or data change')) lenses.push('data (dba)')
  if (all.includes('API contract change')) lenses.push('API contract, compatibility and consumers (architect)')
  if ((state.kinds ?? []).includes('perf')) lenses.push('performance (performance-engineer)')
  if (all.includes('CI or infrastructure')) lenses.push('operability (sre)')

  // Re-review only what is new (ADR-0005): the files changed since the last packet was built.
  const last = state.lastPacketHead && git(`cat-file -t ${state.lastPacketHead}`, dir) === 'commit' ? state.lastPacketHead : null
  const sinceLast = last ? git(`diff --name-only ${last}`, dir).split('\n').filter(f => f && !f.startsWith(`${cfg.specsDir}/`)) : null

  return { feature: state.feature, lane: state.lane, head: git('rev-parse --short HEAD', dir), files: rows, code: code.length, tests: tests.length, deletedTests, untested, lenses, newDeps, oversized, codeLines, criteria, last, sinceLast }
}

export function packetText(p) {
  const lines = [
    `<!-- built at ${p.head} -->`,
    `# Review packet: ${p.feature} (${p.lane} lane)`,
    '',
    `${p.files.length} files changed: ${p.code} code, ${p.tests} test. Generated by "sdlc review"; read it before the diff.`,
    '',
    ...(p.sinceLast ? [
      `## Changed since the last review (${p.last.slice(0, 7)})`,
      '',
      'Re-review only these. Do not repeat a finding already in review.md; if a fixed bug has siblings, flag the class once.',
      '',
      ...(p.sinceLast.length ? p.sinceLast.map(f => `- \`${f}\``) : ['- Nothing outside the specs.']),
      '',
    ] : []),
    '## Look here first',
    '',
    ...(p.files.filter(f => f.signals.length).slice(0, 5).map(f => `- \`${f.file}\` (${f.lines} lines): ${f.signals.join('; ')}`)),
    ...(p.files.some(f => f.signals.length) ? [] : ['- No risk signals. Review against the spec and the checklist.']),
    '',
    '## Simplicity',
    '',
    ...(p.newDeps.length
      ? p.newDeps.map(d => `- New dependency \`${d.name}\` in \`${d.manifest}\`: check the ladder first (needed now? standard library, platform, a dependency or helper already here, a one-liner).`)
      : ['- No new dependencies.']),
    p.oversized
      ? `- OVERSIZED: ${p.oversized.codeLines} code lines for ${p.oversized.criteria} acceptance criteria (${p.oversized.perCriterion} per criterion, more than ${OVERSIZED_PER_CRITERION}). Look for speculative options, abstractions and hand-rolled code.`
      : `- ${p.codeLines} code lines${p.criteria ? ` for ${p.criteria} acceptance criteria` : ''}.`,
    '',
    '## Lenses to run',
    '',
    ...p.lenses.map(l => `- ${l}`),
    '',
    '## Criteria with no test',
    '',
    ...(p.untested.length ? p.untested.map(s => `- ${s.ac} (${s.level}): ${s.name}`) : ['- None: every criterion in acceptance.feature is tested at its level.']),
    '',
    ...(p.deletedTests.length ? ['## Deleted tests', '', ...p.deletedTests.map(f => `- \`${f}\`: say why in the PR, or restore it`), ''] : []),
    '## All files',
    '',
    '| File | Lines | Signals |',
    '|---|---|---|',
    ...p.files.map(f => `| \`${f.file}\` | ${f.lines} | ${f.signals.join('; ') || ' '} |`),
    '',
  ]
  return lines.join('\n')
}

// The ledger is a Markdown table: | ID | Severity | Location | Checklist | Finding | Status | Source |
// IDs are F1, F2 ... for agent findings and H1, H2 ... for human ones, so two reviewers adding rows at
// once do not collide (design review ADR-0001 Q10). Rows that are neither a finding nor the header are
// returned as malformed, so a mistyped ID cannot hide an open blocker from the gate (Q2).
export function parseLedger(text) {
  const findings = []
  const malformed = []
  for (const [i, l] of text.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, '')).split(/\r?\n/).entries()) {
    if (!/^\s*\|/.test(l) || /^\s*\|\s*ID\s*\|/i.test(l) || /^\s*\|[\s|:-]+\|\s*$/.test(l)) continue
    const cells = l.split('|').slice(1, -1).map(c => c.trim())
    if (!/^[FH]\d+$/.test(cells[0] ?? '') || cells.length !== 7) {
      malformed.push(`line ${i + 1}: a finding row needs 7 cells and an ID like F1 (agents) or H1 (humans): "${l.trim().slice(0, 60)}"`)
      continue
    }
    const [id, severity, location, checklist, finding, status, source] = cells
    findings.push({ id, severity: severity.toLowerCase(), location: location.replace(/`/g, ''), checklist, finding, status, source: source.toLowerCase() })
  }
  return Object.assign(findings, { malformed })
}

// seenIds: every ID the gate has seen before. A finding is closed by fixing or explaining it, never by
// deleting its row (Q6). "fixed" names the commit that fixed it (Q4); a fixed row may point at a file
// the fix removed (Q3). Only a high-risk change must show that commit touches the file (ADR-0003).
export function ledgerProblems(dir, findings, seenIds = [], { strictFixes = true } = {}) {
  const problems = [...(findings.malformed ?? [])]
  const seen = new Set()
  // A new row about the same file and checklist item as one already closed is a repeat (ADR-0005): the
  // reviewer reopens that row or flags the class of bug once, rather than posting it again.
  const fileOf = f => f.location?.split(':')[0]
  const closed = findings.filter(f => seenIds.includes(f.id) && /^(fixed|wontfix)/i.test(f.status))
  for (const f of findings.filter(f => !seenIds.includes(f.id))) {
    const twin = closed.find(c => fileOf(c) === fileOf(f) && c.checklist === f.checklist)
    if (twin) problems.push(`${f.id} repeats ${twin.id} (${fileOf(f)}, item ${f.checklist}), which is already closed: reopen ${twin.id} or name the class of bug once`)
  }
  for (const f of findings) {
    if (seen.has(f.id)) problems.push(`${f.id} is used twice`)
    seen.add(f.id)
    if (!SEVERITIES.includes(f.severity)) problems.push(`${f.id}: severity must be one of ${SEVERITIES.join(', ')}`)
    const status = f.status.toLowerCase()
    const loc = f.location?.match(/^([^:\s]+):(\d+)/)
    if (!loc) problems.push(`${f.id}: location must be file:line`)
    else if (!status.startsWith('fixed') && !fs.existsSync(path.join(dir, loc[1]))) problems.push(`${f.id}: ${loc[1]} does not exist`)
    if (!f.finding) problems.push(`${f.id}: says nothing`)
    if (!SOURCES.test(f.source ?? '')) problems.push(`${f.id}: source must be pre-review, human or lens:<name>`)
    if (f.id.startsWith('H') !== (f.source === 'human')) problems.push(`${f.id}: H ids are for human findings and F ids for agent findings`)
    if (status.startsWith('open') && ['blocker', 'major', 'minor'].includes(f.severity)) problems.push(`${f.id} (${f.severity}) is still open`)
    if (status.startsWith('wontfix') && !/wontfix:\s*\S/.test(status)) problems.push(`${f.id}: a wontfix needs a reason ("wontfix: ...")`)
    if (status.startsWith('wontfix') && f.severity === 'blocker') problems.push(`${f.id}: a blocker cannot be wontfix`)
    if (status.startsWith('fixed')) {
      const sha = status.match(/^fixed:?\s*([0-9a-f]{4,40})\b/)?.[1]
      if (!sha) problems.push(`${f.id}: "fixed" must name the commit that fixed it ("fixed: <sha>")`)
      else if (git(`cat-file -t ${sha}`, dir) !== 'commit') problems.push(`${f.id}: ${sha} is not a commit in this repo`)
      // The fixing commit must touch the file the finding is about (finding F3: any old commit passed).
      else if (strictFixes && loc && !git(`diff-tree --no-commit-id --name-only -r ${sha}`, dir).split('\n').includes(loc[1])) problems.push(`${f.id}: commit ${sha} does not change ${loc[1]}`)
    }
    if (!/^(open|fixed|wontfix)/.test(status)) problems.push(`${f.id}: status must be open, fixed: <sha> or wontfix: <reason>`)
  }
  for (const id of seenIds.filter(id => !seen.has(id))) problems.push(`${id} was removed from the ledger; mark it fixed or wontfix instead`)
  return problems
}

// What only humans caught: the pre-review's misses, and the retro's best review evidence.
export function humanCatches(findings) {
  return findings.filter(f => f.source === 'human' && ['blocker', 'major'].includes(f.severity))
}
