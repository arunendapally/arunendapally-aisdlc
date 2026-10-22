# PRD: quality-gates

<!-- Dogfood: this improvement to the plugin, run through the plugin's own Plan stage. -->

## Problem

Teams using an AI SDLC lose the most time and quality in four places. Agents assume instead of asking. Requirements rest on beliefs about the current system that nobody checked. Design decisions are approved without anyone arguing the alternative. Tests at the right levels, and the data they need, are hard to produce. Code review is the hardest of all: agents produce more change than humans can review, and agent reviews miss what humans then catch.

## Users and jobs

- **Product lead:** get a requirements document they can approve without guessing what the agent assumed.
- **Architect:** get decisions that have already survived hard questions from other disciplines.
- **QA and SDETs:** get every acceptance criterion as an executable scenario, with tests at the right level and data that cleans itself up.
- **Human code reviewer:** spend minutes, not hours, on a PR, looking only where judgement is needed.

## Questions asked

- Q1: Which part of the process is hardest today? A: Code review is the most difficult part. (Arun)
- Q2: What should the requirements document look like? A: A PRD with good Gherkin syntax. (Arun)
- Q3: Which test levels matter? A: Unit, subsystem, Postman API tests, Playwright E2E, and setup and teardown of their data. (Arun)
- Q4: Should the agent ask questions or assume? A: Ask relevant questions and build facts about the current system. (Arun)
- Q5: Which language, database and CI does your team use? unanswered
- Q6: How should database and API changes be shown to reviewers? A: An ER diagram for database changes, and an OpenAPI YAML that can be viewed in Swagger for API changes. (Arun)
- Q7: Should the agents follow a Ponytail-style simplicity ladder? A: Yes: a ladder for the builder, a simplicity lens for the pre-reviewer, and packet signals for new dependencies and oversized diffs. (Arun)

## Assumptions

- A1: Teams can run Node 22 for the plugin's scripts. [confirmed]
- A2: Test scaffolds in TypeScript with Vitest, Postgres via Testcontainers, Newman and Playwright fit most teams. [unconfirmed]
- A3: Reviewers will record what they find in a ledger file in the repo. [unconfirmed]

## Evidence

| Claim | Grade | Source |
|---|---|---|
| Review is the bottleneck when agents write code | Moderate | the user's own experience at work; widely reported, not measured here |
| Seeded-bug reviews measure review recall | Established | standard practice in testing reviewers and static analysers |
| Gherkin scenarios work as acceptance criteria and tests | Established | BDD practice; Cucumber and playwright-bdd run them |

## Goals and non-goals

- Goals: questions before drafting; facts pinned to code; Gherkin acceptance criteria covering every requirement; a design review board; tests traced to criteria at their level with clean data; a review packet, lenses and a findings ledger that learns from human catches.
- Non-goals: running the Gherkin as tests directly (teams choose Cucumber, playwright-bdd or plain tests); generating tests for every stack.

## Requirements

- R1. (must) The Plan gate refuses a PRD whose assumptions are not marked, or whose unconfirmed assumptions are missing from Open questions. Data needed: the PRD (F1).
- R2. (must) The Analyze gate refuses until facts are pinned to existing code lines at a known commit, are not stale, and acceptance.feature is valid Gherkin covering every requirement. Data needed: the repo's git history (F3).
- R3. (must) The Design gate refuses until each decision has been cross-questioned by at least three disciplines, every question is answered and resolved, and the verdict is accept. Data needed: ADRs in docs/adr.
- R4. (must) The Verify gate refuses a criterion with no test at its declared level, and the gate can expose flaky tests and leaked test data. Data needed: test files and the gate command (F4).
- R5. (must) Every PR gets a review packet and a findings ledger; the Verify gate refuses open blockers, majors and minors (a nit may stay); findings only humans caught become retro proposals. Data needed: the diff and review.md (F2, F5).
- R6. (must) Data work cannot pass Design without a Mermaid ER diagram in the plan that marks the entities it changes, and a schema change without a plan change is flagged in review. Data needed: plan.md and the diff.
- R7. (must) API work cannot pass Design without a well-formed OpenAPI 3 file, breaking changes against the base branch must be declared, and the contract opens in Swagger UI. Data needed: openapi.yaml at the base and at HEAD.
- R8. (must) The builder writes the least code that works by climbing a simplicity ladder; the pre-review runs a simplicity lens; the packet names each new dependency and flags oversized changes. Data needed: the manifests at the base and at HEAD, and the acceptance criteria.

## Never

- Never mark an assumption confirmed without a person or a fact behind it.
- Never let an agent resolve a question on the board on the asker's behalf.
- Never use production data in a test, or leave test data behind.

## Out of scope

Language-specific test generators beyond the TypeScript scaffolds; a UI for the ledger.

## Outcome metric

Pre-review recall on serious findings (findings the pre-review caught over all blocker and major findings), read by `sdlc retro`. Baseline: unmeasured before this change. Target: 80% within three months of use.

## Stakeholders

Arun (decides); teams adopting the plugin (consulted through their retros).

## Dependencies

Node 22 and git on every machine and CI runner; Claude Code for the agents.

## Release criteria

All must requirements' scenarios pass; npm test and the golden evals green; the seeded-bug review evals pass.

## Proposed lane

full, because it changes every gate of the full lane.

## Open questions

- A2: the team's real stack decides the scaffolds; ask Arun (Q5).
- A3: whether reviewers will keep the ledger; watch it in the first retro. Recommendation: keep the ledger in the repo; PR comments can be mirrored into it later.
