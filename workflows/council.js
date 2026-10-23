export const meta = {
  name: 'council',
  description: 'Convene the AI SDLC council on one decision: experts review in parallel from their own roles, a sceptic checks each review against the code, and the CTO settles it into a decision record.',
}

// The council (docs/org-ai-sdlc-process.md): what the CTO did by hand for ADR-0002 to ADR-0005, as a
// script. It advises; it never approves, merges or edits code, and its record is a proposal a human
// accepts. Run it as /ai-sdlc:council with args:
//   question:  the decision to make, in one or two sentences
//   context:   what to read first (files, ADRs, links), and anything the experts must know
//   experts:   agent names from agents/ (default: tech-lead, safe-ai-sdlc-expert, sre, qa-engineer, agentic-ai-expert)
//   record:    where to write the decision record, for example docs/decisions/2026-10-23-<slug>.md
//   date:      today's date (the script cannot read the clock)
//   words:     the word limit for each review (default 400)
const {
  question,
  context = '',
  experts = ['tech-lead', 'safe-ai-sdlc-expert', 'sre', 'qa-engineer', 'agentic-ai-expert'],
  record,
  date,
  words = 400,
} = args ?? {}
if (!question || !record || !date) throw new Error('council needs args.question, args.record and args.date')

const HOUSE = 'No em dashes. Cite files as path:line. Do not edit any file or run any command that changes state.'

const REVIEW = {
  type: 'object',
  required: ['position', 'recommendations', 'mustStayHuman', 'doNotDo'],
  properties: {
    position: { type: 'string', description: 'Your overall position in two or three sentences.' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'rule', 'where', 'why', 'evidence'],
        properties: {
          title: { type: 'string' },
          rule: { type: 'string', description: 'The concrete rule or change, stated so a check could fail on it.' },
          where: { type: 'string', description: 'Where it lives: hook, gate check, ledger, template, agent, eval, or none.' },
          why: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' }, description: 'path:line citations that support it.' },
        },
      },
    },
    mustStayHuman: { type: 'array', items: { type: 'string' } },
    doNotDo: { type: 'array', items: { type: 'string' }, description: 'What not to do, and why.' },
  },
}

const CHECK = {
  type: 'object',
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'verdict', 'why'],
        properties: {
          title: { type: 'string' },
          verdict: { type: 'string', enum: ['supported', 'unsupported', 'wrong'] },
          why: { type: 'string', description: 'What the cited code actually shows.' },
        },
      },
    },
  },
}

const RULING = {
  type: 'object',
  required: ['agreed', 'contested', 'record'],
  properties: {
    agreed: { type: 'array', items: { type: 'string' } },
    contested: {
      type: 'array',
      items: {
        type: 'object',
        required: ['point', 'positions', 'ruling', 'why'],
        properties: { point: { type: 'string' }, positions: { type: 'string' }, ruling: { type: 'string' }, why: { type: 'string' } },
      },
    },
    record: { type: 'string', description: 'The path of the decision record written.' },
  },
}

// 1. Each expert reviews independently, in its own context, as the role its agent file defines.
phase('Experts')
const reviews = await pipeline(experts, expert =>
  agent(
    [
      `You are the ${expert} on the CTO's council. Read agents/${expert}.md first and take that role and its judgement.`,
      `Decision: ${question}`,
      context && `Context:\n${context}`,
      'Answer from your discipline only. Read the code you cite. Prefer a rule that can fail over prose, and add no process that does not catch a real failure.',
      `At most ${words} words. ${HOUSE}`,
    ].filter(Boolean).join('\n\n'),
    { label: expert, schema: REVIEW },
  ).then(review => (review ? { expert, ...review } : null)),
)
const heard = reviews.filter(Boolean)
log(`${heard.length} of ${experts.length} experts reported.`)

// 2. A sceptic checks each review against the code it cites, in a fresh context, so no expert grades
// its own claims (self-preferential bias).
phase('Sceptics')
const checks = await pipeline(heard, review =>
  agent(
    [
      `You are a sceptic. Assume each recommendation below is wrong until the code shows otherwise. For each, open the cited files and say whether the evidence supports it, does not support it, or shows it is wrong. Judge evidence, not taste.`,
      `Decision: ${question}`,
      `Review by the ${review.expert}:\n${JSON.stringify(review.recommendations, null, 2)}`,
      HOUSE,
    ].join('\n\n'),
    { label: `check ${review.expert}`, schema: CHECK },
  ).then(check => ({ expert: review.expert, review, verdicts: check?.verdicts ?? [] })),
)

// 3. The CTO settles agreements and contested points and writes the record a human will read.
phase('CTO')
const ruling = await agent(
  [
    'You are the CTO. Read agents/cto.md and docs/decisions/2026-10-22-code-review-at-scale.md for the shape of a decision record.',
    `Decision: ${question}`,
    context && `Context:\n${context}`,
    `The experts' reviews, each with a sceptic's verdict on its claims. Drop or rework any recommendation the sceptic found unsupported or wrong, and say so:\n${JSON.stringify(checks, null, 2)}`,
    `Write ${record}: a short title and date line (${date}), what each expert proposed in one table, where they agreed, each contested point with how you settled it and why, what not to do, and what stays human. It is a proposal: a human accepts it, and you never claim a gate is passed.`,
    HOUSE.replace('Do not edit any file or run any command that changes state.', `Write only ${record}.`),
  ].filter(Boolean).join('\n\n'),
  { label: 'cto', schema: RULING },
)

return {
  record: ruling?.record ?? record,
  experts: heard.map(r => r.expert),
  unsupported: checks.flatMap(c => c.verdicts.filter(v => v.verdict !== 'supported').map(v => `${c.expert}: ${v.title} (${v.verdict})`)),
  agreed: ruling?.agreed ?? [],
  contested: ruling?.contested ?? [],
}
