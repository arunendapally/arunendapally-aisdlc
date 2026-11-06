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

Risk: high, because .github/pull_request_template.md is on a path that always needs a person; the change itself removes a Verify refusal in scripts/sdlc.mjs and changes the review packet text; tests exist, no data or contract change, but the gate it loosens matters under autonomy (F1).
Open findings: 0 (F1 wontfix: sdlc merge is removed by stop-at-pr; F2 fixed in 235a1a3)
Look here first: scripts/sdlc.mjs:572 (sdlc merge under autonomy lands an untested @manual criterion with no person looking; decide whether merge must refuse it, F1), scripts/review.mjs:198 (the packet wording is now the only place a person is told to check by hand; judge whether a reviewer will see it)
Lenses run: correctness, tests
Revert: git revert of the merge commit; no data to back out. The revert restores the "Checked by hand" refusal, so PRs in flight with @manual criteria would need the line again.
Checked mechanically: every AC-1 to AC-3 scenario walked through the code (checklist 1, 2, 3); manualProblems has no other caller and no other reader of the line in scripts, hooks or CI; the section import dropped from testmatrix.mjs is unused there; tests/release-criteria.test.mjs passes (8 of 8); AC-1 and AC-2 fail on the base by reading (the export exists and the heading is absent there); packet signals cleared (the .github template change is a comment only); no new dependencies, no secrets.
Could not check: the full suite and evals were not rerun by me; security, simplicity and operability lenses were not run, by request; docs/decisions/2026-11-04-browser-qa.md:18 still describes the old line, left as a historical record.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
.ai-sdlc/config.json here is the same file as on task/repo-setup and feature/branch-autonomy; whichever lands first, the others merge cleanly.
