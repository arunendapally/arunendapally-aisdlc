## Summary

Each capability now has one architecture overview beside its slices, with C4 Level 1 ("System context") and a "Decision log" of what was agreed after the PRD was signed off: date, decision, who agreed it, source and what it changes. Features in a capability are checked against the capability's systems under change; Define refuses a capability with no system context; a decision row with no one who agreed it or no source is refused; unconfirmed rows are listed in the review packet. Arun asked for the decision log at capability level, in the architecture overview, with the PRD kept as signed.
Spec: specs/capability-overview/prd.md (R1 to R5). Also here: specs/gates-and-names/architecture-overview.md, this repo's own capability overview, with the decisions from 6 and 7 Nov, each quoting Arun. Not in this PR: the change request question (change-request) and the trace index (trace-index).

## Test results

Suite: 252 passed, 0 failed, 0 skipped (baseline 246 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; all five AC tests failed on the base before the change, and each of seven guards broken on purpose failed its test
Criteria: 5 of 5 traced (tests/capability-overview.test.mjs)
New tests: tests/capability-overview.test.mjs (AC-1 to AC-5)
Removed, skipped or quarantined: none

## Pre-review

Risk: medium, because it changes Define, Build and Verify gate checks and the review packet, with no data, auth or contract change and tests that failed on the base.
Open findings: 0 (F1 fixed in 0cf3467, F2 fixed in 0b21852)
Look here first: specs/gates-and-names/architecture-overview.md:35 (rows 4 to 7 were drafted by an agent from session chat and name Arun as agreed; the template says such rows read "unconfirmed" until he confirms, so Arun must confirm each quote), scripts/sdlc.mjs:413 (Define now refuses any capability feature whose capability overview has no System context; judge whether that is right for capabilities that existed before this change)
Lenses run: correctness, simplicity, tests
Revert: git revert of the merge commit; no data to back out. specs/<capability>/architecture-overview.md files created by init stay behind and are harmless.
Checked mechanically: full suite 251 passed, 0 failed (baseline 246); checklist 1, 2, 3, 13, 21, 22, 24 to 26; AC-1 to AC-5 walked through the code; section() strips comments, so the untouched template fails Define and its commented example row is not read as a decision; init does not overwrite an existing capability overview; features with no capability keep their own overview and the "no task changes it" check (tests/systems.test.mjs, tests/prereview-060.test.mjs pass); dogfood rows 1 to 3 match the quoted PRD lines; no new dependencies, no secrets; packet signals: none.
Could not check: the Claude Code session quotes in dogfood rows 4 to 7 (no transcript in the repo); the test proof (no proofCommand).

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
The decision rows quote Arun verbatim from the Claude Code session that built this PR (6 and 7 Nov); the pre-reviewer could not see that session, so Arun confirms them in review.
A live session on this code: the installed 0.7.1 CLI ran the gates.
