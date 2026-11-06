## Summary

A criterion only a person can check (tagged @manual) no longer needs a "Checked by hand" line in the PR body: the review packet lists it under "Check by hand before merging", and the person who merges checks it. Arun asked where that line is even written, and said merging the PR already says it was checked by hand.
Spec: specs/merge-is-hand-check/prd.md (R1 to R3). This PR also carries the re-sliced capability record, specs/gates-and-names/slices.md.

## Test results

Suite: 231 passed, 0 failed, 0 skipped (baseline 229 on main), npm test on this commit
Evals: 30/30 golden tasks pass, npm run eval on this commit
Proof: not run, no proofCommand; the AC-1 and AC-2 tests failed on the base code before the change, AC-3 passed as it pins unchanged behaviour
Criteria: 3 of 3 traced (AC-1 to AC-3 in tests/release-criteria.test.mjs)
New tests: tests/release-criteria.test.mjs (AC-1, AC-2, AC-3)
Removed, skipped or quarantined: the V5 test for the "Checked by hand" line, replaced by AC-1 because R1 removes that behaviour

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
.ai-sdlc/config.json here is the same file as on task/repo-setup and feature/branch-autonomy; whichever lands first, the others merge cleanly.
