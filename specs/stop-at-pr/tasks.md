# Tasks: stop-at-pr

<!-- Stage 4 Build. Owner: tech-lead agent. Gate: none, it passes on checks (the gate green at or above the
     baseline, the diff under the lane limit, every task line valid). -->

Spec: specs/stop-at-pr/prd.md, specs/stop-at-pr/acceptance.feature, specs/stop-at-pr/plan.md
Baseline: 229 passing, from the first "sdlc gate stop-at-pr" on 482e3d3, before any change
Budget: about 40 counted code lines of 400 (full); most of the diff is removed code, tests and docs.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

See plan.md and ADR-0008. Only what the tasks need:
- The end of a lane is data: LANES in scripts/lib.mjs. Every lane drops stage 6 and adds 5 to auto, so Verify runs the same refusal path as today and then passes on checks (R1, R2, R6).
- Stage 5 and 6 owners that name a person (CODEOWNER, on-call, incident commander, release owner, DBA at 5 and 6) go, per the PRD's "Never name who must approve or merge a PR".
- The arguable choice: nextStage() returns nothing for a stage the lane no longer runs, so a feature left at stage 6 closes on "sdlc advance" instead of looping back to Plan. The plan defers how such a feature closes; this only stops the loop, and keeps the left-over release code reachable by its own tests.
- Release code, release.md and release evals stay, unreachable, for the follow-up task (PRD Out of scope).

## Characterisation tests

The current behaviour this slice changes is already pinned by existing tests, run in the baseline before any change: tests/lanes.test.mjs (bug lane Verify waits for a person, stageSpec owners), tests/autonomy.test.mjs (sdlc merge), tests/release-criteria.test.mjs (@release refused in a lane with no Release), tests/loop.test.mjs (outcome follow-up read from release.md at stage 6). Each one that asserts Release, a Verify approver or sdlc merge is changed in T5 to the new end point; no other assertion is loosened. The gate-5 approval-lapse checks move to the Plan gate in tests/review.test.mjs; eval 24 drops its gate-5 lapse steps, since Verify has no human approval to lapse.

## Tasks

- [x] T1 [R1, R2, R3, R4, R5, R6] files: tests/stop-at-pr.test.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 depends-on: [] Write the acceptance tests first and show they fail on the current code.
  - done when: AC-1 to AC-5 fail on 482e3d3 and AC-6 passes there (it pins unchanged behaviour).
  - traps: Subtests that were never awaited
- [x] T2 [R1, R2, R6] files: scripts/lib.mjs test: AC-1, AC-2, AC-6 depends-on: [T1] Every lane ends at Verify, which passes on checks; drop approver owners at 5 and 6; nextStage stops at a stage the lane does not run.
  - done when: AC-1, AC-2 and AC-6 pass; "sdlc status" still prints a feature left at stage 6.
  - traps: none
- [x] T3 [R3, R4] files: scripts/sdlc.mjs, scripts/review.mjs test: AC-3, AC-4 depends-on: [T1] Remove merge(); remove the @release refusal at Verify; list untested @release criteria under "## Check after deploy".
  - done when: AC-3 and AC-4 pass; @manual criteria still show under "## Criteria with no test" as on main.
  - traps: none
- [x] T4 [R5] files: scripts/loop.mjs test: AC-5 depends-on: [T2] advanceFeature() reads the outcome follow-up from prd.md.
  - done when: AC-5 passes; "Metric: None, because ..." in the PRD opens no follow-up.
  - traps: none
- [x] T5 [R1, R2, R3, R4, R5] files: tests/*.test.mjs, evals/golden/*.json test: AC-1, AC-2, AC-3, AC-4, AC-5 depends-on: [T2, T3, T4] Update only the tests and evals that assert Release, a Verify approver or sdlc merge.
  - done when: npm test and npm run eval pass; each changed assertion traces to a requirement above.
  - traps: none
- [x] T6 [R3] files: commands/verify.md, commands/release.md, commands/hotfix.md, commands/start.md, skills/org-ai-sdlc/SKILL.md, templates/repo/.claude/rules/ai-sdlc.md, CHANGELOG.md test: AC-3 depends-on: [T3] Docs stop telling agents to merge or release; commands/release.md says the stage is out of scope (ADR-0008).
  - done when: no doc tells an agent to run sdlc merge or request a Release gate.
  - traps: A style rule in prose leaked
