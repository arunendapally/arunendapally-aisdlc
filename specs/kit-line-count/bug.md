<!-- Bug lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. Gate: a CODEOWNER engineer, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     One file from start to merge, and the PR body. Build passes on checks: the repro red before the fix,
     the gate green after, under the line limit (tasks.md Budget), and no change to dependency manifests,
     migrations, .github, infra or terraform (those make it a feature). Write Repro and Expected and actual
     before any fix.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written; never start a line with "# " or "## " inside a section.
     Every line states a fact with its source: a test, a command run on this commit, a file:line or a link;
     end one you did not check with [unconfirmed]. -->

## Repro

Test: tests/smooth.test.mjs "the unmodified init-repo kit does not count toward PR size, an edited kit file does"
Steps: on a fresh branch run "sdlc init-repo", then read changedLines() for the branch
Report: task repo-setup (branch task/repo-setup) was refused at Build: "425 changed lines is over the task lane limit of 200"

## Expected and actual

Expected: a branch that only adds the unmodified kit counts 0 lines; an edited kit file counts
Actual: 435 lines counted for the unmodified kit (test assertion on the base, c6b642d)

## Root cause

scripts/lib.mjs:347 changedLines() counts every changed file outside prLineExcludes and the gate's own harness scripts. The kit "sdlc init-repo" copies from templates/repo (workflows, .github/scripts, rulesets, CODEOWNERS) is the plugin's code, not the change under review, yet it counted in full. The proof step already knew the kit (scaffoldFiles() in scripts/loop.mjs, finding V2) but the size check did not use it.
Trap: none new; the size check and the proof disagreed on what counts as the change.

## Fix

scripts/lib.mjs: changedLines() skips a file that is in the kit and whose content equals the shipped template (line endings normalised). An edited kit file counts in full, as before. scaffoldFiles() moved from scripts/loop.mjs to scripts/lib.mjs so both checks share one list; loop.mjs imports it. The CI size check (templates/repo/.github/scripts/check-pr-size.mjs) was left alone: it runs without the plugin, so it cannot compare against the template, and it changes .github, which the bug lane refuses.

## Test results

Repro: tests/smooth.test.mjs "the unmodified init-repo kit does not count toward PR size, an edited kit file does" red on the base (c6b642d, 435 counted), green on this commit
Suite: 230 passing, 0 failed (baseline 230), npm test && npm run eval (sdlc gate kit-line-count)
PR size: 45 of 200 code lines
Removed, skipped or quarantined: none

## Pre-review

## Not verified

The CI size check in a product repo still counts the kit; a reviewer can add the "size-exception" label on that one PR. [unconfirmed]
