---
description: Stage 2 Analyze. Supervisor review against real code, journeys, integration, test IDs, SLOs and threat model, then the spec; ends at the scope gate.
argument-hint: <feature-slug>
---

Stage 2 for `$ARGUMENTS`. As `cto`, run these experts in parallel on the approved PRD, then synthesise:

- `architect` (read-only supervisor on the strongest model): read the PRD with the real code, schema, ADRs and `knowledge/`. Write `specs/$ARGUMENTS/facts.md` from the template: every fact the feature depends on, pinned to `file:line` and the commit you read it at, plus what you looked for and did not find. Confirm or refute each PRD assumption against those facts. Rank the top problems, flag every requirement whose data the system does not hold, propose a smaller first version, write the integration decision in plain words.
- `ux-designer`: a user journey per requirement and where setup and daily use live.
- `qa-engineer`: `specs/$ARGUMENTS/acceptance.feature` from the template: every acceptance criterion as a Gherkin scenario tagged with the requirement it proves (`@R1`), a unique criterion id (`@AC-1`) and one test level (`@unit`, `@subsystem`, `@api`, `@e2e`), in declarative Given, one When, Then form; then `sdlc.mjs gherkin $ARGUMENTS` until it has no errors. Plus a "how it fails" line per criterion and a minimal test plan in the spec.
- `sre`: SLOs per journey, the error budget, load and data growth assumptions.
- `safe-ai-sdlc-expert`: threat model (STRIDE plus prompt injection, tool misuse, exfiltration, over-broad permissions) and the risk class of the paths touched.
- `project-manager`: thin vertical slices behind flags, each with an owner; open the risk log.

Check the supervisor's main findings against the code yourself. Then write `specs/$ARGUMENTS/spec.md` from the template (Spec Kit's specify stage if installed).

**Lane:** recommend light only if the change is reversible, behind a flag, adds no data, adds no screen or navigation, and touches no high-risk path, infrastructure, IAM or network. Otherwise full. Every feature starts full; if you recommend light, ask the human to type `sdlc lane $ARGUMENTS light` at the gate. While the error budget is frozen, only full is open.

**Goal:** every requirement cites facts (F1) that exist and are current, every PRD requirement has a Gherkin scenario, every scenario can fail, the threat model has no unowned high risk, and the supervisor raises no blocker. Cap 3 rounds (`node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retry $ARGUMENTS analysis`).

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS`. Show the gate packet: scope cut, integration decision, lane, top threats, SLOs, not verified. Stop. Approval: `sdlc approve $ARGUMENTS 2`.
