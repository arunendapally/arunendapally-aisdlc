// The test matrix: every Gherkin scenario (@AC-n) mapped to the tests that prove it. A criterion with no
// test fails the Verify gate; the scenario's level is a hint, since levels are guessed from paths.
import fs from 'node:fs'
import path from 'node:path'
import { git, loadConfig, matches } from './lib.mjs'
import { lint } from './gherkin.mjs'

// Where each level's tests live by default. A repo can add its own globs in config "testLevels".
// E2E is recognised by folder or an ".e2e" name only: "*.spec.ts" is a unit test in Jest, Angular and
// NestJS repos (finding F5), so it stays unit unless it sits in an e2e folder.
export const DEFAULT_LEVELS = {
  unit: ['**/*.test.*', '**/*.spec.*', '**/*_test.go', '**/test_*.py', '**/*_test.py', 'test/unit/**', 'tests/unit/**',
    '**/*Tests.cs', '**/*Test.cs', '**/*Tests.java', '**/*Test.java', '**/*Test.kt'],
  subsystem: ['**/*.int.test.*', '**/*.integration.test.*', 'test/integration/**', 'tests/integration/**', 'test/subsystem/**', 'tests/subsystem/**',
    '**/*IntegrationTests.cs', '**/*IT.java'],
  api: ['**/*.postman_collection.json', 'test/api/**', 'tests/api/**', '**/*.api.test.*', '**/*ApiTests.cs', '**/*ApiTest.java'],
  e2e: ['e2e/**', 'tests/e2e/**', 'test/e2e/**', 'playwright/**', '**/*.e2e.*', '**/*.e2e-spec.*'],
}

// A test traces a feature's criterion only when it names the criterion and the file names the feature
// (in a describe block, a title or a comment), because every feature numbers from AC-1 (finding F1).
export function traces(text, file, feature, ac) {
  return new RegExp(`\\b${ac}\\b`, 'i').test(text) && (file.includes(feature) || new RegExp(`\\b${feature.replace(/[-]/g, '[-_ ]')}\\b`, 'i').test(text))
}

export function levels(dir) {
  const own = loadConfig(dir).testLevels ?? {}
  return Object.fromEntries(Object.entries(DEFAULT_LEVELS).map(([k, v]) => [k, [...v, ...(own[k] ?? [])]]))
}

// The more specific levels claim a file first, so an integration test is not counted as a unit test.
export function levelOf(file, map) {
  for (const level of ['e2e', 'api', 'subsystem', 'unit']) if (matches(file, map[level])) return level
  return null
}

export function matrix(dir, feature) {
  const cfg = loadConfig(dir)
  const file = path.join(dir, cfg.specsDir, feature, 'acceptance.feature')
  if (!fs.existsSync(file)) return { rows: [], problems: ['no acceptance.feature, so there is nothing to trace'] }
  const scenarios = lint(fs.readFileSync(file, 'utf8')).scenarios.filter(s => s.ac)
  const map = levels(dir)
  const files = [...new Set([...git('ls-files', dir).split('\n'), ...git('ls-files --others --exclude-standard', dir).split('\n')])]
    .filter(f => f && levelOf(f, map) && fs.existsSync(path.join(dir, f)) && fs.statSync(path.join(dir, f)).size < 2e6)
  const texts = files.map(f => ({ file: f, level: levelOf(f, map), text: fs.readFileSync(path.join(dir, f), 'utf8') }))
  const rows = scenarios.map(s => {
    const id = s.ac.slice(1)
    const found = texts.filter(t => traces(t.text, t.file, feature, id))
    return { ac: id, level: s.level, requirements: s.requirements, name: s.name, tests: found.map(t => `${t.file} (${t.level})`), traced: found.length > 0 }
  })
  // A file that names the criterion but is not a known test file is the likelier cause: say so.
  const unrecognised = ac => git(`grep --untracked -l -w ${ac} -- .`, dir).split('\n').filter(f => f && !levelOf(f, map) && !f.startsWith(`${cfg.specsDir}/`))
  const problems = rows.filter(r => !r.traced).map(r => {
    const near = unrecognised(r.ac)
    return near.length
      ? `${r.ac} has no test: ${near.slice(0, 3).join(', ')} names it but is not a recognised test file. Rename it to a test pattern, or a person adds its pattern to "testLevels" in .ai-sdlc/config.json`
      : `${r.ac} has no test: name a test after it ("${r.ac} ${r.name}") in a file that names ${feature}`
  })
  return { rows, problems }
}

export function matrixText({ rows, problems }) {
  const lines = ['| AC | Level | Requirements | Scenario | Tests | Traced |', '|---|---|---|---|---|---|']
  for (const r of rows) lines.push(`| ${r.ac} | ${r.level} | ${r.requirements.join(', ')} | ${r.name} | ${r.tests.join('<br>') || 'none'} | ${r.traced ? 'yes' : 'NO'} |`)
  return [...lines, '', ...(problems.length ? problems.map(p => `- ${p}`) : ['Every criterion has a test.'])].join('\n')
}
