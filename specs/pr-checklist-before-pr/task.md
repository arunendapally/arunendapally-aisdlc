<!-- Task lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. Gate: a CODEOWNER engineer, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     No new behaviour: a dependency bump, config, a refactor, docs, tooling. If a user could notice the
     change, stop: it is a bug or a feature. This file is the PR body; the line limit is in tasks.md Budget.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written; never start a line with "# " or "## " inside a section.
     Every line states a fact with its source: a test, a command run on this commit, a file:line or a link;
     end one you did not check with [unconfirmed]. -->

## Summary

The PR body's definition of done asks for "Work committed on the feature branch" instead of "PR raised from the feature branch", which Verify checks before "sdlc pr" raises the PR.

## Change

skills/org-ai-sdlc/templates/pr.md:68, templates/repo/.github/pull_request_template.md:68, .github/pull_request_template.md:68: the last definition-of-done item reworded; the three stay identical (tests/review.test.mjs:176)
changelog.d/pr-checklist-before-pr.md: the changelog fragment

## Why

Verify refuses an open definition-of-done item, but "sdlc pr" raises the PR only after Verify passes, so the item could only be ticked untruthfully or marked N/A (#67 marked it N/A). Found building PR #67 (Todoist "small plugin defects found building PR #67").

## Behaviour change

None, because no script, hook or check changes: only one line of template text, and the definition-of-done check (scripts/lib.mjs:334) reads whatever items the document holds.

## Test results

Suite: 349 passed, 0 failed (baseline 349), from "sdlc gate pr-checklist-before-pr"
Gate: green, golden evals F1 to F5 caught, PR size 0 of 200 code lines
Removed, skipped or quarantined: none

## Pre-review

Risk: high, because .github/pull_request_template.md is under .github/, though the change is one line of template text in each of three files
Open findings: 0
Look here first: skills/org-ai-sdlc/templates/pr.md:68 (is "Work committed on the feature branch" the item you want, or should the line go?)
Lenses run: correctness, docs accuracy (tech lead, no subagent: 3 lines)
Revert: git revert of the merge commit; no data to back out
Checked mechanically: the three templates stay identical (tests/review.test.mjs:176 in the gate); no other file in skills, templates, agents or docs says "PR raised"; no em dashes in the diff
Could not check: PRs already open from the old template keep the old item

## Not verified

PRs already open from the old template keep the old item; nothing rewrites them.
