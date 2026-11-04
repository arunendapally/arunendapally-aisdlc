// A PRD states requirements, not solutions: what a user or the business can observe, true whatever we
// build. solutionWarnings() lists the requirement lines in prd.md and the steps in acceptance.feature that
// read like a design: code, files, markup, endpoints, storage and deploy mechanics. It only warns, like the
// field-name check, until an eval shows it is reliable enough to refuse. A solution a person imposed goes
// in "## Constraints", which is not checked; the design (plan.md, or "## Approach" in tasks.md) says how.
import { section } from './lib.mjs'

const SIGNS = [
  ['code in backticks', /`[^`]+`/],
  ['markup', /<\/?[a-z][a-z0-9-]*(\s[^>]*)?>/i],
  ['a file', /\b[\w./-]+\.(m?js|cjs|tsx?|jsx|py|rb|go|java|cs|css|html?|json|ya?ml|sql|prisma|sh)\b/i],
  ['an endpoint', /\b(GET|POST|PUT|PATCH|DELETE)\s+\//],
  ['a status code', /\bHTTP\s*[1-5]\d\d\b|\bstatus (code )?[1-5]\d\d\b/i],
  ['a design word', /\b(modules?|endpoints?|API|REST|GraphQL|database|DB|tables?|columns?|schema|migrations?|queues?|microservices?|cron|webhooks?|workflows?|commits?|sha|deploy(s|ed|ment)?|repo(sitory)?|branch(es)?|cookies?|local ?storage|session ?storage|JSON|YAML|npm|Node(\.js)?|React|framework|S3|Lambda|Redis|Postgres|MySQL|Kafka|meta tag|DOM|CSS|JavaScript|TypeScript|regex)\b/],
]

// Words that are fine in a requirement even though they look technical: "the page", "the screen".
const lineSigns = line => SIGNS.filter(([, re]) => re.test(line)).map(([name, re]) => `${name} (${line.match(re)[0]})`)

export function solutionWarnings(prdText = '', featureText = '') {
  const warnings = []
  for (const line of (section(prdText, '## Requirements') ?? '').split('\n')) {
    const id = line.match(/^\s*[-*]?\s*\**(R\d+)\b/)?.[1]
    if (!id) continue
    const signs = lineSigns(line.replace(/^\s*[-*]?\s*\**R\d+\**\.?\s*(\((must|should|could)\))?/i, ''))
    if (signs.length) warnings.push(`prd.md ${id} reads like a solution: ${signs.join(', ')}. State what a user or the business observes; put how in the design, or a person's choice in "## Constraints"`)
  }
  featureText.split('\n').forEach((line, i) => {
    if (!/^\s*(Given|When|Then|And|But)\b/.test(line)) return
    const signs = lineSigns(line)
    if (signs.length) warnings.push(`acceptance.feature line ${i + 1} reads like a solution: ${signs.join(', ')}. Describe the behaviour, not the mechanism`)
  })
  return warnings
}
