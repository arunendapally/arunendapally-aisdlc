// PostToolUse on AskUserQuestion: a person answers a gate or intent question with a click, instead of
// typing a command (owner feedback, 29 Oct). The question carries a marker written by "sdlc ask":
// "[gate <feature> <stage> <fingerprint>]" or "[intent <feature>]". The choice is recorded by the
// user-prompt hook, with every check a typed command gets. The pre-tool guard refuses a marked question
// the agent tried to answer itself, and answers inside a subagent are ignored.
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { root, readState, readStdin } from '../lib.mjs'

const input = readStdin()
if (input.tool_name !== 'AskUserQuestion' || input.agent_id) process.exit(0)
const dir = root(input.cwd)
const questions = input.tool_input?.questions ?? []

// The answers: in the tool input once the person has answered, or in the tool's result text.
const answers = { ...(input.tool_input?.answers ?? {}), ...(input.tool_response?.answers ?? {}) }
const text = typeof input.tool_response === 'string' ? input.tool_response : JSON.stringify(input.tool_response ?? '')
for (const m of text.matchAll(/\\?"((?:[^"\\]|\\.)+?)\\?"=\\?"((?:[^"\\]|\\.)*?)\\?"/g)) answers[m[1]] ??= m[2]
const answer = q => answers[q.question]?.trim()

const said = []
const record = prompt => {
  const hook = path.join(path.dirname(fileURLToPath(import.meta.url)), 'user-prompt.mjs')
  const r = spawnSync('node', [hook], { cwd: dir, input: JSON.stringify({ prompt, cwd: dir, session_id: input.session_id }), encoding: 'utf8' })
  said.push(r.stdout.trim() ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext.replace(/^\[ai-sdlc\] /, '') : 'Nothing recorded.')
}
const plain = s => s.replace(/[;\n]+/g, ',').replace(/\s+/g, ' ').trim()

for (const q of questions) {
  const gate = q.question?.match(/\[gate ([a-z0-9-]+) (\d) ([0-9a-f]*)\]$/)
  if (!gate || !answer(q)) continue
  const [, feature, stage, fp] = gate
  const current = readState(dir, feature)?.gates?.[stage]
  if (current?.status !== 'waiting' || !current.fingerprint?.startsWith(fp)) {
    said.push(`Gate ${stage} for ${feature}: the question no longer matches what is waiting, so nothing was recorded. Run "sdlc ask ${feature}" again.`)
    continue
  }
  record(answer(q) === 'Approve' ? `sdlc approve ${feature} ${stage}` : `sdlc reject ${feature} ${stage} ${plain(answer(q) === 'Send back' ? 'sent back from the question, no reason given' : answer(q))}`)
}

const intent = questions.filter(q => /\[intent [a-z0-9-]+\]$/.test(q.question ?? ''))
if (intent.length) {
  const feature = intent[0].question.match(/\[intent ([a-z0-9-]+)\]$/)[1]
  const part = header => intent.find(q => q.header?.toLowerCase() === header)
  const parts = [['change', 'change'], ['smallest', 'smallest'], ['drop if', 'drop if']].map(([h, label]) => [label, part(h) && answer(part(h))])
  if (parts.every(([, a]) => a)) record(`sdlc intent ${feature} ${parts.map(([label, a]) => `${label}: ${plain(a)}`).join('; ')}`)
  else said.push(`The intent for ${feature} needs all three answers; nothing was recorded.`)
}

if (said.length) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `[ai-sdlc] ${said.join(' ')}` } }))
