# Tasks: branch-autonomy

Spec: specs/branch-autonomy/prd.md, specs/branch-autonomy/acceptance.feature, specs/branch-autonomy/plan.md (full lane only)
Baseline: taken by the first "sdlc gate branch-autonomy" before any code change
Budget: about 80 counted code lines of 400 (full lane).
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

See plan.md and ADR-0007.

## Characterisation tests

The existing suite pins today's behaviour: Plan and Design wait for a person (tests/lanes.test.mjs, tests/ask.test.mjs, tests/human-verbs.test.mjs) and Verify and Release keep their people (tests/review.test.mjs, tests/release-criteria.test.mjs). Tests that expect gate 1 or 3 to wait now set gateOwners or run off the feature branch, so they keep pinning the person's path.

## Tasks

- [ ] T1 [R1, R2, R3, R5, R7] files: tests/branch-autonomy.test.mjs test: AC-1, AC-2, AC-3, AC-5, AC-7 depends-on: [] Tests first for the branch rule and each condition that keeps a person.
  - done when: the tests fail on the current code for AC-1 and AC-2 and pass for AC-3, AC-5, AC-7.
  - traps: none
- [ ] T2 [R1, R2] files: scripts/lib.mjs, scripts/sdlc.mjs test: AC-1, AC-2 depends-on: [T1] BRANCH_AUTO and branchAutoBlock(), used by request() after autonomy and earned trust, with an "auto" audit line on every pass on checks.
  - done when: AC-1 and AC-2 pass; each condition test passes; the waiting message names the condition.
  - traps: none
- [ ] T3 [R4] files: tests/branch-autonomy.test.mjs, scripts/sdlc.mjs test: AC-4 depends-on: [T2] Drift after a pass on checks sends work back, with the branch wording.
  - done when: AC-4 passes.
  - traps: none
- [ ] T4 [R6] files: scripts/review.mjs, tests/branch-autonomy.test.mjs test: AC-6 depends-on: [T2] The review packet lists passes on checks and drift events from audit.jsonl.
  - done when: AC-6 passes.
  - traps: none
- [ ] T5 [R1] files: tests/*.test.mjs, .claude/rules/ai-sdlc.md, templates/repo/.claude/rules/ai-sdlc.md, skills/org-ai-sdlc/SKILL.md, commands/plan.md, commands/design.md, CHANGELOG.md test: AC-1 depends-on: [T2] Existing tests and docs follow the new rule.
  - done when: npm test and npm run eval pass.
  - traps: none
