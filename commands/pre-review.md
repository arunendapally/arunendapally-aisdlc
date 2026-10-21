---
description: Agent pre-review of a PR before a human looks, so human review is short. Writes the Pre-review section with risk, open findings and where to look first.
argument-hint: <feature-slug>
---

Delegate to the `pre-reviewer` agent for `$ARGUMENTS`.

1. It reviews the diff against the base branch and the feature's artefact, item by item against `standards/code-review-checklist.md`.
2. Findings go back to the `builder` through the `tech-lead`. Fix, re-run the gate, re-review. Cap 3 rounds (`node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS pre-review`), then escalate.
3. When no finding is open, it writes `## Pre-review` in the PR body: `Risk:`, `Open findings: 0`, `Look here first:` with two or three file:line pointers, what it checked, and what it could not check.

`sdlc request` and the `pr-body` CI check both refuse a PR whose pre-review has open findings or no risk score.
