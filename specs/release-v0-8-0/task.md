<!-- Task lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. Gate: a CODEOWNER engineer, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     No new behaviour: a dependency bump, config, a refactor, docs, tooling. If a user could notice the
     change, stop: it is a bug or a feature. This file is the PR body; the line limit is in tasks.md Budget.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written; never start a line with "# " or "## " inside a section.
     Every line states a fact with its source: a test, a command run on this commit, a file:line or a link;
     end one you did not check with [unconfirmed]. -->

## Summary

Prepare the v0.8.0 release: the version is 0.8.0, the changelog fragments are folded into a dated 0.8.0 section, and the release notes cover PRs #51 to #67.

## Change

.claude-plugin/plugin.json: version 0.7.1 to 0.8.0 (package.json and marketplace.json carry no version)
CHANGELOG.md: "sdlc changelog" folded changelog.d/unattended-runs.md into Unreleased, then the section is dated "## [0.8.0] - 2026-11-18" under an empty Unreleased
changelog.d/unattended-runs.md: removed by "sdlc changelog"
docs/releases/v0.8.0.md: new, in the style of v0.7.0.md, with the update commands and what changes for features in flight

## Why

PR #67 added guards and the proof requirement, but they reach a session only once a release is cut and installed: the installed plugin is 0.7.1 ("claude plugin list" on 2026-11-18).

## Behaviour change

None, because no script, hook, agent or command changes; only the version string, the changelog and a release note.

## Test results

Suite: 349 passed, 0 failed (baseline 349), from "sdlc gate release-v0-8-0" on c93c2a8
Gate: green, golden evals F1 to F5 caught, PR size 2 of 200 code lines
Main before this branch: the evals workflow passed on 5817009 (gh run 44109470812)
Removed, skipped or quarantined: none

## Pre-review

Risk: medium, because .claude-plugin/plugin.json is a code file; the rest is CHANGELOG.md and docs
Open findings: 0
Look here first: docs/releases/v0.8.0.md (does the headline and the "Features already in flight" list say what you want users to read first?), CHANGELOG.md:7 (the 0.8.0 section is dated 2026-11-18; change it if the release is cut on another day)
Lenses run: correctness, docs accuracy (tech lead, no subagent: under 30 lines and no high-risk path)
Revert: git revert of the merge commit; no data to back out
Checked mechanically: the version is 0.8.0 in .claude-plugin/plugin.json, the only file in the repo that carries one (package.json and marketplace.json have no version); changelog.d/ is empty after "sdlc changelog"; the release notes name PRs #51 to #67 from "git log v0.7.1..origin/main"; no em dashes in the diff
Could not check: the installed plugin after the release, which needs the merge and "gh release create v0.8.0" first

## Not verified

The release itself: an agent may not create it, so nothing here proves that "claude plugin update" picks up 0.8.0.
The pr-dod-and-amend-baseline bug fix is a separate PR and is not in this release unless it merges first and its changelog fragment is folded in.
