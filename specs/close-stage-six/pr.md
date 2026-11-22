## Summary

A feature an older plugin left at Release (stage 6) now completes on its next `sdlc request` or `sdlc advance`, with its outcome follow-up from the PRD and no Release check or approval (ADR-0008). This repo's nine stage-6 features are closed with it, and the two evals that ran the Release check (14, 22) are removed.
Spec: specs/close-stage-six/prd.md (R1 to R4). Not in this PR: removing the unused Release code, template and docs (remove-release, next task).

## Test results

Suite: 304 passed, 0 failed (sdlc gate close-stage-six on a78e4c4, after the pre-review fixes; baseline 303 per tasks.md)
Feature file: node --test tests/stop-at-pr.test.mjs, 14 passed, 0 failed, run by the pre-reviewer on 4a962c7
Evals: node evals/run.mjs --baseline evals/baseline.json, 29 of 29 golden tasks pass, F1 to F5 caught (F3 by no-merge-push-deploy and branch-deploy-is-a-preview), run by the tech lead on f104f16
New tests: tests/stop-at-pr.test.mjs close-stage-six AC-1 and AC-3 (request), AC-2 and AC-3 (advance); AC-4 is the existing "stop-at-pr AC-6: a failing Verify still stops"
Removed: tests/review.test.mjs "code committed after Verify never reached a reviewer, so Release refuses it" (pinned the Release check this removes; a commit after Verify stays covered at stage 5); evals 14-release-needs-tested-rollback and 22-release-is-on-main-and-live

## Pre-review

Risk: high, because it changes gate code (scripts/sdlc.mjs request and advance skip checks and approval at stage 6) and removes two golden evals
Open findings: 0 (F1 to F3 fixed in f104f16)
Look here first: scripts/sdlc.mjs:328 (request at stage 6 closes before any check or autonomy test: is closing with no person acceptable in a repo without autonomy?), evals/golden/31-branch-deploy-is-a-preview.json (old eval 22's preview-deploy ask, kept as its own F3 eval, F1)
Lenses run: correctness, simplicity, tests, evals (failure coverage after removing 14 and 22), state (nine closed features)
Revert: git revert of the merge commit; the nine closes in specs/*/state.json revert with it, no data to back out first
Checked mechanically: AC-1 to AC-4 walked through the code; both new tests would fail on the base, by reading it, not by running it (request hits the Release check with no release.md, advance hits "is not approved"); the nine state.json diffs add only stage-6 leftAt, updatedAt, closedAt, releasedSha and an open outcome, nothing else; no feature is left at stage 6 unclosed; evals green with F1 to F5 caught; checklist 1 to 4, 13, 21, 22, 24 to 26; no secrets
Could not check: nothing further; the review packet was rebuilt and the gate rerun by the tech lead after the fixes

## Not verified

The test proof did not run: no proofCommand is set in .ai-sdlc/config.json; the new tests were seen red on the base code by hand instead.
The nine closed features keep the releasedSha the old close wrote before F3 was fixed; nothing reads it but the Release check, and state.json is never edited by hand.
Mutation tests, run by the tech lead: removing either stage-6 guard turns AC-1 or AC-2 red; restoring the releasedSha write turns both red; "expect": "allow" in eval 31 fails it. Whether request should close a stage-6 feature in a repo without autonomy is left to the human reviewer (Look here first).

## Definition of done

- [ ] Pre-review has no open findings
- [x] Not verified is honest
- [ ] PR raised from the feature branch
