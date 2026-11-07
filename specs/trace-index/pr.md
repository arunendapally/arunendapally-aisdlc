## Summary

"sdlc trace <capability>" prints every requirement in a capability as <feature>/R<n>, with its scenarios, the tests that prove them, the decision rows that changed it and the ADRs that name it; a requirement with no scenario or no test is marked. "sdlc trace --file <path>" (a test file, an ADR, or a decision row) prints the requirements it traces to. It is generated on demand and written nowhere, so it cannot drift. Arun asked for a requirements index that traces back.
Spec: specs/trace-index/prd.md (R1 to R4). This is the last gates-and-names slice.

## Test results

Suite: 307 passed, 0 failed, 0 skipped (baseline 303 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; all four new tests failed on the base before the change, and breaking each filter and marker made a test fail
Criteria: 4 of 4 traced (tests/trace-index.test.mjs)
New tests: tests/trace-index.test.mjs (AC-1 to AC-4)
Removed, skipped or quarantined: none

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
An ADR traces only when it names "<feature>/R<n>"; a bare R id in its Context does not count (PRD A1, half taken).

## Definition of done

- [x] Pre-review has no open findings
- [x] Not verified is honest
- [x] PR raised from the branch
