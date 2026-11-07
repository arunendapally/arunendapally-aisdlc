# Plan: close-stage-six

## Summary

"sdlc request" and "sdlc advance" complete a feature at stage 6 through advanceFeature (F3), with no Release check (F4) and no approval. The two release evals that ran the Release check go; F3 (failure) stays caught by the deploy-hold hook eval.

## Decisions

None, because ADR-0008 decided it (every lane ends at Verify; its Release check is no longer run).

## Data model

None, because no stored field changes: completing writes closedAt and outcome, as at Verify (F3).

## Contracts

None, because no interface outside this repo changes.

## Threat model

None, because it adds no input, stored data or permission: stage 6 is reachable only from state an older plugin wrote (F1).

## Error handling

None, because completing a stage-6 feature runs the same advanceFeature path as Verify (F3), which has no new failure mode.

## Data and tenancy

None, because the plugin has no tenants and keeps state per feature in the repo.

## Test plan

AC-1 to AC-3: tests/stop-at-pr.test.mjs runs the CLI on a temp repo with a stage-6 feature. AC-4: the existing failing-Verify test in the same file. Evals: npm run eval still catches F1 to F5.

## Run it

None, because the plugin is a local CLI with nothing deployed.
