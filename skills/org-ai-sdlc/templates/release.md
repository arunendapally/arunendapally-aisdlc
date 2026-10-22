# Release: <feature>

<!-- Stage 6 Release. Gate: release owner; "sdlc approve <feature> 6". Humans run merge, apply and deploy.
     Order: check production is in the shape the change expects, rehearse data changes on a copy, apply
     data changes before the code that needs them, deploy, probe. -->

## Rollout

<!-- Flag, canary or staged percentages, and the stop condition. -->

## Rollback (tested)

<!-- The command, and "Tested: <YYYY-MM-DD>, <how>". Release is refused without a tested date. -->

## Probes

<!-- Read-only checks against the SLOs, each with its result (pass or fail). -->

## Outcome metric

Metric: <the PRD's outcome metric and target, or "None, because ...">
Owner: <who reads it>
Read on: <YYYY-MM-DD, or leave out for the lane's default watch window>

<!-- Full lane: the feature closes at release and this opens its outcome follow-up
     (sdlc outcome <feature> met|missed|breach). -->

<!-- Optional: ## Artefact (build digest), ## Runbook, ## Cost delta, ## Traps added. -->
