# PRD: stage-names

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: Proper stages, each with a name, and each with an input, a processing and an output; not stage 1, stage 2, stage 3
- Smallest: Stages read Define, Design, Build, Verify everywhere a person sees them, and the design lives in design.md
- Drop if: People or agents confuse the stage that writes requirements with the one that writes the design

## Problem

The stage that writes the PRD and acceptance criteria is called "Plan", and the Design stage writes a file called plan.md (F1), the reverse of the most used spec-driven tool, where the plan is the technical how (research report, reports/AI SDLC stages and decision records.md). Messages and status lead with stage numbers (F2, F3, F4), and no command says what a stage takes in and hands on (facts Not found). Arun asked for named stages, each with an input, a processing and an output (Arun, plugin owner, 2026-11-06).

## Users and jobs

- Person running a feature: when I read a message or status, I want the stage's name, so I know where the work is without a lookup.
- Agent starting a stage: when I pick up a stage cold, I want its input, processing and output written down, so I know what to read and what to hand on.

## Questions asked

- Q1: How should stages be named? A: We should not call them stage 1, stage 2, stage 3; each stage should have a name, an input, a processing and an output. (Arun, plugin owner, 2026-11-06)
- Q2: Which names? A: Plan (the roadmap), Define (PRD and Gherkin), Design, Build, Verify; the plugin stops at the PR. (Arun accepted the research recommendation and the re-sliced capability, 2026-11-06)

## Current system

Stage 1 is "Plan" and writes prd.md; Design writes plan.md (F1). Messages and status lead with numbers (F2 to F4). Several checks read plan.md by name (F5).

## Assumptions

- A1: Stage numbers stay inside state.json and typed commands ("sdlc approve <feature> 1"); only what people read changes. [unconfirmed]
- A2: The Plan stage itself (the roadmap) arrives in slice plan-roadmap; this slice frees the name. [unconfirmed]

## Requirements

- R1. (must) Every gate, advance and status message names the stage (Define, Design, Build, Verify) and does not lead with a stage number. Needs: each stage's name (F1).
- R2. (must) The stage that writes the PRD and acceptance criteria is called Define, with its own command. Needs: nothing new.
- R3. (must) A new feature's technical design is written in design.md. Needs: nothing new.
- R4. (must) A feature whose design is already in plan.md keeps passing its checks. Needs: which file holds the feature's design (F5).
- R5. (must) Each stage's command states its input, its processing and its output. Needs: nothing new.

## Non-functional requirements

- Performance: None, because it renames text and a file.
- Security and privacy: None, because no data, permission or input changes.
- Accessibility: None, because only command text changes.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never break a feature already in flight because its design is in plan.md.

## Out of scope

- The Plan stage and its roadmap: slice plan-roadmap.
- Definition of done checklists: slice definition-of-done.

## Outcome metric

Metric: human stops before the PR in one gates-and-names dogfood slice
Baseline: 4 (the 2026-11-05 run, Arun)
Target: 0
Owner: Arun, plugin owner
Objective: a person is asked for a decision only at the PR (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept; numbers in typed commands are stable and short.
- A2: who: Arun. Recommend: accept.
