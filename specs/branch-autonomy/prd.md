# PRD: branch-autonomy

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

<!-- Typed by Arun Endapally on 2026-11-06. Only a person changes it: sdlc intent <feature> change: ...; smallest: ...; drop if: ... -->

- Change: Branch runs on its own
- Smallest: Gates pass on checks
- Drop if: Bad PRs reach review

## Problem

A person running a feature on its own branch is stopped at every gate before the pull request, then reviews the same work again in the PR: the 2026-11-05 dogfood run stopped 4 times before any PR existed (Arun, plugin owner). The only way to skip those stops today is repo-wide autonomy, which also lets the agent merge to main without the PR review (F4, F5).

## Users and jobs

- Person running a feature: when work is on a feature branch that will end in a PR, I want it to run on its own until the PR, so I can step away and come back to review the PR.
- PR reviewer: when a PR arrives, I want to see what each skipped gate checked, so I can judge the work in one review.

## Questions asked

- Q1: What should change, what is the smallest proof, and what would make us drop it? A: Branch runs on its own; gates pass on checks; drop if bad PRs reach review. (Arun, plugin owner, 2026-11-06)
- Q2: Why not keep the gates before the PR? A: Work on a branch always ends in a PR, and the person reviews the PR anyway, so the earlier stops add nothing. (Arun, plugin owner, 2026-11-05)

## Constraints

- The PR review stays the human gate; nothing reaches main without it. (Arun, plugin owner)
- ADR-0005 is superseded by this feature's design. (CTO triage, 2026-11-05)

## Current system

Plan and Design wait for a named person; only Build passes on checks (F1, F2). Repo-wide autonomy is the one way around the waits, and it also merges to main (F4, F5). Agents already cannot push to main (F6).

## Assumptions

- A1: The checks each gate runs today are strong enough to stand in for the person at Plan and Design when a PR review follows. [unconfirmed]
- A2: Release stays a human decision, since a release is not reviewed in the PR. [unconfirmed]
- A3: A person still answers the intent question before Plan, since the checks cannot judge intent. [unconfirmed]

## Requirements

- R1. (must) Work on a feature branch passes the Plan gate on its checks, with no person asked. Needs: which branch the work is on (F7).
- R2. (must) Work on a feature branch in the full lane passes the Design gate on its checks, with no person asked. Needs: which branch the work is on (F7).
- R3. (must) The merge gate still waits for a person, so nothing reaches main without the PR review. Needs: nothing new (F6).
- R4. (must) A spec or design edited after it passed on checks sends the work back to that gate, as it does after a person approves. Needs: what was checked when it passed (F3).
- R5. (must) A gate that fails its checks on a branch stops with the reasons and is not passed by anyone else. Needs: nothing new.
- R6. (should) The PR shows, for each gate that passed on checks, that it passed on checks and when. Needs: when each gate passed and by what (F3).
- R7. (must) Release still waits for its owner. Needs: nothing new.

## Non-functional requirements

- Performance: None, because passing a gate on checks runs the same checks a person's request runs today.
- Security and privacy: R3
- Accessibility: None, because this changes command output only, read the same way as today.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never say a person approved a gate that passed on checks.
- Never merge or push to main without a person's PR review.
- Never pass a gate whose checks failed.

## Out of scope

- The "Checked by hand" line in the PR body: slice merge-is-hand-check (specs/gates-and-names/slices.md).
- Renaming plan.md and Stage 1: slices design-rename and plan-roadmap.
- Removing repo-wide autonomy: kept as it is for anyone who wants agents to merge.

## Outcome metric

Metric: human stops before the PR in one gates-and-names dogfood slice
Baseline: 4 (the 2026-11-05 run, Arun)
Target: 0
Owner: Arun, plugin owner
Objective: a person is asked for a decision only at the PR (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept, and read the first three PRs for anything a Plan or Design person would have caught.
- A2: who: Arun. Recommend: keep Release human (R7).
- A3: who: Arun. Recommend: keep the intent question; it is the one input checks cannot make up.
