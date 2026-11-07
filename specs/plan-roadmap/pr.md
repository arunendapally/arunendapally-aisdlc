## Summary

Plan is now a roadmap. A capability's slices are placed now, next or later; an enabler such as an API contract can be its own slice so dependents build in parallel; each slice says how it goes live on its own (compatible, behind a named flag, or after a named slice with the reason, refused without one); status groups slices by horizon; "sdlc tickets <feature>" prints one ticket per repo to copy into any tracker; and /ai-sdlc:plan runs the stage with its input, processing and output. Arun described Plan as a roadmap of independent pieces, enablers first, each PR able to go live on its own.
Spec: specs/plan-roadmap/prd.md (R1 to R6). This repo's own specs/gates-and-names/slices.md uses the new format. Not in this PR: creating tickets in a tracker (the person does it from the text), and change requests (change-request).

## Test results

Suite: 254 passed, 0 failed, 0 skipped (baseline 246 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; all 7 new tests failed on the base before the change, and breaking each guard made its test fail
Criteria: 6 of 6 traced (tests/plan-roadmap.test.mjs)
New tests: tests/plan-roadmap.test.mjs (AC-1 to AC-6)
Removed, skipped or quarantined: none; tests/slices.test.mjs changed only in the indentation of the status lines

## Pre-review

Risk: medium, because it changes CLI code (status, the Define request, a new tickets command) with tests that fail on the base; no data, auth or contract change
Open findings: 0 (F1 and F3 fixed in 7160d8c, F2 in d3bc2d1)
Look here first: scripts/sdlc.mjs:394 (F1: one slice's missing reason blocks Define for every slice in the capability; decide whether that is intended and fix code or docs), scripts/lib.mjs:306 (F2: an unrecognised Horizon reads as now with no warning)
Lenses run: correctness, simplicity, tests
Revert: git revert of the merge commit; no data to back out. specs/gates-and-names/slices.md keeps the new fields, which the old code ignores
Checked mechanically: checklist items 1, 2, 3, 13, 16, 21, 22, 24, 25, 26; all six criteria traced to tests/plan-roadmap.test.mjs and pass (9 of 9 with tests/slices.test.mjs); old slice lines with no Horizon, Kind or Goes live still list under now and are not refused (tests/slices.test.mjs, AC-1 A2 test); status on this repo groups gates-and-names with no roadmap problem; packets output and tasksOf callers unchanged apart from the added line field; no new dependency; packet had no risk signals
Could not check: re-ran no mutation myself (item 14), and did not run the tests on the base (red on the base is by construction: no roadmapProblems export, no tickets command, no commands/plan.md); full suite not re-run; tickets in a real multi-repo run

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
How the roadmap and tickets read in a real multi-repo run.
A live session on this code: the installed 0.7.1 CLI ran the gates.
