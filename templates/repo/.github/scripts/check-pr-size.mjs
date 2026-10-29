// CI: small PRs get reviewed fast. Count changed lines, leaving out specs, docs, lock files
// and snapshots, and fail over the lane's limit unless a human added the "size-exception" label.
import { pathToFileURL } from 'node:url'

export const LIMITS = { full: 400, light: 300, bug: 200, hotfix: 100 }
export const EXCLUDES = [/^specs\//, /^docs\//, /\.md$/i, /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/, /\.lock$/, /\.snap$/,
  // Tests, project and tool boilerplate, and the plugin's state: the same list as the gate's prLineExcludes.
  /\.(test|spec)\.[^/]+$/, /_test\.go$/, /(^|\/)test_[^/]+\.py$/, /(Tests?)\.cs$/, /Test\.(java|kt)$/,
  /\.(sln|csproj)$/, /(^|\/)tsconfig[^/]*\.json$/, /(^|\/)launchSettings\.json$/, /(^|\/)\.gitignore$/, /^\.ai-sdlc\//]

export function countLines(files) {
  return files.filter(f => !EXCLUDES.some(re => re.test(f.filename))).reduce((sum, f) => sum + f.additions + f.deletions, 0)
}

export function verdict({ files, lane = 'full', labels = [] }) {
  const lines = countLines(files)
  const limit = LIMITS[lane] ?? LIMITS.full
  if (lines <= limit) return { ok: true, message: `${lines} changed lines, within the ${lane} limit of ${limit}.` }
  if (labels.includes('size-exception')) return { ok: true, message: `${lines} changed lines, over ${limit}, allowed by the size-exception label.` }
  return { ok: false, message: `${lines} changed lines is over the ${lane} limit of ${limit}. Split it into one PR per slice, or ask a reviewer to add "size-exception".` }
}

async function main() {
  const { GH_TOKEN, REPO, PR_NUMBER, LABELS = '[]', BODY = '' } = process.env
  const files = []
  for (let page = 1; ; page++) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100&page=${page}`, {
      headers: { authorization: `Bearer ${GH_TOKEN}`, accept: 'application/vnd.github+json' },
    })
    const batch = await res.json()
    files.push(...batch)
    if (batch.length < 100) break
  }
  const labels = JSON.parse(LABELS).map(l => l.name ?? l)
  const lane = /^## Incident\s*$/m.test(BODY) ? 'hotfix' : /^## Repro\s*$/m.test(BODY) ? 'bug' : (labels.find(l => l.startsWith('lane:'))?.slice(5) ?? 'full')
  const result = verdict({ files, lane, labels })
  console.log(result.message)
  process.exit(result.ok ? 0 : 1)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main()
