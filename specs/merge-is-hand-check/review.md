# Review: merge-is-hand-check

<!-- Stage 5 Verify. Owner: pre-reviewer agent. Gate: with pr.md; the gate reads every row and refuses an open blocker, major or minor.
     The findings ledger: one table row per finding, from the pre-reviewer, every lens and every human.
     Replace <feature> above. No findings is a valid ledger; the PR's "Lenses run:" line says what was looked at.

     Example:
| F1 | major | src/lists/save.ts:58 | 6 | Saving twice adds two rows: no unique key on (shopper, item). A replayed POST shows it. | wontfix: sdlc merge is removed by the next slice, stop-at-pr (specs/gates-and-names/slices.md); the plugin stops at a raised PR and a person merges, and this run never calls sdlc merge | pre-review |
| F2 | minor | src/stock/events.ts:12 | 25 | Hand-rolled retry loop where src/lib/retry.ts exists. | fixed: 235a1a3 | pre-review |
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
| F1 | major | scripts/sdlc.mjs:572 | 2 | With autonomy granted (.ai-sdlc/AUTONOMY is set on this branch) sdlc merge pushes the reviewed commit to main with no person merging, and nothing refuses an untested @manual criterion. The packet line "Your merge records that you checked these" and the PRD Never clause (never say a criterion was checked by hand when no person merged) and Drop-if (a criterion meant for a person reaches main unlooked) both fail on that path. Before this change the PR line at least had to exist. See it: a feature with an untested @manual AC, autonomy on, sdlc request then sdlc merge lands it. Fix: sdlc merge refuses while matrix rows have due manual and not traced, or the spec says why autonomy covers it. | wontfix: sdlc merge is removed by the next slice, stop-at-pr (specs/gates-and-names/slices.md); the plugin stops at a raised PR and a person merges, and this run never calls sdlc merge | pre-review |
| F2 | minor | tests/release-criteria.test.mjs:47 | 15 | AC-1 asserts the manualProblems export is gone, not the scenario outcome (Verify checks run, no problem names AC-2). A hand check re-added inline in the Verify request in scripts/sdlc.mjs would keep this test green. Drive the Verify request (or the function it calls) with a PR body lacking the line and assert no refusal names AC-2. | fixed: 235a1a3 | pre-review |
