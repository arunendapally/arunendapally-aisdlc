## Summary

Add the AI SDLC repo kit that "sdlc init-repo" generated, so this repo runs its own process with a gate command.

## Change

.ai-sdlc/config.json and .ai-sdlc/.gitignore are already on main (#54 and later), so this PR adds no repo config. .ai-sdlc/autonomy.json was dropped: the v0.8.0 kit no longer ships it and no script reads it (grep of scripts, hooks, skills, commands, docs).
.github/workflows/ai-sdlc-gate.yml, review-sla.yml, publish-docs.yml, .github/scripts/*.mjs, .github/rulesets/main.json, .github/CODEOWNERS: the kit's CI checks, ruleset and owners. Two kit parts do not fit this repo and were changed (review.md F1, F2): test-levels.yml is left out (it runs test:unit, test:subsystem, start:test and test:e2e scripts this repo does not have), and ai-sdlc-gate.yml drops build-and-test (npm ci fails with no package-lock.json; evals.yml already runs the full suite), so the ruleset requires tests-and-golden-evals in its place. gate-approvals and its script check-gates.mjs are left out (F3, Arun's call on 23 Nov): it needs a reviewer other than the PR author, which a one-person repo cannot give.
templates/repo/.github/scripts/check-pr-body.mjs and this repo's copy: comments are stripped as GitHub hides them, an unclosed one to the end, until none is left, so hidden text never counts as a filled section (CodeQL alert on PR #73, review.md F9). Test: tests/pr-body-comments.test.mjs. Changelog fragment: changelog.d/repo-setup.md.
CONSTITUTION.md, standards/, knowledge/README.md, docs/adr/0000-template.md, docs/architecture/workspace.dsl, docs/feedback.md, .claude/rules/ai-sdlc.md: the kit's rules, standards and templates, plus the feedback record. Kit files were refreshed to the v0.8.0 templates (templates/repo), so each is an exact copy and does not count toward the PR size (scaffoldFiles, scripts/lib.mjs:465).

## Why

The 2026-11-05 dogfood run ran init-repo on this repo and left the kit untracked in the main checkout; the gates-and-names slices need a gate command to pass Build, and the kit belongs in its own PR so feature PRs stay under their line limits.

## Behaviour change

One, in the repo kit: the pr-body check no longer counts text hidden in an HTML comment as section content (F9). Otherwise the kit adds CI checks on this repo's own PRs only.

## Test results

Suite: 351 passing, 0 failed (baseline 351), npm test && npm run eval (sdlc gate repo-setup on 3dadd7c)
PR size: 0 of 200 code lines (kit files are exact template copies; docs and specs are excluded)
Removed, skipped or quarantined: none

## Pre-review

Risk: high, because every change is under .github (CI, owners and the branch ruleset), a path that always needs a person.
Open findings: 0 (nits left open: F7, F8)
Look here first: .github/rulesets/main.json:10 (required_signatures: none of this branch's commits are signed, so only a GitHub-side squash merge would pass), .github/rulesets/main.json:15 (require_code_owner_review and require_last_push_approval: with you as the only owner and author, no PR can merge without an admin bypass once the ruleset is applied and F6 names a real owner)
Lenses run: correctness, simplicity, security, operability (tests: no test changes; the scripts are exact template copies covered by the plugin's own suite)
Revert: git revert of the merge commit; no data to back out. If .github/rulesets/main.json was applied to GitHub, delete that ruleset first, or every PR stays blocked on checks that no longer exist.
Checked mechanically: every kit file equals templates/repo except the three changes the PR names; pr-body passes on this body (task lane reads as full: Summary, Test results, Pre-review, Not verified); pr-size counts 353 changed lines against the CI limit of 400 (the local gate counts 0 because kit copies are excluded); on GitHub, pr-body, pr-size, secrets, dependencies and tests-and-golden-evals passed on PR #73 (dependencies after Dependency graph was turned on); gitleaks needs no licence on a personal account and no secret patterns appear in the branch's commits; dependency-review has no lock file to diff; publish-docs skips (CONFLUENCE_BASE_URL unset); review-sla runs only from main; tests-and-golden-evals is the job name in evals.yml, so the ruleset context resolves; permissions are read-only on PR events, untrusted PR fields reach scripts only through env, no pull_request_target; F1 and F2 pass the ledger rules at d414069 (a fixed row may name the file its fix removed).
Could not check: how the workflows actually behave on GitHub (they have not run; F4 is read from the actions' source on their default branches, not the pinned v2 and v4 tags); whether a GitHub-side squash merge satisfies required_signatures for this repo; actions are pinned by major tag, not commit SHA, as in evals.yml.

## Not verified

F4 (secrets and dependencies failing on a review event) is read from the actions' source, not seen in a run.
.github/rulesets/main.json is a file only: applying it to GitHub is a person's step, and with one person it blocks every merge without an admin bypass (F6, required_signatures, require_code_owner_review).
review-sla.yml and publish-docs.yml run only from main, so this PR does not exercise them.
