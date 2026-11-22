<!-- Task lane. Owner: builder agent; the pre-reviewer agent writes Pre-review. -->

## Summary

Delete the unused release.md template and stop the docs and agents describing a Release stage the plugin no longer runs (ADR-0008).

## Change

skills/org-ai-sdlc/templates/release.md: deleted (no command, check or test reads it since #61)
agents/sre.md: the rollout, rollback and probes go in the design's `## Run it`; the SRE advises the org's own release, not a stage 6
docs/getting-started.md, docs/org-ai-sdlc-process.md: the 6 Release table rows removed; the outcome follow-up opens from the PRD at Verify
skills/org-ai-sdlc/templates/incident.md, skills/org-ai-sdlc/templates/prd.md: references to release.md replaced
scripts/lib.mjs:180, templates/repo/standards/README.md: one comment and one line that named release.md or stage 6

## Why

#61 removed the Release check, so these files told agents and people to write a release.md that nothing reads and to approve a stage that no lane reaches. The open follow-up from #61's Not verified section.

## Behaviour change

None, because the only code line touched is a comment (scripts/lib.mjs:180), and no script, hook or test reads the deleted template (git grep "release.md" on this commit finds only STAGES[6]'s artefact name, kept so status names old features).

## Test results

Suite: 301 passed, 0 failed, 0 skipped (baseline 301)
Gate: green, 29/29 evals, F1 to F5 caught, PR size 2 of 200 (sdlc gate release-docs)
Removed, skipped or quarantined: none

## Pre-review

Risk: medium, because the only code line is a comment (scripts/lib.mjs:180), but the gate floor for code is medium; the rest is docs and templates.
Open findings: 0 (F1 to F5 fixed in c0ebb5d)
Look here first: docs/getting-started.md:99 (the new outcome sentence contradicts the default config for the light lane), docs/getting-started.md:65 and docs/org-ai-sdlc-process.md:101 (how much Release wording this PR should clear versus the deferred docs pass)
Lenses run: correctness, docs accuracy, dead references, simplicity
Revert: git revert of the merge commit; no data or state to back out
Checked mechanically: git grep for release.md, templates/release, stage 6 and ai-sdlc:release across scripts, hooks, tests, evals, commands, skills, templates, agents and docs: only STAGES[6] (scripts/lib.mjs:18, kept on purpose), tests/db-design.test.mjs:66 (a message, F5) and dated decision and feedback records remain; commands/release.md exists and already says out of scope, so retro.mjs:8 still resolves; outcomeFollowUp reads Metric, Owner and Read on: from the PRD Outcome metric (scripts/loop.mjs:201-210, called from loop.mjs:257); design.md has Run it (templates/design.md:112, lib.mjs:13); the two edited markdown tables keep their column count; no new dependency, nothing hand-rolled
Could not check: the full suite and evals were not rerun here (gate reported 301 and 29/29); rendered markdown not viewed

## Not verified

Other wording in docs/getting-started.md and docs/org-ai-sdlc-process.md that predates ADR-0008 (for example "sdlc approve saved-items 5" and "A CODEOWNER engineer approves and merges") was not changed: a separate docs pass.
No proofCommand is set, so the fail-before proof did not run.
