# PRD: change-request

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: Once the build starts and changes are needed, ask the user whether it is a change request or an amendment to the existing PRD, and tell them why a change request is better in some cases and how the effort changes
- Smallest: A spec change found once Build has started stops and puts that question, with the reasons and the effort change, before anything moves
- Drop if: People always pick the same answer, so the question is noise

## Problem

When the spec changes once development has started, the plugin silently sends the feature back to Define and drops the later approvals (F1), so every change becomes an amendment. Dev teams push back on changes once development is well along, because new work needs a new estimate and moves the timeline; a change request makes that visible and trackable, while a silent amendment hides the extra effort inside the original estimate (Arun, plugin owner, 2026-11-07). Each organisation works differently, so this is guidance: the person decides (Arun, 2026-11-07).

## Users and jobs

- Product owner: when the spec must change once development has started, I want to choose change request or amendment knowing what each means for effort, so the timeline stays honest.
- Tech lead: when a change arrives mid-build, I want it raised as its own item when it is big, so its estimate and PR are separate from the work already done.

## Questions asked

- Q1: How should a spec change after Build starts be handled? A: Let this be guidance, as we do not know how each org works; once the build starts and changes are needed, ask the user whether it is a change request or they want to amend the existing PRD; the design and tasks might change. Tell the user why a CR is better in some cases, and mention the effort changes. (Arun, plugin owner, 2026-11-07)
- Q2: Why a CR? A: Dev teams push back when they are maybe 70% done, because new changes need a new estimate and timelines get pushed; it is easier to track with a new CR than a new version of the PRD. (Arun, plugin owner, 2026-11-07)

## Current system

A spec change after Define sends the feature back to Define with no question (F1). Features can be slices of a capability (F2).

## Assumptions

- A1: "Once Build has started" means the feature is at Build or later when the spec change is found. [unconfirmed]
- A2: The agent puts the question with the question tool; the plugin gives the exact wording and the two commands, and never picks the answer. [unconfirmed]

## Requirements

- R1. (must) A spec change found once Build has started stops the request with the question "change request or amend the existing PRD?", before the feature moves back. Needs: the feature's stage when the change is found (F1).
- R2. (must) The question says why a change request is often better once much is built, and that the design and tasks may change either way. Needs: nothing new.
- R3. (must) The question says how the effort changes: a change request gets its own estimate; an amendment means re-doing the original estimate with the added effort stated. Needs: nothing new.
- R4. (must) Choosing a change request creates a new feature in the same capability that names the original, and the original keeps its approvals. Needs: the original's capability (F2).
- R5. (must) Choosing to amend sends the feature back to Define, as today. Needs: nothing new.
- R6. (must) A spec change found before Build has started goes back to Define as today, with no question. Needs: the feature's stage.

## Non-functional requirements

- Performance: None, because it adds one question.
- Security and privacy: None, because no data, permission or input changes.
- Accessibility: None, because only command text changes.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never choose change request or amendment for the person.
- Never drop the original feature's approvals when the person chose a change request.

## Out of scope

- Estimating effort: the team does it; the plugin only says which estimate changes.
- Superseding specific requirements of the original from the change request: a later slice with trace-index.

## Outcome metric

Metric: spec changes after Build started in dogfood runs that were asked about
Baseline: 0 (none asked today)
Target: all of them
Owner: Arun, plugin owner
Objective: changes mid-build keep the timeline honest (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept.
- A2: who: Arun. Recommend: accept; the answer is the person's, the commands only carry it out.
