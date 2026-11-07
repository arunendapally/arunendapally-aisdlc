## Summary

Stages now have names a person reads: the stage that writes the PRD and acceptance criteria is Define (command /ai-sdlc:define), the technical design is written in design.md (a feature with plan.md keeps working), messages and status lead with the stage name, and each stage command states its input, processing and output. Arun asked for named stages, not stage 1, 2, 3.
Spec: specs/stage-names/prd.md (R1 to R5). Not in this PR: the Plan stage and its roadmap (plan-roadmap) and Definition of done checklists (definition-of-done).

## Test results

Suite: 246 passed, 0 failed, 0 skipped (baseline 240 on main after #54), sdlc gate on this commit
Evals: 30/30 golden tasks pass, sdlc gate on this commit
Proof: not run, no proofCommand; AC-1, AC-2, AC-3 and AC-5 failed on the base code before the change; AC-4 pins existing plan.md behaviour and failed when the fallback was broken on purpose
Criteria: 5 of 5 traced (tests/stage-names.test.mjs)
New tests: tests/stage-names.test.mjs (AC-1 to AC-5)
Removed, skipped or quarantined: none

## Pre-review

Risk: medium, because it is code with tests that fail on the base, no data, contract or auth change; it does touch the artefact-order guard (scripts/hooks/pre-tool.mjs:242) and every Design check through designDoc
Open findings: 0 (F1 and F2 fixed in 389d42c)
Look here first: scripts/lib.mjs:411 (designDoc picks plan.md only when design.md is absent; judge whether a feature holding both files should warn), scripts/sdlc.mjs:256 (the init message still names Plan, F1), scripts/hooks/user-prompt.mjs:215 (whether the approval reply may lead with "gate 1" under A1, F2)
Lenses run: correctness, simplicity, tests
Revert: git revert of the merge commit; no data to back out (stage numbers in state.json are unchanged, a feature that wrote design.md would need it renamed to plan.md)
Checked mechanically: checklist items 1, 2, 13, 22; R4: every plan.md reader now goes through designDoc (missingHeadings, Design fingerprint, supersede check, plan drift, revision check, contracts and ER, design-review board, review packet, gate and ask artefact), no other literal plan.md reader left in scripts/; AC-1, AC-2, AC-3, AC-5 fail on feature/stop-at-pr and AC-4 passes there as a characterisation test; full suite 245 of 245 green; no live reference to commands/plan.md or /ai-sdlc:plan
Could not check: a live session on this code (the installed 0.7.1 CLI ran the gates); the evals; the stop-at-pr files, reviewed in #54

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
Stage numbers remain in state.json, in typed commands ("sdlc approve <feature> 1") and in the reply to them (PRD A1).
A live session on this code: the installed 0.7.1 CLI ran this feature's gates.
