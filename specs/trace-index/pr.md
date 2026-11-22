## Summary

"sdlc trace <capability>" prints every requirement in a capability as <feature>/R<n>, with its scenarios, the tests that prove them, the decision rows that changed it and the ADRs that name it; a requirement with no scenario or no test is marked. "sdlc trace --file <path>" (a test file, an ADR, or a decision row) prints the requirements it traces to. It is generated on demand and written nowhere, so it cannot drift. Arun asked for a requirements index that traces back.
Spec: specs/trace-index/prd.md (R1 to R4). This is the last gates-and-names slice.

## Test results

Suite: 308 passed, 0 failed, 0 skipped (baseline 303 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; all four new tests failed on the base before the change, and breaking each filter and marker made a test fail
Criteria: 4 of 4 traced (tests/trace-index.test.mjs)
New tests: tests/trace-index.test.mjs (AC-1 to AC-4, plus decision ranges, lists and word boundaries for AC-2)
Removed, skipped or quarantined: none

## Pre-review

Risk: medium, because it is new read-only code with tests that fail on the base; no data, contract, auth or high-risk path
Open findings: 0 (F1 and F2 fixed in 7e6408c; F3 and F4 wontfix with reasons in review.md)
Look here first: scripts/trace.mjs:11 (how a decision row's Changes cell is read: ranges and lists; F1 fixed), scripts/trace.mjs:28 (tests column inherits matrix() matching; F3 wontfix), skills/org-ai-sdlc/templates/adr.md:20 (new ADRs name "<feature>/R<n>"; F4)
Lenses run: correctness, simplicity, tests
Revert: git revert of the merge commit; no data to back out, the index is written nowhere
Checked mechanically: checklist items 1, 3, 13, 21, 22, 24, 25, 26; tests/trace-index.test.mjs passes (5 of 5); no new dependency; no file written by "sdlc trace"; "sdlc trace gates-and-names" run on the real capability (exit 0, 50 requirements); packet signals cleared (none raised)
Could not check: the full suite and the test proof (no proofCommand); that each test fails on the base was taken from the PR body, not rerun; Windows backslash paths for --file

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
An ADR traces only when it names "<feature>/R<n>"; a bare R id in its Context does not count (PRD A1, half taken).

## Definition of done

- [x] Pre-review has no open findings
- [x] Not verified is honest
- [x] PR raised from the branch
