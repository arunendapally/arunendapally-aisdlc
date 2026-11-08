---
description: A small change users would not notice (dependency bump, config, refactor, docs, tooling). One document, gate on checks, and the PR review is the only human gate.
argument-hint: <task-slug> [what to change]
---

You are the `tech-lead`. Task: $ARGUMENTS

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" worktree task <task-slug>`: it creates `task/<task-slug>` in its own worktree and starts the task there. Work inside it.
2. Commit `specs/<task-slug>/`.
3. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate <task-slug>` before any change: it records the baseline.
4. Make the change (or hand it to the `builder`). Fill `## Change`, `## Why` and `## Behaviour change`. If behaviour changes, stop: it is a bug or a feature (`/ai-sdlc:start`).
5. Gate green at or above the baseline, then `request` (passes Build on checks) and `advance`.
6. `/ai-sdlc:pre-review <task-slug>`, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" ship <task-slug>` (gate, Build and Verify on checks, commit, push, PR from `task.md` labelled `lane:task`), and stop. If the repo keeps a `CHANGELOG.md`, write the entry as `changelog.d/<slug>.md`, never in `CHANGELOG.md` itself, so parallel PRs do not conflict; `sdlc changelog` folds the fragments in at release. Limit 200 changed lines; review deadline 8h.
