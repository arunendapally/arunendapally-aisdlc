// Requirements, design, testing and review quality gates. Each test is named after the acceptance
// criterion it proves in specs/quality-gates/acceptance.feature, so "sdlc tests quality-gates" traces it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, switchableGate } from './helpers.mjs'
import { lint, requirementsFrom } from '../scripts/gherkin.mjs'
import { parseLedger, humanCatches } from '../scripts/review.mjs'
import { adrProblems, decisionsIn } from '../scripts/design-review.mjs'
import { parseFacts, assumptionProblems } from '../scripts/facts.mjs'
import { analyze } from '../scripts/retro.mjs'
import { STAGES } from '../scripts/lib.mjs'

const template = name => fs.readFileSync(new URL(`../skills/org-ai-sdlc/templates/${name}`, import.meta.url), 'utf8')
const messages = r => r.errors.map(e => e.message).join('\n')
const FEATURE = (body, tags = '@R1 @AC-1 @unit') => `Feature: F\n  As a user\n  I want x\n  So that y\n\n  ${tags}\n  Scenario: S\n${body}\n`
const hoursAgo = h => new Date(Date.now() - h * 36e5).toISOString()

test('AC-1 the acceptance template is valid Gherkin that covers its requirements', () => {
  const r = lint(template('acceptance.feature'), ['R1', 'R2'])
  assert.deepEqual(r.errors, [])
  assert.deepEqual(r.scenarios.map(s => s.ac), ['@AC-1', '@AC-2', '@AC-3'])
  assert.deepEqual(r.scenarios.map(s => s.level), ['api', 'unit', 'e2e'])
  assert.deepEqual(requirementsFrom('## Requirements\n\n- R1. (must) a\n- R2. b\n\n## Never\n\n- R9. not a requirement\n'), ['R1', 'R2'])
})

test('AC-2 every scenario must carry its criterion, requirement and one test level', () => {
  const r = lint(FEATURE('    Given a\n    When b\n    Then c', '@unit'), ['R1'])
  assert.match(messages(r), /exactly one criterion tag/)
  assert.match(messages(r), /needs the requirement it proves/)
  assert.match(messages(r), /R1 has no scenario/)
  assert.match(messages(lint(FEATURE('    Given a\n    When b\n    Then c', '@R1 @AC-1 @unit @e2e'))), /exactly one test level/)
  assert.match(messages(lint(FEATURE('    Given a\n    When b\n    Then c', '@R7 @AC-1 @unit'), ['R1'])), /@R7, which is not in the PRD/)
  assert.match(messages(lint('Feature: F\n  I want x\n\n  @R1 @AC-1 @unit\n  Scenario: S\n    Given a\n    When b\n    Then c\n')), /missing: As a, So that/)
})

test('AC-3 one behaviour per scenario, in Given, When, Then order', () => {
  assert.match(messages(lint(FEATURE('    Given a\n    When b\n    And c\n    Then d'))), /2 When steps\. One behaviour per scenario/)
  assert.match(messages(lint(FEATURE('    Given a\n    Then d'))), /has no When/)
  assert.match(messages(lint(FEATURE('    When b\n    Then c\n    Given a'))), /Given after Then/)
  assert.match(messages(lint(FEATURE('    And a\n    When b\n    Then c'))), /cannot start with And/)
})

test('AC-4 a Scenario Outline needs Examples with a column for every placeholder', () => {
  const outline = 'Feature: F\n  As a u\n  I want x\n  So that y\n\n  @R1 @AC-1 @unit\n  Scenario Outline: O\n    Given <a>\n    When <b> happens\n    Then ok\n\n    Examples:\n      | a |\n      | 1 |\n'
  assert.match(messages(lint(outline)), /no column for <b>/)
  assert.match(messages(lint(FEATURE('    Given <a>\n    When b\n    Then c'))), /is not a Scenario Outline/)
})

