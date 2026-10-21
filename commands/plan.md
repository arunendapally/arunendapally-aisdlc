---
description: Stage 1 Plan. The product-owner agent writes a graded brief; ends at the product lead's gate.
argument-hint: <feature-slug>
---

Stage 1 for `$ARGUMENTS`. Delegate to the `product-owner` agent.

**Goal (exit criterion):** `specs/$ARGUMENTS/brief.md` has every template section filled, every requirement numbered, every claim graded Established, Moderate or Preliminary, a data-needs line per requirement, one outcome metric with where it will be read, and a recommendation for each open question. The brief proposes a lane (full or light) with its reason.

**Loop:** draft, self-check against the goal, fix. Count each failed check with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS brief`. If it prints ESCALATE, stop and report what was tried.

**Gate:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` and show the gate packet: the brief in five lines, the proposed lane, and what was not verified. Then stop. Only the product lead approves, by typing `sdlc approve $ARGUMENTS 1`.
