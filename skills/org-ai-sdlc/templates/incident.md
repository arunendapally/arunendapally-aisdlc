# Incident: <title>

<!-- A record, not a stage. Owner: sre agent. Gate: none; overdue check only.
     Blameless postmortem, made by "sdlc incident <slug>"; keep the file name, the overdue check matches
     "-<slug>.md". Due within postmortemDays (2 by default) of the hotfix shipping.
     Or: None, because <reason>, where a section does not apply. Tie every claim to its source (a log or
     alert link, a commit, a file:line, a time); end anything reconstructed from memory with [unconfirmed].
     Link hotfix.md and the rollout record; do not repeat them. Write about systems and times, not people: "the
     deploy ran without the migration", not "Sam forgot". Times HH:MM UTC.
     Only "## Actions" is read by a script: keep its header and column order exactly. -->

## Summary

<!-- Four lines for someone who reads nothing else. Example:
What broke: POST /checkout returned 500 for every card payment (alert checkout-5xx, 09:21).
Impact: 812 failed card checkouts, all EU customers (orders dashboard, 09:12 to 09:33).
Duration: 21 min, 09:12 to 09:33; detected after 9 min (see Timeline).
Severity: SEV2. Fix: specs/checkout-timeouts/hotfix.md (PR #88). -->

## Timeline

<!-- One row per fact, with where it came from. Mark start, detected, mitigated, resolved. Example:
| 09:10 | Release payments-sdk-v5 at 100% | deploy log, Live a1b2c3d |
| 09:12 | Start: first 500 on POST /checkout for a card payment | log query <link> |
| 09:21 | Detected: alert checkout-5xx paged on-call | pager incident #4411 |
| 09:30 | Mitigated: helm rollback checkout 41; 500s stop 09:33 | deploy log <link> |
| 09:58 | Resolved: hotfix live (7e4d9f0), probes pass | specs/checkout-timeouts/hotfix.md "## Probes" | -->

| Time (UTC) | What happened | Source |
|---|---|---|

## Detection

<!-- What told us, how long after the start (from the Timeline), and what should have told us sooner. A
     customer report or a person noticing is itself a finding and becomes an action. Example:
Alert checkout-5xx, 9 min after start. The rollout went from 5% to 100% in 10 min, inside the 30 min step
the rollout plan set [unconfirmed: no record of who moved it]. -->

## Mitigation

<!-- What stopped the harm, and when (Timeline row). Was the tested rollback used, and did it work
     as its "Tested:" line said? Then where we got lucky. Example:
helm rollback at 09:30; 500s stopped 09:33. Planned rollback used: yes; worked as tested: yes (3 min).
Where we got lucky: no charges taken; the gateway voided the timed-out authorisations [unconfirmed]. -->

## Root cause

<!-- The trigger, then the defect (file:line and the commit that introduced it), then, for each check that
     could have caught it (tests, review, probes, alerts, the rollout's stop condition), why it did not.
     Each "why" becomes a row in Actions. Last, earlier incidents with this cause. Example:
Trigger: payments-sdk-v5 reached 100% at 09:10 (Timeline).
Defect: src/payments/client.ts:88 relied on the SDK's default timeout, which v5 cut from 10 s to 1 s (a1b2c3d).
Tests: tests/payments/client.test.ts stubs the gateway at 50 ms, so no test waited over 1 s.
Probes: the release probe paid with a sandbox card, which answers in 200 ms.
Earlier incidents with this cause: none in docs/incidents. -->

## Actions

<!-- One row per "why" above. Columns stay in this order: Action, Becomes, Owner, Due.
     Becomes: what it became, as a path (standards/traps.md), a PR or issue (#91), or a URL.
     Owner: a named person. Due: YYYY-MM-DD. No "|" inside a cell. Rows start at the first column.
     After a hotfix, one row is the lesson: a trap in standards/traps.md with "- **Source:** <slug>" and a
     "Guard now" that is a test, hook, lint rule, CI check or eval. The postmortem stays OVERDUE until it
     exists. A postmortem with no rows is not finished, though no script says so. Example:
| Set the gateway timeout explicitly, with a test at 2 s latency | tests/payments/client.test.ts | Sam | 2026-11-08 |
| Trap: a dependency bump can change a default timeout | standards/traps.md | Sam | 2026-11-06 |
| Release probes include one card payment at real gateway latency | #91 | Ana | 2026-11-12 | -->

| Action | Becomes | Owner | Due |
|---|---|---|---|

## Not verified

<!-- What this postmortem could not confirm, and why: logs that had rotated, a cause inferred but not
     reproduced. Example:
Why the rollout skipped its 30 min step: the flag audit log keeps 24 h and was read too late.
     Or: None, because every claim above has a source. -->
