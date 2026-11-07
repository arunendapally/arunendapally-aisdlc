---
description: Build. Tests first, then the builder implements batches the tech lead reviews; the gate passes on checks, with no human wait.
argument-hint: <feature-slug>
---

Build for `$ARGUMENTS`. You are the `tech-lead`.

**Input:** the approved spec and, in the full lane, `design.md`.
**Ready when:** the Design definition of done in `design.md` is complete (in the light lane, the Define definition of done in `prd.md`).
**Processing:** tasks first, then tests that fail, then the code, batch by batch, each diff reviewed and the full gate green.
**Output:** `tasks.md` and the tested change on the feature branch, passed on checks.

1. Before any change, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate $ARGUMENTS`: its first run in Build records the baseline. In a new repo nothing passes yet, so that run is red with 0 passing: the baseline is 0, and the first test you write must fail before its code exists. Write `specs/$ARGUMENTS/tasks.md`: first `## Approach` (in the light lane it is the design, and Build refuses without it; in the full lane it links `design.md`), then tasks, each with its files, the criterion it proves, the tasks it waits for (`depends-on: [T1]`, or `depends-on: []`) and the traps from `standards/traps.md` that apply.
2. **Tests first.** The `qa-engineer` writes a test per criterion, named after it (`AC-1 ...`) in a file that names the feature, with its own data setup and teardown. `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" tests $ARGUMENTS` lists any criterion with no test.
3. Hand batches to the `builder` in the feature worktree, never on a protected branch. Review every diff against `standards/code-review-checklist.md`. Release the next batch only when the gate is green at or above the baseline.
4. A spec gap: write the options with a recommendation, ask the `architect` or `product-owner`, and write the ruling back into the spec. Never guess.
5. **A test that contradicts the spec.** Once the proof has run, its test files are locked: the guard refuses an agent's edit and `proof` refuses a changed one. Never bend the test. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" conflict $ARGUMENTS <AC-n> <reason>`, then `sdlc ask $ARGUMENTS` and put its question: the person chooses Change the test or Keep the test. A conflict is an answer, not a failed check, so it is not counted as a retry. A new spec version a person approved unlocks the tests; one passed on checks does not.
6. **A spec change during Build.** If the spec changes after development started, `request` stops before anything moves and prints a question: change request or amend the existing PRD. Put it to the person with the question tool and never answer it for them. A change request (`sdlc cr $ARGUMENTS <new-slug>`) is a new feature in the same capability whose PRD names this one; this feature keeps its approvals and estimate, and its spec goes back to the approved text. Amending (`sdlc amend $ARGUMENTS`) sends this feature back to Define, and its estimate is re-done with the added effort stated.
7. Count failed attempts with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS <goal>`. On ESCALATE, stop.

**Gate:** run the gate once more, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS`. It passes on checks (gate green at or above the baseline, diff under the limit, in the light lane no high-risk path or destructive migration) and moves the feature to Verify. Then run `/ai-sdlc:verify $ARGUMENTS`.
