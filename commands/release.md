---
description: Out of scope. The plugin stops at a raised PR (ADR-0008); deploy and release are the org's own process.
argument-hint: <feature-slug>
---

There is no Release stage for `$ARGUMENTS`. Every lane ends at Verify, which passes on its checks and completes the feature once the PR is raised (docs/adr/0008-the-plugin-stops-at-a-raised-pr.md).

Tell the person, in one line, that merge, deploy and release follow their org's own process, and that any `@release` criteria are listed under `## Check after deploy` in `specs/$ARGUMENTS/review-packet.md` for them to check on the deployed build. Do not merge, deploy or request a gate.