test('AC-5 steps describe behaviour: selectors fail, UI mechanics warn', () => {
  assert.match(lint(FEATURE('    Given a\n    When the user presses #submit-btn\n    Then c')).warnings[0].message, /may name a selector/)
  assert.match(messages(lint(FEATURE('    Given a\n    When the page has //div[@id]\n    Then c'))), /names a selector/)
  assert.match(messages(lint(FEATURE('    Given a\n    When the page has [data-test=save]\n    Then c'))), /names a selector/)
  assert.deepEqual(lint(FEATURE('    Given a step that names a CSS selector\n    When the linter checks it\n    Then it is refused')).errors, [], 'talking about selectors in words is fine')
  const warned = lint(FEATURE('    Given a\n    When the user clicks the Save button\n    Then c'))
  assert.deepEqual(warned.errors, [])
  assert.match(warned.warnings[0].message, /UI mechanics/)
})

test('AC-5 no false positives on paths, hashtags, comparisons or scenario descriptions (review F6, F7, F8)', () => {
  const ok = body => lint(FEATURE(body)).errors
  assert.deepEqual(ok('    Given the file ".ai-sdlc/config.json" exists\n    When the gate runs\n    Then it reads it'), [])
  assert.deepEqual(ok('    Given an issue labelled #needs-triage\n    When triage runs\n    Then it is routed'), [])
  assert.deepEqual(ok('    Given a search\n    When it runs\n    Then the time is < 200 ms and > 10 ms'), [])
  const described = 'Feature: F\n  As a u\n  I want x\n  So that y\n\n  Rule: Retries are safe\n    Retrying never charges twice.\n\n  @R1 @AC-1 @unit\n  Scenario: S\n    This scenario covers retries.\n    Given a\n    When b\n    Then c\n'
  assert.deepEqual(lint(described).errors, [])
  assert.match(messages(lint(FEATURE('    Given a\n    When b\n    Then c\n    this prose sits after the steps'))), /Not Gherkin: "this prose sits after the steps"/, 'description is allowed only before the first step')
  assert.deepEqual(requirementsFrom('## Requirements\n\n| ID | Priority | Requirement |\n|---|---|---|\n| R1 | must | save |\n| R2 | should | mark |\n'), ['R1', 'R2'], 'table PRDs (review F2)')
})

test('AC-8 a PRD with no requirement ids cannot switch coverage off (review F2)', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 2 })
  r.put('specs/demo/prd.md', '## Requirements\n\n1. (must) save for later\n')
  r.put('specs/demo/acceptance.feature', FEATURE('    Given a\n    When b\n    Then c'))
  assert.match(r.sdlc('request', 'demo').out, /prd\.md has no requirement ids/)
})

test('AC-12 a single option with sub-bullets is still one option, and "no real cost" is not a downside (review F4)', () => {
  const adr = 'Status: proposed\n\n## Context\n\nx\n\n## Options\n\n- Postgres: what it is\n  - why it might lose: ops cost\n\n## Decision\n\nPostgres\n\n## Consequences\n\nNo real cost.\n'
  const p = adrProblems(adr, 'ADR-0002').join('\n')
  assert.match(p, /weighs 1 option/)
  assert.match(p, /names no downside/)
})

test('AC-14 criteria are scoped to their feature, and *.spec.ts unit tests are unit tests (review F1, F5)', () => {
  const r = makeRepo()
  r.sdlc('init', 'b')
  r.put('specs/b/acceptance.feature', FEATURE('    Given a\n    When b\n    Then c', '@R1 @AC-1 @unit'))
  r.put('test/a.test.ts', "describe('feature-a', () => test('AC-1 cart', () => {}))\n")
  const out = r.sdlc('tests', 'b')
  assert.notEqual(out.status, 0, 'feature a\'s AC-1 does not trace feature b\'s AC-1')
  r.put('src/cart/cart.service.spec.ts', "describe('b', () => it('AC-1 cart', () => {}))\n")
  const ok = r.sdlc('tests', 'b')
  assert.equal(ok.status, 0, ok.out)
  assert.match(ok.out, /cart\.service\.spec\.ts \(unit\)/)
})

test('AC-15 --repeat rejects a value that is not a whole number (review F12)', () => {
  const r = makeRepo()
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('init', 'demo')
  gate.green()
  assert.match(r.sdlc('gate', 'demo', '--repeat', 'x').out, /--repeat takes a whole number/)
})

