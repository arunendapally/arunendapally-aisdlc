# PRD: stop-at-pr

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: Only make sure the AI agent uses a branch rather than main, and always raises a PR; who approves and merges is the org's own policy
- Smallest: Every lane ends at a raised PR, with no Release stage and no sdlc merge
- Drop if: Work reaches main without a PR

## Problem

The plugin runs every feature through a merge gate it assigns to a code owner, a Release gate it assigns to a release owner, and under autonomy merges to main itself (F1, F2, F5). Teams have their own approval, merge and promotion rules (in some, QA tests the build in a lower environment before the merge promotes it), so the plugin's own rules either duplicate theirs or fight them (Arun, plugin owner, 2026-11-06).

## Users and jobs

- Person running a feature: when the agent finishes the work, I want a PR raised from a branch, so my team's usual review, merge and release process takes over.
- Team lead: when my org already has approval and release rules, I want the plugin to stay out of them, so nobody waits on a gate the plugin invented.

## Questions asked

- Q1: Who may approve a merge? A: AI SDLC should not define this; orgs have their own teams and policies in GitHub. Only make sure the AI agent uses a branch rather than main and always raises a PR. Keep it out of scope. (Arun, plugin owner, 2026-11-06)
- Q2: Is Release out of scope too? A: Yes. There is a difference between release and deployment: always target deploying continuously, but never release without proper sign-offs. (Arun, plugin owner, 2026-11-06)

## Current system

Full, light and hotfix lanes end at Release; Verify and Release wait for named people (F1, F2). A feature closes at its last stage and reads its outcome from release.md (F3, F4). Under autonomy the plugin merges to main (F5). Agents cannot push to main (F7).

## Assumptions

- A1: The hotfix lane ends at its PR like every other lane; the incident record and postmortem stay. [unconfirmed]
- A2: A @release criterion (one only the deployed build can show) is listed in the PR for a person to check after deploy, with no gate. [unconfirmed]
- A3: The outcome follow-up starts when the PR is raised, read from the PRD's outcome metric. [unconfirmed]

## Requirements

- R1. (must) A feature in any lane is complete once Verify passes its checks, with no stage after it. Needs: which stages each lane runs (F1).
- R2. (must) Verify passes on its checks, without waiting for a named approver. Needs: nothing new.
- R3. (must) The plugin offers no command that merges or pushes to main. Needs: nothing new (F7).
- R4. (must) A criterion tagged @release is not refused at Verify when the PR names it under "Check after deploy", and the review packet lists it there too. Needs: which criteria are tagged @release (F6).
- R5. (should) A feature with an outcome metric gets its follow-up owner and date when it completes. Needs: the PRD's outcome metric (F4).
- R6. (must) A Verify whose checks fail still stops with the reasons. Needs: nothing new.

## Non-functional requirements

- Performance: None, because it removes stages and a command.
- Security and privacy: R3
- Accessibility: None, because only command text changes.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never merge, push to main, deploy or release on anyone's behalf.
- Never name who must approve or merge a PR.

## Out of scope

- Deleting the now-unused release code, release.md template and release evals: a follow-up task after this slice.
- Stage names: slice stage-names (specs/gates-and-names/slices.md).

## Outcome metric

Metric: human stops before the PR in one gates-and-names dogfood slice
Baseline: 4 (the 2026-11-05 run, Arun)
Target: 0
Owner: Arun, plugin owner
Objective: a person is asked for a decision only at the PR (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept; a hotfix is still a PR, and the incident record is not a release step.
- A2: who: Arun. Recommend: accept; the deployed build is the org's, so the check is theirs.
- A3: who: Arun. Recommend: accept; the PR is the last thing the plugin sees.

## Changes since v1

- R4: Verify now needs the PR body to name each untested @release criterion under "Check after deploy", so the person reviewing the PR sees it; the packet alone is not in the PR (pre-review F2).
