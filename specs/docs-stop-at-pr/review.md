# Review: docs-stop-at-pr

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
| F1 | minor | docs/getting-started.md:65 | 17 | "You answers the intent, then reviews the PR": subject and verbs disagree. Read: "You answer the intent, then review the PR". | fixed: 5ff8fd4 | pre-review |
| F2 | minor | docs/org-ai-sdlc-process.md:44 | 2 | The routing table gives a hotfix the gates "intent, PR review", but a hotfix has no intent (scripts/sdlc.mjs:643 asks for one only in the full and light lanes at Define), and the lanes table at docs/org-ai-sdlc-process.md:74 says "declared by a person, PR review". Use the lanes table wording in both. | fixed: 5ff8fd4 | pre-review |
| F3 | minor | docs/org-ai-sdlc-process.md:71 | 2 | The full lane row (and the routing row at :49) says the gates are "intent, PR review", but branchAutoBlock (scripts/lib.mjs:524) keeps Design with a person for data work and for a risky Security and privacy section, which are the reasons triage picks the full lane. Say Design waits for a person on data or risky work, so the full lane row does not promise no wait it usually has. | fixed: 5ff8fd4 | pre-review |
| F4 | minor | docs/getting-started.md:70 | 2 | Class: Define and Design still described as a person approving, contradicting the new lines at docs/getting-started.md:65 and docs/org-ai-sdlc-process.md:9. Every place: docs/getting-started.md:56 and :70 (sdlc approve saved-items 1 as the normal step), :74 ("a fourth wait"), docs/org-ai-sdlc-process.md:96 ("Product lead approves the spec"), :97 ("Architect and product lead approve the design"), :277 ("a feature waits on a human three times, bugs and chores once", the exact claim this task says it removed). On a feature branch these pass on checks unless gateOwners names a person (scripts/lib.mjs:523). | fixed: 5ff8fd4 | pre-review |
| F5 | minor | docs/org-ai-sdlc-process.md:153 | 2 | Class: the Release stage and its checks are still described as live, though no lane reaches stage 6 (scripts/lib.mjs:28-45) and the checks were deleted in #61. Every place: docs/org-ai-sdlc-process.md:153 (Release refuses without a tested rollback, the feature closes at release), :124 and :280 ("every release" as a gate that never moves), :175 ("how Release and incidents feed Define"), :198 ("Release updates the pages"), :209 (eval "release needs a tested rollback": evals/golden has no file 14), docs/getting-started.md:133 (Release records Live: sha and refuses; no Live: check remains in scripts). | fixed: 5ff8fd4 | pre-review |