test('AC-6 the Plan gate refuses unmarked assumptions and unconfirmed ones missing from open questions', () => {
  const prd = '## Questions asked\n\n- Q1: who? A: shoppers (Arun)\n- Q2: when?\n\n## Assumptions\n\n- A1: stock is live [confirmed]\n- A2: emails allowed [unconfirmed]\n- A3: no limit\n\n## Open questions\n\n- none\n'
  const p = assumptionProblems(prd).join('\n')
  assert.match(p, /"- A3: no limit" is not marked/)
  assert.match(p, /A2 is unconfirmed, so it must appear in Open questions/)
  assert.match(p, /"- Q2: when\?" has no "A: \.\.\."/)
  assert.deepEqual(assumptionProblems(prd.replace('- A3: no limit', '- A3: no limit [unconfirmed]').replace('- Q2: when?', '- Q2: when? unanswered').replace('- none', '- A2 and A3: ask legal')), [])
  assert.ok(STAGES[1].headings.includes('## Assumptions') && STAGES[1].headings.includes('## Questions asked'))
})

test('AC-7 system facts are pinned to real lines and go stale when the code changes', () => {
  const r = makeRepo()
  r.put('src/orders.ts', 'export const softDelete = true\nexport const x = 1\n')
  r.git('add', '.')
  r.git('commit', '-m', 'orders')
  const sha = r.git('rev-parse', '--short', 'HEAD')
  r.sdlc('init', 'demo', '--kind', 'brownfield')
  r.setState('demo', { stage: 2 })
  const facts = body => r.put('specs/demo/facts.md', `## Facts\n\n${body}\n`)
  const factIssues = () => r.sdlc('request', 'demo').out
  facts(`- F1: Orders are soft-deleted. Source: src/orders.ts:1. Verified: ${sha}.`)
  assert.doesNotMatch(factIssues(), /facts\.md/)
  facts(`- F1: Orders are soft-deleted. Source: src/orders.ts:9. Verified: ${sha}.`)
  assert.match(factIssues(), /has 3 lines, so line 9 cannot be the source/)
  facts(`- F1: Orders are soft-deleted. Source: src/missing.ts:1. Verified: ${sha}.`)
  assert.match(factIssues(), /src\/missing\.ts does not exist/)
  facts('- F1: Orders are soft-deleted, see the repo.')
  assert.match(factIssues(), /write a fact as/)
  facts(`- F1: Orders are soft-deleted. Source: src/orders.ts:1. Verified: ${sha}.`)
  r.put('specs/demo/spec.md', '## Requirements\n\nFR-1 relies on F1 and F4.\n')
  assert.match(factIssues(), /spec\.md cites F4, which facts\.md does not define/)
  r.put('src/orders.ts', 'export const softDelete = false\nexport const x = 1\n')
  r.git('commit', '-am', 'change')
  assert.match(factIssues(), /F1 is stale/)
  facts('None, because')
  assert.match(factIssues(), /brownfield work needs at least one fact/)
  assert.equal(parseFacts(`- F2: A. Source: a.ts:3-5. Verified: ${sha}.`).facts[0].end, 5)
})

test('AC-8 the Analyze gate needs acceptance.feature covering the PRD and valid facts', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 2 })
  r.put('specs/demo/prd.md', '## Requirements\n\n- R1. (must) save for later\n- R2. (should) sold-out marker\n')
  let out = r.sdlc('request', 'demo').out
  assert.match(out, /acceptance\.feature does not exist/)
  assert.match(out, /facts\.md does not exist/)
  r.put('specs/demo/acceptance.feature', FEATURE('    Given a\n    When b\n    Then c'))
  out = r.sdlc('request', 'demo').out
  assert.match(out, /R2 has no scenario/)
  assert.equal(r.write('specs/demo/acceptance.feature', 'x'), 'allow', 'stage 2 may write it')
})

