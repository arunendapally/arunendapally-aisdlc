<!-- Bug lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. Gate: a CODEOWNER engineer, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     One file from start to merge, and the PR body. Build passes on checks: the repro red before the fix,
     the gate green after, under the line limit (tasks.md Budget), and no change to dependency manifests,
     migrations, .github, infra or terraform (those make it a feature). Write Repro and Expected and actual
     before any fix.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written; never start a line with "# " or "## " inside a section.
     Every line states a fact with its source: a test, a command run on this commit, a file:line or a link;
     end one you did not check with [unconfirmed]. -->

## Repro

<!-- The failing test, then the steps and the report. Without a proofCommand: run "sdlc gate <slug>" now;
     it must go red on this test. With one: after the fix, "sdlc proof <slug> --files <test file>" must pass
     here and fail on the base. Example:
Test: tests/stock/events.test.ts "a sold-out item is marked in every saved list"
Steps: two shoppers save "Blue mug"; "Blue mug" sells out; the second shopper opens their saved list
Report: issue #212 -->

Test: tests/codeql-alerts.test.mjs (3 tests, one per class of alert); tests/codeql-alerts-edges.test.mjs (3 tests, pre-review F1 and F2)
Steps: run CodeQL (codeql/javascript-queries javascript-code-scanning suite) on main at bf0365a; it reports 17 alerts
Report: local scan on 23 Nov after PR #73 merged; Todoist "clear the 17 CodeQL alerts already on main"

## Expected and actual

<!-- Two lines, observed values only. Example:
Expected: both saved lists show "Blue mug" as "Sold out" within 5 minutes (R2)
Actual: the first shopper's list shows "Sold out"; the second still shows "In stock" after 30 minutes -->

Expected: a section hidden in a comment reads empty; git passes "%s|x" through literally; a slug "a.b" matches only "a.b"; CodeQL reports 0 alerts
Actual: section() returns the hidden text of an unclosed comment; git('log -1 --format=%s|x') returns "" (the shell piped it); "a.b" matched "axb" and "a(b" threw (tests/codeql-alerts.test.mjs on bf0365a); CodeQL reports 17 alerts

## Root cause

<!-- Why, not where: the wrong assumption at its file:line, then the trap. If opened with --caused-by, the
     merge waits for that trap with "- **Source:** <slug>" and a "Guard now" that is a test, hook, lint
     rule, CI check or eval. Example:
src/stock/events.ts:31 looks up one saved row for the item (LIMIT 1), assuming one shopper per item.
Trap: an update meant for every row written as a single-row lookup (new: added to standards/traps.md) -->

Three wrong assumptions, each repeated across files:
(a) Template comments are always closed and never nested, so one lazy pass from comment open to comment close removes them (scripts/lib.mjs:347 section(), facts.mjs:56 and 76, gherkin.mjs:20, sdlc.mjs:368, 669 and 1260, tests/definition-of-done.test.mjs:27). An unclosed comment, or one rebuilt from the pieces of another, left hidden text that counted as filled.
(b) A feature slug or criterion id is plain text inside a RegExp (scripts/lib.mjs:522 lessonPaid, scripts/testmatrix.mjs:23 traces; tests/db-design.test.mjs:18 and lanes.test.mjs:95 escaped only parentheses).
(c) git arguments are safe to hand to a shell (scripts/lib.mjs:208 git() and gitOk() ran execSync on a built string; some arguments come from files, such as ledger locations and facts.md paths).
Trap: a sanitizer or pattern written for the expected input, not for every input [unconfirmed: not added to standards/traps.md]

## Fix

<!-- What changed, why it is the smallest safe change, and what was left alone. Example:
src/stock/events.ts:31: mark every saved row for the item in one UPDATE (3 lines). The save path was right and is unchanged. -->

