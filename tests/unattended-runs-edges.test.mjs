// unattended-runs v2 (R9 to R13): answers land with the feature, proved tests and the world outside the
// repo are safe from one-liners, code waits for started work, and setup copies no file nothing reads.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeRepo, plugin } from './helpers.mjs'

const onMain = () => {
  const r = makeRepo()
  r.git('checkout', '-q', 'main')
  return r
}
const intentQuestions = feature => [['Change', 'shoppers keep items'], ['Smallest', 'a save button'], ['Drop if', 'nobody saves']]
  .map(([header, answer]) => ({ header, question: `${header}? [intent ${feature}]`, answer }))

test('AC-12 an answer given in the main checkout is recorded in the feature\'s worktree', () => {
  const r = onMain()
  assert.equal(r.sdlc('worktree', 'light', 'saved-items').status, 0)
  const where = path.join(r.repo, '.claude', 'worktrees', 'saved-items')
  const qs = intentQuestions('saved-items')
  r.hook('answers', {
    tool_name: 'AskUserQuestion',
    tool_input: { questions: qs.map(({ header, question }) => ({ header, question })), answers: Object.fromEntries(qs.map(q => [q.question, q.answer])) },
  })
  const state = JSON.parse(fs.readFileSync(path.join(where, 'specs', 'saved-items', 'state.json'), 'utf8'))
  assert.equal(state.intent?.change, 'shoppers keep items')
  assert.equal(state.intent?.by, 'Test Human')
  assert.equal(fs.existsSync(path.join(r.repo, 'specs', 'saved-items')), false, 'no stray feature in the main checkout')
})

test('AC-13 a one-line program cannot change a proved test', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.setState('demo', { stage: 4, lock: { at: new Date().toISOString(), files: { 'tests/save.test.mjs': 'abc' } } })
  r.put('tests/save.test.mjs', 'x\n')
  assert.equal(r.bash('node -e "require(\'fs\').writeFileSync(\'tests/save.test.mjs\', \'\')"'), 'deny')
  assert.equal(r.bash('python -c "open(\'tests/save.test.mjs\', \'w\')"'), 'deny')
  assert.equal(r.bash('node --test tests/save.test.mjs'), 'allow')
  assert.equal(r.bash('cat tests/save.test.mjs'), 'allow')
  assert.equal(r.bash('node -e "console.log(1)"'), 'allow', 'a one-liner that names no proved test is not refused')
})

test('AC-14 code is not changed on the protected branch before work is started', () => {
  const r = onMain()
  const code = r.tool('Write', { file_path: path.join(r.repo, 'src', 'app.js'), content: 'x' })
  assert.equal(code.decision, 'deny')
  assert.match(code.reason, /\/ai-sdlc:start/)
  assert.equal(r.write('docs/notes.md'), 'allow')
  r.git('checkout', '-q', 'feature/demo')
  assert.equal(r.write('src/app.js'), 'allow', 'a branch of its own is not the protected branch')
})

test('AC-15 a repo that does not run the plugin is left alone', () => {
  const r = onMain()
  fs.rmSync(path.join(r.repo, '.ai-sdlc'), { recursive: true })
  assert.equal(r.write('src/app.js'), 'allow')
})

test('AC-16 a folder tree outside the repo cannot be deleted', () => {
  const r = makeRepo()
  // Outside the repo means anywhere else, scratch folders too: the repo is the agent's, the rest the person's.
  for (const command of ['rm -rf ../other-repo', 'rm -rf ~', 'rm -r -f /c/Users', 'rm --recursive $HOME/projects', 'Remove-Item -Recurse -Force C:\\Users\\someone',
    'rm -rf $UNKNOWN_DIR', `rm -rf ${path.join(os.tmpdir(), 'scratch-x').split(path.sep).join('/')}`, 'cd .. && rm -rf other-repo']) {
    assert.equal(r.bash(command), 'deny', command)
  }
  for (const command of ['rm -rf build', 'rm -rf ./dist node_modules', 'rm ../notes.txt', 'Remove-Item -Recurse -Force .\\build', 'rm -f old.log']) {
    assert.equal(r.bash(command), 'allow', command)
  }
})

test('AC-17 setup gives a repo no autonomy levels file', () => {
  const r = makeRepo()
  fs.rmSync(path.join(r.repo, '.ai-sdlc'), { recursive: true })
  assert.equal(r.sdlc('init-repo').status, 0)
  assert.equal(fs.existsSync(path.join(r.repo, '.ai-sdlc', 'autonomy.json')), false)
  assert.doesNotMatch(fs.readFileSync(path.join(plugin, 'docs', 'getting-started.md'), 'utf8'), /autonomy\.json/)
})
