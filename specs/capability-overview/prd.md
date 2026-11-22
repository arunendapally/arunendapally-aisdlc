# PRD: capability-overview

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: The decision log moves to the architecture overview at the capability level, because a capability can hold more than one feature; C4 Level 1 goes there too
- Smallest: Each capability has one architecture overview beside its slices, with a system context and a decision log
- Drop if: Teams keep recording agreements somewhere else and the log stays empty

## Problem

Decisions made after a PRD is signed off (in meetings, emails and chats, while it is socialised with architecture and development) have nowhere to go, so the PRD is edited or the agreement is lost (facts Not found). The only architecture overview is per feature and only for work across repos (F1), while a capability often holds several features that share those decisions (F3). Arun asked for the decision log at the capability level, in the architecture overview, with C4 Level 1 (Arun, plugin owner, 2026-11-06 and 2026-11-07).

## Users and jobs

- Product owner: when architecture and development raise issues with a signed-off PRD, I want to record what we agreed, so the PRD stays as signed and the agreement is on record.
- Architect or tech lead: when I pick up a feature in a capability, I want the capability's context and its agreed decisions in one place, so I build on what was agreed.

## Questions asked

- Q1: Where should the decision log live? A: Not at the feature level, since we might build more than one feature in a capability; move it to the architecture overview. Keep the PRD immutable; these decisions come up after the PRD is socialised, and we use them for agreement. (Arun, plugin owner, 2026-11-07)
- Q2: Where does C4 Level 1 go? A: In the architecture overview, including single-repo work. (Arun, plugin owner, 2026-11-06)

## Current system

The overview is per feature and optional (F1). A capability folder exists before its features (F2), and status knows which features share one (F3).

## Assumptions

- A1: A decision row an agent drafts from a conversation stays unconfirmed until a named person confirms it. [unconfirmed]
- A2: A feature with no capability keeps its own overview, as today. [unconfirmed]

## Requirements

- R1. (must) Starting a capability's first feature gives the capability one architecture overview beside its slices. Needs: the feature's capability (F2).
- R2. (must) A feature in a capability is checked against its capability's systems under change, not a copy of its own. Needs: the feature's capability (F2).
- R3. (must) Define refuses a feature whose capability overview has no system context (C4 Level 1). Needs: nothing new.
- R4. (must) Each decision row names its date, the decision, who agreed it, its source and what it changes. Needs: nothing new.
- R5. (must) A decision row with no named person who agreed it is shown as unconfirmed to the person reviewing the PR. Needs: nothing new.

## Non-functional requirements

- Performance: None, because it reads one more small file.
- Security and privacy: None, because no data, permission or input changes.
- Accessibility: None, because only document text changes.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never record a decision as agreed by a person who did not agree it.
- Never edit a signed-off PRD to hold a later decision.

## Out of scope

- Asking change request or amendment once Build has started: slice change-request.
- An index from requirements to decisions: slice trace-index.

## Outcome metric

Metric: decision rows recorded per capability in dogfood runs
Baseline: 0 (no place for them today)
Target: every agreement after sign-off has a row
Owner: Arun, plugin owner
Objective: agreements after the PRD are on record (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept; it matches how agents capture decisions in the research report.
- A2: who: Arun. Recommend: accept; nothing breaks for features made before this.
