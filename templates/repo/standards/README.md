# Standards knowledge base

A small, growing set of documents that every agent reads before it writes or reviews code. They are generic starting points. Each project copies them into its own repo and makes them its own.

| File | Who reads it | When |
|---|---|---|
| `engineering-standards.md` | Worker and reviewer | Before writing any code (stage 4) |
| `code-review-checklist.md` | Reviewer, and the final PR review | On every diff, and before merge (stages 4 and 5) |
| `testing-standards.md` | Worker and reviewer | When writing or judging a test |
| `traps.md` | Everyone, and every task brief | Always. This is the project's memory of its own mistakes |

## How the knowledge base grows

- **A review finding that happens twice becomes a standard.** Add it to the checklist with a one-line reason.
- **A mistake that costs a session becomes a trap.** Add it to `traps.md` with what happened, how it was found, and the guard that now prevents it.
- **A standard nobody can check is a wish.** Where possible, back each standard with a lint rule, a test or a contract check, and name it beside the standard.
- **Prune.** If a standard is enforced by tooling now, shorten it to a pointer. If it no longer applies, delete it.

## How the skill uses it

- Stage 4: the task list header links to these files, and the worker is told to read them before the first task.
- Stage 4: the reviewer checks each batch against `code-review-checklist.md` and reports findings by checklist item.
- Stage 5: the final review runs the whole checklist and lists the items it could not check in the PR's "Not verified" section.
- Stage 6: new traps and repeat findings from this feature are added here before the cycle starts again.
