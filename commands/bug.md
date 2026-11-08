---
description: Fix a bug in the bug lane. One document, repro test first, small diff, and the PR review is the only human gate.
argument-hint: <bug-slug> [what is wrong]
---

You are the `tech-lead`. Bug: $ARGUMENTS

1. Create a branch `bug/<bug-slug>` in its own worktree from the protected branch, and work inside it.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" bug <bug-slug>` (add `--issue <n>` to fill the Report line from a GitHub issue) and commit `specs/<bug-slug>/`. If the bug came from work shipped through this process, add `--caused-by <that-feature>`: it charges the escape to the gates that let it through.
3. Fill `## Repro`, `## Expected and actual` and `## Root cause` in `specs/<bug-slug>/bug.md`.
4. Write the test that reproduces it. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate <bug-slug>`: it must go red. That run records the repro.
5. Hand the fix to the `builder`: the smallest change that turns it green. No dependency, schema, CI or infrastructure changes; the hooks refuse them in this lane, except a version-only bump of `package.json` with the Edit tool. If the fix needs them, stop: it is a feature (`/ai-sdlc:start`).
6. Run the gate again until green and at or above the baseline (cap 3, `sdlc.mjs retry <bug-slug> fix`). Fill `## Fix` and `## Test results`.
7. `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request <bug-slug>` passes the Build gate on checks, then `advance`.
8. Run `/ai-sdlc:pre-review <bug-slug>`, then `request` (Verify passes on its checks; a green Build gate on the same code counts), commit `specs/<bug-slug>/`, and run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" pr <bug-slug>`: it pushes and opens the PR from `bug.md` labelled `lane:bug`. Stop there: review and merge are the org's (ADR-0008). Independent bugs can each run in their own worktree at the same time.

If the diff is over the bug lane limit (200 lines), split it or make it a feature.
