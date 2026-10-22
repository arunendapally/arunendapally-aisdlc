// CI: the PR body holds every section its lane needs, each with content, and an agent
// pre-review that names the risk and has no open findings.
import { pathToFileURL } from 'node:url'

const VERIFY = ['## Test results', '## Pre-review', '## Not verified']
export const SECTIONS = {
  full: ['## Summary', ...VERIFY],
  bug: ['## Repro', '## Expected and actual', '## Root cause', '## Fix', ...VERIFY],
  hotfix: ['## Incident', '## Fix', '## Rollback', ...VERIFY],
}

// The lane is read from the body itself, so the check needs no access to the repo.
export function laneOf(body) {
  if (/^## Incident\s*$/m.test(body)) return 'hotfix'
  if (/^## Repro\s*$/m.test(body)) return 'bug'
  return 'full'
}

function section(body, heading) {
  const lines = body.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)
  const at = lines.findIndex(l => l.trim() === heading)
  if (at === -1) return null
  const end = lines.findIndex((l, i) => i > at && /^#{1,2} /.test(l))
  return lines.slice(at + 1, end === -1 ? undefined : end).join('\n').trim()
}

export function problems(body = '') {
  const out = []
  for (const h of SECTIONS[laneOf(body)]) {
    const text = section(body, h)
    if (text === null) out.push(`missing section: ${h}`)
    else if (!text) out.push(`empty section: ${h}`)
  }
  const pre = section(body, '## Pre-review') ?? ''
  if (pre && !/Risk:\s*(low|medium|high)\b/i.test(pre)) out.push('pre-review gives no "Risk: low|medium|high"')
  if (pre && !/Open findings:\s*0\b/i.test(pre)) out.push('pre-review has open findings')
  return out
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const found = problems(process.env.BODY ?? '')
  console.log(found.length ? found.join('\n') : `PR body complete (${laneOf(process.env.BODY ?? '')} lane).`)
  process.exit(found.length ? 1 : 0)
}
