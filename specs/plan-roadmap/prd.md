# PRD: plan-roadmap

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: Plan is a roadmap: now, next, later; a big requirement structured so pieces run one by one with no dependency between them, enablers first (an API contract first so the UI can build on it in parallel)
- Smallest: The capability's slices are placed now, next or later, an enabler can be a slice, and each slice says how it goes live on its own
- Drop if: Teams keep their roadmap elsewhere and never read the capability's

## Problem

There is no Plan stage (F4). A capability lists its slices with a dependency and a status (F1), but nothing places them now, next or later, and the template forbids an enabler slice such as an API contract (F2), which is what lets a UI build in parallel against the contract. Nothing says how each piece goes live on its own, and each repo's work has no ticket the team can copy into its own tracker (F3). Arun described Plan as a roadmap of independent pieces, enablers first, and every PR able to go live on its own (Arun, plugin owner, 2026-11-06).

## Users and jobs

- Product owner: when a big requirement arrives, I want it cut into pieces placed now, next or later, so we build one by one and re-plan the later ones.
- Architect: when a UI depends on an API, I want the API contract as its own enabler piece, first, so the UI and the service build in parallel.
- Tech lead: when a piece spans repos, I want one ticket per repo I can copy into our tracker, so each repo's PR is planned and tracked.

## Questions asked

- Q1: What is a plan? A: A roadmap, now, next, later, and how we take a big requirement and structure it so we execute one by one with no dependency between them. An API is the enabler for a UI; or an OpenAPI contract first so the UI builds on it. (Arun, plugin owner, 2026-11-06)
- Q2: Where do tickets live? A: In tasks.md; we do not know which tool each team uses, so they copy them or create them through an MCP. (Arun, plugin owner, 2026-11-06)
- Q3: How are PRs across repos ordered? A: Every PR should go live on its own: backward compatible, or behind a feature flag if not, and only if neither works, in sequence; sequencing shows tight coupling. (Arun, plugin owner, 2026-11-06)

## Current system

Slice lines carry a dependency and a status, read by status (F1); enablers are forbidden (F2); tasks name repos (F3); no Plan command exists (F4).

## Assumptions

- A1: The roadmap stays in the capability's slices.md; no new document. [unconfirmed]
- A2: A slice with no horizon written is treated as "now", so existing capabilities keep working. [unconfirmed]

## Requirements

- R1. (must) Each slice in a capability is placed now, next or later, and status groups them that way. Needs: each slice's horizon.
- R2. (must) A slice can be an enabler that other slices build on, such as an API contract. Needs: whether a slice is an enabler.
- R3. (must) Each slice says how it goes live on its own: backward compatible, behind a named feature flag, or after a named slice with the reason. Needs: how each slice goes live.
- R4. (must) A slice that goes live only after another slice and gives no reason is refused. Needs: how each slice goes live.
- R5. (must) A feature's tasks give one ticket per repo the team can copy into its tracker. Needs: which repos the tasks change (F3).
- R6. (must) A Plan command runs the roadmap stage, stating its input, processing and output. Needs: nothing new.

## Non-functional requirements

- Performance: None, because it reads the same small files.
- Security and privacy: None, because no data, permission or input changes.
- Accessibility: None, because only document and command text change.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never call a slice independent when it goes live only after another.
- Never create tickets in a team's tracker without the person asking.

## Out of scope

- Creating tickets in a tracker through an MCP: the person does it from the ticket text.
- Change requests once Build has started: slice change-request.

## Outcome metric

Metric: slices in dogfood capabilities that go live on their own (compatible or flagged)
Baseline: not recorded today
Target: all but those with a stated reason
Owner: Arun, plugin owner
Objective: pieces ship one by one without blocking each other (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept; slices.md is already the capability's plan.
- A2: who: Arun. Recommend: accept.