scripts/lib.mjs: stripComments() removes every closed comment (an empty one and a "--!>" end too, as in HTML), and an unclosed opener hides the rest only when it starts a line, as GitHub renders it, repeated until nothing changes; it scans with indexOf instead of a regex replace, because a mid-line opener rightly stays as text (pre-review F1); section() and the six other call sites use it. escapeRegExp() escapes a string for a RegExp; lessonPaid, traces and the two tests use it. git() and gitOk() run execFileSync with an argument list (split on spaces, a "double-quoted" part kept whole), so no shell reads them; no caller used a pipe, redirect or "&&" (grep of 57 git( calls).
tests/solutions.test.mjs:108 unwraps comments to keep their text, as the test meant, instead of deleting the markers.
skills/org-ai-sdlc/templates/testing/factories.ts:3: the per-run id uses crypto.randomUUID() instead of Math.random().
Left alone: scripts/review.mjs:240 keeps comment newlines for line numbers and is not flagged. scripts/hooks/user-prompt.mjs:21 (clear-text logging): the hook writes the approver's name (git user.name, else USERNAME) into the record of who approved a gate, which is its purpose, not a secret; it stays an open alert for the owner to dismiss on GitHub as a false positive.

## Test results

<!-- One line per fact, each from a command run on this commit. Any line that is not all green or "none"
     names the test and the reason. Example:
Repro: tests/stock/events.test.ts "a sold-out item is marked in every saved list" red on the base (4e5f6a7), green on this commit
Suite: 141 passed, 0 failed, 0 skipped (baseline 140)
Gate: types, lint and secret scan clean (sdlc gate <slug>)
Removed, skipped or quarantined: none -->

Repro: tests/codeql-alerts.test.mjs (3 tests) red on the base (bf0365a, gate recorded 354 passing), green on this commit
Suite: 357 passing, 0 failed (baseline 357), npm test && npm run eval (sdlc gate codeql-alerts)
CodeQL: 17 alerts on bf0365a, 1 on this commit (javascript-code-scanning suite, CodeQL CLI run locally); the one left is user-prompt.mjs:21, a false positive (see Fix)
PR size: 48 of 200 code lines
Removed, skipped or quarantined: none

## Pre-review

<!-- Written by the pre-reviewer agent before any human looks. Keep each line prefix exactly as shown: the gate reads them. Example:
Risk: medium, because it changes code (src/stock/events.ts) and touches no high-risk path
Open findings: 0
Look here first: src/stock/events.ts:31 (one UPDATE over every saved row: is the item index enough at 3 M rows?)
Lenses run: correctness, data, tests
Revert: git revert of the merge commit; no data to back out
Checked mechanically: checklist 1 to 9, 13 to 16; the repro fails on the base; no secrets
Could not check: the UPDATE time at production volume

Risk: never below the floor the change sets; the gate refuses a lower label.
  low     only *.md, *.txt, docs/ and specs/ files (a file on a high path stays high)
  medium  any other change, behind a flag or not, including copy inside code files
  high    auth, payments or migrations folders, infra/, terraform/, .github/, CODEOWNERS, .claude/agents/, .claude/hooks/, .mcp.json,
          a .sql or Prisma schema that drops, renames or alters, and any path in the repo's highRiskPaths or askPaths
Open findings: open blocker, major and minor rows in specs/<feature>/review.md. Must be 0; open nits may stay, named: "Open findings: 0 (nits left open: F5)".
Look here first: two or three file:line places that need human judgement, each with the question to decide. Never a place you already proved.
Lenses run: the lenses that ran, by name. An empty ledger is valid; this line says what was looked at.
Revert: the one step that undoes this (git revert of the merge, a flag off), and whether data must be backed out first. -->

Risk: medium, because it changes code in scripts/ (the gate's own document parsing and every git call) and touches no high-risk path, migration or contract
Open findings: 0 (nits left open: F3)
Look here first: scripts/lib.mjs:350 (stripComments: an unclosed opener hides the rest only at the start of a line, as GitHub renders it; is that the rule for every template and doc the gate reads, F1), scripts/lib.mjs:208 (git arguments are now parsed by a one-line splitter instead of a shell; is a string contract right, or should callers pass an argument array)
Lenses run: correctness, simplicity, tests
Revert: git revert of the merge commit; no data or state to back out
Checked mechanically: every git( and gitOk( caller in scripts/ (no pipe, redirect, glob, tilde, %VAR%, single quote or glued quote; empty interpolations give no token or an empty quoted argument, as the shell did); no circular import (scripts/lib.mjs imports only node: modules); escapeRegExp covers every RegExp metacharacter and all four sites use it correctly; the other unescaped ids (scripts/sdlc.mjs:670, scripts/testmatrix.mjs:52) are AC-n, enforced at scripts/gherkin.mjs:61; no template or doc in the repo holds an unclosed comment opener (scan of every .md and .feature); tests/codeql-alerts.test.mjs passes here (3 of 3); tests/solutions.test.mjs:108 unwrap gives the same text as before for the PRD template; no secrets; no new dependency
Could not check: the CodeQL count of 1 (not re-run by the pre-reviewer); that the new test fails on the base (taken from the gate record of 354 on bf0365a); git() on Linux or macOS (run on Windows only)

## Not verified

<!-- What nobody checked, and why, one line each. The gate prints this section to the approver. Example:
The UPDATE time on 3 M saved rows: ran on 10 k rows only.
     Or: None, because the repro and every changed line are covered by the suite above. -->

CodeQL result of 1 alert left: the pre-reviewer did not re-run the CodeQL CLI; the count is the builder's.
The new tests red on the base: taken from the gate record (354 on bf0365a), not re-run by the pre-reviewer.
git() without a shell on Linux and macOS: the suite ran on Windows only; execFileSync needs git on PATH as an executable, so a git that exists only as a .cmd or shell shim would now fail where cmd.exe found it.
skills/org-ai-sdlc/templates/testing/factories.ts: the global crypto.randomUUID() needs Node 19 or later, or a browser or jsdom that provides it, in the repo that copies the template; no test covers the template.
