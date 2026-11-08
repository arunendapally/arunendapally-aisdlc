<!-- Hotfix lane, declared only by a person. Owner: builder agent; the sre agent writes Probes and Follow-up. Gate: the on-call engineer (CODEOWNER), asked with "sdlc ask <feature>"; then the incident commander at Release.
     This file is the PR body. Review deadline 1 h; line limit in tasks.md Budget. Incident, Fix and
     Rollback come before the PR; Probes and Follow-up come after the deploy from main.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written; never start a line with "# " or "## " inside a section.
     Every line states a fact with its source: a test, a command run on this commit, a file:line or a link;
     end one you did not check with [unconfirmed]. -->

## Incident

<!-- Facts from monitoring, each with its source. Example:
Broken: POST /checkout returns 500 for every card payment (dashboard: checkout-errors)
Since: 2026-11-04 09:12 UTC, after deploy a1b2c3d
Who: all EU customers, about 40 failed orders a minute
Link: #inc-2211 -->

## Fix

<!-- The smallest change that stops the harm, and what it leaves for the follow-up. Example:
src/payments/client.ts:88 restores the 10 s gateway timeout dropped in a1b2c3d. Why the default changed is the follow-up. -->

## Rollback

<!-- One step to undo this fix, what it falls back to, and whether it was tried. Example:
git revert of the merge commit; falls back to a1b2c3d (the outage); not rehearsed [unconfirmed] -->

## Test results

<!-- One line per fact, each from a command run on this commit. Any line that is not all green or "none"
     names the test and the reason. Example:
Repro: tests/payments/client.test.ts "times out after 10 s" red before the fix, green on this commit; sdlc proof runs after the merge
Suite: 141 passed, 0 failed, 0 skipped (baseline 140)
Gate: types, lint and secret scan clean (sdlc gate <slug>)
Removed, skipped or quarantined: none -->

## Pre-review

<!-- Written by the pre-reviewer agent before any human looks. Keep each line prefix exactly as shown: the gate reads them. Example:
Risk: high, because src/payments/client.ts is on a path that always needs a person
Open findings: 0
Look here first: src/payments/client.ts:88 (is 10 s right for the gateway's p99, or only the old value?)
Lenses run: correctness, security, tests
Revert: see "## Rollback"
Checked mechanically: the repro fails on the base; no secrets; diff 4 lines
Could not check: card payments above 40 a minute

Risk: never below the floor the change sets; the gate refuses a lower label.
  low     only *.md, *.txt, docs/ and specs/ files (a file on a high path stays high)
  medium  any other change, behind a flag or not, including copy inside code files
  high    auth, payments or migrations folders, infra/, terraform/, .github/, CODEOWNERS, .claude/agents/, .claude/hooks/, .mcp.json,
          a .sql or Prisma schema that drops, renames or alters, and any path in the repo's highRiskPaths or askPaths
Open findings: open blocker, major and minor rows in specs/<feature>/review.md. Must be 0; open nits may stay, named: "Open findings: 0 (nits left open: F5)".
Look here first: two or three file:line places that need human judgement, each with the question to decide. Never a place you already proved.
Lenses run: the lenses that ran, by name. An empty ledger is valid; this line says what was looked at.
Revert: the one step that undoes this (git revert of the merge, a flag off), and whether data must be backed out first. -->

## Not verified

<!-- What nobody checked, and why, one line each. The gate prints this section to the approver. Example:
Card payments above 40 a minute: not load tested.
     Or: None, because the repro and every changed line are covered by the suite above. -->

## Probes

<!-- After the deploy from main: read-only checks in production, each with pass or fail, then "Live:" with the
     build the running system reports (a version endpoint, a meta tag, the platform's inspect command),
     never the sha you expect. Release refuses until the fix is on origin/main and the live build contains
     it and the previous release. Example:
POST /checkout with a test card: pass (200 in 1.2 s)
/checkout error rate 15 min after deploy: pass (0.1%, was 38%)
Live: 7e4d9f0 -->

## Follow-up

<!-- Each item with its command or file. The postmortem stays overdue until all of these are done. Example:
Proof: sdlc proof checkout-timeouts --files tests/payments/client.test.ts: pass
Postmortem: sdlc incident checkout-timeouts, due 2026-11-06
Trap: standards/traps.md entry with Source checkout-timeouts and a Guard now that is a test
Root cause: bug payments-default-timeout -->
