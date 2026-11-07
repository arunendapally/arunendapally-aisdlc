# Release: <feature>

<!-- Release. Owner: sre agent. Gate: the release owner, asked with "sdlc ask <feature>"; under autonomy it passes on its checks.
     The sre writes this before the deploy and finishes it after the probes. Humans merge, apply and deploy;
     under autonomy "sdlc merge" lands the reviewed commit.
     A required section with only a comment in it is empty, and the gate refuses it. Keep every "## " heading
     exactly as written. Or: None, because <reason>, where a section does not apply.
     Tie every claim to its source (a probe row, a command and its output, a date); end anything you did
     not see yourself with [unconfirmed]. Link the PRD, plan and db-design.md; do not repeat them. -->

## Decision

<!-- Written last, two lines, each pointing at the section that proves it. No check reads this section; the gate
     refuses a failed probe, so anything unconfirmed goes first. Example:
Recommend: keep live. Probes: 3 pass, 0 fail; Live 9c8b7a6 holds this release and the previous one (## Probes).
Unconfirmed: the dead-letter alert was not seen firing (## Not verified). -->

## Rollout

<!-- How exposure grows and the number that stops it. Full lane: link the alert in design.md "## Run it";
     light lane: name it here. Example:
Mechanism: flag SAVED_ITEMS, default off.
Steps: 5% of signed-in shoppers for 1 h, 50% for 1 day, then 100%.
Stop and roll back if: POST /saved-items 5xx above 1% for 5 min, or GET p95 above 300 ms (design.md "## Run it").
     Or: None, because no user can see the change (config-only refactor, see pr.md Summary). -->

## Order

<!-- Tick each step when it is done, with who did it and what proved it. Data changes go before the code
     that needs them. A step that does not apply says "None, because ...". -->

- [ ] 1. Production has what this change expects (flag, earlier migration, config): <read-only command, output>
- [ ] 2. Data change applied by <person> before the code, as rehearsed in db-design.md "## Rehearsal": <YYYY-MM-DD HH:MM UTC>
- [ ] 3. Deployed from main by <person>: <build id or image digest>. A branch deploy is a preview, not this step
- [ ] 4. Rollout at 100%, or stopped and rolled back: <YYYY-MM-DD HH:MM UTC>

## Rollback (tested)

<!-- The gate needs "Tested:" and a real date on one line: the date the rollback was actually run and what
     you saw, never a planned date. Data work: the data undo is db-design.md "## Backout"; point to it. Example:
Command: flagctl set SAVED_ITEMS off (instant), or helm rollback cart-service 41 (3 min)
Tested: 2026-11-02, staging under load: flag off, save button gone and POST /saved-items 404 in 20 s (load-test run #212)
Takes: under 1 min (flag), 3 min (helm), both measured in that test
Leaves behind: saved_items rows stay, unread (db-design.md "## Backout") -->

Command: <the exact command or flag change a human runs>
Tested: <YYYY-MM-DD>, <where, how, and the output that showed the old behaviour came back>
Takes: <minutes until the old version serves all traffic, as measured in that test>
Leaves behind: <what the rollback does not undo, or "None, because ...">

## Probes

<!-- After the deploy from main. Read-only checks, one row each; Result is "pass" or "fail" with the value
     seen. Row 1 is this feature's own acceptance check: a health check passes on the old build too.
     Then "Live:" with the commit sha the running system reports (version endpoint, meta tag, or the
     platform's read-only inspect command), never the deploy log and never a version tag. The gate refuses
     unless that build holds the reviewed commit and the previous release. Example:
| AC-1 saved list for the probe shopper | curl -s https://shop.example/api/saved-items -H 'cookie: probe=1' | 1 item, "Blue mug" | pass, 1 item |
| Cart health | curl -s -o /dev/null -w '%{http_code}' https://shop.example/healthz | 200 | pass, 200 |
| 5xx rate, 15 min at 100% | <saved dashboard query link> | under 0.5% | pass, 0.12% |

Live: 9c8b7a6 (from https://shop.example/version at 14:05 UTC) -->

| Probe | Read-only command | Expected | Result |
|---|---|---|---|

Live: <sha>

## Outcome metric

<!-- Metric and Owner are prd.md's "## Outcome metric" lines as approved (the follow-up records this text, so
     it must stand alone). Leave out "Read on:" to use the lane's window (outcomeWindowDays: 14 full, 7 light
     by default). Example:
Metric: share of saved items bought within 14 days of saving
Owner: Priya, product lead
Read on: 2026-11-24
     Or: Metric: None, because this is a refactor behind a flag with no user-visible change. -->

## Not verified

<!-- What nobody checked in production, and why: a probe that could not run read-only, an alert never seen
     firing, a region not probed. Example:
The dead-letter alert: not seen firing; no stock.changed delivery failed during the rollout.
     Or: None, because every claim above has a probe row or a dated test. -->
