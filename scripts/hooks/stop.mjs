// Stop and SubagentStop: refuse to finish while added lines hold a secret. Only added lines are
// checked, so text that was already there is left alone. House style is checked when a file is written.
import fs from 'node:fs'
import path from 'node:path'
import { root, git, readStdin } from '../lib.mjs'

const SECRET = /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|sk-[A-Za-z0-9_-]{32,})/

const input = readStdin()
if (input.stop_hook_active) process.exit(0)
const dir = root(input.cwd)

const added = []
let file = ''
for (const line of git('diff -U0 --no-color HEAD', dir).split('\n')) {
  if (line.startsWith('+++ ')) file = line.slice(6)
  else if (line.startsWith('+') && !line.startsWith('+++')) added.push([file, line.slice(1)])
}
for (const f of git('ls-files --others --exclude-standard', dir).split('\n').filter(Boolean)) {
  const full = path.join(dir, f)
  if (fs.statSync(full).size > 1e6) continue
  for (const line of fs.readFileSync(full, 'utf8').split('\n')) added.push([f, line])
}

const problems = []
for (const [f, line] of added) {
  if (f.startsWith('.ai-sdlc/')) continue
  if (SECRET.test(line)) problems.push(`${f}: looks like a secret`)
}
if (problems.length) {
  const unique = [...new Set(problems)].slice(0, 20)
  console.log(JSON.stringify({ decision: 'block', reason: `[ai-sdlc] Fix before finishing:\n- ${unique.join('\n- ')}` }))
}
