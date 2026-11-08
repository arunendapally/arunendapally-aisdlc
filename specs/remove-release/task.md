<!-- Task lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. -->

## Summary

Delete the Release check that no lane reaches since ADR-0008, with its tests; stage 6 keeps its name.

## Change

scripts/loop.mjs: remove releaseProblems, liveProblems, landedOn, releaseSha, liveShaIn, probeResult, testedOn, isHeaderRow and rememberWarnings, and the four imports only they used
scripts/sdlc.mjs: remove the stage-6 branch of `request` that called releaseProblems (a stage-6 feature already completes earlier in `request`, scripts/sdlc.mjs:329)
tests/failures.test.mjs, tests/loop.test.mjs, tests/harden.test.mjs, tests/release-criteria.test.mjs: remove the 8 tests of the deleted functions; harden test 1 keeps its outcomeFollowUp check
CHANGELOG.md: one line under Unreleased

## Why

ADR-0008 (docs/adr/0008-the-plugin-stops-at-a-raised-pr.md) ends every lane at Verify, and close-stage-six (#60) completes any feature an older plugin left at stage 6 before the Release check could run, so this code only cost reading time and test minutes. The CHANGELOG entry for ADR-0008 said a follow-up would remove it.

## Behaviour change

None, because the deleted branch ran only for a feature at stage 6 that is not closed, and `request` returns for such a feature at scripts/sdlc.mjs:329 before reaching it; no other caller of the deleted functions exists outside the removed tests (git grep on this commit).

## Test results

Suite: 301 passed, 0 failed, 0 skipped (baseline 309 on main; the 8 removed tests tested only the deleted functions)
Gate: see sdlc gate remove-release on this commit
Removed, skipped or quarantined: 8 removed: failures F3 release, F3 rollback, F3 squash; loop release readiness, release warnings; harden failed probe, rollback date; release-criteria V4 Release refuses

## Pre-review

## Not verified

The release.md template, agents/sre.md and docs that still describe Release were not changed: they are docs, left for a separate cleanup.
The stale-knowledge, superseded-ADR and postmortem-action warnings no longer run anywhere; whether Verify should run them is not decided here.
No proofCommand is set, so the fail-before proof did not run.
