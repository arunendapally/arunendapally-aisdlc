# Plan: branch-autonomy

## Summary

Builds: Plan (gate 1) and Design (gate 3) pass on their checks when requested on the feature's own branch, unless the repo names a person for that gate or the change is risky; every pass on checks is audited and the review packet lists them.
Reuses: the automatic-gate path Build already uses (F3), with its fingerprint, so spec and plan drift still send work back; gateOwners as the per-repo off switch.
Biggest risk: a weak PRD or design reaches the PR with no person having read it before Build (PRD A1); the PR review is the catch, and the packet now says which gates and revisions no person saw.
Not doing: any change to Verify, merge or repo-wide autonomy (ADR-0007); Verify and Release follow ADR-0008.
Open: none.

| Requirement | Where it is built |
|---|---|
| R1 Plan passes on checks on a branch | scripts/lib.mjs (BRANCH_AUTO, branchAuto() conditions), scripts/sdlc.mjs request() |
| R2 Design passes on checks on a branch | scripts/lib.mjs (BRANCH_AUTO, branchAuto() conditions), scripts/sdlc.mjs request() |
| R3 the plugin never merges or pushes to main | unchanged: main has no merge command (ADR-0008); stage 5 is not in BRANCH_AUTO; AC-3 pins that Verify leaves main where it was, and a test pins BRANCH_AUTO against neverTrust |
| R4 drift sends work back | unchanged drift check in request() (F3), with branch wording in next(); test pins it |
| R5 failing checks refuse | unchanged missing-checks path in request(); test pins it |
| R6 PR shows gates passed on checks | scripts/sdlc.mjs request() (audit event "auto"), scripts/review.mjs packet() and packetText() |

## C4 views

None, because no container or component changes: the change stays inside the sdlc CLI (scripts/sdlc.mjs, scripts/lib.mjs, scripts/review.mjs). Level 1: unchanged (workspace.dsl).

## Decisions

- ADR-0007: Plan and Design pass on checks on the feature's own branch; the PR review stays the human gate.

## Data model

None, because no table, column or stored field changes; gate records keep the shape they have (F3). audit.jsonl gains one event name, below.

## Contracts

- Additive: "sdlc request" at gate 1 or 3, when every ADR-0007 condition holds, prints "passed on checks (feature branch)" instead of waiting. No flag or argument changes.
- Additive: .ai-sdlc/audit.jsonl gains event "auto" ({ event, feature, stage, revision, by }) for every pass on checks, Build included.
- Additive: the review packet gains a "## Gates passed on checks" section: each "auto" event and each spec-drift or plan-drift event for the feature, with its time.
- Changed text: when a condition fails, the waiting message names it; on another checkout it says "switch to <branch> and request again to pass on checks".
- Changed text: the drift message on the branch says the gate passes on its checks; the agent rule "Only a human approves a gate" in .claude/rules/ai-sdlc.md and templates/repo/.claude/rules/ai-sdlc.md gains "or the feature branch rule passes Plan or Design on checks".

## Threat model

| Threat | What stops it | Proved by |
|---|---|---|
| Work reaches main with no person | stage 5 is not in BRANCH_AUTO, BRANCH_AUTO never meets neverTrust, and agents cannot push to main (F6) | AC-3; unit test on BRANCH_AUTO and neverTrust |
| A request on main, a detached HEAD or a failed git call passes Plan on checks | HEAD must equal state.branch exactly and be none of "HEAD", "" or a protected branch | tests/branch-autonomy.test.mjs "on main / detached, Plan does not pass on checks" |
| The agent names a shared branch at init | accepted: work still reaches main only by PR; a repo lists the branch in protectedBranches to keep its people | ADR-0007 Consequences |
| A person's rejection or pending review is overwritten | the rule applies only when the stage has no gate record | test "a rejected gate 1 waits for its person" |
| A PRD edit drifts the feature back and clears a person's rejection | the rule is off for a stage once audit.jsonl (agents cannot write .ai-sdlc/**) holds a "reject" event for the feature and stage | test "gate 3 rejected, PRD edited, gates 1 and 3 wait" |
| A repo that names a Plan person and approves on main is refused there | the off-branch refusal applies only when every other condition holds | test "gateOwners names a Plan person, request on main waits" |
| A repo's named gate owner is bypassed | the rule applies only when gateOwners lists no name for the stage | test "gateOwners naming a person keeps gate 1" |
| A migration or security-touching design passes with no DBA or security person | gate 3 keeps its person for kind data or a risky Security and privacy line | test "kind data, gate 3 waits for the DBA" |
| Plan and Design run with no person on a spent budget | the rule is off while BUDGET_FROZEN exists | test "frozen budget, gate 1 waits" |
| A failing spec is passed anyway | the missing-checks refusal runs before any automatic pass | AC-5 |
| A spec edited after passing ships unseen | the fingerprint sends it back to Plan, the re-pass needs "## Changes since vN", and the packet lists the drift and the re-pass | AC-4, AC-6 |
| The PR claims a person approved | the gate is recorded "checks: feature branch", and the packet says "passed on checks" | AC-6 |

## Error handling

- Request at gate 1 or 3 on a checkout other than state.branch, with no state.branch (features made before it was set), a named gate owner, a rejected or waiting gate, a "reject" event in audit.jsonl for the stage, a frozen budget, or (gate 3) kind data or a risky Security and privacy line: the gate waits for its named person as today, and the message says which condition kept the person.
- Checks fail: the request fails with every reason, as today; nothing is approved.
- The branch carries code over the lane limit: refused by the PR size check, as at Build.

## Data and tenancy

None, because it reads the feature's own state.json and the repo config, and writes the feature's state.json and one audit line, as a request and an approval do today.

## Test plan

- AC-1, AC-2, AC-3, AC-4, AC-5: subsystem, in tests/branch-autonomy.test.mjs, each test builds a throwaway git repo in a temp folder with a feature on its own branch and removes it after.
- Conditions: subsystem, same file: main, detached HEAD, wrong branch waits naming the switch, gateOwners named, rejected and waiting gates, a rejection cleared by drift still waits, frozen budget, kind data at gate 3, risky NFR at gate 3, an "auto" audit line written.
- AC-6: unit, packetText() given a packet with one pass on checks and one drift event.
- Unit: no BRANCH_AUTO stage appears in neverTrust for any lane.
- Budget: none beyond today's checks; an automatic pass at 1 or 3 also runs the PR size check that Build runs, which a person's approval does not.

## Run it

- Signals: each pass on checks writes event "auto" to .ai-sdlc/audit.jsonl, by "checks: feature branch" (or the autonomy or earned-trust label).
- Revisit signal: PRs sent back in the org's review for a feature with an "auto" event at gate 1 or 3 in audit.jsonl; Arun reads their reasons for the first three PRs (PRD A1).
- Alert: None, because this is a local CLI with no service.
- Config and secrets: no new config or secret; gateOwners and protectedBranches keep their meaning.
- Cost and backup: None, because nothing is stored beyond the gate record and one audit line.

## Changes since v1

- Main merged ADR-0008 (the plugin stops at a raised PR) and stage names: R3 now says the plugin never merges or pushes to main, R7 and AC-7 are removed, and the revisit signal reads PRs sent back in the org's review instead of gate 5 rejects, since Verify passes on its checks.
