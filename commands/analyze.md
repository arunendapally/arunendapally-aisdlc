---
description: Stage 2 Analyze. Supervisor review against real code, journeys, integration, test IDs, SLOs and threat model, then the spec; ends at the scope gate.
argument-hint: <feature-slug>
---

Stage 2 for `$ARGUMENTS`. As `cto`, run these experts in parallel on the approved brief, then synthesise:

- `architect` (read-only supervisor on the strongest model): read the brief with the real code, schema and ADRs. Rank the top problems, flag every requirement whose data the system does not hold, propose a smaller first version, write the integration decision in plain words.
- `ux-designer`: a user journey per requirement and where setup and daily use live.
- `qa-engineer`: a test ID and a "how it fails" line for every acceptance criterion; a minimal test plan.
- `sre`: SLOs per journey, the error budget, load and data growth assumptions.
- `safe-ai-sdlc-expert`: threat model (STRIDE plus prompt injection, tool misuse, exfiltration, over-broad permissions) and the risk class of the paths touched.
- `project-manager`: thin vertical slices behind flags, each with an owner; open the risk log.

Check the supervisor's main findings against the code yourself. Then write `specs/$ARGUMENTS/spec.md` from the template (Spec Kit's specify stage if installed).

**Lane:** recommend light only if the change is reversible, behind a flag, adds no data, adds no screen or navigation, and touches no high-risk path, infrastructure, IAM or network. Otherwise full. Every feature starts full; if you recommend light, ask the human to type `sdlc lane $ARGUMENTS light` at the gate. While the error budget is frozen, only full is open.

**Goal:** every requirement cites data that exists, every acceptance criterion has a test ID that can fail, the threat model has no unowned high risk, and the supervisor raises no blocker. Cap 3 rounds (`node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS analysis`).

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS`. Show the gate packet: scope cut, integration decision, lane, top threats, SLOs, not verified. Stop. Approval: `sdlc approve $ARGUMENTS 2`.
