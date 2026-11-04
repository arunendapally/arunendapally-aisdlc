# ADR-NNNN: <the decision as a statement, such as "Saved lists live in the cart database">

Status: proposed
Date: <YYYY-MM-DD>

<!-- Stage 3 Design. Owner: architect agent. Gate: with plan.md, the architect and product lead, asked with "sdlc ask <feature>".
     One ADR per new datastore, dependency, service or breaking contract; name it in plan.md
     "## Decisions" as "- ADR-NNNN: <one line>". Keep it to one screen.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written. The gate checks: the status line above, at the start of its line; Context,
     Options, Decision, Consequences and Review filled; at least two options.
     The status stays proposed until a person approves the Design gate, then becomes accepted. When a
     later ADR replaces this one, change it to "superseded by ADR-NNNN", and write the words
     "Supersedes ADR-NNNN" (no colon) in the new ADR, so Release can check the old one was marked. -->

## Context

<!-- The forces, as facts, not the answer: what is true today (file:line or a fact F<n>), the requirement
     that forces a choice (R ids), and the limits. End a claim you could not check with [unconfirmed]. Example:
R1 needs a saved list per shopper, read on every list page (about 40 requests a second at peak
[unconfirmed]). The cart already runs on Postgres 15 with daily backups (infra/db.tf:12). The team
runs no other datastore. -->

## Options

<!-- Two or more. Each option is a top-level "- " bullet (or a "### " heading); indented sub-bullets are
     pros and cons, not options. Each says what it is, why it might win, why it might lose. Argue the
     runner-up as well as the winner. "Do nothing" counts only if it is real. Example:
- **A table in the cart database:** one table and one migration. Might win: nothing new to run; backups and access control exist. Might lose: list schema changes wait for a cart release.
- **A lists service with its own store:** Might win: owned, deployed and scaled apart. Might lose: a service to run, secure and page for, holding one table. -->

## Decision

<!-- First line: the option chosen, in the words of its bullet. Then only the rules that follow from it.
     Last line: "Confirmed by: <the test, lint rule or gate check that fails if code breaks this decision>".
     Example:
A table in the cart database. List code reaches it only through src/lists/, so it can move to its own
service later without a client change.
Confirmed by: an eslint no-restricted-imports rule bans src/lists/ imports from outside src/lists/ and src/api/. -->

## Consequences

<!-- One line each, starting "Good:", "Downside:" or "Risk:". At least one Downside or Risk. Name the
     signal that would make you revisit the decision. Example:
- Good: nothing new to run; backups and access control are inherited.
- Downside: a list schema change waits for a cart release.
- Risk: list writes load the cart primary; revisit above 200 writes a second. -->

## Review

<!-- Required before the Design gate. The design-reviewer and at least one other discipline ask; the
     architect answers here and revises the ADR where a question lands. One line per question, with
     what changed. Copy the questions here: a link to a review held elsewhere is not a review. Example:
- Q1 (sre): what happens to saving when the cart database is slow? A: POST /saved-items times out at 2 s and the page says "Try again". Changed: timeout added to the Decision.
- Q2 (dba): does the new table lock carts? A: no; it is a new table with no backfill (db-design.md). Changed: nothing.
- Open: none. -->
