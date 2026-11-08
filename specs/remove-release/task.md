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

None a user sees, because the deleted branch ran only for a feature at stage 6: an open one returns at scripts/sdlc.mjs:329 before reaching it, and a closed one now gets the "already approved" refusal without first running the old Release check and its git fetch (a refusal either way). No other caller of the deleted functions exists outside the removed tests (git grep on this commit).

## Test results

Suite: 301 passed, 0 failed, 0 skipped (baseline 309 on main; the 8 removed tests tested only the deleted functions)
Gate: green, 301 passing, 29/29 evals, F1 to F5 caught, PR size 145 of 200 (sdlc gate remove-release)
Removed, skipped or quarantined: 8 removed: failures F3 release, F3 rollback, F3 squash; loop release readiness, release warnings; harden failed probe, rollback date; release-criteria V4 Release refuses

## Pre-review

Risk: medium, because it deletes code only, no data, contract or high-risk path, and the deleted branch was unreachable for open features since close-stage-six
Open findings: 0 (F1, F2 fixed in e06216f)
Look here first: scripts/sdlc.mjs:329 (confirm a closed stage-6 feature skipping the old Release check is acceptable, F2), CHANGELOG.md:7 (the stale-knowledge, superseded-ADR and postmortem-action warnings now run nowhere: a person decides whether Verify should own them)
Lenses run: correctness, simplicity, dead references
Revert: git revert of the merge commit; no data or state to back out
Checked mechanically: checklist items 2, 3, 13, 21, 22, 26; suite rerun at ddfafa3: 301 passed, 0 failed; no caller or import of releaseProblems, liveProblems, landedOn, releaseSha, liveShaIn, probeResult, testedOn, isHeaderRow, rememberWarnings in scripts, hooks, tests, evals, templates; the removed imports (gitOk, knowledgeCheck, knowledgePages, parseFacts, factProblems) have no other use in loop.mjs; every remaining loop.mjs import is still used; harden test 1 keeps its outcomeFollowUp assertion; the 8 removed tests exercised only deleted functions; no new dependency; packet signals: none
Could not check: docs, agents/sre.md and the release.md template still describe Release (out of scope by task.md); no proofCommand, so no fail-before proof; @release criteria are now named on the PR only (ADR-0008), not re-verified here

## Not verified

The release.md template, agents/sre.md and docs that still describe Release were not changed: they are docs, left for a separate cleanup.
The stale-knowledge, superseded-ADR and postmortem-action warnings no longer run anywhere; whether Verify should run them is not decided here.
No proofCommand is set, so the fail-before proof did not run.
