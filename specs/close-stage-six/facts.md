# System facts: close-stage-six

## Facts

- F1: [governing] LANES gives every lane stages up to 5 and none runs stage 6, so only state an older plugin wrote can be at stage 6. Source: scripts/lib.mjs:28-48. Verified: 1af03e7.
- F2: nextStage returns undefined for a stage the lane does not run, so advancing a stage-6 feature completes it rather than sending it back. Source: scripts/lib.mjs:576-580. Verified: 1af03e7.
- F3: advanceFeature closes a feature with no next stage and opens its outcome follow-up from the PRD, so completing at stage 6 can reuse it (R3). Source: scripts/loop.mjs:376-397. Verified: 1af03e7.
- F4: releaseProblems is the Release check (tested rollback, probes, live build on main), so a stage-6 request that skips it runs no release checks (R1). Source: scripts/loop.mjs:221-250. Verified: 1af03e7.

## Not found

Nothing missing; searched scripts/lib.mjs, scripts/loop.mjs and scripts/sdlc.mjs for stage 6.
