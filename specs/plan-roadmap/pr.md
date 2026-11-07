## Summary

Plan is now a roadmap. A capability's slices are placed now, next or later; an enabler such as an API contract can be its own slice so dependents build in parallel; each slice says how it goes live on its own (compatible, behind a named flag, or after a named slice with the reason, refused without one); status groups slices by horizon; "sdlc tickets <feature>" prints one ticket per repo to copy into any tracker; and /ai-sdlc:plan runs the stage with its input, processing and output. Arun described Plan as a roadmap of independent pieces, enablers first, each PR able to go live on its own.
Spec: specs/plan-roadmap/prd.md (R1 to R6). This repo's own specs/gates-and-names/slices.md uses the new format. Not in this PR: creating tickets in a tracker (the person does it from the text), and change requests (change-request).

## Test results

Suite: 253 passed, 0 failed, 0 skipped (baseline 246 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; all 7 new tests failed on the base before the change, and breaking each guard made its test fail
Criteria: 6 of 6 traced (tests/plan-roadmap.test.mjs)
New tests: tests/plan-roadmap.test.mjs (AC-1 to AC-6)
Removed, skipped or quarantined: none; tests/slices.test.mjs changed only in the indentation of the status lines

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
How the roadmap and tickets read in a real multi-repo run.
A live session on this code: the installed 0.7.1 CLI ran the gates.
