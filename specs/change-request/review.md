# Review: change-request

<!-- Stage 5 Verify. Owner: pre-reviewer agent. Gate: with pr.md; the gate reads every row and refuses an open blocker, major or minor.
     The findings ledger: one table row per finding, from the pre-reviewer, every lens and every human.
     Replace <feature> above. No findings is a valid ledger; the PR's "Lenses run:" line says what was looked at.

     Example:
| F1 | major | src/lists/save.ts:58 | 6 | Saving twice adds two rows: no unique key on (shopper, item). A replayed POST shows it. | fixed: 22245d7 | pre-review |
| F2 | minor | src/stock/events.ts:12 | 25 | Hand-rolled retry loop where src/lib/retry.ts exists. | wontfix: guidance by Arun's ruling (PRD Q1, A2); the plugin cannot prove who chose, and neither command skips a check | pre-review |
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
| F1 | minor | docs/org-ai-sdlc-process.md:78 | 1 | Docs still say any spec change after Define goes straight back to Define. Since this PR, a change at Build or later stops with the change request or amend question. Every place: docs/org-ai-sdlc-process.md:78, docs/other-agents.md:17, skills/org-ai-sdlc/SKILL.md:45 (the line above the new bullet still says the next request sends it back). An agent reading these expects the old path. | fixed: 22245d7 | pre-review |
| F2 | nit | scripts/sdlc.mjs:557 | 1 | cr and amend are agent verbs, not in HUMAN_VERBS, and are not tied to a recorded answer from the person (unlike ask), so an agent can pick the answer itself, against the PRD Never "choose for the person". Neither skips a check: amend is the old path and still needs a person to re-approve Define, and cr leaves the original untouched. The plugin cannot prove who chose; this rests on the build.md and SKILL.md wording. A human should decide if that is enough. | wontfix: guidance by Arun's ruling (PRD Q1, A2); the plugin cannot prove who chose, and neither command skips a check | pre-review |
