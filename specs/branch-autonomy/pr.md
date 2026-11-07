## Summary

Work on a feature's own branch now passes Define and Design on their checks, so a person is asked for the intent and then reviews the PR, not every gate before it. A person keeps Define or Design when gateOwners names one, after a send-back, on a frozen budget, and at Design for data or risky security work (ADR-0007). Verify passes on its checks and the plugin never merges (ADR-0008, merged from main); the PR review is the org's.
Spec: specs/branch-autonomy/prd.md (R1 to R6; R3 restated and R7 removed in "## Changes since v2"). Not in this PR: the "Checked by hand" line (merge-is-hand-check) and plan-roadmap, specs/gates-and-names/slices.md.

## Test results

Suite: 259 passed, 0 failed, 0 skipped (baseline 259), npm test and sdlc gate on this branch after merging main
Evals: 30/30 golden tasks pass, npm run eval after merging main
Proof: not run, no proofCommand; tests/branch-autonomy.test.mjs failed to load on the base code (BRANCH_AUTO missing) before the change
Criteria: 6 of 6 traced (AC-1 to AC-6 in tests/branch-autonomy.test.mjs)
New tests: tests/branch-autonomy.test.mjs (AC-1 to AC-6, plus main, detached HEAD, gateOwners, send-back after drift, frozen budget, data work, each branchAutoBlock condition)
Removed, skipped or quarantined: the AC-7 test went with R7 (Release is out of scope, ADR-0008); AC-3 now requests Verify and asserts main does not move. tests/helpers.mjs and tests/hooks.test.mjs name the test person in gateOwners for gates 1 and 3, so the existing tests keep pinning the person's path.

## Pre-review

Risk: high, because it changes who approves gates 1 and 3 (the gate engine decides when no person is asked)
Open findings: 0 (7 found by pre-review, 6 fixed in cdd00b4, F7 wontfix with the ADR corrected, see specs/branch-autonomy/review.md)
Look here first: scripts/lib.mjs:454 (branchAutoBlock: is this the right set of conditions for no person before the PR, and is any non-protected branch counting as the feature branch acceptable, ADR-0007 Q4), scripts/sdlc.mjs:345 (the branch rule only after autonomy and earned trust; read with the merged Verify reopen at scripts/sdlc.mjs:303), tests/helpers.mjs:57 (every older test names a Define and Design owner, so only tests/branch-autonomy.test.mjs exercises the default config at gates 1 and 3)
Lenses run: correctness, simplicity, tests (mutation in a scratch copy, by the pre-reviewer, not the qa-engineer agent), security of the gate path (by the pre-reviewer). The merge of main (14edff5) and the spec update after it were resolved and checked by the tech-lead agent, not re-run through the pre-reviewer lenses.
Revert: git revert of the merge commit; no data to back out. Gates already passed on checks stay recorded as checks: feature branch in state.json and audit.jsonl and are not undone.
Checked mechanically: Define and Design cannot pass off the feature branch, on main or detached (tested); the branch rule never covers Verify or Release (BRANCH_AUTO test and the condition test for stages 4 to 6); Verify leaves main where it was (AC-3); the reject-event match holds for the audit line user-prompt.mjs writes; agents cannot write .ai-sdlc/** so cannot forge or erase audit lines; no new dependencies; no secrets; checklist items 1, 2, 14, 21, 22, 24 to 26; tests/branch-autonomy.test.mjs 13 of 13 pass after the merge.
Could not check: a live session on the new plugin; whether state.json is guarded against agent edits that would reset gates, kinds or branch (a pre-existing path, not changed here).

## Not verified

The test proof did not run: no proofCommand in .ai-sdlc/config.json.
A live session: this session runs the installed 0.7.1 plugin, so the branch rule takes effect only after merge, a release and a plugin update.
The repo's own .claude/rules/ai-sdlc.md is on task/repo-setup, not this branch; only templates/repo/.claude/rules/ai-sdlc.md is updated here.
The gates for this PR were walked with the installed 0.7.1 CLI under repo autonomy, so this branch's own rule did not pass them, and 0.7.1 still names stage 1 Plan.
