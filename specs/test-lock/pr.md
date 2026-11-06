## Summary

Tests the proof recorded are now locked against agents: an agent's edit to one is refused, and the only way to change it is to raise a conflict ("sdlc conflict <feature> <AC-n> <reason>") that a person settles, or to change the spec. Raising a conflict is an answer, not a failed check. This follows the research finding that a sanctioned "flag for a person" outcome cut test cheating sharply (reports/AI SDLC stages and decision records.md).
Spec: specs/test-lock/prd.md (R1 to R5). Not in this PR: locking tests before any code is written, and mutation testing (later slices).

## Test results

Suite: 240 passed, 0 failed, 0 skipped (baseline 229 on main), sdlc gate on this commit
Evals: green via sdlc gate on this commit; eval 13 now checks the lock refusal and that a failed proof keeps the lock (791e775, reason in the commit message)
Proof: not run, no proofCommand; all 7 new tests failed on the base code, and each guard was broken once on purpose to see its test fail
Criteria: 5 of 5 traced (tests/test-lock.test.mjs)
New tests: tests/test-lock.test.mjs (AC-1 to AC-5)
Removed, skipped or quarantined: none

## Pre-review

Risk: high, because the change is a security guard on agent behaviour; the bypasses the pre-review reproduced (F1 to F3) are closed and tested
Open findings: 0 (F1 to F4 fixed in c5b2591 and 354b553; F5 wontfix, the repo config rides here so the gate runs)
Look here first: scripts/sdlc.mjs:764 (a failed or narrowed proof drops the lock, F1), scripts/loop.mjs:184 (an agent spec edit unlocks every test, and under autonomy no person sees it: needs your ruling on A2, F3), scripts/hooks/pre-tool.mjs:212 (shell writes other than heredocs pass the guard, F2)
Lenses run: correctness, simplicity, tests, security
Revert: git revert of the merge commit; no data to back out (state.json conflicts entries are ignored by the old code)
Checked mechanically: all 5 criteria walked through the code and each has a test that asserts the outcome; no new dependencies; settle is refused to agents by Bash, the CLI path and a prefilled AskUserQuestion; the lock does not block non-test files (AC-1 test plus Write to src); packet signals for user-prompt.mjs, lib.mjs and loop.mjs are covered by tests/test-lock.test.mjs through the hooks and CLI; no secrets
Could not check: the guard in a live Claude Code session; that the new tests fail on the base code (taken from the PR, not re-run); the full suite

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
The guard in a live session: only the hook tests ran it. In bypass mode it audits the edit instead of refusing (ADR-0006); the proof refusal still stops a changed test.
A write to a locked test through node -e or another interpreter is not caught by the guard; the proof refusal still stops it.
The unlock rule follows Arun's answer (PRD Q2): only a new spec version a person approved unlocks tests; the change-request slice will make a CR the other route.
One gate run recorded 239 of 240 tests (a flaky run); npm test and the next gate both passed 240.
