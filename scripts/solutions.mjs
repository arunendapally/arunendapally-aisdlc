// A PRD states requirements, not solutions: what a user or the business can observe, true whatever we
// build. solutionWarnings() lists the requirement lines in prd.md and the steps in acceptance.feature that
// name a mechanism. It only warns, never refuses.
//
// Precision first: a warning that fires on ordinary business words ("branch", "queue", "table", "commit")
// teaches people to ignore it. So it looks only for signs that are almost never a need: code, real markup,
// files, identifiers, endpoints, named storage and named technology. tests/fixtures/solution-corpus.json is
// the labelled set it is measured on: no functional line may warn, and most technical lines must.
//
// The feature's kinds change what counts. In api work the contract is the product, so endpoints, status
// codes and field names are requirements; in data work the datasets are.
import { section } from './lib.mjs'

const TECH = [
  'postgres(ql)?', 'mysql', 'sqlite', 'mongo(db)?', 'dynamodb', 'firestore', 'redis', 'memcached', 'elasticsearch',
  'kafka', 'rabbitmq', 'sqs', 'sns', 'pub/sub', 'event bus', 'message queue', 'grpc', 'orm', 'foreign key', 'primary key',
  'index on', 'nosql', 'sql', 'database', 'react', 'angular', 'vue', 'next\\.js', 'node(\\.js)?', 'express', 'django', 'rails',
  'spring boot', 'kubernetes', 'docker', 'terraform', 'lambda', 's3', 'vercel', 'netlify', 'github (actions|pages)',
  'launchdarkly', 'microservices?', 'localstorage', 'sessionstorage', 'indexeddb', '(browser|local|session) storage',
  'meta tag', 'script tag', 'commit (sha|hash)', 'build meta', 'cdn',
]
const API_WORDS = ['api', 'rest', 'graphql', 'webhooks?', 'endpoints?']
const DATA_WORDS = ['sql', 'database', 'index on', 'primary key', 'foreign key']
const TAGS = 'meta|script|link|style|div|span|input|button|form|img|iframe|html|head|body|select|option|output|label|table|tr|td|ul|li'

const signsFor = kinds => {
  const api = kinds.includes('api')
  const data = kinds.includes('data')
  const words = [...TECH.filter(w => !(data && DATA_WORDS.includes(w))), ...(api ? [] : API_WORDS)]
  return [
    ...(api ? [] : [['code in backticks', /`[^`]+`/]]),
    ['markup', new RegExp(`</?(${TAGS})\\b[^>]*>`, 'i')],
    ['a file', /\b[\w./-]+\.(m?js|cjs|tsx?|jsx|py|rb|go|java|cs|css|html?|json|ya?ml|sql|prisma|sh)\b/i],
    ...(api ? [] : [
      ['an endpoint', /\b(GET|POST|PUT|PATCH|DELETE)\s+\/|(^|\s)\/api\//],
      ['a status code', /\bHTTP\s*[1-5]\d\d\b|\bstatus (code )?[1-5]\d\d\b/i],
      ['an identifier', /\b[a-z]{2,}_[a-z0-9_]+\b|\b[a-z]{2,}[A-Z][a-z]+[a-zA-Z]*\b/],
    ]),
    ['a named technology', new RegExp(`\\b(${words.join('|')})\\b`, 'i')],
  ]
}

const lineSigns = (line, signs) => signs.filter(([, re]) => re.test(line)).map(([name, re]) => `${name} (${line.match(re)[0].trim()})`)

// Requirement lines in prd.md, each with the indented lines that continue it.
const requirementLines = prdText => {
  const out = []
  for (const line of (section(prdText, '## Requirements') ?? '').split('\n')) {
    const id = line.match(/^\s*[-*]?\s*\**(R\d+)\b/)?.[1]
    if (id) out.push({ id, text: line.replace(/^\s*[-*]?\s*\**R\d+\**\.?\s*(\((must|should|could)\))?/i, '') })
    else if (out.length && /^\s+\S/.test(line) && !/^\s*[-*]\s/.test(line)) out[out.length - 1].text += ` ${line.trim()}`
    else if (!line.trim()) out.push({ id: null, text: '' })
  }
  return out.filter(r => r.id)
}

export function solutionWarnings(prdText = '', featureText = '', kinds = []) {
  const signs = signsFor(kinds)
  const warnings = []
  for (const { id, text } of requirementLines(prdText)) {
    const found = lineSigns(text, signs)
    if (found.length) warnings.push(`prd.md ${id} reads like a solution: ${found.join(', ')}. State what a user or the business observes; put how in the design, or a person's choice in "## Constraints"`)
  }
  featureText.split('\n').forEach((line, i) => {
    if (!/^\s*(Given|When|Then|And|But|\*)\s|^\s*\|/.test(line)) return
    const found = lineSigns(line, signs)
    if (found.length) warnings.push(`acceptance.feature line ${i + 1} reads like a solution: ${found.join(', ')}. Describe the behaviour, not the mechanism`)
  })
  return warnings
}
