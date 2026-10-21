---
description: Agent code review of a PR before a human looks. Builds the review packet, runs the right expert lenses, records every finding in the review.md ledger, and writes the Pre-review section so human review takes minutes.
argument-hint: <feature-slug>
---

Delegate to the `pre-reviewer` agent for `$ARGUMENTS`.

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" review $ARGUMENTS` writes `specs/$ARGUMENTS/review-packet.md` (risk signals, criteria with no test, deleted tests, lenses to run) and starts `specs/$ARGUMENTS/review.md`, the findings ledger.
2. The pre-reviewer runs the lenses the packet lists in parallel and records every finding in the ledger: severity, `file:line`, checklist item, what is wrong, status, source.
3. Findings go back to the `builder` through the `tech-lead`. Fix, re-run the gate, re-review, update each row. Cap 3 rounds (`node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS pre-review`), then escalate.
4. When nothing above nit is open, it writes `## Pre-review` in the PR body: `Risk:`, `Open findings: 0`, `Look here first:` with two or three `file:line` pointers that need human judgement, the lenses run, what it checked, and what it could not check.

**For the human reviewer:** read the packet's "Look here first", then the ledger, then only the places the pre-review pointed at. Add every finding you make to `review.md` with source `human`. Those rows are how the pre-review learns: `sdlc retro` turns them into checklist items and review evals.

`sdlc request` refuses the Verify gate without the packet, with an open blocker, major or minor, a finding with no `file:line`, or a wontfix with no reason. The `pr-body` CI check refuses a PR whose pre-review has open findings or no risk score.
