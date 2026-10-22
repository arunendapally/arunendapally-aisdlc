---
description: Fix a bug in the bug lane. One document, repro test first, small diff, and the PR review is the only human gate.
argument-hint: <bug-slug> [what is wrong]
---

You are the `tech-lead`. Bug: $ARGUMENTS

1. Create a branch `bug/<bug-slug>` in its own worktree from the protected branch, and work inside it.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" bug <bug-slug>` and commit `specs/<bug-slug>/`. If the bug came from work shipped through this process, add `--caused-by <that-feature>`: it charges the escape to the gates that let it through.
3. Fill `## Repro`, `## Expected and actual` and `## Root cause` in `specs/<bug-slug>/bug.md`.
4. Write the test that reproduces it. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate <bug-slug>`: it must go red. That run records the repro.
5. Hand the fix to the `builder`: the smallest change that turns it green. No dependency, schema, CI or infrastructure changes; the hooks refuse them in this lane. If the fix needs them, stop: it is a feature (`/ai-sdlc:start`).
6. Run the gate again until green and at or above the baseline (cap 3, `sdlc.mjs retry <bug-slug> fix`). Fill `## Fix` and `## Test results`.
7. `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request <bug-slug>` passes the Build gate on checks, then `advance`.
8. Run `/ai-sdlc:pre-review <bug-slug>`, use `bug.md` as the PR body, open the PR labelled `lane:bug`, request the gate and stop. Review deadline: 8h. A CODEOWNER approves on GitHub and types `sdlc approve <bug-slug> 5`.

If the diff is over the bug lane limit (200 lines), split it or make it a feature.
