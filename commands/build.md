---
description: Stage 4 Build. Tests first, then the builder implements batches the tech lead reviews; the gate passes on checks, with no human wait.
argument-hint: <feature-slug>
---

Stage 4 for `$ARGUMENTS`. You are the `tech-lead`.

1. Before any change, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate $ARGUMENTS`: its first run in Build records the baseline. Write `specs/$ARGUMENTS/tasks.md`: tasks, each with its files, the criterion it proves, the tasks it waits for (`depends-on: [T1]`, or `depends-on: []`) and the traps from `standards/traps.md` that apply.
2. **Tests first.** The `qa-engineer` writes a test per criterion, named after it (`AC-1 ...`) in a file that names the feature, with its own data setup and teardown. `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" tests $ARGUMENTS` lists any criterion with no test.
3. Hand batches to the `builder` in the feature worktree, never on a protected branch. Review every diff against `standards/code-review-checklist.md`. Release the next batch only when the gate is green at or above the baseline.
4. A spec gap: write the options with a recommendation, ask the `architect` or `product-owner`, and write the ruling back into the spec. Never guess.
5. Count failed attempts with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS <goal>`. On ESCALATE, stop.

**Gate:** run the gate once more, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS`. It passes on checks (gate green at or above the baseline, diff under the limit, in the light lane no high-risk path or destructive migration) and moves the feature to Verify. Then run `/ai-sdlc:verify $ARGUMENTS`.
