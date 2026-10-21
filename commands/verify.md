---
description: Stage 5 Verify. Full gate, independent QA verdict, mutation proof, security results, honest PR body; ends at the merge gate.
argument-hint: <feature-slug>
---

Stage 5 for `$ARGUMENTS`. You are the `tech-lead`.

1. Run the full gate with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate $ARGUMENTS` (types, lint, whole suite, end-to-end, scans, as the repo's `gateCommand` defines). It fails below the baseline.
2. `qa-engineer`, independently of the builder: every QA test ID passes, every changed test fails on the baseline, every guard fails under mutation, automated accessibility checks on changed screens, an exploratory pass on the riskiest flow. Its verdict goes in `## QA verdict`.
3. `safe-ai-sdlc-expert`: scan results and any finding a human must accept. Critical findings block.
4. `c4-diagrams-expert`: the diagrams still match the code.
5. Keep the PR small: `sdlc request` refuses over 400 changed lines (specs, docs and lock files not counted). Split a large feature into one PR per slice from the spec.
6. Write `specs/$ARGUMENTS/pr.md` from the template, then run `/ai-sdlc:pre-review $ARGUMENTS` so `## Pre-review` names the risk, has no open findings, and points the human at where to look. Use `pr.md` as the PR body. Push the feature branch and open a PR labelled `stage:verify`, `lane:full` and `author:agent`. Review deadline: 24h; after that it is escalated.
7. Answer `## Review honesty` in writing: did you review every phase yourself, or take any result on the builder's word? Anything but a clear yes means review properly now.

**Gate:** `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" request $ARGUMENTS`, then stop. A CODEOWNER approves the PR on GitHub and types `sdlc approve $ARGUMENTS 5`. Agents never merge.
