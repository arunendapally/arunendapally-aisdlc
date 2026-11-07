---
description: Design, full lane only. The design, contracts and an ADR per significant decision, each cross-questioned by another discipline; ends at the architect and product lead's gate.
argument-hint: <feature-slug>
---

Design for `$ARGUMENTS` (the light lane skips it; its design is `## Approach` in `tasks.md`).

**Input:** the approved `prd.md`, `acceptance.feature` and `facts.md`.
**Ready when:** the Define definition of done in `prd.md` is complete.
**Processing:** decide how it is built, each significant decision an ADR with two options, cross-questioned by another discipline.
**Output:** `design.md`, ADRs in `docs/adr/` and, for api work, `openapi.yaml`, approved at the Design gate.

1. `architect`: `specs/$ARGUMENTS/design.md` from the template, and an ADR in `docs/adr/` for each new datastore, dependency, service or breaking contract. Each ADR weighs at least two options.
2. Only what the change needs:
   - data work: the `dba` draws the ER diagram of the change in `specs/$ARGUMENTS/db-design.md` `## Data model` and writes its migration plan (expand-contract); `design.md` `## Data model` says "See db-design.md.";
   - API work: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" api $ARGUMENTS` starts `openapi.yaml`; declare any breaking change in `## Contracts`;
   - a new or changed container: update the C4 model in `docs/architecture/workspace.dsl`;
   - a screen: the `ux-designer` designs it from the product's real components, with its accessibility checks;
   - a high-risk path: the `safe-ai-sdlc-expert` writes the threat model.
3. **Review.** The `design-reviewer` and at least one other discipline question each ADR; the architect answers in the ADR's `## Review`, revising it where a question lands. At most three rounds, then escalate.

**Goal:** every requirement maps to a plan element, every ADR it names exists with its review, every breaking contract is declared.

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS`, then run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" ask $ARGUMENTS` and put its question to the architect or product lead with the question tool: Approve, or Send back with a reason.
