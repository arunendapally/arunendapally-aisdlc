---
description: Stage 6 Release. Written release order, staged rollout, tested rollback, production probes, and the lessons fed back; the release owner decides when it ships.
argument-hint: <feature-slug>
---

Stage 6 for `$ARGUMENTS`.

1. `sre` and `ops-engineer` write `specs/$ARGUMENTS/release.md` from the template: the artefact digest, the release order (check production shape, rehearse migrations on a copy, data changes before code, deploy, probe), the rollout (flag, canary or staged), a rollback that has been tested, the probes, the support runbook and the cost delta.
2. Humans run the merge, `terraform apply` and the production deploy. The hooks refuse those commands for agents.
3. `sre` runs the read-only production probes against the SLOs and records the results. A deploy's own success message is not proof.
4. Feed the cycle: changelog, docs, new traps in `standards/traps.md`, any review finding seen twice becomes a checklist item. Update or add `knowledge/` pages for every area this feature taught you, re-verify the stale ones it touched (`sdlc.mjs knowledge check`), and rebuild the index. `confluence-expert` publishes the changed artefacts. `project-manager` posts `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" metrics $ARGUMENTS`.

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` (it refuses while the Probes section is empty), then stop. The release owner closes the cycle with `sdlc approve $ARGUMENTS 6`.
