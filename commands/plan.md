---
description: Stage 1 Plan. The product-owner agent asks its questions first, then writes the PRD; ends at the product lead's gate.
argument-hint: <feature-slug>
---

Stage 1 for `$ARGUMENTS`. Delegate to the `product-owner` agent.

1. **Questions before drafting.** The product owner returns the three to seven questions whose answers would change the PRD, each with a recommended answer. Ask the person them in one round (use the question tool if you have one). Do not draft until they answer or say to proceed with the recommendations.
2. **Draft** `specs/$ARGUMENTS/prd.md` from the template, recording the questions and answers, the assumptions (each `[confirmed]` or `[unconfirmed]`), and every other section.

**Goal (exit criterion):** every template section filled; every requirement numbered (R1, R2, ...), testable and with its data need; every claim graded Established, Moderate or Preliminary; every unconfirmed assumption in Open questions; one outcome metric with baseline and target; release criteria; a proposed lane with its reason.

**Loop:** draft, self-check against the goal, fix. Count each failed check with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS prd`. If it prints ESCALATE, stop and report what was tried.

**Gate:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` and show the gate packet: the PRD in five lines, the unconfirmed assumptions, the proposed lane, and what was not verified. Then stop. Only the product lead approves, by typing `sdlc approve $ARGUMENTS 1`.
