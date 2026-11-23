# Review: codeql-alerts

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
| F1 | major | scripts/lib.mjs:353 | 2 | stripComments strips an unclosed comment opener to the end of the text wherever it sits, but GitHub (CommonMark) hides to the end only an unclosed comment that starts a line (an HTML block); a mid-line or code-span opener renders as literal text. So a doc that mentions the opener in prose, as bug.md nearly did, loses everything after it. Fail-open repro: openDoneItems on a Definition of done with "- [x] a", then an N/A line that quotes the comment opener in a code span, then "- [ ] still open" returns [] on this commit and reports the open item on the base. Also: section() of any later heading returns null (a misleading missing-heading refusal), and sdlc pr (scripts/sdlc.mjs:368) silently truncates the PR body. Same class: the empty comment (opener followed straight by ">") is taken as an opener that eats to the next close, where HTML ends it at once. Smaller fix: take the to-end branch only when the opener begins a line, keep the loop and "--!>", add a test for a mid-line opener staying visible, and re-run CodeQL. | fixed: 054fb19 | pre-review |
| F2 | minor | tests/codeql-alerts-edges.test.mjs:22 | 9 | The quoted-part case uses "a.txt", which has no space, so it proves the quotes are stripped but not that a double-quoted part with a space stays one argument. That is the case loop.mjs:124 (worktree under os.tmpdir, which holds a space on Windows when the user name has one), facts.mjs:42 and knowledge.mjs:153 depend on. Use a file named "a b.txt". | fixed: 054fb19 | lens:tests |
| F3 | nit | scripts/lib.mjs:208 | 2 | gitArgv splits any unquoted interpolation on spaces and cannot carry a double quote inside a value. Callers that interpolate a path unquoted: scripts/sdlc.mjs:194 and scripts/review.mjs:95 (show base:path), scripts/review.mjs:289 (ledger locations, which forbid spaces). A path with a space fails there as it did under the shell, so no regression; quoting the two show calls makes the comment at lib.mjs:206 true for every caller. | open | pre-review |
| F4 | nit | scripts/sdlc.mjs:669 | 26 | stripComments on the output of section() is a no-op: section() already strips comments (lib.mjs:362). Carried over from the old regex; drop the outer call. | fixed: 054fb19 | pre-review |
