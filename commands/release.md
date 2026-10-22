---
description: Stage 6 Release. A staged rollout, a tested rollback and production probes; the release owner decides when it ships.
argument-hint: <feature-slug>
---

Stage 6 for `$ARGUMENTS`.

1. The `sre` writes `specs/$ARGUMENTS/release.md` from the template: the rollout (flag, canary or staged), a rollback with its `Tested: <date>, <how>` line, the probes, and `## Outcome metric` with `Metric:` and `Owner:` (or `Metric: None, because ...`).
2. Humans run the merge, `terraform apply` and the production deploy. The hooks refuse those commands for agents.
3. The `sre` runs the read-only production probes and records pass or fail for each. A deploy's success message is not proof.
4. `sdlc request` warns about knowledge pages and facts the change made stale, ADRs it supersedes that are not marked, and postmortem actions without a link. Fix what it lists: re-verify the pages, mark the ADRs, link the actions. Add a trap to `standards/traps.md` only when the feature taught one.

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` (it refuses without a tested rollback and probe results), then stop. The release owner closes the feature with `sdlc approve $ARGUMENTS 6`; in the full lane that opens the outcome follow-up.
