// The unit-converter run (docs/plugin-feedback.md in that repo): the proof listed criteria no test traced
// (V1), missed a base that held only the init-repo scaffold (V2), the plugin's own traps.md made the test
// matrix match a product criterion (V3), and end-to-end test files counted as code (B2).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo } from './helpers.mjs'

const ACCEPT = 'Feature: F\n  As a user\n  I want x\n  So that y\n\n  @R1 @AC-1 @unit\n  Scenario: S\n    Given a\n    When b\n    Then c\n\n  @R1 @AC-2 @e2e\n  Scenario: T\n    Given a\n    When b\n    Then d\n'
const greetTest = "const { test } = require('node:test')\nconst assert = require('node:assert')\ntest('demo AC-1 greets', () => assert.equal(require('../src/greet.cjs')(), 'hi'))\n"

test('V1: the proof names only the criteria a test traces, and lists the rest as not proved', () => {
  const r = makeRepo()
  r.config({ proofCommand: 'node --test {files}' })
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', ACCEPT)
  r.put('src/greet.cjs', "module.exports = () => 'hi'\n")
  r.put('tests/demo.test.cjs', greetTest)
  const out = r.sdlc('proof', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /Proof passed against \w+: AC-1 failed on the base code and pass here\./)
  assert.match(out.out, /Not proved, no test traces them: AC-2\./)
})

test('V2: a base holding only what init-repo writes is greenfield', () => {
  const r = makeRepo()
  r.git('checkout', '-q', 'main')
  for (const f of ['CONSTITUTION.md', 'standards/traps.md', '.github/scripts/check-gates.mjs', '.github/workflows/ai-sdlc-gate.yml', '.claude/rules/ai-sdlc.md', 'docs/architecture/workspace.dsl']) r.put(f, 'scaffold\n')
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'sdlc init-repo')
  r.git('checkout', '-q', 'feature/demo')
  r.git('merge', '-q', 'main')
  r.config({ proofCommand: 'node --test {files}' })
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', ACCEPT)
  r.put('src/greet.cjs', "module.exports = () => 'hi'\n")
  r.put('tests/demo.test.cjs', greetTest)
  const out = r.sdlc('proof', 'demo')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /Greenfield: the base commit has no code/)
})

test('V3: standards/traps.md is never read as a test of the product', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.put('specs/demo/acceptance.feature', ACCEPT)
  r.put('standards/traps.md', '# Traps\n\n- **Guard now:** a test (tests: AC-1, "demo greets")\n')
  const out = r.sdlc('tests', 'demo').out
  assert.doesNotMatch(out, /standards\/traps\.md/)
  assert.match(out, /AC-1 has no test/)
})

test('V3: the repo template traps.md cites no plugin test ids', async () => {
  const fs = await import('node:fs')
  const traps = fs.readFileSync(new URL('../templates/repo/standards/traps.md', import.meta.url), 'utf8')
  assert.doesNotMatch(traps, /\bAC-\d+\b/)
})

test('B2: end-to-end test files do not count toward the PR line limit', () => {
  const r = makeRepo()
  r.config({ gateCommand: 'node gate.cjs' })
  r.put('gate.cjs', "console.log('1 passing')\n")
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4, stages: { 4: { enteredAt: '2026-10-31T00:00:00Z' } } })
  r.put('src/a.js', 'module.exports = 1\n')
  r.put('test/e2e/demo.e2e.cjs', Array.from({ length: 50 }, (_, i) => `// e2e line ${i}`).join('\n') + '\n')
  r.put('e2e/flow.spec.ts', Array.from({ length: 30 }, (_, i) => `// flow ${i}`).join('\n') + '\n')
  r.git('add', '-A')
  r.git('commit', '-q', '-m', 'work')
  const out = r.sdlc('gate', 'demo').out
  assert.match(out, /PR size: 1 of 300 code lines/)
})