test('AC-9 the review packet shows where the risk is before anyone reads the diff', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', FEATURE('    Given a\n    When b\n    Then c', '@R1 @AC-1 @unit') + '\n  @R1 @AC-2 @unit\n  Scenario: T\n    Given a\n    When b\n    Then c\n')
  r.put('src/auth/login.ts', 'export function login() {\n  console.log("debug")\n}\n')
  r.put('src/cart.ts', 'export const cart = 1\n')
  r.put('test/cart.test.ts', "describe('demo', () => test('AC-1 cart', () => {}))\n")
  r.put('db/migrations/001.sql', 'create table t (id int);\n')
  const out = r.sdlc('review', 'demo').out
  assert.match(out, /`src\/auth\/login\.ts`.*high-risk path/)
  assert.match(out, /1 leftover \(line 2: console\.log/)
  assert.match(out, /login\.ts.*no changed test mentions it/)
  assert.doesNotMatch(out.match(/`src\/cart\.ts`[^\n]*/)?.[0] ?? '', /no changed test/)
  assert.match(out, /AC-2 \(unit\): T/)
  assert.doesNotMatch(out, /AC-1 \(unit\)/)
  assert.match(out, /security \(safe-ai-sdlc-expert\)/)
  assert.match(out, /data \(dba\)/)
  assert.ok(fs.existsSync(path.join(r.repo, 'specs', 'demo', 'review.md')))
})

test('AC-9 the review packet stays quiet where printing is the job and where a suite tests the file', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('scripts/cli.mjs', 'console.log("usage")\nconsole.log("done")\n')
  r.put('tests/cli-suite.test.mjs', "import '../scripts/cli.mjs'\ntest('AC-1 cli', () => {})\n")
  r.put('src/pay.ts', 'export const pay = 1\n// TODO remove\n')
  const out = r.sdlc('review', 'demo').out
  const row = name => out.match(new RegExp(`\\| \`${name}\` \\|[^\\n]*`))?.[0] ?? ''
  assert.doesNotMatch(row('scripts/cli.mjs'), /leftover/, 'a CLI prints by design')
  assert.doesNotMatch(row('scripts/cli.mjs'), /no changed test/, 'a suite named differently still tests it')
  assert.match(row('src/pay.ts'), /1 leftover \(line 2: \/\/ TODO remove\)/)
})

test('AC-10 the findings ledger refuses open serious findings, missing locations and unexplained wontfix', () => {
  const r = makeRepo('bug/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('bug', 'demo')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  r.fill('specs/demo/bug.md', ['## Repro', '## Expected and actual', '## Root cause', '## Fix', '## Test results', '## Not verified', '## Review honesty'], '\n## Pre-review\n\nRisk: low\nOpen findings: 0\nLenses run: correctness, tests\n')
  gate.green()
  r.sdlc('gate', 'demo')
  assert.match(r.sdlc('request', 'demo').out, /no review packet/)
  r.put('src/a.ts', 'x\n')
  r.sdlc('review', 'demo')
  const row = (...cells) => `| ${cells.join(' | ')} |`
  const ledger = rows => r.put('specs/demo/review.md', `| ID | Severity | Location | Checklist | Finding | Status | Source |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`)
  ledger([
    row('F1', 'major', 'src/a.ts:1', '6', 'retry not idempotent', 'open', 'pre-review'),
    row('H2', 'minor', 'nowhere', '3', 'naming', 'open', 'human'),
    row('F3', 'blocker', 'src/a.ts:1', '2', 'auth bypass', 'wontfix', 'lens:security'),
    row('F4', 'nit', 'src/a.ts:1', '9', 'typo', 'open', 'robot'),
  ])
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /F1 \(major\) is still open/)
  assert.match(out, /H2: location must be file:line/)
  assert.match(out, /F3: a wontfix needs a reason/)
  assert.match(out, /F3: a blocker cannot be wontfix/)
  assert.match(out, /F4: source must be/)
  assert.doesNotMatch(out, /F4 \(nit\) is still open/, 'a nit may stay open')
  // A real fix: a commit that changes src/a.ts and removes src/gone.ts.
  r.put('src/gone.ts', 'old\n')
  r.git('add', 'src/gone.ts')
  r.git('commit', '-m', 'before the fix')
  const unrelated = r.git('rev-parse', '--short', 'HEAD')
  r.git('rm', '-q', 'src/gone.ts')
  r.put('src/a.ts', 'fixed\n')
  r.git('add', 'src')
  r.git('commit', '-m', 'the fix')
  const sha = r.git('rev-parse', '--short', 'HEAD')
  assert.match(r.sdlc('request', 'demo').out, /the review packet was built at \w+, not HEAD/)
  r.sdlc('review', 'demo')
  // Every round keeps all five rows: closing a finding never means deleting it.
  const rounds = f1 => ledger([
    row('F1', 'major', f1.location ?? 'src/a.ts:1', '6', 'retry not idempotent', f1.status, 'pre-review'),
    row('H1', 'minor', 'src/a.ts:1', '3', 'naming', 'wontfix: matches the module style', 'human'),
    row('H2', 'minor', 'src/a.ts:1', '3', 'naming', `fixed: ${sha}`, 'human'),
    row('F3', 'major', 'src/a.ts:1', '2', 'auth bypass', `fixed: ${sha}`, 'lens:security'),
    row('F4', 'nit', 'src/a.ts:1', '9', 'typo', 'open', 'pre-review'),
  ])
  rounds({ status: 'fixed' })
  assert.match(r.sdlc('request', 'demo').out, /F1: "fixed" must name the commit that fixed it/)
  rounds({ status: 'fixed: abcdef9' })
  assert.match(r.sdlc('request', 'demo').out, /F1: abcdef9 is not a commit/)
  rounds({ status: `fixed: ${unrelated}` })
  assert.match(r.sdlc('request', 'demo').out, new RegExp(`F1: commit ${unrelated} does not change src/a.ts`), 'any old commit is not proof of a fix')
  rounds({ status: `fixed: ${sha}`, location: 'src/gone.ts:1' })
  const ok = r.sdlc('request', 'demo')
  assert.equal(ok.status, 0, `${ok.out}: a fixed row may point at a file the fix removed`)
})

