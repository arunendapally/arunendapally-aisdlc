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

## Not verified

docs/releases/*.md and the README's narrative of an earlier release were left as written: they record what was true then.
This repo's own untracked .claude/rules/ai-sdlc.md still names `sdlc merge`; it is not in git, so the owner updates it (the kit copy in templates/repo is already current).
Rendered markdown was not viewed.
