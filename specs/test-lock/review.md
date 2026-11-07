# Review: test-lock

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
| F1 | blocker | scripts/sdlc.mjs:768 | 2 | Any proof run overwrites the lock record, so the agent can drop the lock with no person. "sdlc proof demo --base HEAD" (or --files naming another test) fails or records other files, state.proof.ok becomes false, lockedFiles returns nothing, the guard then allows the Write to tests/demo.test.mjs, and the next normal proof records the edited test's hash. Reproduced in a scratch test on top of tests/helpers.mjs. The lock must survive a failed or narrowed proof until a person settles a conflict or the spec changes. | fixed: c5b2591 | lens:security |
| F2 | major | scripts/hooks/pre-tool.mjs:223 | 11 | The Bash lock only sees a quoted heredoc into cat or tee. echo x > file, sed -i, cp, mv, rm, git checkout and node -e on tests/demo.test.mjs are all allowed (probe). The proof refusal is the real lock, yet the PR Summary and CHANGELOG say an agent's edit is refused, and "Not verified" names only the heredoc case. Either cover shell writes to locked files or say plainly that only Write, Edit and the heredoc forms are refused and the proof catches the rest; add a test for the shell path. | fixed: c5b2591 | lens:security |
| F3 | major | scripts/loop.mjs:185 | 2 | Any edit to prd.md or acceptance.feature, even one byte, unlocks every proved test at once, and the agent makes that edit itself. With AUTONOMY granted (this repo has .ai-sdlc/AUTONOMY) gate 1 passes again on checks, so no person ever sees the test change: the agent has in effect settled its own conflict, against the PRD's Never. A2 is still unconfirmed. Needs Arun's ruling: keep, require a person's gate 1 approval to unlock, or unlock only the criteria whose scenario changed. | fixed: 354b553 | lens:security |
| F4 | minor | scripts/hooks/answers.mjs:44 | 11 | The [conflict feature AC-n] marker is not bound to the open conflict (no reason hash or timestamp), unlike gate questions which carry a fingerprint. An agent can ask a question of its own wording ending in the marker with a "Change the test" option, and the person's click is recorded as sdlc settle change. Bind the marker to the conflict's at or reason. | fixed: c5b2591 | lens:security |
| F5 | nit | .ai-sdlc/autonomy.json:1 | 22 | Repo config (.ai-sdlc/autonomy.json, config.json, .gitignore, commit 98a093c) rides in a feature PR about test locks; it changes the repo's gate and autonomy levels and would be easier to judge on its own. | wontfix: the repo config rides here so the gate runs, the same files as task/repo-setup | pre-review |
