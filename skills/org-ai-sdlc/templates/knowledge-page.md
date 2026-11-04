---
# A record, not a stage. Owner: the agent that learned it. Gate: none; "sdlc knowledge check" flags it invalid or stale.
# One subject per page; name the file after it (saved-list.md). Unfilled type or confidence fails the check.
# Quote a value holding " #" or starting with a quote or bracket.
type: <system|component|decision|trap|runbook|howto|glossary|playbook>
title: <the subject, as a reader would search for it>
description: <one sentence, the index entry; what it is and the one thing a reader must know>
sources:
  - resource: <path whose change should make this page stale; a folder covers every file in it>
generated: { by: ai-sdlc/<agent>, at: <YYYY-MM-DDTHH:MM:SSZ> }
verified:
  - { by: ai-sdlc/<agent>, at: <YYYY-MM-DDTHH:MM:SSZ> }
# A person who checks it against the code adds: - { by: "human:<id>", at: <YYYY-MM-DDTHH:MM:SSZ> }
verified_commit: <git rev-parse --short HEAD, the commit you read the sources at>
confidence: <Established|Moderate|Preliminary>
# Established: read in code and tests. Moderate: read in code. Preliminary: inferred.
---

<!-- Body for system, component, howto and glossary pages. A trap page uses: What happened, Guard now,
     How to spot it. A runbook page uses: Symptom, Check (read-only), Fix, Verify. A decision page links
     its ADR and says what it rules out; it does not restate the ADR.
     Or: None, because <reason>, where a section does not apply. Tie every claim to a source (file:line,
     a test name, a command and its output); end an inference with [unconfirmed]. Write what one file
     cannot tell a reader: why, the invariant, the trap. Not a code tour, and no copy of another page or ADR.
     Link another page by its file name (no .md) in double square brackets; the check reads links even
     inside comments and refuses one to a page that does not exist. -->

## What it is

<!-- Two sentences: what it does and who calls it. Example:
Keeps up to 200 items per signed-in shopper for 90 days (src/lists/save.ts:12). Called by the web app's save
button through POST /saved-items, and by stock-listener when an item sells out (src/stock/events.ts:17). -->

## How it works

<!-- The path a request takes, file:line per step. Example:
1. src/lists/save.ts:30 counts the shopper's items and refuses a 201st with "Your saved list is full (200 items)".
2. src/lists/repo.ts:42 inserts one row per shopper and item; the unique key makes a second save a no-op.
3. src/stock/events.ts:31 marks every saved row for a sold-out item in one UPDATE. -->

## Rules that must hold

<!-- One line each: the rule, then the test that guards it, or "Unguarded" (then confidence is at most
     Moderate). Example:
- Saving twice keeps one entry. Guarded by: tests/lists/save.test.ts "saving twice keeps one entry".
- A sold-out item is marked in every saved list. Guarded by: tests/stock/events.test.ts "a sold-out item is marked in every saved list".
- Never more than 200 items per shopper. Unguarded. -->

## Gotchas

<!-- What bites people: symptom, cause, what to do. Example:
- Symptom: an item shows "In stock" after it sold out. Cause: its stock.changed event is in the dead-letter
  queue [unconfirmed: seen once, 2026-10-12]. Do: replay the dead letter.
     Or: None, because <reason>. -->

## Related

<!-- Other pages, ADRs and runbooks, one per line, each with why it is related. Example:
- docs/adr/0012-saved-lists-in-the-cart-database.md: why the list is a cart table, not a service.
     Or: None, because <reason>. -->
