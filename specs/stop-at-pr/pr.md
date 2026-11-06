## Summary

The plugin's work now ends at a raised PR from a branch. Every lane ends at Verify, which passes on its checks; a feature completes there and opens its outcome follow-up from the PRD; `sdlc merge` is gone; a @release criterion is listed under "Check after deploy" instead of being refused. Approval, merge, deploy and release are the org's own process (ADR-0008, Arun's decision).
Spec: specs/stop-at-pr/prd.md (R1 to R6). Not in this PR: deleting the now-unused release code, release.md template and the rest of the release evals (a follow-up task). Also here: `.ai-sdlc/AUTONOMY` is now git-ignored in this repo and in the init-repo kit, after a local grant was committed by mistake on another branch.

## Test results

Suite: 237 passed, 0 failed, 0 skipped (baseline 229 on main), npm test on this commit
Evals: 30/30 golden tasks pass, F1 to F5 each caught, npm run eval on this commit
Proof: not run, no proofCommand; AC-1 to AC-5 failed on the base code before the change and AC-6 passed (it pins unchanged behaviour), run by the tech lead
Criteria: 6 of 6 traced (tests/stop-at-pr.test.mjs)
New tests: tests/stop-at-pr.test.mjs (AC-1 to AC-6)
Removed, skipped or quarantined: the sdlc merge test in tests/autonomy.test.mjs (the command is removed). Evals 05, 15, 23 and 24 follow the new end point; eval 24's gate 5 lapse steps moved to the Plan gate in tests/review.test.mjs, since Verify has no human approval left to lapse.

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
Stale docs left for the follow-up task: docs/getting-started.md, skills/org-ai-sdlc/templates/release.md, and "Backout at Release" wording.
A live session on this code: the installed 0.7.1 CLI ran this feature's gates.
Conflicts with open PRs: #51 (branch-autonomy) says Verify waits for a person; whichever merges second must take ADR-0008's end point.
