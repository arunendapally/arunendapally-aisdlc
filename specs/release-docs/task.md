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

## Not verified

Other wording in docs/getting-started.md and docs/org-ai-sdlc-process.md that predates ADR-0008 (for example "sdlc approve saved-items 5" and "A CODEOWNER engineer approves and merges") was not changed: a separate docs pass.
No proofCommand is set, so the fail-before proof did not run.
