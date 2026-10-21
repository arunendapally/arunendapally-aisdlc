// A Gherkin linter for acceptance.feature. Each scenario is one acceptance criterion and, later, one
// test. Errors block the Analyze gate; warnings are style advice. Every scenario carries its criterion
// (@AC-n), the requirement(s) it proves (@Rn, which must exist in the PRD) and one test level.
export const LEVELS = ['@unit', '@subsystem', '@api', '@e2e']
const STEP = /^(Given|When|Then|And|But|\*)\s+(.*)$/
const SCENARIO = /^(Scenario|Example|Scenario Outline|Scenario Template):\s*(.*)$/
const UI_MECHANICS = /\b(click(s|ed)?|tap(s|ped)?|press(es|ed)?|type(s|d)? .* into|fill(s|ed)? in|enter(s|ed)? .* into|button|dropdown|checkbox|scroll(s|ed)?|hover(s|ed)?|wait(s)? \d+|page (re)?loads?)\b/i
// Unmistakable selector syntax is an error: XPath ("//div[@id]") and data attributes ("[data-test=x]").
// "#id" and ".class" look like selectors but also like hashtags and file paths (".ai-sdlc/config.json",
// "#needs-triage"), so they only warn. Dogfood review findings F6 and the earlier CSS-words case.
const SELECTOR = /\/\/[a-z]+\[|\[data-[\w-]+/i
const MAYBE_SELECTOR = /(^|\s|["'`(])(#[a-z][\w-]*-[\w-]+|\.[a-z][\w]*-[\w-]+)(?=["'`)\s]|$)(?![\w./])/i
// A placeholder starts with a letter right after "<": "<item>", not "< 200 ms and >" (finding F7).
const PLACEHOLDER = /<([A-Za-z_][\w-]*(?: [\w-]+)*)>/g

// Requirement IDs (R1, R2, ...) from the PRD's "## Requirements" section, as bullets, numbered lines
// or table rows (finding F2: a table PRD used to switch coverage off).
export function requirementsFrom(prdText) {
  const m = prdText.replace(/<!--[\s\S]*?-->/g, '').match(/^## Requirements\s*$([\s\S]*?)(?=^#{1,2} |(?![\s\S]))/m)
  if (!m) return []
  return [...new Set([...m[1].matchAll(/^\s*(?:[-*]|\d+\.|\|)?\s*\**(R\d+)\b/gm)].map(x => x[1]))]
}

export function lint(text, requirements = null) {
  const errors = []
  const warnings = []
  const err = (line, message) => errors.push({ line, message })
  const warn = (line, message) => warnings.push({ line, message })
  const scenarios = []
  let featureTags = []
  let ruleTags = []
  let pending = []
  let feature = null
  let narrative = []
  let inNarrative = false
  let current = null // the scenario or background being read
  let inDoc = false
  let ruleOpen = false

  const close = () => {
    if (!current) return
    const c = current
    current = null
    if (c.kind === 'background') {
      if (c.steps.some(s => s.phase !== 'Given')) err(c.line, 'Background may only hold Given steps.')
      return
    }
    if (!c.steps.length) return err(c.line, `Scenario "${c.name}" has no steps.`)
    const whens = c.steps.filter(s => s.phase === 'When')
    if (whens.length === 0) err(c.line, `Scenario "${c.name}" has no When: say what the user or system does.`)
    if (whens.length > 1) err(whens[1].line, `Scenario "${c.name}" has ${whens.length} When steps. One behaviour per scenario: split it.`)
    if (!c.steps.some(s => s.phase === 'Then')) err(c.line, `Scenario "${c.name}" has no Then: say the observable outcome.`)
    const order = { Given: 0, When: 1, Then: 2 }
    for (let i = 1; i < c.steps.length; i++) {
      if (order[c.steps[i].phase] < order[c.steps[i - 1].phase]) err(c.steps[i].line, `${c.steps[i].phase} after ${c.steps[i - 1].phase}: keep Given, When, Then in that order.`)
    }
    if (c.steps.length > 10) warn(c.line, `Scenario "${c.name}" has ${c.steps.length} steps. Long scenarios hide the behaviour; move setup into Background or the step definitions.`)
    const tags = [...featureTags, ...c.ruleTags, ...c.tags]
    const acs = c.tags.filter(t => /^@AC-\d+$/i.test(t))
    if (acs.length !== 1) err(c.line, `Scenario "${c.name}" needs exactly one criterion tag like @AC-1 on the scenario itself.`)
    const reqs = [...new Set(tags.filter(t => /^@R\d+$/i.test(t)).map(t => t.slice(1).toUpperCase()))]
    if (!reqs.length) err(c.line, `Scenario "${c.name}" needs the requirement it proves, like @R1.`)
    if (requirements) for (const r of reqs.filter(r => !requirements.includes(r))) err(c.line, `Scenario "${c.name}" proves @${r}, which is not in the PRD's requirements.`)
    const levels = [...new Set(tags.filter(t => LEVELS.includes(t.toLowerCase())))]
    if (levels.length !== 1) err(c.line, `Scenario "${c.name}" needs exactly one test level: ${LEVELS.join(', ')}.`)
    const placeholders = [...new Set(c.steps.flatMap(s => [...s.text.matchAll(PLACEHOLDER)].map(m => m[1])))]
    if (c.isOutline) {
      if (!c.examples.length) err(c.line, `Scenario Outline "${c.name}" has no Examples table.`)
      for (const ex of c.examples) {
        if (ex.rows < 1) err(ex.line, `Examples for "${c.name}" has a header but no rows.`)
        for (const p of placeholders.filter(p => !ex.header.includes(p))) err(ex.line, `Examples for "${c.name}" has no column for <${p}>.`)
      }
      if (!placeholders.length) warn(c.line, `Scenario Outline "${c.name}" uses no <placeholders>; a plain Scenario is clearer.`)
    } else {
      if (placeholders.length) err(c.line, `Scenario "${c.name}" uses <${placeholders[0]}> but is not a Scenario Outline.`)
      if (c.examples.length) err(c.line, `Scenario "${c.name}" has Examples but is not a Scenario Outline.`)
    }
    scenarios.push({ name: c.name, line: c.line, ac: acs[0]?.toUpperCase() ?? null, requirements: reqs, level: levels[0]?.slice(1).toLowerCase() ?? null })
  }

  const lines = text.split(/\r?\n/)
  lines.forEach((raw, i) => {
    const n = i + 1
    const line = raw.trim()
    if (line.startsWith('"""') || line.startsWith('```')) return void (inDoc = !inDoc)
    if (inDoc || !line || line.startsWith('#')) return
    if (line.startsWith('@')) return void pending.push(...line.split(/\s+/).filter(Boolean))
    let m
    if ((m = line.match(/^Feature:\s*(.*)$/))) {
      if (feature) err(n, 'Only one Feature per file.')
      if (!m[1]) err(n, 'Feature needs a name.')
      feature = { name: m[1], line: n }
      featureTags = pending
      pending = []
      inNarrative = true
      return
    }
    if ((m = line.match(/^Rule:\s*(.*)$/))) {
      close()
      inNarrative = false
      ruleOpen = true
      ruleTags = pending
      pending = []
      return
    }
    if (/^Background:/.test(line)) {
      close()
      inNarrative = false
      current = { kind: 'background', line: n, steps: [] }
      pending = []
      return
    }
    if ((m = line.match(SCENARIO))) {
      close()
      inNarrative = false
      if (!m[2]) err(n, 'Scenario needs a name that says the behaviour.')
      if (scenarios.some(s => s.name === m[2])) err(n, `Two scenarios are named "${m[2]}".`)
      ruleOpen = false
      current = { kind: 'scenario', name: m[2], line: n, isOutline: /Outline|Template/.test(m[1]), tags: pending, ruleTags, steps: [], examples: [] }
      pending = []
      return
    }
    if (/^(Examples|Scenarios):/.test(line)) {
      if (!current || current.kind !== 'scenario') return void err(n, 'Examples outside a Scenario Outline.')
      current.examples.push({ line: n, header: null, rows: 0 })
      return
    }
    if (line.startsWith('|')) {
      const ex = current?.examples?.at(-1)
      if (ex && current.steps.length && ex.line > current.steps.at(-1).line) {
        const cells = line.split('|').slice(1, -1).map(c => c.trim())
        if (!ex.header) ex.header = cells
        else ex.rows++
      }
      return
    }
    if ((m = line.match(STEP))) {
      if (!current) return void err(n, `Step outside a Scenario: "${line}".`)
      let phase = m[1]
      if (['And', 'But', '*'].includes(phase)) {
        if (!current.steps.length) err(n, `A scenario cannot start with ${m[1]}.`)
        phase = current.steps.at(-1)?.phase ?? 'Given'
      }
      current.steps.push({ phase, text: m[2], line: n })
      if (SELECTOR.test(m[2])) err(n, `Step names a selector: "${m[2]}". Describe behaviour; selectors belong in step definitions.`)
      else if (MAYBE_SELECTOR.test(m[2])) warn(n, `Step may name a selector: "${m[2]}". If it is one, describe behaviour instead.`)
      else if (UI_MECHANICS.test(m[2])) warn(n, `Step describes UI mechanics: "${m[2]}". Say what the user achieves, not what they click.`)
      return
    }
    if (inNarrative) return void narrative.push(line)
    // Free-text description under Rule, Scenario or Examples, before their first step or row (finding F8).
    if ((current && !current.steps.length) || (!current && ruleOpen)) return
    err(n, `Not Gherkin: "${line}".`)
  })
  close()

  if (!feature) err(1, 'No "Feature:" line.')
  else {
    const story = narrative.join('\n')
    const missing = [['As a', /^As an? /im], ['I want', /^I want/im], ['So that', /^So that/im]].filter(([, re]) => !re.test(story)).map(([w]) => w)
    if (missing.length) err(feature.line, `Feature narrative is missing: ${missing.join(', ')}. Say who it is for, what they want, and why.`)
  }
  if (!scenarios.length && feature) err(feature.line, 'Feature has no scenarios.')
  const acCount = {}
  for (const s of scenarios.filter(s => s.ac)) acCount[s.ac] = (acCount[s.ac] ?? 0) + 1
  for (const [ac, count] of Object.entries(acCount)) if (count > 1) err(scenarios.find(s => s.ac === ac).line, `${ac} is used by ${count} scenarios; criterion IDs must be unique.`)
  if (requirements) {
    const covered = new Set(scenarios.flatMap(s => s.requirements))
    for (const r of requirements.filter(r => !covered.has(r))) err(feature?.line ?? 1, `${r} has no scenario. Every PRD requirement needs at least one.`)
  }
  return { errors: errors.sort((a, b) => a.line - b.line), warnings, scenarios }
}
