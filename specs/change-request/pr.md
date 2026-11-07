## Summary

Once Build has started, a spec change no longer silently sends the feature back to Define. The request stops and tells the agent to ask the person: change request or amend the existing PRD? The question says why a change request is often better once much is built (its own estimate, timeline and PR; work done stays as agreed) and how the effort changes (an amendment re-does the original estimate with the added effort stated), and that the design and tasks may change either way. "sdlc cr <feature> <new-slug>" creates a linked feature in the same capability and leaves the original's approvals; "sdlc amend <feature>" takes today's path back to Define. Before Build, nothing changes. Arun asked for this as guidance: the person decides.
Spec: specs/change-request/prd.md (R1 to R6).

## Test results

Suite: 250 passed, 0 failed, 0 skipped (baseline 246 on main), sdlc gate on this branch
Evals: green via sdlc gate; the spec-drift golden eval now answers the new question with "sdlc amend" (fd4f7ed), its checks unchanged
Proof: not run, no proofCommand; AC-1 to AC-5 failed on the base before the change, AC-6 pins unchanged behaviour; breaking each new guard failed a test
Criteria: 6 of 6 traced (tests/change-request.test.mjs)
New tests: tests/change-request.test.mjs (AC-1 to AC-6)
Removed, skipped or quarantined: none; tests/review.test.mjs and tests/autonomy.test.mjs answer the question with "sdlc amend", checks unchanged

## Pre-review

Risk: medium, because it changes request (gate) code with tests that fail on the base; no high-risk path, data or migration, and the new verbs only reuse the existing back-to-Define path or create a feature.
Open findings: 0 (F1 fixed in 22245d7; F2 wontfix, guidance by Arun's ruling)
Look here first: scripts/sdlc.mjs:337 (the Build-or-later guard only catches Define drift; design drift at Build still goes back silently, which matches R1 but confirm it is intended), scripts/sdlc.mjs:557 (cr and amend are agent verbs; the person's choice is not recorded, see F2)
Lenses run: correctness, simplicity, tests, golden eval and edited tests
Revert: git revert of the merge commit; no data to back out (a feature created by sdlc cr stays as a folder to delete by hand)
Checked mechanically: AC-1 to AC-6 walked through the code; tests/change-request, review and autonomy tests pass (24 of 24); eval 25 and the two edited tests keep every old assertion and add a check that the stage stays at Build; cr and amend do not exist on the base, so AC-4 and AC-5 fail there; no new dependency; no secrets
Could not check: the question in a live question-tool session; the full suite and evals (relied on the PR's reported run); that the packet's "AC-2 has no test" is only the test name "AC-1 to AC-3" (AC-2 strings are asserted)

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
The question text has not been put through the real question tool in a live session.
