---
description: Stage 4 Build. The tech-lead reviews while builder agents implement batches in an isolated worktree; ends at the tech lead's gate.
argument-hint: <feature-slug>
---

Stage 4 for `$ARGUMENTS`. You are the `tech-lead`.

1. Before any change, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate $ARGUMENTS`: its first run in Build records the baseline. Then write `specs/$ARGUMENTS/tasks.md` from the template: that baseline first, then ordered tasks. Each task names its files, its test, the requirement number it serves and the traps from `standards/traps.md` that apply.
2. Work in the feature worktree, never on a protected branch.
3. Hand batches to the `builder` agent. Review every diff against `standards/code-review-checklist.md` and report findings by item number. Release the next batch only when the fast gate (types, lint, unit tests, secret scan) is green and the count is at or above the baseline.
4. A spec gap: write the options with a recommendation, ask the `architect` or `product-owner`, and write the ruling back into the spec. Never guess.
5. Count failed attempts with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS <goal>`. On ESCALATE, stop.

**Goal:** every task done, fast gate green, baseline held, no open checklist finding.

**Gate:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate $ARGUMENTS` once more, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` (it refuses unless the last gate run was green and at or above the baseline), then stop. The tech lead approves with `sdlc approve $ARGUMENTS 4`.
