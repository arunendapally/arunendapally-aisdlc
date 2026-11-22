# Review: release-docs

<!-- Verify. Owner: pre-reviewer agent. Gate: with pr.md; the gate reads every row and refuses an open blocker, major or minor.
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
| F1 | minor | docs/getting-started.md:99 | 2 | The rewritten line says the outcome follow-up opens when Verify completes a full-lane feature and that you add outcomeWindowDays light 7 to turn it on for light. DEFAULT_CONFIG already has light: 7 (scripts/lib.mjs:182) and advanceFeature opens it for any lane with a window (scripts/loop.mjs:257), so a light feature already gets one. Say full and light by default, 0 turns a lane off. | fixed: c0ebb5d | pre-review |
| F2 | minor | CHANGELOG.md:7 | 21 | No changelog entry for this change, and two Unreleased entries now say the opposite: remove-release (line 7) says the release.md template and the docs that mention it stay for now, and the ADR-0008 entry says the release.md template stays until a follow-up. | fixed: c0ebb5d | pre-review |
| F3 | minor | docs/getting-started.md:65 | 2 | Class: Release-stage wording beside the edited lines, which the task goal (nothing tells people about a stage 6) covers. getting-started.md:65 says a feature waits on you for the spec, the merge and the release, introducing the table whose Release row was just removed. docs/org-ai-sdlc-process.md:60 (a backout at Release), :101 (Remember row: flags at Release, reviewed with the release), :154 and :285 (Release warns about stale knowledge; #61 deleted those warnings). Fix every instance or list them under Not verified by name. | fixed: c0ebb5d | pre-review |
| F4 | nit | agents/sre.md:13 | 2 | Line 13 says the plan Run it section and the new line 14 says the design Run it section; the artefact is design.md (scripts/lib.mjs:12). Light lane features have no design, so line 14 gives the SRE nowhere to write the rollout there. | fixed: c0ebb5d | pre-review |
| F5 | nit | tests/db-design.test.mjs:66 | 2 | Assertion message Backout stays in release.md names the deleted template. Harmless: stageSpec(6) still lists the Backout heading for db-design.md. | fixed: c0ebb5d | pre-review |
