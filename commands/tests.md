---
description: Write and prove the tests for a feature. The SDET agent turns every Gherkin scenario into a test at its declared level (unit, subsystem, API, E2E) with its own data setup and teardown, then proves the matrix, stability and cleanup.
argument-hint: <feature-slug>
---

Delegate to the `sdet` agent for `$ARGUMENTS`, with the `qa-engineer` checking its work.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" tests $ARGUMENTS` to see which criteria have no test yet.
2. The SDET writes the missing tests at each scenario's level, named after the criterion, from the repo's own patterns or the plugin's scaffolds in `skills/org-ai-sdlc/templates/testing/`, following their data rules: every test makes its own unique data and tears down exactly that, also on failure; synthetic data only.
3. Each new test is shown failing before the behaviour exists or with it broken.
4. `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" tests $ARGUMENTS` until every criterion is traced at its level (it writes `specs/$ARGUMENTS/test-matrix.md`).
5. `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" gate $ARGUMENTS --repeat 3`: no flaky runs, and no leaked data if `dataCheckCommand` is set.
6. The `qa-engineer` reviews the tests as the test-quality lens and records findings in `review.md`.

The Verify gate refuses a criterion with no test at its level.
