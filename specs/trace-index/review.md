# Review: trace-index

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
| F1 | major | scripts/trace.mjs:11 | 2 | A decision is matched only when its Changes cell names "<feature> R<n>" literally, so a range or list misses every id but the first. On this repo, "stop-at-pr R1 to R5" and "stage-names R1 to R5" show R2 to R5 with "decisions: none", and "capability-overview R1, R4" is missing from capability-overview/R4. R2 says the view lists every decision that changed a requirement. The AC-2 test only uses a single-id row, so it cannot catch this: add a range and a list row to the fixture. | fixed: 7e6408c | pre-review |
| F2 | minor | scripts/trace.mjs:30 | 9 | ADRs match on a plain substring, so "save-list/R1" also matches an ADR that names "save-list/R10". The decision match on line 21 already uses word boundaries; the ADR match should too. | fixed: 7e6408c | pre-review |
| F3 | minor | scripts/trace.mjs:28 | 2 | The tests column trusts matrix(), which counts any test file that mentions the feature name and the AC id anywhere (scripts/testmatrix.mjs:23). On this repo every capability-overview/R1 to R5 lists tests/change-request.test.mjs (a comment on its line 18), and every change-request requirement lists tests/test-lock.test.mjs, so "trace --file tests/change-request.test.mjs" claims requirements it does not prove (R3). Inherited from F1 of the facts; fix in testmatrix or accept with a reason. | wontfix: the tests column reuses matrix() unchanged, so its matching is pre-existing behaviour (facts F1) and is fixed separately in testmatrix, not in this slice | pre-review |
| F4 | minor | docs/adr/0007-feature-branch-runs-on-checks-until-the-pr.md:8 | 2 | On the real capability the ADRs column is "none" for every requirement: ADRs cite bare ids ("R1 and R2") and decision rows cite ADRs ("ADR-0008"), neither of which the index reads. R2 (ADRs that name it) therefore shows nothing today. The PR discloses A1 as half taken; a person should decide whether that is acceptable or whether the decision row's ADR reference should link it. | wontfix: accepted ADRs are immutable, so they are not edited to add ids; the ADR template now asks new ADRs to name the requirements they serve as <feature>/R<n> (7e6408c), and the convention starts now | pre-review |
