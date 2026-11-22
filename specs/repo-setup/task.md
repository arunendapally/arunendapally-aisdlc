## Summary

Add the AI SDLC repo kit that "sdlc init-repo" generated, so this repo runs its own process with a gate command.

## Change

.ai-sdlc/config.json and .ai-sdlc/.gitignore are already on main (#54 and later), so this PR adds no repo config. .ai-sdlc/autonomy.json was dropped: the v0.8.0 kit no longer ships it and no script reads it (grep of scripts, hooks, skills, commands, docs).
.github/workflows/ai-sdlc-gate.yml, review-sla.yml, publish-docs.yml, .github/scripts/*.mjs, .github/rulesets/main.json, .github/CODEOWNERS: the kit's CI checks, ruleset and owners. Two kit parts do not fit this repo and were changed (review.md F1, F2): test-levels.yml is left out (it runs test:unit, test:subsystem, start:test and test:e2e scripts this repo does not have), and ai-sdlc-gate.yml drops build-and-test (npm ci fails with no package-lock.json; evals.yml already runs the full suite), so the ruleset requires tests-and-golden-evals in its place.
CONSTITUTION.md, standards/, knowledge/README.md, docs/adr/0000-template.md, docs/architecture/workspace.dsl, docs/feedback.md, .claude/rules/ai-sdlc.md: the kit's rules, standards and templates, plus the feedback record. Kit files were refreshed to the v0.8.0 templates (templates/repo), so each is an exact copy and does not count toward the PR size (scaffoldFiles, scripts/lib.mjs:465).

## Why

The 2026-11-05 dogfood run ran init-repo on this repo and left the kit untracked in the main checkout; the gates-and-names slices need a gate command to pass Build, and the kit belongs in its own PR so feature PRs stay under their line limits.

## Behaviour change

None, because no plugin code under scripts/, hooks/, skills/ or commands/ changes; the kit adds CI checks on this repo's own PRs only.

## Test results

Suite: 351 passing, 0 failed (baseline 351), npm test && npm run eval (sdlc gate repo-setup on 3dadd7c)
PR size: 0 of 200 code lines (kit files are exact template copies; docs and specs are excluded)
Removed, skipped or quarantined: none

## Pre-review

Pending.

## Not verified

The new GitHub workflows have not run on GitHub yet; they run on this PR.
.github/rulesets/main.json is a file only: applying it to GitHub is a person's step.
