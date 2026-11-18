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

<!-- filled from the gate run on this commit -->

## Pre-review

<!-- written after the gate -->

## Not verified

<!-- filled after the gate -->
