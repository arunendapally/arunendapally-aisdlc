# Release: <feature>

<!-- Stage 6 Release. Gate: release owner; "sdlc approve <feature> 6". Humans run merge, apply and deploy. -->

## Artefact

<!-- Exact build digest promoted from staging. -->

## Release order

1. Check production is in the shape the change expects.
2. Rehearse data changes on a copy.
3. Apply data changes and access rules before any code that needs them.
4. Deploy.
5. Probe.

## Rollout

<!-- Flag, canary or staged percentages, and the stop condition. -->

## Rollback (tested)

<!-- The command, and "Tested: <YYYY-MM-DD>, <how>". Release is refused without a tested date. -->

## Probes

<!-- Read-only checks against the SLOs, each with its result (pass or fail). -->

## Runbook

<!-- Link, and the support hand-over owner. -->

## Cost delta

## Outcome metric

Metric: <the PRD's outcome metric and target>
Owner: <who reads it>
Read on: <YYYY-MM-DD, or leave out for the lane's default watch window>

<!-- The feature closes at release; this opens its outcome follow-up (sdlc outcome <feature> met|missed|breach). -->

## Traps added

<!-- What this feature taught, added to standards/traps.md. -->
