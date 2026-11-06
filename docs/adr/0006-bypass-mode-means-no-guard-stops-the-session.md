# ADR-0006: Bypass mode means no guard stops the session

Status: accepted
Date: 2026-11-06

## Context

The person started a session with Claude Code's bypassPermissions mode and told the agent to do everything. The plugin's PreToolUse guard still refused the agent's edit to `.ai-sdlc/config.json` and its `git push --delete` of merged branches, so the person had to run both by hand. The guard never read the session's permission mode: every refusal went through one function, `decide()` in `scripts/hooks/pre-tool.mjs`, that ignored it.

The person's model (6 Nov): work happens on a branch, a PR is always raised, and the person reviews it whenever they come back. Waiting on them before the PR buys nothing.

## Options

- **Honour bypassPermissions in `decide()`, audit what would have been refused, keep the human pause:** one change at the single choke point, so every guard, current and future, follows the mode.
- **Exempt rules one by one** (config, push, release): loses because each new guard would block again, and the list drifts.
- **Keep the guards in every mode:** loses because the person has already decided, in the tool built for that decision, that nothing should stop the session.

## Decision

Honour bypassPermissions in `decide()`.

- In bypassPermissions, a guard that would deny or ask lets the call through and writes `decision: "bypassed"` with the rule, the reason and what it would have done to `.ai-sdlc/audit.jsonl`. A bypassed refusal never counts toward holding the session.
- A human pause (`.ai-sdlc/PAUSED`, from `sdlc pause`) still stops a bypass session: it is the person's stop, not a guard.
- Every other mode (default, acceptEdits, plan, auto) keeps every guard.
- Server-side protection, such as GitHub rulesets and required checks, is unaffected.

## Consequences

- In bypass mode an agent can push to main, approve gates and edit guardrail files. The audit log and the PR are how the person sees what it did.
- Tests: `tests/bypass.test.mjs`.
