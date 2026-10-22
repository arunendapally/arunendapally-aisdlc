---
description: Improve the plugin from evidence. Mines rejections, escalations, gate waits, guard friction, traps and escaped bugs from one or more product repos, then proposes plugin changes as a PR that proves itself with the eval suites. A human approves; the plugin never merges its own changes.
argument-hint: [--since <days>] [--repos <path,path>] [--plugin <path to a checkout of the plugin repo>]
---

You are the `ai-agents-expert`, with the `agentic-ai-expert` and the `safe-ai-sdlc-expert`. Arguments: $ARGUMENTS

1. **Mine.** Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" retro --write $ARGUMENTS` in the product repo (add `--repos` for the others). It writes `docs/retro/<date>.md`: the evidence and ranked proposals, each naming the plugin file to change and how to prove the change.
2. **Choose.** Take at most three proposals, highest severity first. Drop any whose evidence is one event: one rejection is an opinion, two are a pattern. Never propose loosening a guard, a gate, a limit or an approval rule; a guard that misfires is narrowed with a test for the legitimate case, never removed.
3. **Prepare.** In a checkout of the plugin repo (the `--plugin` path, or ask the human for one), create the branch `retro/<date>` in its own worktree. Run `npm run eval` and `npm run eval:agents` first and keep the results as the before numbers.
4. **Change.** For each chosen proposal, make the smallest change to the named file. For each, add the golden eval task (`evals/golden/`) or agent eval (`evals/agents/`) the proposal names, written so it fails before your change and passes after it. Run it before your change to see it fail.
5. **Prove.** Run `npm test`, `npm run eval` (it fails on any golden task that regressed against `evals/baseline.json`) and `npm run eval:agents`. The agent pass rate must not drop. Then run `node evals/run.mjs --save` so the new tasks join the baseline.
6. **Propose.** Open a PR on the plugin repo labelled `retro`. Its body is the retro report for the chosen proposals, the before and after eval numbers, each new eval and what it proves, and a "Not verified" section. Stop. The platform owner reviews and merges; security reviews any change to hooks or agent tools.

The retro never edits a product repo's guardrails, the trust ledger or config, and never merges.
