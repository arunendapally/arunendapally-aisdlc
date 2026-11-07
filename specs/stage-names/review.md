# Review: <feature>

<!-- Stage 5 Verify. Owner: pre-reviewer agent. Gate: with pr.md; the gate reads every row and refuses an open blocker, major or minor.
     The findings ledger: one table row per finding, from the pre-reviewer, every lens and every human.
     Replace <feature> above. No findings is a valid ledger; the PR's "Lenses run:" line says what was looked at.

     Example:
| F1 | major | src/lists/save.ts:58 | 6 | Saving twice adds two rows: no unique key on (shopper, item). A replayed POST shows it. | fixed: 5d6e7f8 | pre-review |
| F2 | minor | src/stock/events.ts:12 | 25 | Hand-rolled retry loop where src/lib/retry.ts exists. | wontfix: src/lib/retry.ts retries 5xx only and this call must retry 409 | pre-review |
| F3 | nit | src/lists/save.ts:20 | 22 | Unrelated reformat of the import block. | open | lens:tests |
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
| F1 | major | scripts/sdlc.mjs:256 | 2 | The PRD stage is still called Plan in messages people read, against R2 and the Drop-if (confusing the requirements stage with the design). Class, every instance: scripts/sdlc.mjs:256 (init says "at stage 1 (Plan)", the first message a person sees), scripts/sdlc.mjs:348 ("sends the spec back to Plan"), scripts/sdlc.mjs:399 ("Design follows Plan"), scripts/sdlc.mjs:969 ("is past Plan"), scripts/hooks/user-prompt.mjs:93 ("is past Plan (stage N)"), scripts/hooks/user-prompt.mjs:104 ("starts at stage 1 (Plan)"). No test pins the init wording. | fixed: 389d42c | pre-review |
| F2 | minor | scripts/hooks/user-prompt.mjs:215 | 2 | Gate and stage messages still lead with a stage number, against R1. Class, every instance: scripts/hooks/user-prompt.mjs:215 ("approved gate 1 (Define)", the human approval reply), :188, :228; scripts/hooks/pre-tool.mjs:245, :257 ("is at stage 3. Code waits for stage 4 (Build)"); scripts/sdlc.mjs:266, :293 ("at stage 4 (Build)"), :448 ("Gate 5 has been refused"), :500 ("Request gate 5 again"), :565 (ask header "Gate N"); scripts/retro.mjs:119, :165. pr.md defers the approval reply to A1, but A1 keeps numbers in typed commands only and is unconfirmed. Name the stage in each, or have Arun confirm A1 covers replies. | fixed: 389d42c | pre-review |