test('AC-10 a finding cannot be hidden by a mistyped id, a wrong prefix, or deleting its row', () => {
  const r = makeRepo('bug/demo')
  const gate = switchableGate(r)
  r.config({ gateCommand: 'node gate.cjs' })
  r.sdlc('bug', 'demo')
  r.setState('demo', { stage: 5, stages: { 5: { enteredAt: hoursAgo(1) } }, baseline: 12 })
  r.fill('specs/demo/bug.md', ['## Repro', '## Expected and actual', '## Root cause', '## Fix', '## Test results', '## Not verified', '## Review honesty'], '\n## Pre-review\n\nRisk: low\nOpen findings: 0\n')
  gate.green()
  r.sdlc('gate', 'demo')
  r.put('src/a.ts', 'x\n')
  r.sdlc('review', 'demo')
  const head = '| ID | Severity | Location | Checklist | Finding | Status | Source |\n|---|---|---|---|---|---|---|\n'
  r.put('specs/demo/review.md', `${head}| f1 | blocker | src/a.ts:1 | 2 | auth bypass | open | pre-review |\n| H2 | nit | src/a.ts:1 | 9 | typo | open | pre-review |\n`)
  let out = r.sdlc('request', 'demo').out
  assert.match(out, /a finding row needs 7 cells and an ID like F1/)
  assert.match(out, /H2: H ids are for human findings/)
  r.put('specs/demo/review.md', `${head}| F1 | nit | src/a.ts:1 | 9 | typo | open | pre-review |\n| H1 | major | src/a.ts:1 | 6 | double charge | open | human |\n`)
  r.sdlc('request', 'demo')
  r.put('specs/demo/review.md', `${head}| F1 | nit | src/a.ts:1 | 9 | typo | open | pre-review |\n`)
  out = r.sdlc('request', 'demo').out
  assert.match(out, /H1 was removed from the ledger; mark it fixed or wontfix instead/)
})

