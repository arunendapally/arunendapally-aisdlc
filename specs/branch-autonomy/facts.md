# System facts: branch-autonomy

## Facts

- F1: [governing] Every lane lists Build (stage 4) as its only stage that passes on checks, so Plan, Design, Verify and Release all wait for a person today. Source: scripts/lib.mjs:28-30. Verified: e59bfdd.
- F2: stageSpec marks a stage automatic only when the lane lists it or a person promoted it through earned trust, so this feature changes which stages count as automatic. Source: scripts/lib.mjs:102. Verified: e59bfdd.
- F3: An automatic gate is recorded as approved by "checks", with a fingerprint, so a spec or plan edited later still sends the work back without any person. Source: scripts/sdlc.mjs:509-514. Verified: e59bfdd.
- F4: The only switch that lets every gate pass on checks today is a repo-wide AUTONOMY file a person writes, so autonomy is all or nothing for the repo, not per branch. Source: scripts/lib.mjs:435-441. Verified: e59bfdd.
- F5: Under that repo-wide autonomy, sdlc merge pushes the reviewed commit straight to main, so granting it today also takes the human PR review away. Source: scripts/sdlc.mjs:573-583. Verified: e59bfdd.
- F6: The guard refuses any push or commit by an agent to a protected branch, so feature work already cannot reach main except through a PR a person merges. Source: scripts/hooks/pre-tool.mjs:172-177. Verified: e59bfdd.
- F7: Build and Verify requests only run on the feature's own branch, so a feature already knows which branch it lives on. Source: scripts/sdlc.mjs:39-43. Verified: e59bfdd.

## Not found

- Looked for any per-branch or per-feature setting that changes which gates are automatic in scripts/lib.mjs and scripts/sdlc.mjs: none, so R1 is new behaviour.
