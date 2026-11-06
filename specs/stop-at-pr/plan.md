# Plan: stop-at-pr

## Summary

Builds: every lane ends at Verify, which passes on its checks; a feature completes there and opens its outcome follow-up from the PRD; sdlc merge is removed; @release criteria are listed to check after deploy.
Reuses: the automatic-gate path Build uses (lane auto list), and outcomeFollowUp() reading "## Outcome metric" (F4).
Biggest risk: existing tests and evals assume Release and a Verify approver; they change with this slice.
Not doing: deleting the unused release code, template and evals (a follow-up task, ADR-0008).
Open: none.

| Requirement | Where it is built |
|---|---|
| R1 every lane ends at Verify | scripts/lib.mjs LANES stages |
| R2 Verify passes on checks | scripts/lib.mjs LANES auto [4, 5]; STAGES[5] owner |
| R3 no merge command | scripts/sdlc.mjs merge() removed |
| R4 @release listed after deploy | scripts/sdlc.mjs Verify refusal removed; scripts/review.mjs packet section |
| R5 outcome follow-up at completion | scripts/loop.mjs advanceFeature() reads prd.md |
| R6 failing Verify still stops | unchanged refusal path in scripts/sdlc.mjs request() |

## C4 views

None, because no container or component changes; the change stays inside the sdlc CLI. Level 1: unchanged (workspace.dsl).

## Decisions

- ADR-0008: the plugin stops at a raised PR; every lane ends at Verify, which passes on its checks.

## Data model

None, because no stored field changes; features already closed keep their records.

## Contracts

- Breaking (CLI): "sdlc merge" is removed. No other repo calls it (facts.md Not found).
- Changed behaviour: "sdlc request" at Verify passes on checks and completes the feature instead of waiting for a CODEOWNER.

## Threat model

| Threat | What stops it | Proved by |
|---|---|---|
| An agent lands work on main | no merge command; the push guard on protected branches (F7) | AC-3; tests/hooks.test.mjs push tests |
| A failing Verify completes the feature | the refusal runs before any pass | AC-6 |

## Error handling

- Verify checks fail: the request fails with every reason, as today.
- A feature already at stage 6 when this ships: "sdlc status" shows it at Release; the follow-up task decides how to close it [unconfirmed].

## Data and tenancy

None, because it reads and writes only the feature's own state.json, as today.

## Test plan

- AC-1, AC-2, AC-5, AC-6: subsystem, tests/stop-at-pr.test.mjs, a throwaway git repo per test.
- AC-3, AC-4: unit, same file.
- Existing tests and evals that assert Release or a Verify approver are updated to the new end point.

## Run it

- Signals: each pass on checks is recorded in state.json as today.
- Alert: None, because this is a local CLI with no service.
- Config and secrets: none new.
- Cost and backup: None, because nothing new is stored.
