// CI: a PR from a feature branch merges only after its Build gate was approved, and that
// approval is confirmed by GitHub itself, not only by files on the branch: state.json can be
// written by anyone who can push, so the PR also needs an approving review from a human who
// is not its author.
import fs from 'node:fs'
import path from 'node:path'

const { HEAD_REF, GH_TOKEN, REPO, PR_NUMBER, PR_AUTHOR } = process.env
const dir = 'specs'
let failed = false
let features = 0

if (fs.existsSync(dir)) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name, 'state.json')
    if (!fs.existsSync(file)) continue
    const state = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (state.branch !== HEAD_REF) continue
    features++
    const gate = state.gates?.['4']
    if (gate?.status === 'approved') console.log(`${name}: gate 4 recorded as approved by ${gate.by}`)
    else {
      console.log(`${name}: gate 4 (Build) is not approved`)
      failed = true
    }
  }
}

if (features) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}/reviews?per_page=100`, {
    headers: { authorization: `Bearer ${GH_TOKEN}`, accept: 'application/vnd.github+json' },
  })
  const reviews = await res.json()
  const humans = reviews.filter(r => r.state === 'APPROVED' && r.user?.type === 'User' && r.user.login !== PR_AUTHOR)
  if (humans.length) console.log(`Approved on GitHub by: ${[...new Set(humans.map(r => r.user.login))].join(', ')}`)
  else {
    console.log('No approving review from a human other than the PR author. Re-run this check after approval.')
    failed = true
  }
}
process.exit(failed ? 1 : 0)
