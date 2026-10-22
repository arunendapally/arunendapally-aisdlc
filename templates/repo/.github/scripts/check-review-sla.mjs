// Scheduled: find PRs waiting on review past their lane's deadline and escalate once,
// mentioning the requested reviewers and the backup team. Waiting is the main cause of slowness.
import { pathToFileURL } from 'node:url'

export const SLA_HOURS = { full: 24, light: 8, bug: 8, hotfix: 1 }
export const MARKER = '<!-- ai-sdlc-review-sla -->'

export function laneOf(pr) {
  const body = pr.body ?? ''
  if (/^## Incident\s*$/m.test(body)) return 'hotfix'
  if (/^## Repro\s*$/m.test(body)) return 'bug'
  return pr.labels?.map(l => l.name).find(n => n?.startsWith('lane:'))?.slice(5) ?? 'full'
}

// PRs that are open, ready, unapproved, past the deadline and not yet escalated.
export function overdue(prs, now = Date.now()) {
  return prs.filter(pr => !pr.draft && !pr.approved && !pr.escalated).flatMap(pr => {
    const lane = laneOf(pr)
    const hours = (now - Date.parse(pr.ready_at ?? pr.created_at)) / 36e5
    const limit = SLA_HOURS[lane] ?? SLA_HOURS.full
    return hours > limit ? [{ number: pr.number, lane, hours: Math.round(hours), limit, reviewers: (pr.requested_reviewers ?? []).map(r => r.login) }] : []
  })
}

export function comment(o, backup) {
  const who = [...o.reviewers.map(r => `@${r}`), backup].filter(Boolean).join(' ')
  return `${MARKER}\nThis ${o.lane} PR has waited ${o.hours}h for review; the deadline is ${o.limit}h. ${who} please review, or hand it to a backup reviewer. The agent pre-review lists where to look first.`
}

async function main() {
  const { GH_TOKEN, REPO, BACKUP_REVIEWERS = '' } = process.env
  const api = async (url, init = {}) => {
    const res = await fetch(`https://api.github.com/repos/${REPO}${url}`, {
      ...init,
      headers: { authorization: `Bearer ${GH_TOKEN}`, accept: 'application/vnd.github+json', ...init.headers },
    })
    return res.json()
  }
  const prs = await api('/pulls?state=open&per_page=100')
  for (const pr of prs) {
    const reviews = await api(`/pulls/${pr.number}/reviews?per_page=100`)
    pr.approved = reviews.some(r => r.state === 'APPROVED')
    const comments = await api(`/issues/${pr.number}/comments?per_page=100`)
    pr.escalated = comments.some(c => c.body?.includes(MARKER))
  }
  for (const o of overdue(prs)) {
    await api(`/issues/${o.number}/comments`, { method: 'POST', body: JSON.stringify({ body: comment(o, BACKUP_REVIEWERS) }) })
    console.log(`Escalated #${o.number}: ${o.hours}h waiting (deadline ${o.limit}h).`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main()
