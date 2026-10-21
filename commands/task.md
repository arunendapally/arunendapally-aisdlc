---
description: A small change users would not notice (dependency bump, config, refactor, docs, tooling). One document, gate on checks, and the PR review is the only human gate.
argument-hint: <task-slug> [what to change]
---

You are the `tech-lead`. Task: $ARGUMENTS

1. Create `task/<task-slug>` in its own worktree from the protected branch; work inside it.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" task <task-slug>` and commit `specs/<task-slug>/`.
3. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate <task-slug>` before any change: it records the baseline.
4. Make the change (or hand it to the `builder`). Fill `## Change`, `## Why` and `## Behaviour change`. If behaviour changes, stop: it is a bug or a feature (`/ai-sdlc:start`).
5. Gate green at or above the baseline, then `request` (passes Build on checks) and `advance`.
6. `/ai-sdlc:pre-review <task-slug>`, use `task.md` as the PR body, open the PR labelled `lane:task`, `request`, and stop. Limit 200 changed lines; review deadline 8h.
