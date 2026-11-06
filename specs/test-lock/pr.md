## Summary

Tests the proof recorded are now locked against agents: an agent's edit to one is refused, and the only way to change it is to raise a conflict ("sdlc conflict <feature> <AC-n> <reason>") that a person settles, or to change the spec. Raising a conflict is an answer, not a failed check. This follows the research finding that a sanctioned "flag for a person" outcome cut test cheating sharply (reports/AI SDLC stages and decision records.md).
Spec: specs/test-lock/prd.md (R1 to R5). Not in this PR: locking tests before any code is written, and mutation testing (later slices).

## Test results

Suite: 236 passed, 0 failed, 0 skipped (baseline 229 on main), sdlc gate on this commit
Evals: run by sdlc gate on this commit, green
Proof: not run, no proofCommand; all 7 new tests failed on the base code, and each guard was broken once on purpose to see its test fail
Criteria: 5 of 5 traced (tests/test-lock.test.mjs)
New tests: tests/test-lock.test.mjs (AC-1 to AC-5)
Removed, skipped or quarantined: none

## Pre-review

Pending: the pre-reviewer writes this section.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
The guard in a live session: only the hook tests ran it. In bypass mode it audits the edit instead of refusing (ADR-0006); the proof refusal still stops a changed test.
A write to a locked test through a Bash heredoc has no test.
