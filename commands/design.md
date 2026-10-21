---
description: Stage 3 Design. Plan, contracts, ADRs, C4, screens from real components, test strategy, observability and operability; ends at the architect and product lead's gate.
argument-hint: <feature-slug>
---

Stage 3 for `$ARGUMENTS` (the light lane skips this stage).

- `architect`: `specs/$ARGUMENTS/plan.md` from the template (Spec Kit's plan stage if installed): data model, versioned contracts, and an ADR in `docs/adr/` for each new component, datastore, dependency, schema or contract change. Write each interpretation of the constitution as a judgement.
- `c4-diagrams-expert`: update `docs/architecture/workspace.dsl`, tagging what is new, changed and removed. Agents appear as actors with what they can write.
- `ux-designer`: screens from the product's real components only, on a canvas humans comment on. One thread per comment; only a human resolves a thread. List unmatched components and the accessibility checks.
- `qa-engineer`: the test strategy (levels, synthetic data, performance and accessibility budgets).
- `sre`: observability (logs, golden signals, traces, SLO alerts each with a runbook).
- `ops-engineer`: operability (environments, IaC modules, secrets needed, cost delta, backup and restore).
- `safe-ai-sdlc-expert`: check the plan against the threat model.

**Goal:** every requirement maps to a plan element, every contract has a version, every plan section is filled (or says "None, because ..."), and no human comment thread is open. Cap 3 rounds.

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS`, then stop. The architect and product lead approve with `sdlc approve $ARGUMENTS 3`.
