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

Test: tests/guard-follows-cd-into-worktree.test.mjs
Steps: the main checkout is on main; a worktree at .claude/worktrees/fix is on bug/fix; the session's folder is the main checkout; the agent runs `cd "<worktree>" && git commit -m x`
Report: Todoist "small plugin defects found building PR #67", item (e); hit four times on 18 Nov building #68 to #70, twice by subagents

## Expected and actual

Expected: the commit is judged on bug/fix, the worktree's branch, and is not refused
Actual: refused as "You are on main. Work on a feature branch in its own worktree." (guard: commit-protected), though the command works in a worktree as the guard asks

## Root cause

scripts/hooks/pre-tool.mjs:155 (before this fix) followed a leading cd to another repo only when the target was outside the session's checkout; a worktree under .claude/worktrees/ is inside it by path, so the branch was read from the main checkout (pre-tool.mjs:159).
Trap: "inside this folder" read as "in this repo", when git worktrees nest inside the main checkout [unconfirmed: not added to standards/traps.md]

## Fix

scripts/hooks/pre-tool.mjs:155: after a leading cd, the guard judges the git top-level the cd enters when it differs from the session's checkout, as it already did for a folder outside it (3 lines). A folder of the main checkout itself still resolves to the main checkout, so commits there stay refused.
changelog.d/guard-follows-cd-into-worktree.md: the changelog fragment.

## Test results

Repro: tests/guard-follows-cd-into-worktree.test.mjs red on the base (3489061), green on this commit ("sdlc proof guard-follows-cd-into-worktree" passed)
Suite: 351 passed, 0 failed (baseline 351), from "sdlc gate guard-follows-cd-into-worktree"
Gate: green, golden evals caught, PR size 4 of 200 code lines
Removed, skipped or quarantined: none

## Pre-review

Risk: medium, because it changes a guard (scripts/hooks/pre-tool.mjs) and touches no high-risk path
Open findings: 0
Look here first: scripts/hooks/pre-tool.mjs:157 (any checkout nested in this one, not only .claude/worktrees, is now judged on its own branch and config; a nested clone on main stays protected by its own protectedBranches)
Lenses run: correctness, security (tech lead, no subagent: 3 code lines)
Revert: git revert of the merge commit; no data to back out
Checked mechanically: the test refuses a commit in the main checkout and in a folder of it, and allows one in the nested worktree; tests/read-only-guard.test.mjs and tests/delete-guard.test.mjs still pass; at feeds only the branch, its config and the git calls below it (pre-tool.mjs:159 to 297), and the push guard now judges the worktree's branch too
Could not check: a cd written as PowerShell Set-Location into a worktree, live (the regex at pre-tool.mjs:148 already covers it; only Bash ran here)

## Not verified

A live subagent commit from a main-checkout session: only the hook test ran, since the installed plugin (0.8.0) predates this fix.
PowerShell Set-Location into a worktree: covered by the same regex, not run.
The trap line under Root cause is not added to standards/traps.md.
