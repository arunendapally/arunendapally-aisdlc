# Running ai-sdlc with an agent other than Claude Code

ai-sdlc has three layers. Only the first is tied to Claude Code. This page says which guarantees hold when the work is done by another coding agent (Cursor, Copilot, Codex, Aider, Gemini CLI and so on), or by a person at a terminal, so a team can choose knowing what it gives up.

| Layer | What it is | Runs where |
|---|---|---|
| Hooks and the autopilot mod | `hooks/hooks.json`, `scripts/hooks/*.mjs`, `mods/ai-sdlc-autopilot` | Claude Code only |
| The CLI | `node scripts/sdlc.mjs ...`: gates, gate runs, proof, review packet, test matrix, status | Any shell, any agent, any person |
| CI and GitHub | `templates/repo/.github/`: workflows, scripts, the ruleset, CODEOWNERS | GitHub, whoever wrote the code |

## What holds on any agent

These are checks a command or CI runs, so they hold whoever wrote the change.

- **Every gate's checks.** `sdlc request <feature>` refuses a missing or empty section, an unmarked assumption, a requirement with no scenario, a red gate, a diff over the lane's limit, a failed or stale proof, an open finding, a release that is not on `main` and live, and so on. The agent runs the command; the command decides.
- **The test proof.** `sdlc proof` runs the traced tests on the branch and on the base commit, and records their hashes, so a test that cannot fail, or one weakened between the two runs, is caught.
- **Spec and plan drift.** A spec or plan changed after its approval sends the feature back to that stage on the next request.
- **CI on the PR.** `check-pr-body.mjs` refuses a PR body without its sections and Pre-review lines; `check-pr-size.mjs` the size limit; `check-gates.mjs` a PR whose Build gate is not recorded as approved and confirmed by an approving review from a person who is not its author.
- **Branch protection.** The ruleset in `templates/repo/.github/rulesets/main.json` requires a code owner's review, the last push approved, signed commits and linear history on `main`. GitHub enforces it, not the agent.

## What does not hold without Claude Code

These live in the hooks, which only Claude Code runs. Without them, they become conventions the agent may or may not follow.

- **Only a person approves a gate.** In Claude Code, the prompt hook records `sdlc approve` only when a person typed it, and the pre-tool hook refuses an agent that tries. With another agent, nothing stops it from running the approval from its shell or editing `state.json`. What remains: CI's `check-gates.mjs` and the ruleset still need a human review on GitHub before anything merges, so a forged approval cannot reach `main`; it can still skip a person at Plan and Design.
- **The guardrail files.** The pre-tool hook refuses agent writes to `.ai-sdlc/`, `state.json`, settings, CI workflows and CODEOWNERS, and pushes to `main`, force pushes and deploy commands. Elsewhere, use the agent's own permission settings and GitHub's branch protection.
- **The refusal loop.** Counting refusals and holding the session after the second one is a hook.
- **Reading what governs first.** The hook that refuses a whole read of a large file.
- **The autopilot.** Running the gate after each editing turn and starting the next fix turn is a Claude Code mod.

## Setting it up for another agent

1. Run `node <plugin>/scripts/sdlc.mjs init-repo` once, and set `gateCommand` (and `proofCommand`) in `.ai-sdlc/config.json`.
2. Copy `skills/org-ai-sdlc/SKILL.md` into the agent's rules file (`AGENTS.md`, `.cursor/rules`, `.github/copilot-instructions.md`) and tell it to run `node <plugin>/scripts/sdlc.mjs` for every gate.
3. Apply `templates/repo/.github/rulesets/main.json` and the CODEOWNERS file on GitHub, and keep the `ai-sdlc-gate` workflow required. This is what keeps a person in the loop when the agent does not.
4. Have people record approvals from their own terminal: `node <plugin>/scripts/sdlc.mjs approve <feature> <stage>` runs the same checks as the prompt hook, under their git user name.

## Not verified

No other agent has run a feature through the plugin yet: this page is read from the code, not from a run.
