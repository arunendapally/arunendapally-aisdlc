---
description: Stage 1 Plan. The product owner asks its questions first, then writes a short PRD and the Gherkin acceptance criteria; one gate, the product lead's.
argument-hint: <feature-slug>
---

Stage 1 for `$ARGUMENTS`. Delegate to the `product-owner` agent, with the `qa-engineer` for the acceptance criteria.

0. **The person's intent first.** If `specs/$ARGUMENTS/state.json` has no `intent`, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" ask $ARGUMENTS`: it prints three questions (change, smallest, drop if). Fill each with two or three answers taken from what the person already said, never invented, and ask them with the question tool; they pick one or write their own. Their answers are recorded as the intent. The PRD cannot be written, and Plan cannot be requested, until then; the request writes their words into `## Intent`, never reworded. Without the question tool they can type `sdlc intent $ARGUMENTS change: ...; smallest: ...; drop if: ...`.
1. **Questions before drafting.** The product owner returns the three to seven questions whose answers would change the PRD, each with a recommended answer. Ask the person them in one round (use the question tool if you have one). Do not draft until they answer or say to proceed with the recommendations.
2. **Draft** `specs/$ARGUMENTS/prd.md` from the template: the questions and answers, the assumptions (each `[confirmed]` or `[unconfirmed]`), numbered testable requirements (R1, R2, ...), the non-functional requirements (performance, security and privacy, accessibility, limits and quotas: each a requirement or "None, because ..."), what it must never do, scope, the outcome metric, and open questions.
3. **Acceptance criteria.** The `qa-engineer` writes `specs/$ARGUMENTS/acceptance.feature`: each criterion a Gherkin scenario tagged with the requirement it proves (`@R1`), a unique id (`@AC-1`) and, as a hint, its test level (`@unit`, `@subsystem`, `@api`, `@e2e`). Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gherkin $ARGUMENTS` until it shows no errors; its warnings are style advice.
4. **Facts, for brownfield or data work.** The `architect` writes `specs/$ARGUMENTS/facts.md`: what the feature depends on in the current system, pinned to `file:line` and a commit.

**Goal:** every section filled or "None, because ..."; every unconfirmed assumption in Open questions; every requirement has a scenario.

**Loop:** draft, self-check, fix. Count each failed check with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS prd`. On ESCALATE, stop and report what was tried.

**Gate:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` and show the PRD in five lines, the unconfirmed assumptions and what was not verified. Then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" ask $ARGUMENTS` and put its question to the product lead with the question tool: Approve, or Send back with a reason. Their answer is recorded (typing `sdlc approve $ARGUMENTS 1` also works). Approved, the feature moves to Design (full lane) or Build (light lane) by itself.
