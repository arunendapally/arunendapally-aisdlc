# Tasks: close-stage-six

Spec: specs/close-stage-six/prd.md, specs/close-stage-six/acceptance.feature, specs/close-stage-six/plan.md
Baseline: 303 passing, from npm test on 1af03e7 before any change
Budget: about 311 counted code lines of 400 (full); 299 are the two deleted release evals.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

See plan.md.

## Tasks

- [x] T1 [R1, R2, R3, R4] files: scripts/sdlc.mjs, tests/stop-at-pr.test.mjs, tests/review.test.mjs test: AC-1, AC-2, AC-3, AC-4 depends-on: [] Request and advance complete a feature at stage 6 through advanceFeature.
  - done when: AC-1 to AC-4 pass; removing either stage-6 guard turns AC-1 or AC-2 red (mutation-tested).
  - traps: none
- [x] T2 [R1] files: evals/golden/14-release-needs-tested-rollback.json, evals/golden/22-release-is-on-main-and-live.json, evals/baseline.json test: AC-1 depends-on: [T1] Remove the two evals that ran the Release check at stage 6.
  - done when: npm run eval passes and still catches F1 to F5, F3 by no-merge-push-deploy.
  - traps: none
- [x] T3 [R3] files: specs/branch-autonomy/state.json, specs/capability-overview/state.json, specs/change-request/state.json, specs/definition-of-done/state.json, specs/merge-is-hand-check/state.json, specs/plan-roadmap/state.json, specs/stage-names/state.json, specs/stop-at-pr/state.json, specs/test-lock/state.json test: AC-1 depends-on: [T1] Close this repo's nine stage-6 features with this branch's "node scripts/sdlc.mjs request".
  - done when: each printed "<feature> is complete" with its outcome follow-up.
  - traps: none

## Characterisation tests

"stop-at-pr: a feature left at stage 6 closes on advance, never back to Plan" (tests/stop-at-pr.test.mjs) pinned stage-6 advance before the change and passes unchanged. "code committed after Verify ... so Release refuses it" (tests/review.test.mjs) pinned the Release check at stage 6, the behaviour this feature removes, so it goes; a commit after Verify stays covered at stage 5 by "stop-at-pr: a commit after Verify passed is flagged in status and reopens Verify on request".

## Definition of done

- [x] Tests failed first, then pass
- [x] Gate green at or above the baseline
- [x] Every task done
- [x] Diff within the size limit
