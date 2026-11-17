// unattended-runs: a run needs a person only at the intent and the PR.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeRepo, plugin } from './helpers.mjs'
import { proofProblems } from '../scripts/loop.mjs'
import { withIntent } from '../scripts/lib.mjs'

const read = f => fs.readFileSync(path.join(plugin, f), 'utf8')
const SLICES = `## Outcome

Shoppers come back to items: 8% of saved items bought in 14 days (Priya).

## Slices

- save-api: the contract. Horizon: now. Kind: enabler. Goes live: compatible. Depends on: none. Status: planned
- save-list: a shopper saves an item. Horizon: now. Kind: slice. Goes live: flag SAVED. Depends on: save-api. Status: planned
- save-share: a shopper shares the list. Horizon: later. Kind: slice. Goes live: after save-list, because the link opens the list. Depends on: save-list. Status: planned
`

test('AC-1 a command that only reads is not refused as a person\'s action', () => {
  const r = makeRepo()
  assert.equal(r.bash('cat scripts/hooks/user-prompt.mjs'), 'allow')
  assert.equal(r.bash('grep -rn "sdlc approve" docs'), 'allow')
  assert.equal(r.bash('node scripts/sdlc.mjs approve demo 1'), 'deny')
  assert.equal(r.bash('cat notes.txt && gh pr merge 5'), 'deny')
  assert.equal(r.bash('grep -rn "sdlc approve" docs > out.txt'), 'deny')
  assert.equal(r.bash('cat "$(gh pr merge 5)"'), 'deny', 'command substitution runs code')
  // Pre-review F1: a read whose output another segment runs is judged whole, as before.
  assert.equal(r.bash('grep -h "gh pr merge" notes.txt | sh'), 'deny')
  assert.equal(r.bash('cat <<< "gh pr merge 5" | bash'), 'deny')
  assert.equal(r.bash('git log -1 --format="gh pr merge 5" | xargs -I{} sh -c {}'), 'deny')
  // Pre-review F6: a name that only starts like a read verb is not one.
  assert.equal(r.bash('cat.sh scripts/hooks/user-prompt.mjs'), 'deny')
  assert.equal(r.bash('git show-x "sdlc approve demo 1"'), 'deny')
})

test('AC-2 two refused reads do not hold the session', () => {
  const r = makeRepo()
  r.put('big.txt', 'line\n'.repeat(2000))
  for (let i = 0; i < 2; i++) assert.equal(r.tool('Bash', { command: 'cat big.txt' }, 's1').decision, 'deny')
  assert.equal(r.tool('Write', { file_path: path.join(r.repo, 'notes.txt'), content: 'x' }, 's1').decision, 'allow')
  // Pre-review F2: the Read tool's refusal of a large file is the same read.
  for (let i = 0; i < 2; i++) assert.equal(r.tool('Read', { file_path: path.join(r.repo, 'big.txt') }, 's3').decision, 'deny')
  assert.equal(r.tool('Write', { file_path: path.join(r.repo, 'notes.txt'), content: 'x' }, 's3').decision, 'allow')
})

test('AC-3 two tries at a secrets file still hold the session, though they only read', () => {
  const r = makeRepo()
  assert.equal(r.tool('Bash', { command: 'cat .env' }, 's4').decision, 'deny')
  assert.equal(r.tool('Bash', { command: 'head .env' }, 's4').decision, 'deny')
  assert.match(r.tool('Write', { file_path: path.join(r.repo, 'notes.txt'), content: 'x' }, 's4').reason, /waiting for the user/)
})

test('AC-3 two refused actions still hold the session', () => {
  const r = makeRepo()
  for (let i = 0; i < 2; i++) assert.equal(r.tool('Bash', { command: 'gh pr merge 5' }, 's2').decision, 'deny')
  const held = r.tool('Write', { file_path: path.join(r.repo, 'notes.txt'), content: 'x' }, 's2')
  assert.equal(held.decision, 'deny')
  assert.match(held.reason, /waiting for the user/)
})

