// Issue #25: take a GitHub Spec Kit spec.md as the start of the Plan gate, instead of competing with it.
// It reads what Spec Kit states (functional requirements FR-n, acceptance scenarios, success criteria
// SC-n, assumptions, [NEEDS CLARIFICATION] markers) and writes them in this plugin's shape, keeping each
// Spec Kit id beside ours. What Spec Kit does not say (which requirement a scenario proves, the
// non-functional needs, the person's intent) is left for the product owner, and the Plan gate names it.

const strip = s => s.replace(/\*\*/g, '').trim()

export function parseSpecKit(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const title = strip(lines.find(l => /^#\s+/.test(l)) ?? '').replace(/^#\s*/, '').replace(/^Feature Specification:\s*/i, '')
  const requirements = []
  const outcomes = []
  const scenarios = []
  const assumptions = []
  let story = 0
  let heading = ''
  for (const line of lines) {
    if (/^#{2,4}\s/.test(line)) {
      heading = line.replace(/^#+\s*/, '').toLowerCase()
      const s = line.match(/User Story\s+(\d+)/i)
      if (s) story = Number(s[1])
      continue
    }
    const fr = line.match(/^\s*[-*]\s*\*\*(FR-\d+)\*\*:?\s*(.+)$/)
    if (fr) requirements.push({ id: fr[1], text: fr[2].trim() })
    const sc = line.match(/^\s*[-*]\s*\*\*(SC-\d+)\*\*:?\s*(.+)$/)
    if (sc) outcomes.push({ id: sc[1], text: sc[2].trim() })
    const gwt = strip(line).match(/^\d+\.\s*Given\s+(.+?),\s*When\s+(.+?),\s*Then\s+(.+?)\.?$/i)
    if (gwt) scenarios.push({ story, given: gwt[1], when: gwt[2], then: gwt[3] })
    if (heading.startsWith('assumptions')) {
      const a = line.match(/^\s*[-*]\s+(.+)$/)
      if (a) assumptions.push(a[1].trim())
    }
  }
  const clarifications = [...text.matchAll(/\[NEEDS CLARIFICATION:\s*([^\]]+)\]/g)].map(m => m[1].trim())
  return { title, requirements, scenarios, outcomes, assumptions, clarifications }
}

// The PRD sections Spec Kit can fill; the rest stay as the template's comments for the product owner.
export function prdFromSpecKit(spec, template) {
  const reqs = spec.requirements.map((r, i) => `- R${i + 1}. (must) ${r.text.replace(/\[NEEDS CLARIFICATION:[^\]]*\]/g, '(to be clarified)')} (Spec Kit ${r.id})`)
  const asks = [...spec.assumptions.map(a => `${a}`), ...spec.clarifications.map(c => `To be clarified (Spec Kit): ${c}`)]
  const assumptions = asks.map((a, i) => `- A${i + 1}: ${a} [unconfirmed]`)
  const open = asks.map((a, i) => `- A${i + 1}: who: the product lead. Recommend: confirm or correct it before approval.`)
  const outcome = spec.outcomes[0] ? `Metric: ${spec.outcomes[0].text} (Spec Kit ${spec.outcomes[0].id})\nOwner: <who reads it>` : ''
  const fill = (text, heading, body) => (body ? text.replace(new RegExp(`(^${heading}\\n)`, 'm'), `$1\n${body}\n`) : text)
  let text = template
  text = fill(text, '## Requirements', reqs.join('\n'))
  text = fill(text, '## Assumptions', assumptions.join('\n'))
  text = fill(text, '## Open questions', open.join('\n'))
  text = fill(text, '## Outcome metric', outcome)
  return text
}

export function featureFromSpecKit(spec) {
  const counts = {}
  const scenarios = spec.scenarios.map((s, i) => {
    counts[s.story] = (counts[s.story] ?? 0) + 1
    return `  @AC-${i + 1} @story-${s.story}\n  Scenario: Story ${s.story}, scenario ${counts[s.story]}\n    Given ${s.given}\n    When ${s.when}\n    Then ${s.then}\n`
  })
  return `# Imported from a Spec Kit spec.md. Tag each scenario with the requirement it proves (@R1 ...) and its
# test level (@unit, @subsystem, @api, @e2e); the Plan gate refuses a scenario with no @R.

Feature: ${spec.title}

${scenarios.join('\n')}`
}
