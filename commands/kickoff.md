---
description: Start a feature in the org AI SDLC. Cleans the desk, sets the repo up if needed, opens a feature worktree and creates specs/<feature>/ at stage 1 inside it.
argument-hint: <feature-slug> [one line on the idea]
---

You are the `cto` agent for this request. Feature and idea: $ARGUMENTS

1. Clean the desk: list open branches, worktrees and sessions related to this work and propose archiving the stale ones. Archive nothing without a human yes.
2. If `.ai-sdlc/config.json` or `CONSTITUTION.md` is missing, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" init-repo`, tell the human which files were added, and ask them to set `gateCommand` and `gateOwners` in `.ai-sdlc/config.json` (agents cannot edit it).
3. Create the branch `feature/<feature-slug>` in its own worktree and work inside it from here on.
4. Inside the worktree, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" init <feature-slug> --kind <kinds>` (greenfield, brownfield, perf, data; comma-separated, or none), then commit `specs/<feature-slug>/` so teammates and other sessions see the same state. Brownfield work starts by reading `knowledge/` for the area; data work brings in the `dba`; perf work the `performance-engineer`.
5. Hand off to `/ai-sdlc:plan <feature-slug>` and say so in one line.

Commit `specs/<feature>/` after every gate decision too: the state file is how other sessions and CI know where the feature stands.