for (const [what, file, body, gate, proof] of [
  ['a package.json whose test runs node:test', 'package.json', '{"scripts":{"test":"node --test"}}', 'npm test', 'node --test {files}'],
  ['a pyproject.toml', 'pyproject.toml', '[project]\nname = "x"\n', 'pytest', 'pytest {files}'],
]) {
  test(`AC-4 setting up a new repo that holds ${what} puts its checks in place`, () => {
    const r = makeRepo()
    fs.rmSync(path.join(r.repo, '.ai-sdlc'), { recursive: true })
    r.put(file, body)
    const out = r.sdlc('init-repo')
    assert.equal(out.status, 0, out.out)
    const cfg = JSON.parse(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'config.json'), 'utf8'))
    assert.equal(cfg.gateCommand, gate)
    assert.equal(cfg.proofCommand, proof)
  })
}

test('AC-5 setting up a repo that already has its settings changes none of them', () => {
  const r = makeRepo()
  r.config({ gateCommand: '' })
  r.put('package.json', '{"scripts":{"test":"node --test"}}')
  const file = path.join(r.repo, '.ai-sdlc', 'config.json')
  const before = fs.readFileSync(file, 'utf8')
  const out = r.sdlc('init-repo')
  assert.equal(fs.readFileSync(file, 'utf8'), before)
  assert.match(out.out, /npm test/)
  assert.match(out.out, /node --test \{files\}/)
})

test('AC-4 a placeholder test script or an unreadable package.json sets no check', () => {
  for (const body of ['{"scripts":{"test":"echo \\"Error: no test specified\\" && exit 1"}}', '{ not json']) {
    const r = makeRepo()
    fs.rmSync(path.join(r.repo, '.ai-sdlc'), { recursive: true })
    r.put('package.json', body)
    const out = r.sdlc('init-repo')
    assert.equal(out.status, 0, out.out)
    assert.equal(JSON.parse(fs.readFileSync(path.join(r.repo, '.ai-sdlc', 'config.json'), 'utf8')).gateCommand, '')
  }
})

test('AC-6 Verify needs the proof or a person\'s waiver', () => {
  const r = makeRepo()
  const state = { feature: 'demo', lane: 'light' }
  const pr = '## Not verified\n\nThe test proof did not run.\n'
  const refused = proofProblems(r.repo, state, pr, { proofCommand: '' })
  assert.equal(refused.problems.length, 1)
  assert.match(refused.problems[0], /proof-command/)
  assert.match(refused.problems[0], /proofWaived/)
  assert.deepEqual(proofProblems(r.repo, state, pr, { proofCommand: '', proofWaived: 'legacy suite, no CI' }).problems, [])
  assert.equal(proofProblems(r.repo, state, pr, { proofCommand: '', proofWaived: true }).problems.length, 1, 'a waiver needs its reason')
  for (const lane of ['bug', 'task', 'hotfix']) assert.deepEqual(proofProblems(r.repo, { ...state, lane }, pr, { proofCommand: '' }).problems, [], `${lane} is unaffected`)
  assert.equal(r.bash('node scripts/sdlc.mjs proof-command "true"'), 'deny', 'only a person sets the proof')
})

