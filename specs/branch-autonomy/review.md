# Review: branch-autonomy

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
| F1 | major | tests/branch-autonomy.test.mjs:120 | 14 | Three guards in branchAutoBlock have no test that kills them. Mutated in a scratch copy, the whole file stays 11/11 green when each is removed: the data check (scripts/lib.mjs:458), the risky Security and privacy check (scripts/lib.mjs:459), and the gate-record check (scripts/lib.mjs:451). The data test only asserts doesNotMatch passed on checks, so it passes for any failure; no test sets a risky Security and privacy line; the waiting-gate case is never exercised alone (the reject-event check masks it). ADR-0007 Confirmed by claims the file fails for gate 3 on kind data and for an overwritten waiting gate. Assert the wait and the keptBy reason for each, and add a risky-NFR case and a waiting-gate-then-drift case. | fixed: cdd00b4 | lens:tests |
| F2 | minor | scripts/lib.mjs:450 | 2 | The checkout check runs before the gate-record, gateOwners, frozen, send-back, data and risky checks, so on main with a named owner or a frozen budget the wait says switch to the branch and request again, which cannot pass. ADR-0007 Review Q12 says the switch message applies only when every other condition holds. Move the HEAD comparison last. | fixed: cdd00b4 | pre-review |
| F3 | minor | scripts/lib.mjs:449 | 2 | ADR-0007 Decision says the rule rejects HEAD (detached) and the empty string on either side. Only the empty and protected cases are rejected for state.branch; init --branch HEAD is accepted (scripts/sdlc.mjs:241 validates only the slug), and then a detached checkout matches. Reject the literal HEAD explicitly. | fixed: cdd00b4 | lens:security |
| F4 | minor | scripts/sdlc.mjs:305 | 2 | next() says it passes on its checks on this branch whenever HEAD is the feature branch, even when gateOwners names a person, a reject event exists or the budget is frozen, so the drift message promises a pass that the next request will not give. Base the wording on branchAutoBlock returning null. | fixed: cdd00b4 | pre-review |
| F5 | minor | tests/branch-autonomy.test.mjs:47 | 1 | AC-3 and AC-7 are tagged subsystem with gate 5 waiting on CODEOWNER engineer and gate 6 on release owner, but the test asserts only the BRANCH_AUTO constant and neverTrust. With both stage guards removed (scripts/lib.mjs:448 and scripts/sdlc.mjs:326) this file stays green; only 9 older tests elsewhere catch it. Request gates 5 and 6 on the branch with gateOwners {} and assert the wait. The PR line 7 of 7 traced overstates it. | fixed: cdd00b4 | lens:tests |
| F6 | nit | scripts/lib.mjs:457 | 25 | The send-back check substring-matches raw JSON and depends on audit() key order (stage followed by by), while scripts/review.mjs parses the same file with JSON.parse. It holds today (scripts/hooks/user-prompt.mjs:227 writes event, feature, stage, by), but a reordered audit() call silently turns the guard off. Parse each line and compare fields. | fixed: cdd00b4 | pre-review |
| F7 | nit | scripts/sdlc.mjs:519 | 2 | ADR-0007 says the label precedence is autonomy, then earned trust, then feature branch; the code records earned trust ahead of autonomy when both apply. Pre-existing behaviour; correct the ADR or the code. | fixed: e96c4d3 | pre-review |
