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

Test: tests/amend-drops-gate-runs.test.mjs
Steps: a feature at Verify with Build and Verify gate runs recorded; its PRD changes; "sdlc amend" sends it to Define; both gate runs are still recorded
Report: Todoist "small plugin defects found building PR #67", found while building PR #67

## Expected and actual

Expected: going back to Define drops the gate runs of the stages it leaves, as it drops their approvals
Actual: the old Verify run stays, so at Verify its old count reads as below a baseline the new Build raised, until the gate runs again

## Root cause

goBack (scripts/sdlc.mjs:249) deletes state.gates from the stage it goes back to but not state.gateRuns, which request reads at Verify (scripts/sdlc.mjs:561).
Trap: state cleared for one record (gates) and not for its twin (gateRuns) [unconfirmed: not added to standards/traps.md]

## Fix

scripts/sdlc.mjs:252: goBack deletes gateRuns from the stage it goes back to, beside the gates (2 lines). The reopen path in request already drops the Verify run.
changelog.d/amend-drops-gate-runs.md: the changelog fragment.

## Test results

<!-- filled from the gate run on this commit -->

## Pre-review

<!-- written after the gate -->

## Not verified

<!-- filled after the gate -->