test('AC-7 one request names every stage from intent to the PR', () => {
  const text = read('commands/run.md')
  const at = s => text.indexOf(s)
  const order = ['/ai-sdlc:define', '/ai-sdlc:design', '/ai-sdlc:build', '/ai-sdlc:verify', 'ends at a raised PR']
  for (const s of order) assert.notEqual(at(s), -1, `${s} is named`)
  assert.deepEqual([...order].sort((a, b) => at(a) - at(b)), order)
  for (const stop of [/intent/, /gate a person holds/, /conflict/, /ESCALATE/]) assert.match(text, stop)
  assert.match(text, /sdlc\.mjs" next/)
})

test('AC-8 the next slice is the first one whose dependencies are complete', () => {
  const r = makeRepo()
  r.put('specs/saved/slices.md', SLICES)
  r.sdlc('init', 'save-api', '--capability', 'saved')
  r.setState('save-api', { closedAt: new Date().toISOString() })
  const out = r.sdlc('next', 'saved')
  assert.equal(out.status, 0, out.out)
  assert.match(out.out, /^Next: save-list \(not started\)/)
})

test('AC-9 a slice whose dependency is not complete is not offered', () => {
  const r = makeRepo()
  r.put('specs/saved/slices.md', SLICES)
  r.sdlc('init', 'save-api', '--capability', 'saved')
  r.setState('save-api', { stage: 4 })
  assert.match(r.sdlc('next', 'saved').out, /^Next: save-api \(at Build\)/)
  r.setState('save-api', { closedAt: new Date().toISOString() })
  r.sdlc('init', 'save-list', '--capability', 'saved')
  r.setState('save-list', { closedAt: new Date().toISOString() })
  assert.match(r.sdlc('next', 'saved').out, /^Nothing is ready: .*save-share is placed later/)
})

test('AC-9 a dependency that was shipped counts, and one retired, dropped or unknown is named', () => {
  const slices = deps => `## Slices\n\n- a: one. Horizon: now. Depends on: none. Status: ${deps}\n- b: two. Horizon: now. Depends on: a, ghost. Status: planned\n`
  const r = makeRepo()
  r.put('specs/cap/slices.md', slices('shipped'))
  assert.match(r.sdlc('next', 'cap').out, /b waits for ghost \(not a slice in slices\.md\)/)
  r.put('specs/cap/slices.md', slices('shipped').replace(', ghost', ''))
  assert.match(r.sdlc('next', 'cap').out, /^Next: b /)
  r.put('specs/cap/slices.md', slices('dropped').replace(', ghost', ''))
  assert.match(r.sdlc('next', 'cap').out, /b waits for a \(dropped\)/)
  r.put('specs/cap/slices.md', slices('planned').replace(', ghost', ''))
  r.sdlc('init', 'a', '--capability', 'cap')
  r.setState('a', { closedAt: new Date().toISOString(), closedReason: 'abandoned' })
  assert.match(r.sdlc('next', 'cap').out, /b waits for a \(closed by a person, not finished\)/)
})

test('AC-10 a new slice carries the capability\'s intent', () => {
  const r = makeRepo()
  r.put('specs/saved/slices.md', SLICES)
  r.sdlc('init', 'save-api', '--capability', 'saved')
  r.setState('save-api', { intent: { change: 'shoppers keep items', smallest: 'a save button', dropIf: 'nobody saves', by: 'Test Human', at: '2026-11-12T00:00:00.000Z' } })
  r.sdlc('init', 'save-list', '--capability', 'saved')
  const intent = r.state('save-list').intent
  assert.equal(intent.change, 'shoppers keep items')
  assert.equal(intent.by, 'Test Human')
  assert.equal(intent.inheritedFrom, 'save-api')
  // Pre-review F5: the PRD, which the person reviews, says where the words came from.
  assert.match(withIntent('## Intent\n', intent), /Typed by Test Human on 2026-11-12 for save-api, and carried over/)
  r.setState('save-api', { intent: undefined })
  r.sdlc('init', 'save-share', '--capability', 'saved')
  assert.equal(r.state('save-share').intent, undefined, 'a carried-over intent is not carried again')
})

test('AC-11 the first messages say who decides', () => {
  const r = makeRepo()
  const said = r.hook('session-start', {})
  assert.match(said, /a person decides at the intent and the PR/)
  assert.doesNotMatch(said, /Humans own every gate|approved only by a human typing/)
  assert.doesNotMatch(read('README.md'), /approve each gate by typing/)
  assert.doesNotMatch(read('.claude-plugin/plugin.json'), /human-only gate approvals/)
  assert.doesNotMatch(read('.claude-plugin/marketplace.json'), /humans at every gate/)
  assert.doesNotMatch(read('docs/getting-started.md'), /type your intent in the Claude Code prompt/)
  assert.doesNotMatch(read('skills/org-ai-sdlc/SKILL.md'), /intent, typed by them/)
})
