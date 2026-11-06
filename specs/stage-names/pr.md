## Summary

Stages now have names a person reads: the stage that writes the PRD and acceptance criteria is Define (command /ai-sdlc:define), the technical design is written in design.md (a feature with plan.md keeps working), messages and status lead with the stage name, and each stage command states its input, processing and output. Arun asked for named stages, not stage 1, 2, 3.
Spec: specs/stage-names/prd.md (R1 to R5). Stacked on #54 (stop-at-pr); review that first. Not in this PR: the Plan stage and its roadmap (plan-roadmap) and Definition of done checklists (definition-of-done).

## Test results

Suite: 245 passed, 0 failed, 0 skipped (baseline 240 on feature/stop-at-pr), sdlc gate on this commit
Evals: 30/30 golden tasks pass, sdlc gate on this commit
Proof: not run, no proofCommand; AC-1, AC-2, AC-3 and AC-5 failed on the base code before the change; AC-4 pins existing plan.md behaviour and failed when the fallback was broken on purpose
Criteria: 5 of 5 traced (tests/stage-names.test.mjs)
New tests: tests/stage-names.test.mjs (AC-1 to AC-5)
Removed, skipped or quarantined: none

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
Stage numbers remain in state.json, in typed commands ("sdlc approve <feature> 1") and in the reply to them (PRD A1).
A live session on this code: the installed 0.7.1 CLI ran this feature's gates.
