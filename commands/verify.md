---
description: Stage 5 Verify. The full gate, the test proof, the review packet and pre-review, and an honest PR body; ends at the merge gate.
argument-hint: <feature-slug>
---

Stage 5 for `$ARGUMENTS`. You are the `tech-lead`.

1. Run the full gate: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate $ARGUMENTS`. It fails below the baseline.
2. Prove the tests: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" proof $ARGUMENTS`. Every new criterion's tests must pass here and fail on the base code; changing a test afterwards means proving again. With no `proofCommand`, say under `## Not verified` that the proof did not run.
3. Keep the PR small: `sdlc request` refuses over the lane's line limit (specs, docs and lock files not counted). Split a large feature into one PR per slice.
4. Write `specs/$ARGUMENTS/pr.md` from the template, then run `/ai-sdlc:pre-review $ARGUMENTS` so `## Pre-review` names the risk, has no open findings and points the human at where to look.
5. Only when the pre-review says `Risk: high`: the `qa-engineer` writes `## QA verdict` (exploratory pass, accessibility checks on changed screens), and the `safe-ai-sdlc-expert` lists scan findings a human must accept.
6. Use `pr.md` as the PR body. Push the feature branch and open a PR labelled `stage:verify` and `author:agent`.

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS` (it rebuilds a stale review packet itself), then stop. A CODEOWNER reviews the PR from "Look here first" and types `sdlc approve $ARGUMENTS 5`. Agents never merge.
