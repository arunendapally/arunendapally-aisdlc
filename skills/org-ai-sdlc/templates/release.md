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

<!-- The command, and when it was last tested. -->

## Probes

<!-- Read-only checks against the SLOs, with results. Empty means the gate cannot be requested. -->

## Runbook

<!-- Link, and the support hand-over owner. -->

## Cost delta

## Outcome metric

<!-- Where the brief's outcome will be read, and when. -->

## Traps added

<!-- What this feature taught, added to standards/traps.md. -->
