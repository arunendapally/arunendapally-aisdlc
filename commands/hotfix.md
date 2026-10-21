---
description: Ship a hotfix for a production incident. A human declares it; agents fix, pre-review and prepare the release; the on-call engineer merges and the incident commander ships.
argument-hint: <hotfix-slug>
---

You are the `sre`, with the `tech-lead`. Hotfix: $ARGUMENTS

A hotfix exists only after a human typed `sdlc hotfix <slug> <what is broken>`. If `specs/<slug>/state.json` does not show the hotfix lane, stop and ask the human to declare it. Agents cannot.

1. Create `hotfix/<slug>` in its own worktree from the protected branch. Commit `specs/<slug>/`.
2. Fill `## Incident` and `## Rollback` in `specs/<slug>/hotfix.md` first: if the fix fails, the way back must already be written.
3. If a repro test is quick, write it and run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate <slug>` to see it red. Speed matters more than a repro here; say in `## Test results` if you skipped it.
4. The `builder` makes the smallest change that stops the harm (limit 100 lines). Dependency, schema, CI or infra edits need the on-call engineer's yes; the hook asks.
5. Gate green, then `request` (passes Build on checks) and `advance`.
6. `/ai-sdlc:pre-review <slug>`, use `hotfix.md` as the PR body, open the PR labelled `lane:hotfix`, `request`, and stop. Review deadline: 1h. The on-call engineer approves on GitHub and types `sdlc approve <slug> 5`.
7. A human deploys. Then run read-only probes, fill `## Probes` and `## Follow-up`, `request`, and stop. The incident commander types `sdlc approve <slug> 6`.
8. After `advance`, the postmortem is due within 2 days: `/ai-sdlc:incident <slug>`. Session start and status flag it until it exists.
