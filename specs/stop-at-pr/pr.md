## Summary

The plugin's work now ends at a raised PR from a branch. Every lane ends at Verify, which passes on its checks; a feature completes there and opens its outcome follow-up from the PRD; `sdlc merge` is gone; a @release criterion is listed under "Check after deploy" instead of being refused. Approval, merge, deploy and release are the org's own process (ADR-0008, Arun's decision).
Spec: specs/stop-at-pr/prd.md (R1 to R6). Not in this PR: deleting the now-unused release code, release.md template and the rest of the release evals (a follow-up task). Also here, so the gate runs on this branch: .ai-sdlc/config.json, .ai-sdlc/autonomy.json and .ai-sdlc/.gitignore (the same files as task/repo-setup), and the re-sliced specs/gates-and-names/slices.md. And `.ai-sdlc/AUTONOMY` is now git-ignored in this repo and in the init-repo kit, after a local grant was committed by mistake on another branch.

## Test results

Suite: 240 passed, 0 failed, 0 skipped (baseline 229 on main), npm test on this commit
Evals: 30/30 golden tasks pass, F1 to F5 each caught, npm run eval on this commit
Proof: not run, no proofCommand; AC-1 to AC-5 failed on the base code before the change and AC-6 passed (it pins unchanged behaviour), run by the tech lead
Criteria: 6 of 6 traced (tests/stop-at-pr.test.mjs)
New tests: tests/stop-at-pr.test.mjs (AC-1 to AC-6)
Removed, skipped or quarantined: the sdlc merge test in tests/autonomy.test.mjs (the command is removed). Evals 05, 15, 23 and 24 follow the new end point; eval 24's gate 5 lapse steps moved to the Plan gate in tests/review.test.mjs, since Verify has no human approval left to lapse.

## Pre-review

Risk: high, because it changes the gate path itself: Verify now passes on checks in every lane, including high-risk paths and data work, and the reviewed-commit guard no longer runs (floor is medium)
Open findings: 0 (F1, F2, F3, F5 fixed in 5422ece; F4 wontfix, the PR summary now names the files)
Look here first: scripts/lib.mjs:29 (auto [4, 5] in every lane: confirm you accept that a high-risk or destructive change completes Verify with no person, leaving it to branch protection, ADR-0008 Risk), scripts/sdlc.mjs:475 (F1: nothing now catches code committed after Verify passed), evals/golden/24-approval-covers-what-was-checked.json:113 (the Verify lapse steps are gone; judge whether the Plan-gate lapse test in tests/review.test.mjs:38 is enough)
Lenses run: correctness, simplicity, tests, security (gate path)
Revert: git revert of the merge commit; no data to back out. Features closed at Verify under this code stay closed (state.json), and a feature left at stage 6 now closes on advance
Checked mechanically: checklist 1, 2, 3, 13, 22, 24 to 26; tests/stop-at-pr.test.mjs passes (9 of 9); each AC-1 to AC-6 walked through sdlc.mjs request and loop.mjs advanceFeature; no command left that pushes to main (merge removed, push guard scripts/hooks/pre-tool.mjs:172 unchanged); a failing Verify still refuses (AC-6); every edited eval and test assertion traces to R1 to R5, none loosened outside the spec; no new dependencies; no secrets
Could not check: that AC-1 to AC-5 fail on the base (taken from the tech lead); the full suite and evals on this commit (not rerun); whether target repos have branch protection on main; live behaviour of the installed 0.7.1 CLI

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
Stale docs left for the follow-up task: docs/getting-started.md, skills/org-ai-sdlc/templates/release.md, and "Backout at Release" wording.
A live session on this code: the installed 0.7.1 CLI ran this feature's gates.
Conflicts with open PRs: #51 (branch-autonomy) says Verify waits for a person; whichever merges second must take ADR-0008's end point.
