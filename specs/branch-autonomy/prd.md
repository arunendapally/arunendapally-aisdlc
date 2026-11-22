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

## Current system

Define and Design wait for a named person; only Build and Verify pass on checks (F1, F2). Repo-wide autonomy is the one way around the waits (F4). The plugin no longer merges (F5), and agents cannot push to main (F6).

## Assumptions

- A1: The checks each gate runs today are strong enough to stand in for the person at Plan and Design when a PR review follows. [unconfirmed]
- A2: Release stays a human decision, since a release is not reviewed in the PR. [unconfirmed]
- A3: A person still answers the intent question before Plan, since the checks cannot judge intent. [unconfirmed]

## Requirements

- R1. (must) Work on a feature branch passes the Plan gate on its checks, with no person asked, unless the repo names a person for Plan or a person already sent it back. Needs: which branch the work is on (F7).
- R2. (must) Work on a feature branch in the full lane passes the Design gate on its checks, with no person asked, unless the repo names a person for Design, a person already sent it back, or the change touches stored data or security. Needs: which branch the work is on (F7).
- R3. (must) The plugin never merges or pushes to main; the PR review is the org's. Needs: nothing new (F6).
- R4. (must) A spec or design edited after it passed on checks sends the work back to that gate, as it does after a person approves. Needs: what was checked when it passed (F3).
- R5. (must) A gate that fails its checks on a branch stops with the reasons and is not passed by anyone else. Needs: nothing new.
- R6. (should) The PR shows, for each gate that passed on checks, that it passed on checks and when. Needs: when each gate passed and by what (F3).

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
- Removing repo-wide autonomy: kept as it is.
- Release: the plugin stops at a raised PR (ADR-0008).

## Outcome metric

Metric: human stops before the PR in one gates-and-names dogfood slice
Baseline: 4 (the 2026-11-05 run, Arun)
Target: 0
Owner: Arun, plugin owner
Objective: a person is asked for a decision only at the PR (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept, and read the first three PRs for anything a Plan or Design person would have caught.
- A2: settled by ADR-0008: Release is not the plugin's (R7 removed).
- A3: who: Arun. Recommend: keep the intent question; it is the one input checks cannot make up.

## Changes since v1

- Removed the constraint "ADR-0005 is superseded": it was the agent's triage note, not a person's, and the design review found nothing in ADR-0005 changes (ADR-0007 Review Q2, Q15).
- R1 and R2 name when a person keeps the gate: a named gate owner, a person's send-back, and for Design, data or security work (ADR-0007 Review Q1, Q6, Q7, Q13).

## Changes since v2

- R3 now says the plugin never merges or pushes to main and the PR review is the org's: main's ADR-0008 ends every lane at Verify, which passes on its checks, and removes the merge command.
- R7 is removed: Release is out of scope under ADR-0008. AC-7 goes with it; nothing is renumbered.
- Stage 1 is now named Define (#56); "Plan" in R1, R4 and AC-1, AC-4, AC-5 means Define.
- Current system restated after main's ADR-0008: Verify passes on checks and there is no merge command (F1, F5 re-pinned).
