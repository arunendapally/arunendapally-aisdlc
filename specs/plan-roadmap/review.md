# Review: plan-roadmap

<!-- Stage 5 Verify. Owner: pre-reviewer agent. Gate: with pr.md; the gate reads every row and refuses an open blocker, major or minor.
     The findings ledger: one table row per finding, from the pre-reviewer, every lens and every human.
     Replace <feature> above. No findings is a valid ledger; the PR's "Lenses run:" line says what was looked at.

     Example:
| F1 | major | src/lists/save.ts:58 | 6 | Saving twice adds two rows: no unique key on (shopper, item). A replayed POST shows it. | fixed: 7160d8c | pre-review |
| F2 | minor | src/stock/events.ts:12 | 25 | Hand-rolled retry loop where src/lib/retry.ts exists. | fixed: d3bc2d1 | pre-review |
| F3 | nit | src/lists/save.ts:20 | 22 | Unrelated reformat of the import block. | fixed: 7160d8c | lens:tests |
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
| F1 | minor | scripts/sdlc.mjs:394 | 2 | The Define request refuses on every roadmap problem in the capability, not only the requesting slice's: a later slice "after x" with no reason blocks the Define of every now slice. CHANGELOG.md:7 and templates/slices.md:24 say that slice's own Define request is refused. AC-4 uses the same slice for both, so it cannot tell. Either filter by s.slug === feature and add a test with a problem on a sibling slice, or correct the docs to say any slice in the capability. | fixed: 7160d8c | pre-review |
| F2 | nit | scripts/lib.mjs:306 | 5 | A Horizon that is written but not now, next or later (a typo such as "Horizon: soon") silently reads as now, the same as no Horizon. PRD A2 covers only none written. Status could name it as a roadmap problem. | fixed: d3bc2d1 | pre-review |
| F3 | nit | scripts/sdlc.mjs:884 | 22 | The ticket text hardcodes "specs/" for the Spec and acceptance paths while the file is read from cfg.specsDir; a repo with another specsDir gets wrong links. Same pattern already at sdlc.mjs:913. | fixed: 7160d8c | pre-review |
