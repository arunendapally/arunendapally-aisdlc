// Issue #29: a light-lane feature had no place to say what "fast enough" or "safe enough" means. The
// PRD names each non-functional need as a requirement (so acceptance.feature tests it) or says why not,
// and a security answer that touches auth, payments or personal data needs the full lane.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRepo, READY_PRD, READY_FEATURE } from './helpers.mjs'

const INTENT = 'sdlc intent demo change: shoppers can save; smallest: a button; drop if: nobody saves'
const NONE = '- Performance: None, because a list of ten items\n- Security and privacy: None, because nothing new is stored\n- Accessibility: None, because no new screen\n- Limits and quotas: None, because one list per shopper\n'
const prd = nfr => `${READY_PRD.replace(/\n## Non-functional requirements\n[\s\S]*?(?=\n## |$)/, '')}\n## Non-functional requirements\n\n${nfr}`

function planRequest(nfr, { lane = 'light', autonomy = false, requirements = '' } = {}) {
  const r = makeRepo()
  if (autonomy) r.say('sdlc autonomy on a demo with no users and no data')
  r.sdlc('init', 'demo', ...(lane === 'full' ? ['--full'] : []))
  if (!autonomy) r.say(INTENT)
  const intent = autonomy ? '## Intent\n\n- Change: a\n- Smallest: b\n- Drop if: c\n\n' : ''
  r.put('specs/demo/prd.md', `${intent}${prd(nfr)}`.replace('- R1. (must) Save an item.', `- R1. (must) Save an item.${requirements}`))
  r.put('specs/demo/acceptance.feature', READY_FEATURE + (requirements ? '\n  @R2 @AC-2 @unit\n  Scenario: Fast enough\n    Given a list\n    When I open it\n    Then it shows in time\n' : ''))
  return { r, ...r.sdlc('request', 'demo') }
}

test('the PRD template and the Plan gate ask for non-functional requirements, with what is expected', () => {
  const r = makeRepo()
  r.sdlc('init', 'demo')
  r.say(INTENT)
  r.put('specs/demo/prd.md', READY_PRD.replace(/\n## Non-functional requirements\n[\s\S]*?(?=\n## |$)/, ''))
  r.put('specs/demo/acceptance.feature', READY_FEATURE)
  const out = r.sdlc('request', 'demo').out
  assert.match(out, /no "## Non-functional requirements" section: one line each for Performance, Security and privacy, Accessibility, and Limits and quotas/)
  assert.match(out, /requirement \(R3\) or "None, because \.\.\."/)
})

test('each non-functional need is a requirement or says why not', () => {
  const missing = planRequest('- Performance: fast\n- Accessibility: None, because no screen\n')
  assert.notEqual(missing.status, 0)
  assert.match(missing.out, /"Performance: fast" is neither a requirement \(R1, R2, \.\.\.\) nor "None, because \.\.\."/)
  assert.match(missing.out, /no "- Security and privacy:" line/)
  assert.match(missing.out, /no "- Limits and quotas:" line/)

  const unknown = planRequest(NONE.replace('Performance: None, because a list of ten items', 'Performance: R9'))
  assert.match(unknown.out, /Performance names R9, which is not in "## Requirements"/)

  const ok = planRequest(NONE.replace('Performance: None, because a list of ten items', 'Performance: R2'), { requirements: '\n- R2. (should) The list opens in under 200 ms at p95.' })
  assert.equal(ok.status, 0, ok.out)
  assert.match(ok.out, /waiting on/)
})

test('a security need that touches personal data, auth or payments needs the full lane', () => {
  const nfr = NONE.replace('Security and privacy: None, because nothing new is stored', 'Security and privacy: R2')
  const reqs = '\n- R2. (must) The saved list stores the shopper\'s personal data only in their account.'
  const light = planRequest(nfr, { requirements: reqs })
  assert.notEqual(light.status, 0)
  assert.match(light.out, /Security and privacy touches personal data, which needs the full lane: ask a human to type "sdlc lane demo full"/)

  const full = planRequest(nfr, { lane: 'full', requirements: reqs })
  assert.equal(full.status, 0, full.out)

  const none = planRequest(NONE.replace('nothing new is stored', 'no personal data is stored'))
  assert.equal(none.status, 0, `"None, because" is not a high-risk answer: ${none.out}`)

  const auto = planRequest(nfr, { autonomy: true, requirements: reqs })
  assert.equal(auto.status, 0, auto.out)
  assert.match(auto.out, /moves to the full lane/)
  assert.equal(auto.r.state('demo').lane, 'full')
})
