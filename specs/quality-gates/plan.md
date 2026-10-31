# Plan: quality-gates

<!-- Dogfood. Only the Decisions section is complete; the rest of the plan is the code in this PR. -->

## Decisions

- ADR-0001: review findings live in a Markdown ledger in the repo.

## Error handling

A refused request exits non-zero and lists every reason at once. Nothing is retried by itself: a refusal is an answer (ADR-0004).

## Data and tenancy

None, because each repo keeps its own state in its own specs/ folder and nothing is shared between repos.
