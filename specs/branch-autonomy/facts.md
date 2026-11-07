# System facts: branch-autonomy

## Facts

<!-- Re-pinned to f6f1618 after merging main (ADR-0008, stage names): every source moved, so each fact was re-read at that commit and restated as true there. -->

- F1: [governing] Every lane lists only Build and Verify (stages 4 and 5) as passing on checks, so Define and Design wait for a person unless another route passes them. Source: scripts/lib.mjs:28-48. Verified: f6f1618.
- F2: stageSpec marks a stage automatic only when the lane lists it or a person promoted it through earned trust, so this feature changes which stages count as automatic. Source: scripts/lib.mjs:103. Verified: f6f1618.
- F3: An automatic gate is recorded as approved by "checks", with a fingerprint, so a spec or design edited later still sends the work back without any person. Source: scripts/sdlc.mjs:543. Verified: f6f1618.
- F4: The only switch that lets every gate pass on checks for the whole repo is an AUTONOMY file a person writes, so that autonomy is all or nothing for the repo, not per branch. Source: scripts/lib.mjs:441-448. Verified: f6f1618.
- F5: There is no merge command: the plugin stops at a raised PR (ADR-0008), so no route, autonomy included, merges to main. Source: tests/stop-at-pr.test.mjs:55-60. Verified: f6f1618.
- F6: The guard refuses any push or commit by an agent to a protected branch, so feature work cannot reach main except through a PR. Source: scripts/hooks/pre-tool.mjs:172-177. Verified: f6f1618.
- F7: Build and Verify requests only run on the feature's own branch, so a feature already knows which branch it lives on. Source: scripts/sdlc.mjs:40-43. Verified: f6f1618.

## Not found

- Looked for any per-branch or per-feature setting that changes which gates are automatic in scripts/lib.mjs and scripts/sdlc.mjs: none, so R1 is new behaviour.
