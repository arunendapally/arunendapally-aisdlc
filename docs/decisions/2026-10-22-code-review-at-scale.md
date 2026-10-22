# Council: what to take from "How the Claude Code team does code review"

*2026-10-22. Chaired by the CTO agent. Decisions in [ADR-0005](../adr/0005-review-converges-and-risk-is-set-by-the-change.md).*

The founder asked what the plugin should take from the article [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/) (claude.dev, 15 October 2026). Five of the plugin's own agents answered: tech lead, safe AI SDLC, SRE, agentic AI and QA.

## What the article says, in short

- The goal is the least human review time that does not raise reverts or incidents; those rates are the guardrail.
- Most review happens before the PR, by an agent that verifies its work and a fresh-context reviewer.
- Review must converge. One PR went through more than fifty review rounds overnight. The fix: a cap of three rounds, diff-only re-review, no repeated findings, flag the class of bug.
- Human approval is scaled by risk, and the change sets the tier, not the author. Some paths always need a person. An agent's approval never counts as a person's. An approval covers one commit.
- The PR template asks how the change was tested, its risk and how to revert it.

## Where the council agreed

| Proposal | Decision | Where it lives |
|---|---|---|
| Cap review rounds | Kept, and enforced in code, not prose. A Verify request the review refuses (ledger, pre-review or its risk) is a round. After three, `request` says "step back, rethink the approach" until a human types `sdlc reject <f> 5 rethink: ...`. | `scripts/sdlc.mjs` request, `reviewRoundCap`; reset in `scripts/hooks/user-prompt.mjs` |
| Re-review only the new diff; no repeats | Kept. The packet lists the files changed since the last review. A new ledger row on the same file and checklist item as a closed row is refused: reopen it or name the class of bug once. | `scripts/review.mjs` packet and `ledgerProblems` |
| An approval covers what was checked | Kept, keyed on content, not the commit id (tech lead): committing, amending or rebasing the same content does not lapse it; new content does. The spec gate keys on the PRD and the feature file. Release refuses code that changed after Verify reviewed it. | `gateFingerprint`, `unreviewedChanges` in `scripts/loop.mjs`; the approve hook |
| `sdlc close <feature> <reason>` | Kept, human-only, a reason required, refused while a lesson is owed or a postmortem is open (SRE). Closed work counts as abandoned, not shipped. | `scripts/hooks/user-prompt.mjs`, `deployPatterns` |
| PR template with risk and revert | Kept. One template for the plugin, the repo kit and this repo, with a test that they match. Every pre-review needs a `Revert:` line, checked by the gate and by CI. PR #1 is closed. | `skills/org-ai-sdlc/templates/pr.md`, `check-pr-body.mjs` |

## A gap the council found

The safe AI SDLC expert and the agentic AI expert found that the stricter ledger rule turned on when the pre-review's own text said `Risk: high`. An agent that wrote "Risk: low" lowered its own scrutiny. Fixed now: the change sets a floor from what it touches (paths that always need a person, destructive migrations, any code), and the label can raise the tier but never lower it. A label below the floor is refused.

The SRE and agentic AI expert also found that earned trust could promote `bug:5` and `task:5`, merges of agent-chosen work, with nothing counting their reverts. Both are now in `neverTrust`: every merge needs a person.

## Contested: zero-human merges

The article lets low-risk changes merge on automated checks alone. All five experts said not yet here, and the safe AI SDLC expert held a blocking vote.
- *Settled:* [ADR-0005](../adr/0005-review-converges-and-risk-is-set-by-the-change.md) records the tier and computes it on every Verify request (shadow mode), but every merge still needs a person, which keeps ADR-0003. Zero-human merges for low risk are a separate decision for the founder, and need first: a revert counter, at least fifty low-tier merges reviewed by a person with no reverts or incidents and no serious human findings, a recall eval built from real escapes, and approvals bound to a verified identity rather than `git config user.name`.

## Do not copy

- **Agents voting on findings** (all five): errors from one model are correlated, and it doubles the cost. Our ledger already ends every finding as fixed or wontfix with a reason.
- **Lighter paths for trusted authors** (QA, tech lead, agentic AI): the author here is often an agent. The change sets the path.
- **"The person who directed the agent counts as a reviewer"** for medium and high risk (safe AI SDLC, SRE): it collapses author and reviewer into one person.
- **"Additive behind a flag" as low risk** (SRE, safe AI SDLC): flipping the flag is the real deploy.
- **Noise measured only by whether authors resolved a comment** (QA): an author waving off a finding is not proof it was wrong.

## A guard to narrow

While building this, the Bash guard refused two commands that only read a file, or wrote source code, whose text mentioned `.ai-sdlc` and `.github`. It matches guardrail names anywhere in a command. By the plugin's own denial rule the session handed back after the second refusal, which worked as designed, but the guard should look at the paths a command reads or writes, not at any text inside it.
