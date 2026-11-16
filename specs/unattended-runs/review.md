# Review: unattended-runs

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
| F1 | blocker | scripts/hooks/pre-tool.mjs:200 | 2 | The class: a command the guard takes for a read that runs a person's command. Round 1: a read piped into sh, bash, xargs sh -c or iex; fixed by leaving reads out of the person's-action scan only when every segment reads. Round 2 (reopened): one read segment running code from its own arguments, a PowerShell group in round brackets, rg --hostname-bin, less with a plus argument. Round 3 (reopened): a PowerShell script block in curly brackets bound to a piped parameter, and git's unique prefix of --output. Rethought after three rounds: a read is now an allowlist. Outside quotes it may hold only names, paths, globs and options, double quotes may hold no dollar, backtick or backslash, and the options that run a program or write a file are refused. Cases in tests/read-only-guard.test.mjs. | fixed: HEAD | lens:security |
| F2 | major | scripts/hooks/pre-tool.mjs:113 | 2 | A Read tool refusal of a large file was still counted, so two refused Reads held the session (R2). The read-slices refusal is now never counted, for any tool. | fixed: HEAD | pre-review |
| F3 | major | scripts/hooks/pre-tool.mjs:190 | 2 | Not counting any all-read-only command also covered tries at secrets files, so an agent trying cat, head and grep on a secrets file was never held. Refusals by the secret, secrets-file and production guards are now always counted. | fixed: HEAD | lens:security |
| F4 | major | scripts/sdlc.mjs:296 | 2 | next treated work a person closed as abandoned as complete, and left a slice waiting without a reason on a dropped or unknown dependency. A state closed with a reason is not complete, and the waiting message names a dependency that is dropped, retired or not a slice. | fixed: HEAD | pre-review |
| F5 | major | scripts/lib.mjs:385 | 2 | A carried-over intent showed in the new slice's PRD as typed by the person, with no word of where it came from, and wrote no audit event. The PRD comment now names the source slice and the carry-over is audited. | fixed: HEAD | pre-review |
| F6 | minor | scripts/hooks/pre-tool.mjs:189 | 25 | readOnly copied the read-verb list and the redirect test from the existing exemption, and both matched a verb by word boundary, so cat.sh and git show-x passed as reads. One shared verb list, sed pattern and redirect test now serve both, and a verb ends at whitespace or the end. | fixed: HEAD | lens:security |
| F7 | minor | scripts/sdlc.mjs:1278 | 2 | npm init's placeholder test script became the gate, a gate that always fails. It is now treated as no test script. | fixed: HEAD | pre-review |
| F8 | minor | scripts/sdlc.mjs:1276 | 2 | A malformed package.json made init-repo throw after the templates were copied. The parse is caught and the output says no checks were detected. | fixed: HEAD | pre-review |
| F9 | minor | scripts/loop.mjs:175 | 2 | Any truthy proofWaived waived the proof, though R4 needs a reason. Only a non-empty string waives it now. | fixed: HEAD | pre-review |
| F10 | minor | tests/unattended-runs.test.mjs:140 | 9 | next and the new slice fields had no test for shipped, dropped, closed by a person or an unknown dependency. A second AC-9 test covers all four. | fixed: HEAD | lens:tests |
| F11 | nit | tests/unattended-runs.test.mjs:100 | 13 | AC-6 calls proofProblems directly, not through a Verify request, and nothing asserted the bug, task and hotfix lanes stay unaffected. The three lanes are now asserted; the Verify request path is covered by the existing suite running with a waiver. | fixed: HEAD | lens:tests |
| F12 | nit | skills/org-ai-sdlc/SKILL.md:47 | 22 | Deletes a duplicate bullet (a spec change after Build) outside the task's files. | wontfix: removing the duplicated rule was item 6 of the review Arun agreed to fix on 12 Nov, and R8 covers what agents read first | pre-review |
