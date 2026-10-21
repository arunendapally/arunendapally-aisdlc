# Design review board: quality-gates

<!-- Round 1: the board asked 11 questions, verdict revise. Round 2: the architect answered each and
     changed the code; each asker checked the answer against the code. Verdict accept. -->

## ADR-0001: review findings ledger

| Q | Reviewer | Question | Answer | Resolved |
|---|---|---|---|---|
| Q1 | design-reviewer | Why is the hybrid (ledger as gate source plus an importer of PR review comments) not weighed? | Added as option three and named as the planned next step. | yes |
| Q2 | design-reviewer | A mistyped ID drops the row and hides an open blocker. Should an unparseable row fail the gate? | parseLedger returns any table row without a valid F/H id and 7 cells as malformed, and the gate fails on it (test AC-10). | yes |
| Q3 | design-reviewer | What does Location pin to when a fix renames or deletes the file? | Where the finding was raised; the existence check is skipped for fixed rows. | yes |
| Q4 | safe-ai-sdlc-expert | Nothing ties fixed to evidence. What enforces it, and who may close a human row? | fixed: <sha> must be a real commit that changes the finding's file; CODEOWNERS covers specs/**/review.md and the ruleset requires code-owner review. | yes (residual: the commit may predate the finding; code-owner review is the real check) |
| Q5 | safe-ai-sdlc-expert | Source is self-declared. How is authorship verified? | The id prefix must match the source, so relabelling changes both and code-owner review sees it; blame-based verification is a follow-up. | yes |
| Q6 | safe-ai-sdlc-expert | Deleting a row passes the gate. What stops an agent removing an open finding? | The gate records every id at sdlc review and each request and fails on a missing one; agents cannot edit state.json. | yes (residual: a row added and removed between two recordings is unseen; git history and code-owner review cover it) |
| Q7 | qa-engineer | What minimum coverage before recall is reported, and how is "reviewed, logged nothing" told apart from "found nothing"? | Recall needs five serious findings; the pre-review must state the lenses it ran; counting approved PRs with no H rows is a follow-up. | yes (human-side signal tracked under A3) |
| Q8 | qa-engineer | A human confirming a pre-review finding: which source, and how are duplicates avoided? | The human writes "confirmed by <name>" in the agent's row and adds no row; it counts once. | yes |
| Q9 | qa-engineer | Is the sample big enough for 80% recall to mean anything? | Recall is withheld below five serious findings; a confidence interval follows once volumes are known. | yes |
| Q10 | sre | Two reviewers append F3 at once. What is the id rule? | Ids are per source (F agents, H humans); a clash within a source is a git text conflict and the gate reports duplicates. | yes |
| Q11 | sre | Where does the cross-repo view come from, and what if a feature folder is deleted? | sdlc retro --repos passes every named repo to collect(); feature folders are kept after merge and deletion is a recorded risk. | yes |

Verdict: accept

Chair's note: accepted; all 11 questions resolved in code and covered by passing tests. Remaining risks rest on human code-owner review: a fixed commit may predate the finding, PR-comment-only human catches are uncounted until the importer ships, and a row added and removed between two recordings is unseen. Next check worth adding: the fix commit comes after the row was added.
