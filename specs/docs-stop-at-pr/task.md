<!-- Task lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. -->

## Summary

Bring the README, getting-started and process docs in line with ADR-0007 and ADR-0008: a person answers the intent and reviews the PR, and every lane ends at Verify.

## Change

README.md:3, docs/org-ai-sdlc-process.md:9: "waits three times (the spec, the merge, the release)" replaced by the intent and the PR review
docs/org-ai-sdlc-process.md: the routing table's gates column, the lanes table (no Release stage, gates "intent, PR review"), the Verify row's decider, the F3 row and the approval-fingerprint line
docs/getting-started.md: the Verify row no longer says `sdlc approve saved-items 5`; bug and task gates are the PR review; the Release troubleshooting row is removed
agents/qa-engineer.md:27: "the merge gate" is now Verify
CHANGELOG.md: one line under Unreleased

## Why

The open follow-up from #63's Not verified section: these lines told people they approve Verify, merge and release in the plugin, which ADR-0008 (docs/adr/0008-the-plugin-stops-at-a-raised-pr.md) removed, and that Define waits for them, which ADR-0007 changed on a feature branch (scripts/lib.mjs:523 BRANCH_AUTO = [1, 3]).

## Behaviour change

None, because only markdown changed (git diff --stat on this commit: README.md, CHANGELOG.md, agents/qa-engineer.md, two docs files, this spec).

## Test results

Suite: 301 passed, 0 failed, 0 skipped (baseline 301)
Gate: green, PR size 0 of 200 (sdlc gate docs-stop-at-pr)
Removed, skipped or quarantined: none

## Pre-review

Risk: low, because only markdown changed (README.md, CHANGELOG.md, agents/qa-engineer.md, two docs files) and no path needs a person.
Open findings: 5
Look here first: docs/org-ai-sdlc-process.md:71 (whether the full lane should promise no Design wait when data and risky work keep it with a person), docs/org-ai-sdlc-process.md:277 (the "three times" claim this task set out to remove is still there), docs/org-ai-sdlc-process.md:153 (a whole Release bullet still describes deleted checks: fix here or in a follow-up)
Lenses run: correctness against ADR-0007 and ADR-0008, simplicity, docs accuracy, dead references
Revert: git revert of the merge commit; no data to back out
Checked mechanically: each changed line against LANES and BRANCH_AUTO and branchAutoBlock in scripts/lib.mjs, the Verify reopen in scripts/sdlc.mjs request(), the deploy and preview guards in scripts/hooks/pre-tool.mjs; table column counts in both changed tables (3 and 6, all rows match); grep of the five files for approve 1/5/6, merge gate, release and wait claims; checklist items 2, 17, 21, 22
Could not check: rendered markdown; whether qa-engineer defects always land as ledger rows (the Verify claim at agents/qa-engineer.md:27 relies on it); the suite was not run, by instruction

## Not verified

docs/releases/*.md and the README's narrative of an earlier release were left as written: they record what was true then.
This repo's own untracked .claude/rules/ai-sdlc.md still names `sdlc merge`; it is not in git, so the owner updates it (the kit copy in templates/repo is already current).
Rendered markdown was not viewed.
