# Review: repo-setup

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
| F1 | major | .github/workflows/test-levels.yml:1 | 13 | The kit's test pyramid runs npm run test:unit, test:subsystem, start:test and test:e2e, none of which exist in package.json, so every PR here would go red on test-levels. The same failure hit unit-converter PR 1. | fixed: d414069 | pre-review |
| F2 | major | .github/workflows/ai-sdlc-gate.yml:66 | 13 | build-and-test runs npm ci, which fails with no package-lock.json in this repo, so every PR would go red; evals.yml already runs the full suite. Removed the job and pointed the ruleset at tests-and-golden-evals. | fixed: d414069 | pre-review |
| F3 | minor | .github/scripts/check-gates.mjs:31 | 2 | gate-approvals needs an approving review from a human who is not the PR author, so in a one-person repo it stays red on every feature PR. | wontfix: it is a person's policy call for this repo (second reviewer, or approvals set to 0 when the ruleset is applied); it is not required until the ruleset is applied, and the PR names it under Look here first | pre-review |
| F4 | major | .github/workflows/ai-sdlc-gate.yml:7 | 2 | The workflow also runs on pull_request_review, which reruns every job. gitleaks-action exits 1 on any event other than push, pull_request, workflow_dispatch and schedule (src/index.js supportedEvents), and dependency-review-action throws when the event is not pull_request, pull_request_target or merge_group (src/git-refs.ts). So the very review that gate-approvals waits for turns secrets and dependencies red on the head commit, and both are required checks in .github/rulesets/main.json. Smaller fix: if: github.event_name == 'pull_request' on the secrets and dependencies jobs (a skipped job reports success), or move gate-approvals to its own workflow on pull_request_review. The same defect is in templates/repo/.github/workflows/ai-sdlc-gate.yml. | fixed: c996ad8 | lens:security |
| F5 | minor | .github/workflows/ai-sdlc-gate.yml:6 | 2 | pull_request uses the default types (opened, synchronize, reopened), so editing the PR body does not rerun pr-body, and Re-run replays the old event payload with the old body. A body fixed after a red pr-body stays red until a new push or a review. Fix: types: [opened, edited, synchronize, reopened]. Also in the template. | fixed: c996ad8 | lens:sre |
| F6 | major | .github/CODEOWNERS:2 | 2 | Every owner is a placeholder (@your-org/...), and this repo belongs to a personal account, which cannot have teams. GitHub ignores owners it cannot resolve, so no path has a code owner: require_code_owner_review in the ruleset enforces nothing, and the ADR-0001 rule that a human approves every change to review.md and state.json is void. The file's own comment says to replace the teams. Smaller version: a single line, * @arunendapally. Whether the owner can then merge his own PRs is the same policy call as F3. | fixed: c996ad8 | pre-review |
| F7 | nit | .github/workflows/review-sla.yml:5 | 26 | Hourly cron in a one-person repo: BACKUP_REVIEWERS is unset and the author is never a requested reviewer, so after 24h every open PR (including outside contributors' PRs) gets an escalation comment that mentions nobody. Harmless, but noise; workflow_dispatch only would do until there is a second reviewer. | open | lens:sre |
| F8 | nit | .github/workflows/publish-docs.yml:13 | 26 | Skips cleanly (CONFLUENCE_BASE_URL is unset), and its publish step is a stub that only echoes, so in this repo it is dead config. Fine to keep as kit dogfood; say so or drop it. | open | pre-review |
