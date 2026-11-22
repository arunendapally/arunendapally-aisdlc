## Summary

Add the AI SDLC repo kit that "sdlc init-repo" generated, so this repo runs its own process with a gate command.

## Change

.ai-sdlc/config.json and .ai-sdlc/.gitignore are already on main (#54 and later), so this PR adds no repo config. .ai-sdlc/autonomy.json was dropped: the v0.8.0 kit no longer ships it and no script reads it (grep of scripts, hooks, skills, commands, docs).
.github/workflows/ai-sdlc-gate.yml, test-levels.yml, review-sla.yml, publish-docs.yml, .github/scripts/*.mjs, .github/rulesets/main.json, .github/CODEOWNERS: the kit's CI checks, ruleset and owners.
CONSTITUTION.md, standards/, knowledge/README.md, docs/adr/0000-template.md, docs/architecture/workspace.dsl, docs/feedback.md, .claude/rules/ai-sdlc.md: the kit's rules, standards and templates, plus the feedback record. Kit files were refreshed to the v0.8.0 templates (templates/repo), so each is an exact copy and does not count toward the PR size (scaffoldFiles, scripts/lib.mjs:465).

## Why

The 2026-11-05 dogfood run ran init-repo on this repo and left the kit untracked in the main checkout; the gates-and-names slices need a gate command to pass Build, and the kit belongs in its own PR so feature PRs stay under their line limits.

## Behaviour change

None, because no plugin code under scripts/, hooks/, skills/ or commands/ changes; the kit adds CI checks on this repo's own PRs only.

## Test results

Pending: filled from "sdlc gate repo-setup" on this commit.

## Pre-review

Pending.

## Not verified

The new GitHub workflows have not run on GitHub yet; they run on this PR.
.github/rulesets/main.json is a file only: applying it to GitHub is a person's step.