test('AC-11 serious findings only a human caught become retro proposals with the pre-review recall', () => {
  const rows = [
    '| H1 | major | a.ts:3 | 6 | idempotency on retry | fixed: abc1234 | human |',
    '| H2 | blocker | b.ts:9 | 6 | double charge | fixed: abc1234 | human |',
    '| F3 | major | c.ts:1 | 2 | auth | fixed: abc1234 | pre-review |',
    '| H4 | nit | d.ts:1 | 9 | typo | open | human |',
  ]
  const ledger = parseLedger(rows.join('\n'))
  assert.deepEqual(humanCatches(ledger).map(f => f.id), ['H1', 'H2'])
  const res = analyze([{ repo: '/r', sla: { full: 24 }, cap: 3, features: [], audit: [], traps: [], promotable: [], trust: {}, reviews: ledger.map(f => ({ ...f, feature: 'pay' })) }])
  const miss = res.proposals.find(p => p.kind === 'review-miss')
  assert.match(miss.title, /Humans caught 2 serious findings the pre-review missed \(checklist 6\); too few serious findings \(3\) to measure recall/)
  const more = parseLedger([...rows, '| F5 | major | e.ts:1 | 2 | x | fixed: abc1234 | pre-review |', '| F6 | major | f.ts:1 | 2 | y | fixed: abc1234 | lens:security |'].join('\n'))
  const res2 = analyze([{ repo: '/r', sla: { full: 24 }, cap: 3, features: [], audit: [], traps: [], promotable: [], trust: {}, reviews: more.map(f => ({ ...f, feature: 'pay' })) }])
  assert.match(res2.proposals.find(p => p.kind === 'review-miss').title, /pre-review recall 60% of 5/)
  assert.equal(miss.change.target, 'agents/pre-reviewer.md')
  assert.match(miss.verify, /seeded-bug review eval/)
})

test('AC-12 an ADR must weigh two options and name a downside', () => {
  const adr = 'Status: proposed\n\n## Context\n\nx\n\n## Options\n\n- Postgres\n\n## Decision\n\nPostgres\n\n## Consequences\n\nIt is great.\n'
  const p = adrProblems(adr, 'ADR-0001').join('\n')
  assert.match(p, /weighs 1 option; a decision needs at least two/)
  assert.match(p, /names no downside/)
  assert.deepEqual(adrProblems(adr.replace('- Postgres', '- Postgres\n- DynamoDB').replace('It is great.', 'Downside: we run it ourselves.'), 'ADR-0001'), [])
  assert.deepEqual(decisionsIn('## Decisions\n\nSee ADR-3 and ADR-0012.\n'), ['ADR-0003', 'ADR-0012'])
})

test('AC-13 the Design gate needs three disciplines to cross-question each decision, all answered, verdict accept', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 3 })
  r.put('specs/demo/plan.md', '## Decisions\n\nADR-0001 for storage.\n')
  let out = r.sdlc('request', 'demo').out
  assert.match(out, /names ADR-0001, but docs\/adr\/ has no file/)
  assert.match(out, /no design-review\.md/)
  r.put('docs/adr/0001-storage.md', 'Status: proposed\n\n## Context\n\nx\n\n## Options\n\n- A\n- B\n\n## Decision\n\nA\n\n## Consequences\n\nRisk: lock-in.\n')
  const board = (rows, verdict) => r.put('specs/demo/design-review.md', `## ADR-0001: storage\n\n| Q | Reviewer | Question | Answer | Resolved |\n|---|---|---|---|---|\n${rows}\n\nVerdict: ${verdict}\n`)
  board('| Q1 | design-reviewer | why not B? | B costs more | yes |\n| Q2 | sre | failover? | | |', 'revise')
  out = r.sdlc('request', 'demo').out
  assert.match(out, /ADR-0001: 2 reviewers questioned it; the board needs at least 3/)
  assert.match(out, /ADR-0001 Q2 \(sre\) has no answer/)
  assert.match(out, /verdict is revise/)
  board('| Q1 | design-reviewer | why not B? | B costs more | yes |\n| Q2 | sre | failover? | multi-AZ | yes (residual: one region) |\n| Q3 | dba | backfill? | batched, 1k rows | not yet: show the lock time |', 'accept')
  assert.match(r.sdlc('request', 'demo').out, /Q3 \(dba\) is answered but not resolved/)
  assert.doesNotMatch(r.sdlc('request', 'demo').out, /Q2 \(sre\)/, 'a resolved answer may carry a note')
  board('| Q1 | design-reviewer | why not B? | B costs more | yes |\n| Q2 | sre | failover? | multi-AZ | yes (residual: one region) |\n| Q3 | dba | backfill? | batched, 1k rows | yes |', 'accept')
  out = r.sdlc('request', 'demo').out
  assert.doesNotMatch(out, /design-review|ADR-0001/)
})

