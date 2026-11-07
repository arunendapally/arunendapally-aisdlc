## Summary

Each capability now has one architecture overview beside its slices, with C4 Level 1 ("System context") and a "Decision log" of what was agreed after the PRD was signed off: date, decision, who agreed it, source and what it changes. Features in a capability are checked against the capability's systems under change; Define refuses a capability with no system context; a decision row with no one who agreed it or no source is refused; unconfirmed rows are listed in the review packet. Arun asked for the decision log at capability level, in the architecture overview, with the PRD kept as signed.
Spec: specs/capability-overview/prd.md (R1 to R5). Also here: specs/gates-and-names/architecture-overview.md, this repo's own capability overview, with the decisions from 6 and 7 Nov, each quoting Arun. Not in this PR: the change request question (change-request) and the trace index (trace-index).

## Test results

Suite: 251 passed, 0 failed, 0 skipped (baseline 246 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; all five AC tests failed on the base before the change, and each of seven guards broken on purpose failed its test
Criteria: 5 of 5 traced (tests/capability-overview.test.mjs)
New tests: tests/capability-overview.test.mjs (AC-1 to AC-5)
Removed, skipped or quarantined: none

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
No test covers the R4 decision-row check in the Verify request (it is tested at Define).
A live session on this code: the installed 0.7.1 CLI ran the gates.
