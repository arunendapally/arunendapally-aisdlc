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
| F1 | major | scripts/sdlc.mjs:475 | 2 | The only check that code changed after Verify reviewed it (unreviewedChanges, reviewedSha) runs at stage 6, which no lane reaches now. A commit after gate 5 passes goes into the PR while its Pre-review says "Open findings: 0" for an older commit, and nothing in the plugin flags it. Before ADR-0008 a human approval at Verify lapsed on new code and Release refused it. See it: pass gate 5, commit src/x.js, run sdlc status: silent. Run the check when a closed feature's branch moves, or name the gap in the ADR. | fixed: 5422ece | lens:security |
| F2 | minor | scripts/sdlc.mjs:478 | 2 | "## Check after deploy" is written only to review-packet.md, which is untracked here and not part of the PR body. Assumption A2 says the @release criterion is listed in the PR for a person; commands/verify.md:15 only tells the agent to point at it. A reviewer on GitHub may never see it. Copy the list into pr.md or make the PR template carry it. | fixed: 5422ece | pre-review |
| F3 | minor | scripts/loop.mjs:422 | 17 | Copy now says what the plugin no longer does: riskTier says a file "is on a path that always needs a person" and scripts/sdlc.mjs:334 says "the DBA reviews the PR", but high-risk paths, migrations and data work now pass Verify on checks with no person (lib.mjs KINDS data owners dropped 5 and 6). Reword both to hand the decision to the org's review. | fixed: 5422ece | pre-review |
| F4 | minor | .ai-sdlc/config.json:1 | 22 | The branch adds .ai-sdlc/config.json, .ai-sdlc/autonomy.json, .ai-sdlc/.gitignore (be67f42) and specs/gates-and-names/slices.md (22024f9), none of them in the PR summary, and the packet skips .ai-sdlc. autonomy.json still lists a "merge" activity at L2 and config.json gateOwners 5 and 6, both for things this PR removes. Say why they ride here or move them out. | open | pre-review |
| F5 | nit | tests/stop-at-pr.test.mjs:38 | 1 | AC-1 runs light, full and hotfix. The task lane also gained auto [4, 5] (scripts/lib.mjs:45) and has no Verify-on-checks test; bug is covered in tests/lanes.test.mjs. | fixed: 5422ece | lens:tests |
