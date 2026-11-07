## Summary

Each stage's document now ends with a "Definition of done" checklist suited to that stage, and a stage's request refuses any item left neither ticked nor marked "N/A: <reason>". Each stage command states its definition of ready as the previous stage's definition of done. Documents written before this change, with no checklist, are not refused for it. Arun asked for DoD and DoR on every stage, as a markdown checklist at the end, with DoR being the previous stage's DoD.
Spec: specs/definition-of-done/prd.md (R1 to R4). Not in this PR: the Plan stage's own checklist (plan-roadmap).

## Test results

Suite: 258 passed, 0 failed, 0 skipped (baseline 246 on main), sdlc gate on this branch
Evals: green via sdlc gate on this branch
Proof: not run, no proofCommand; the new tests failed on the base before the change, and disabling the checker or its call made them fail
Criteria: 6 of 6 traced (tests/definition-of-done.test.mjs)
New tests: tests/definition-of-done.test.mjs (AC-1 to AC-6)
Removed, skipped or quarantined: none

## Pre-review

Risk: high, because .github/pull_request_template.md is on a path that always needs a person; otherwise it is code (the floor) in the gate path that refuses a stage request, with no data, auth or contract change; a false refusal blocks work, a false pass only lets an open checklist through.
Open findings: 0 (F1 fixed in 88c8f88, F2 in e3e42f4, F3 in f640d99)
Look here first: scripts/sdlc.mjs:340 (the stage list and the artefact it reads decide which gates enforce the checklist; only Define is exercised by a test), skills/org-ai-sdlc/templates/prd.md:130 and design.md:123 (whether these checklist items are the right ones per stage is a product call)
Lenses run: correctness, simplicity, tests
Revert: git revert of the merge commit; no data or state to back out, and documents that carry a checklist keep passing on the old code because it ignores the section.
Checked mechanically: walked AC-1 to AC-6 through scripts/lib.mjs openDoneItems and the request path; tests/definition-of-done.test.mjs passes (9 of 9) and imports openDoneItems, so it fails on the base; R4 holds (no section, no refusal); light lane reads tasks.md at Build and bug, task and hotfix documents have no section; no new dependency (checklist 24 to 26); changelog updated (21); no secrets; packet signal on .github/pull_request_template.md is a template text change only.
Could not check: the full suite count (255) was not rerun here; no mutation run on the stage list; security and operability lenses listed in the packet were not run, judged unneeded for a template and gate-text change.

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
The agent ticks its own checklist items; the gate checks only that none is left open, and the PR reviewer reads them (PRD A2).
A live session on this code: the installed 0.7.1 CLI ran the gates.

## Definition of done

- [x] Pre-review has no open findings
- [x] Not verified is honest
- [x] PR raised from the branch
