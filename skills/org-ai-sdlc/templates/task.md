<!-- Task lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. Gate: a CODEOWNER engineer, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     No new behaviour: a dependency bump, config, a refactor, docs, tooling. If a user could notice the
     change, stop: it is a bug or a feature. This file is the PR body; the line limit is in tasks.md Budget.
     A section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written; never start a line with "# " or "## " inside a section.
     Every line states a fact with its source: a test, a command run on this commit, a file:line or a link;
     end one you did not check with [unconfirmed]. -->

## Summary

<!-- One sentence. CI requires this heading until it knows the task lane. Example:
Bump lodash 4.17.20 to 4.17.21 to close CVE-2021-23337. -->

## Change

<!-- One line per file or group. Example:
package.json, package-lock.json: lodash 4.17.20 to 4.17.21 (patch) -->

## Why

<!-- The reason and its link. "Cleanup" is not a reason: say what it prevents or unblocks. Example:
CVE-2021-23337 (command injection in template): Dependabot alert #14 -->

## Behaviour change

<!-- "None, because" with its evidence. Anything else means this is not a task. Example:
None, because all 140 existing tests pass unchanged and no test file is in the diff. -->

## Test results

<!-- One line per fact, each from a command run on this commit. Any line that is not all green or "none"
     names the test and the reason. Example:
Suite: 140 passed, 0 failed, 0 skipped (baseline 140)
Gate: types, lint and secret scan clean (sdlc gate <slug>)
Removed, skipped or quarantined: none -->

## Pre-review

<!-- Written by the pre-reviewer agent before any human looks. Keep each line prefix exactly as shown: the gate reads them. Example:
Risk: medium, because package.json and package-lock.json are code, not documents
Open findings: 0
Look here first: package-lock.json (is 4.17.21 the only version in the tree?)
Lenses run: correctness, dependencies
Revert: git revert of the merge commit; no data to back out
Checked mechanically: npm ls lodash shows one version; npm audit clean; no secrets
Could not check: lodash in the browser bundle

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
lodash in the browser bundle: only the Node tests ran.
     Or: None, because no behaviour changed and every changed line is covered by the suite above. -->