test('AC-14 every criterion must be tested at its declared level', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', FEATURE('    Given a\n    When b\n    Then c', '@R1 @AC-1 @unit') + '\n  @R1 @AC-2 @e2e\n  Scenario: Journey\n    Given a\n    When b\n    Then c\n\n  @R1 @AC-3 @api\n  Scenario: Contract\n    Given a\n    When b\n    Then c\n')
  r.put('test/cart.test.ts', "// demo\ntest('AC-1 cart', () => {})\ntest('AC-2 journey done as a unit test', () => {})\n")
  r.put('tests/api/orders.postman_collection.json', '{"info":{"name":"demo"},"item":[{"name":"AC-3 contract"}]}')
  const out = r.sdlc('tests', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /AC-2 is a e2e criterion, but it is only tested at test\/cart\.test\.ts \(unit\)/)
  assert.match(out.out, /\| AC-1 \| unit .*\| yes \|/)
  assert.match(out.out, /\| AC-3 \| api .*postman.*\| yes \|/)
  r.put('e2e/journey.spec.ts', "test('demo AC-2 journey', async () => {})\n")
  assert.equal(r.sdlc('tests', 'demo').status, 0)
  assert.ok(fs.existsSync(path.join(r.repo, 'specs', 'demo', 'test-matrix.md')))
})

test('AC-17 data work shows an ER diagram that marks the entities it changes', () => {
  const r = makeRepo()
  r.sdlc('init', 'loyalty', '--kind', 'data')
  r.setState('loyalty', { stage: 3 })
  const plan = model => r.put('specs/loyalty/plan.md', `## Data model\n\n${model}\n\n## Decisions\n\nNone, because no ADR.\n`)
  const er = () => r.sdlc('request', 'loyalty').out
  plan('A new table for points.')
  assert.match(er(), /ER diagram: plan\.md "## Data model" has no Mermaid erDiagram/)
  plan('```mermaid\nerDiagram\n  CUSTOMERS {\n    uuid id PK\n  }\n  CUSTOMERS ||--o| LOYALTY_POINTS : earns\n```')
  let out = er()
  assert.match(out, /no "%% changed: ENTITY, \.\.\." line/)
  plan('```mermaid\nerDiagram\n  %% changed: LOYALTY_POINTS\n  CUSTOMERS {\n    uuid id PK\n  }\n  CUSTOMERS ||--o| LOYALTY_POINTS : earns\n```')
  assert.match(er(), /LOYALTY_POINTS is changed, so draw it with its attributes/)
  plan('```mermaid\nerDiagram\n  %% changed: LOYALTY_POINTS\n  CUSTOMERS {\n    uuid id PK\n  }\n  LOYALTY_POINTS {\n    uuid customer_id FK\n    int balance\n  }\n  CUSTOMERS ||--o| LOYALTY_POINTS : earns\n```')
  assert.doesNotMatch(er(), /ER diagram/)
  r.put('db/migrations/003_points.sql', 'create table loyalty_points (customer_id uuid, balance int);\n')
  out = r.sdlc('review', 'loyalty').out
  assert.doesNotMatch(out, /ER diagram did not/, 'the plan changed with the schema')
  r.git('add', '.')
  r.git('commit', '-m', 'points')
  r.git('branch', '-f', 'main') // the plan is now on main; the next migration comes without it
  r.put('db/migrations/004_more.sql', 'alter table loyalty_points add tier text;\n')
  out = r.sdlc('review', 'loyalty').out
  assert.match(out, /004_more\.sql.*schema changed but the plan and its ER diagram did not/)
})

