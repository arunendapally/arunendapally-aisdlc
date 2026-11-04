# Feedback: a unit-converter page through the AI SDLC (plugin 0.6.0)

*2026-11-02 to 2026-11-04. The second product run, after the calculator (`2026-10-29-calculator-run.md`). A one-page converter (length, weight, temperature) in plain HTML, CSS and JavaScript, light lane, with a person at every gate. The full findings, with each exact message, are in that product's repo: `arunendapally/unit-converter`, `docs/plugin-feedback.md`. This page records what the plugin did about each.*

## What the run showed

- **Plan to a green Build in one session, but the spec described the build.** The PRD was approved with requirements that named a meta tag, a commit sha, a workflow, a Node module and browser storage. The light lane had no place for the design, so it went into the requirements.
- **A green Build gate that was not green.** The gate recorded 88 passing on 2026-11-02. On a newer Node the same suite cancelled 43 tests and failed 12, because subtests were never awaited. Nothing recorded which runtime had run the tests.
- **Verify found real defects the gate could not.** A browser run found a crash on every category change, and the pre-review found five more: a crash after Back, unchecked units, rounding below absolute zero, a missing minus key on iPhones, and a probe that accepted any build. Each was fixed test first. The plugin's own numbers were wrong in three places: the proof claimed 29 criteria with 6 untested, no Greenfield note, and the plugin's own traps file matched the product's AC-7.
- **The gate's rules for release-time and hand-checked criteria were missing.** Verify refused the two criteria that can only run against the live site, so a probe was written early to get past it. The four criteria the plan said to check by hand had no place for their evidence.

## What changed in the plugin

| Finding | Fixed in |
|---|---|
| P1 requirements stated solutions | #40: the PRD template, `## Constraints`, `## Approach` in `tasks.md`, and a Plan warning measured on a labelled corpus |
| P2 a broken gate command read as a new repo | #42 |
| Values, probes and rollback dates read loosely (found by the council) | #44 |
| B1 no record of the runtime | #42: `runtimeCommand`, "RUNTIME CHANGED", a trap for un-awaited subtests |
| B2 e2e tests counted as code | #41, in the gate and in CI |
| V1 the proof listed untested criteria, and re-proved the base's | #41 |
| V2 no Greenfield note after `init-repo` | #41 |
| V3 the plugin's traps matched a product criterion | #41 |
| V4 criteria that run at release | #46: `@release` scenarios, proved by a release probe |
| V5 criteria checked by hand | #46: `@manual` scenarios and a "Checked by hand" line in the PR |
| V6 the proof ran a browser suite it could not | #46: `proofSkipLevels` |
| G1 a silenced read of `.ai-sdlc` was refused | #43; process substitution, found in review, is refused too |

Every fix was reviewed by an agent other than the one that wrote it before it merged. Those reviews found a blocker in three of the fixes: a broken gate run left an earlier green on record, a fingerprint change would have reset every in-flight Design approval, and a skipped proof level would have refused Verify for ever. All three were fixed before merging.

## Still open

- **The refusal cap.** A refused read-only command still counts toward the cap that holds the session.
- **Running the gate command at setup.** `init-repo` does not run it once; the first `sdlc gate` names a broken command instead.
- **Field use.** Two runs, both by one person on small greenfield products. Neither was a team, a brownfield codebase or a change across services.
