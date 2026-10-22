---
description: Stage 1 Plan. The product owner asks its questions first, then writes a short PRD and the Gherkin acceptance criteria; one gate, the product lead's.
argument-hint: <feature-slug>
---

Stage 1 for `$ARGUMENTS`. Delegate to the `product-owner` agent, with the `qa-engineer` for the acceptance criteria.

1. **Questions before drafting.** The product owner returns the three to seven questions whose answers would change the PRD, each with a recommended answer. Ask the person them in one round (use the question tool if you have one). Do not draft until they answer or say to proceed with the recommendations.
2. **Draft** `specs/$ARGUMENTS/prd.md` from the template: the questions and answers, the assumptions (each `[confirmed]` or `[unconfirmed]`), numbered testable requirements (R1, R2, ...), what it must never do, scope, the outcome metric, and open questions.
3. **Acceptance criteria.** The `qa-engineer` writes `specs/$ARGUMENTS/acceptance.feature`: each criterion a Gherkin scenario tagged with the requirement it proves (`@R1`), a unique id (`@AC-1`) and, as a hint, its test level (`@unit`, `@subsystem`, `@api`, `@e2e`). Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gherkin $ARGUMENTS` until it shows no errors; its warnings are style advice.
4. **Facts, for brownfield or data work.** The `architect` writes `specs/$ARGUMENTS/facts.md`: what the feature depends on in the current system, pinned to `file:line` and a commit.

**Goal:** every section filled or "None, because ..."; every unconfirmed assumption in Open questions; every requirement has a scenario.

**Loop:** draft, self-check, fix. Count each failed check with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS prd`. On ESCALATE, stop and report what was tried.

**Gate:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` and show the PRD in five lines, the unconfirmed assumptions and what was not verified. Stop. The product lead approves by typing `sdlc approve $ARGUMENTS 1`; the feature then moves to Design (full lane) or Build (light lane) by itself.
