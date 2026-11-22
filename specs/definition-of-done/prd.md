# PRD: definition-of-done

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: Each stage has a definition of done as a markdown checklist at the end of its document, and a stage's definition of ready is the previous stage's definition of done
- Smallest: The four stage documents end with a checklist, and a gate refuses an item left neither ticked nor marked not applicable
- Drop if: The checklists are ticked without being read, and reviewers stop looking at them

## Problem

No stage says when it is done or when the next may start (facts Not found). Each stage has one document the gate already checks section by section (F1, F2), but the things a person expects before moving on, such as open questions answered, UX design done if applicable, API or database design done if applicable, and acceptance criteria done, live only in people's heads. Arun asked for a definition of done and a definition of ready for every stage (Arun, plugin owner, 2026-11-06).

## Users and jobs

- Person running a feature: when a stage ends, I want to see what "done" meant for it, so I know the next stage can start.
- Person reviewing the PR: when I read the stage documents, I want each to end with what was checked, so I can spot what was skipped.

## Questions asked

- Q1: How should DoR and DoD work? A: We need a checklist, for example open questions answered, UX design done if applicable, API or database design done if applicable, acceptance criteria done. We can do the checklist in markdown at the end. The DoR for the current stage is the completion of the DoD for the previous stage. (Arun, plugin owner, 2026-11-06)

## Current system

Every stage has one artefact (F1) whose required sections the gate checks (F2). Commands state input, processing and output (F3).

## Assumptions

- A1: An item that does not apply is written "N/A: <reason>" and counts as done. [unconfirmed]
- A2: The agent ticks the items it did; the checklist is a record for the PR reviewer, and the gate only checks that no item is left open. [unconfirmed]

## Requirements

- R1. (must) Each stage's document ends with a definition of done checklist suited to that stage. Needs: nothing new.
- R2. (must) A stage's gate refuses while any checklist item is neither ticked nor marked not applicable with a reason. Needs: nothing new.
- R3. (must) Each stage's command states its definition of ready as the previous stage's definition of done. Needs: nothing new.
- R4. (must) A document written before this change, with no checklist, is not refused for it. Needs: whether the document has the checklist section.

## Non-functional requirements

- Performance: None, because it reads one section more.
- Security and privacy: None, because no data, permission or input changes.
- Accessibility: None, because only document text changes.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never let "N/A" pass without a reason.

## Out of scope

- The Plan stage's roadmap and its own checklist: slice plan-roadmap.

## Outcome metric

Metric: stage documents in dogfood PRs with every checklist item closed
Baseline: 0 (no checklist today)
Target: all of them
Owner: Arun, plugin owner
Objective: every stage says when it is done (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept.
- A2: who: Arun. Recommend: accept; the gate's own checks stay the hard ones, and the checklist is what the reviewer reads.
