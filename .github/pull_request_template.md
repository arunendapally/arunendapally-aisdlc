<!-- Stage 5 Verify. Owner: pre-reviewer and engineer agents. Gate: a CODEOWNER engineer, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     This file is the PR body. A required section with only a comment in it is empty, and the gate refuses it.
     Keep every "## " heading exactly as written; never start a line with "# " or "## " inside a section,
     even a shell comment in a code block. Or: None, because <reason>, where a section does not apply.
     Every line states a fact with its source: a test, a command run on this commit, a file:line or a link;
     end one you did not check with [unconfirmed].
     Extra sections: perf work adds "## Benchmark after" (the gate refuses without it); Risk high adds
     "## QA verdict" (qa-engineer) and "## Security results" (safe-ai-sdlc-expert); "## Defects" lists
     anything QA found that is still open. -->

## Summary

<!-- Two or three sentences: what a user or caller can do now that they could not before, and why. Then the
     spec and what is left out. Example:
Shoppers can save an item for later; a saved item that sells out shows as sold out instead of vanishing.
Spec: specs/saved-items/prd.md (R1 to R7). Not in this PR: sharing a saved list (save-share, next slice). -->

## Test results

<!-- One line per fact, each from a command run on this commit. Any line that is not all green or "none"
     names the test and the reason. Example:
Suite: 412 passed, 0 failed, 0 skipped (baseline 405)
Proof: sdlc proof saved-items green on the branch, red on the base, 3 test files
Criteria: 3 of 3 traced at their level (specs/saved-items/test-matrix.md)
New tests: tests/lists/save.test.ts (AC-1, AC-2), e2e/saved.spec.ts (AC-3)
Removed, skipped or quarantined: none
Checked by hand: AC-3, Priya, 2026-11-03, Safari on an iPhone 13, saved list after a sell-out, pass -->

## Pre-review

<!-- Written by the pre-reviewer agent before any human looks. Keep each line prefix exactly as shown: the gate reads them. Example:
Risk: high, because migrations/0042_saved_items.sql is on a path that always needs a person
Open findings: 0 (nits left open: F3)
Look here first: src/lists/save.ts:58 (is the 200-item count read inside the transaction?), src/stock/events.ts:31 (a redelivered event: is marking twice harmless?)
Lenses run: correctness, data, security, tests
Revert: flag SAVED_ITEMS off; the table stays (db-design.md "## Backout")
Checked mechanically: checklist 1 to 9, 13 to 16, 24 to 26; the new tests fail on the base; no secrets; every packet signal cleared
Could not check: list reads under real peak load

Risk: never below the floor the change sets; the gate refuses a lower label.
  low     only *.md, *.txt, docs/ and specs/ files (a file on a high path stays high)
  medium  any other change, behind a flag or not, including copy inside code files
  high    auth, payments or migrations folders, infra/, terraform/, .github/, CODEOWNERS, .claude/agents/, .claude/hooks/, .mcp.json,
          a .sql or Prisma schema that drops, renames or alters, and any path in the repo's highRiskPaths or askPaths
Open findings: open blocker, major and minor rows in specs/<feature>/review.md. Must be 0. Name any open nits.
Look here first: two or three file:line places that need human judgement, each with the question to decide. Never a place you already proved.
Lenses run: the lenses that ran, by name. An empty ledger is valid; this line says what was looked at.
Revert: the one step that undoes this (git revert of the merge, a flag off), and whether data must be backed out first. -->

## Not verified

<!-- What nobody checked, and why, one line each. The gate prints this section to the approver. Example:
Safari and Firefox: e2e ran in Chromium only.
     Or: None, because every criterion ran in the proof and no changed file is outside the tests. -->
