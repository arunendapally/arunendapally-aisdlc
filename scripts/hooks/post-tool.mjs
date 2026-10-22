// PostToolUse: append every tool call to the local audit trail. Logs only, blocks nothing.
import { root, audit, readStdin } from '../lib.mjs'

const input = readStdin()
const ti = input.tool_input ?? {}
audit(root(input.cwd), {
  event: 'tool',
  tool: input.tool_name,
  agent: input.agent_type ?? 'main',
  target: String(ti.file_path ?? ti.command ?? ti.url ?? ti.pattern ?? '').slice(0, 200),
  session: input.session_id,
})
