# Review: definition-of-done

<!-- Stage 5 Verify. Owner: pre-reviewer agent. Gate: with pr.md; the gate reads every row and refuses an open blocker, major or minor.
     The findings ledger: one table row per finding, from the pre-reviewer, every lens and every human.
     Replace <feature> above. No findings is a valid ledger; the PR's "Lenses run:" line says what was looked at.

     Example:
| F1 | major | tests/definition-of-done.test.mjs:75 | 6 | Saving twice adds two rows: no unique key on (shopper, item). A replayed POST shows it. | fixed: 88c8f88 | pre-review |
| F2 | minor | src/stock/events.ts:12 | 25 | Hand-rolled retry loop where src/lib/retry.ts exists. | fixed: e3e42f4 | pre-review |
| F3 | nit | src/lists/save.ts:20 | 22 | Unrelated reformat of the import block. | fixed: f640d99 | lens:tests |
| H1 | major | src/web/SavedList.tsx:44 | 11 | Sold out is checked in the UI only; the API still saves a sold-out item. Confirmed by Ana. | fixed: 9c8d7e6 | human |

     Each cell, and what the gate refuses:
     ID        F1, F2 ... for agents; H1, H2 ... for humans. Take the next number. Never reuse, renumber or delete a row.
     Severity  blocker: wrong or unsafe, cannot ship. major: a real defect or a missing test. minor: fix before merge. nit: taste, may stay open.
     Location  file:line from the repo root, no spaces, where the code is now. When the code moves, move the line.
     Checklist the item number only from standards/code-review-checklist.md: 6, not "B6" or "idempotent". The gate finds repeats by it.
     Finding   what is wrong, why it matters, how to see it. Never type a pipe character: it splits the row and the gate refuses it.
     Status    open | fixed: <sha of the commit that fixed it> | wontfix: <reason>. On a high-risk change the commit must change
               the Location file. A blocker is never wontfix.
     Source    pre-review | human | lens:<name>, no space after the colon: lens:security, lens:tests, lens:data, lens:performance.

     A finding seen before: set its old row back to open; a new row on the same file and checklist item as a closed one is refused.
     A bug with siblings: one row that names the class and lists every place.
     Humans: agree with an agent row by adding "Confirmed by <name>." to its Finding. Add your own as an H row with source
     human; sdlc retro reads H rows to learn what the pre-review misses. -->

| ID | Severity | Location | Checklist | Finding | Status | Source |
|---|---|---|---|---|---|---|
| F1 | minor | tests/definition-of-done.test.mjs:75 | 14 | The definition of done is checked through the gate only at Define (tests/definition-of-done.test.mjs:15 drives stage 1). Dropping 3, 4 or 5 from [1, 3, 4, 5], or a wrong artefact at Design (design.md vs plan.md), Build (tasks.md) or Verify (pr.md), fails no test, yet R2 covers every stage gate. Add one gate test at Build or Verify with an open item. Found by reading; mutation not run. | fixed: 88c8f88 | lens:tests |
| F2 | nit | scripts/lib.mjs:295 | 9 | Only lines starting with "- " count as items, so an open item written "* [ ] x" or indented "  - [ ] x" passes silently. Templates use "- " so this is edge only. | fixed: e3e42f4 | pre-review |
| F3 | nit | specs/definition-of-done/pr.md:19 | 2 | This feature does not dogfood its own Verify checklist: pr.md has no ## Definition of done (and prd.md predates it), so the outcome metric for this PR reads incomplete. tasks.md does carry a ticked one. | fixed: f640d99 | pre-review |
