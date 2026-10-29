# Release: <feature>

<!-- Stage 6 Release. Gate: release owner, asked with "sdlc ask <feature>"; under autonomy it passes on its checks. Humans run apply and deploy; under autonomy "sdlc merge" lands the reviewed commit.
     Order: check production is in the shape the change expects, rehearse data changes on a copy, apply
     data changes before the code that needs them, deploy, probe. -->

## Rollout

<!-- Flag, canary or staged percentages, and the stop condition. -->

## Rollback (tested)

<!-- The command, and "Tested: <YYYY-MM-DD>, <how>". Release is refused without a tested date. -->

## Probes

<!-- After the deploy from main: read-only checks, each with its result (pass or fail), including this
     feature's own acceptance check, since a generic health check cannot see an old build.
     Then the build that is running, read from the system itself, not from the deploy log: a version
     endpoint, a meta tag, or the platform's read-only inspect command. Release refuses unless the
     reviewed change is on origin/main and this build contains it and the previous release. A deploy
     from a branch is a preview, never a release. -->

Live: <sha>

## Outcome metric

Metric: <the PRD's outcome metric and target, or "None, because ...">
Owner: <who reads it>
Read on: <YYYY-MM-DD, or leave out for the lane's default watch window>

<!-- Full lane: the feature closes at release and this opens its outcome follow-up
     (sdlc outcome <feature> met|missed|breach). -->

<!-- Optional: ## Artefact (build digest), ## Runbook, ## Cost delta, ## Traps added. -->
