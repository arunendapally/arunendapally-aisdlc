## Summary

Work on a feature's own branch now passes Plan and Design on their checks, so a person is asked for the intent and then for the PR review, not at every gate before it. Verify (the PR) and Release keep their people, and a person keeps Plan or Design when gateOwners names one, after a send-back, on a frozen budget, and at Design for data or risky security work (ADR-0007).
Spec: specs/branch-autonomy/prd.md (R1 to R7). Not in this PR: the "Checked by hand" line (merge-is-hand-check) and the plan/design rename (design-rename, plan-roadmap), specs/gates-and-names/slices.md.

## Test results

Suite: 241 passed, 0 failed, 0 skipped (baseline 229 on main), npm test on this commit
Evals: 30/30 golden tasks pass, npm run eval on this commit
Proof: not run, no proofCommand; tests/branch-autonomy.test.mjs failed to load on the base code (BRANCH_AUTO missing) before the change
Criteria: 7 of 7 traced (AC-1 to AC-7 in tests/branch-autonomy.test.mjs)
New tests: tests/branch-autonomy.test.mjs (AC-1 to AC-7, plus main, detached HEAD, gateOwners, send-back after drift, frozen budget, data work)
Removed, skipped or quarantined: none. tests/helpers.mjs and tests/hooks.test.mjs now name the test person in gateOwners for gates 1 and 3, so the existing tests keep pinning the person's path.

## Pre-review

Risk: high, because it changes who approves gates 1 and 3 (the gate engine decides when no person is asked)
Open findings: 0 (7 found by pre-review, 6 fixed in cdd00b4, F7 wontfix with the ADR corrected, see specs/branch-autonomy/review.md)
Look here first: scripts/lib.mjs:446 (branchAutoBlock: is this the right set of conditions for no person before the PR, and is any non-protected branch counting as the feature branch acceptable, ADR-0007 Q4), tests/helpers.mjs:59 (every older test now names a Plan and Design owner, so only tests/branch-autonomy.test.mjs exercises the default config at gates 1 and 3), scripts/sdlc.mjs:324 (the branch rule only after autonomy and earned trust, and only when spec.isAuto is false)
Lenses run: correctness, simplicity, tests (mutation in a scratch copy, by the pre-reviewer, not the qa-engineer agent), security of the gate path (by the pre-reviewer)
Revert: git revert of the merge commit; no data to back out. Gates already passed on checks stay recorded as checks: feature branch in state.json and audit.jsonl and are not undone.
Checked mechanically: gate 1 and 3 cannot pass off the feature branch, on main or detached (tested); gates 5 and 6 cannot pass via this rule (both stage guards, and with them removed 9 older tests fail); the reject-event match holds for the audit line user-prompt.mjs:227 writes, and the feature slug regex stops a feature name matching another; removing the reject check fails the send-back test; agents cannot write .ai-sdlc/** so cannot forge or erase audit lines; no new dependencies; no secrets; checklist items 1, 2, 14, 21, 22, 24 to 26; tests/branch-autonomy.test.mjs 12 of 12 pass on HEAD, each condition pinned by a test.
Could not check: a live session on the new plugin; whether state.json is guarded against agent edits that would reset gates, kinds or branch (a pre-existing path, not changed here).

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
A live session: this session runs the installed 0.7.1 plugin, so the branch rule takes effect only after merge, a release and a plugin update.
The repo's own .claude/rules/ai-sdlc.md is on task/repo-setup, not this branch; only templates/repo/.claude/rules/ai-sdlc.md is updated here.
