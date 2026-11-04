# Browser QA: the product's own end-to-end suite, not a browser inside the plugin

*2026-11-04. Issue #25 asked whether Verify should drive a real browser for UI work, as gstack's QA does (Q3 of `2026-10-25-agile-with-agents.md` left it open).*

## Evidence

The unit-converter run (`docs/feedback/2026-11-04-unit-converter-run.md`) is the first with a UI:
- A Playwright script, run once in Verify, found a crash on every category change that 88 passing unit tests could not see.
- The pre-review then found a second crash after Back.
- The script lived in a scratch folder and always exited 0, so nothing kept it honest. Committed as `test/e2e/unit-converter.e2e.cjs`, failing on any FAIL, it became the guard for both crashes.

## Decision

The plugin does not ship or drive a browser. A UI feature's `@e2e` criteria are proved by the product's own end-to-end suite, committed with the change:
- `templates/testing/e2e-fixtures.ts` is the starting point;
- the test matrix already reads `e2e/`, `test/e2e/`, `playwright/` and `*.e2e.*`;
- a suite the proof command cannot run is left to its own run with `proofSkipLevels`;
- a criterion that truly needs a person is tagged `@manual`, with a dated "Checked by hand ... pass" line in the PR.

Options weighed:
- **The plugin drives Playwright in Verify.**
  - Might win: one way for every product, nothing to set up.
  - Might lose: it adds a large dependency to a plugin with none, guesses how each product starts and signs in, and its checks would not live in the product, so they would not run in the product's CI or survive the feature.
- **The product's own suite, chosen.**
  - Might win: the checks live with the code, run in CI and keep guarding after release.
  - Might lose: each product sets up Playwright (or Cypress) once.

## Consequences

- Good: the run's two crashes are now guarded by a committed test, and the gate counts it like any other.
- Downside: a product without a browser suite falls back to `@manual`, which an agent can write. The review packet lists each one apart for the person at the merge.

Confirmed by: `tests/release-criteria.test.mjs` (an `@e2e` criterion with no test is refused unless it is `@manual` or `@release` and proved that way).
