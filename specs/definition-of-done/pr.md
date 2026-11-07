## Summary

Each stage's document now ends with a "Definition of done" checklist suited to that stage, and a stage's request refuses any item left neither ticked nor marked "N/A: <reason>". Each stage command states its definition of ready as the previous stage's definition of done. Documents written before this change, with no checklist, are not refused for it. Arun asked for DoD and DoR on every stage, as a markdown checklist at the end, with DoR being the previous stage's DoD.
Spec: specs/definition-of-done/prd.md (R1 to R4). Not in this PR: the Plan stage's own checklist (plan-roadmap).

## Test results

Suite: 255 passed, 0 failed, 0 skipped (baseline 246 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; the new tests failed on the base before the change, and disabling the checker or its call made them fail
Criteria: 6 of 6 traced (tests/definition-of-done.test.mjs)
New tests: tests/definition-of-done.test.mjs (AC-1 to AC-6)
Removed, skipped or quarantined: none

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
The agent ticks its own checklist items; the gate checks only that none is left open, and the PR reviewer reads them (PRD A2).
A live session on this code: the installed 0.7.1 CLI ran the gates.