test('AC-18 API work has a valid OpenAPI contract, and breaking changes must be declared', () => {
  const r = makeRepo()
  const ok = fs.readFileSync(new URL('../skills/org-ai-sdlc/templates/openapi.yaml', import.meta.url), 'utf8')
  r.sdlc('init', 'orders', '--kind', 'api')
  r.put('specs/orders/openapi.yaml', ok)
  r.git('add', '.')
  r.git('commit', '-m', 'contract v1')
  r.git('branch', '-f', 'main')
  r.setState('orders', { stage: 3 })
  r.put('specs/orders/plan.md', '## Contracts\n\nopenapi.yaml\n\n## Decisions\n\nNone, because no ADR.\n')
  const gate = () => r.sdlc('request', 'orders').out
  assert.doesNotMatch(gate(), /openapi\.yaml/)
  r.put('specs/orders/openapi.yaml', ok.replace('openapi: 3.1.0', 'openapi: 2.0').replace("              schema:\n                $ref: '#/components/schemas/Order'", "              schema:\n                $ref: '#/components/schemas/Orderz'").replace('      operationId: cancelOrder\n', '      operationId: getOrder\n'))
  let out = gate()
  assert.match(out, /"openapi:" must be 3\.0\.x or 3\.1\.x/)
  assert.match(out, /\$ref to #\/components\/schemas\/Orderz, which components\.schemas does not define/)
  assert.match(out, /operationId getOrder is used by GET \/orders\/\{orderId\} and DELETE/)
  r.put('specs/orders/openapi.yaml', ok.replace(/    delete:[\s\S]*?(?=components:)/, ''))
  out = gate()
  assert.match(out, /breaks clients \(removed DELETE \/orders\/\{orderId\}\)/)
  r.put('specs/orders/plan.md', '## Contracts\n\nBreaking: DELETE /orders/{orderId} is removed in v2.0.0; clients move to POST /orders/{orderId}/cancel.\n\n## Decisions\n\nNone, because no ADR.\n')
  assert.doesNotMatch(gate(), /breaks clients/)
})

test('AC-19 sdlc api starts the contract and puts a Swagger viewer beside it', () => {
  const r = makeRepo()
  r.sdlc('init', 'orders')
  const out = r.sdlc('api', 'orders')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /open specs\/orders\/swagger\.html/)
  assert.ok(fs.existsSync(path.join(r.repo, 'specs', 'orders', 'openapi.yaml')))
  const viewer = () => fs.readFileSync(path.join(r.repo, 'specs', 'orders', 'swagger.html'), 'utf8')
  assert.match(viewer(), /url: '\.\/openapi\.yaml'/, 'served over HTTP it reads the live file')
  assert.match(viewer(), /spec: jsyaml\.load\(embedded\)/, 'opened from disk it uses the embedded copy')
  // The viewer always embeds the current contract, even after the file changes.
  r.put('specs/orders/openapi.yaml', fs.readFileSync(path.join(r.repo, 'specs', 'orders', 'openapi.yaml'), 'utf8').replace('title: Orders API', 'title: Orders API v2'))
  r.sdlc('api', 'orders')
  assert.match(viewer(), /OPENAPI_YAML_START\*\/\nopenapi: 3\.1\.0\ninfo:\n  title: Orders API v2/)
  assert.equal(viewer().match(/title: Orders API/g).length, 1, 'only the current contract is embedded')
  assert.deepEqual(r.state('orders').kinds, ['api'])
  const packet = (r.put('specs/orders/openapi.yaml', 'openapi: 3.1.0\n'), r.sdlc('review', 'orders').out)
  assert.match(packet, /openapi\.yaml.*API contract change/)
  assert.match(packet, /API contract, compatibility and consumers \(architect\)/)
})

test('AC-15 repeated gate runs expose flaky tests', () => {
  const r = makeRepo()
  r.put('flaky.cjs', "const fs=require('fs');const n=fs.existsSync('n')?Number(fs.readFileSync('n','utf8')):0;fs.writeFileSync('n',String(n+1));console.log((n%2?11:12)+' passing');process.exit(n%2)\n")
  r.config({ gateCommand: 'node flaky.cjs' })
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4 })
  const out = r.sdlc('gate', 'demo', '--repeat', '3')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /FLAKY: 3 runs gave green 12, red 11, green 12/)
  assert.equal(r.state('demo').gateRuns['4'].flaky, true)
})

test('AC-16 the data check catches tests that leave data behind', () => {
  const r = makeRepo()
  const gate = switchableGate(r)
  r.put('leak.cjs', "const fs=require('fs');if(fs.existsSync('LEFTOVER')){console.log('3 test rows left in orders');process.exit(1)}\n")
  r.config({ gateCommand: 'node gate.cjs', dataCheckCommand: 'node leak.cjs' })
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4 })
  gate.green()
  assert.equal(r.sdlc('gate', 'demo').status, 0)
  r.put('LEFTOVER', 'y')
  const out = r.sdlc('gate', 'demo')
  assert.notEqual(out.status, 0)
  assert.match(out.out, /TEST DATA LEAKED[\s\S]*3 test rows left in orders/)
})
