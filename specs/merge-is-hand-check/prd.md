# PRD: merge-is-hand-check

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: Merging the PR itself is like checked by hand; no "Checked by hand" line to write
- Smallest: Verify passes a PR with a @manual criterion and no "Checked by hand" line
- Drop if: A criterion meant for a person reaches main with nobody having looked at it

## Problem

A PR whose spec has a criterion only a person can check (tagged @manual) is refused at Verify until its body carries a line "Checked by hand: AC-n, who, date, how, pass" (F1, F2). The agent writes the PR body, so it either stops to ask a person to fill the line in or writes it itself, which the person then reads again at the merge; Arun asked where that line is even written, and said merging the PR already says it was checked by hand (Arun, plugin owner, 2026-11-05).

## Users and jobs

- Person reviewing the PR: when a criterion has no test because only a person can check it, I want to be told which one before I merge, so I can check it as part of my review.
- Person running a feature: when the work reaches the PR, I want no line to write for checks I will do at the merge anyway, so I review once.

## Questions asked

- Q1: Where is "Checked by hand" written, and is it needed? A: I do not know where we write that line; merging the PR itself is like checked by hand, it infers that it is checked by hand. (Arun, plugin owner, 2026-11-05)

## Current system

Verify refuses a PR when a @manual criterion with no test has no valid "Checked by hand" line under "## Test results" (F1, F2). The review packet already lists criteria with no test, with "by hand: judge whether a test was possible" for @manual ones (F3).

## Assumptions

- A1: The person who merges reads the review packet's list of criteria to check by hand before merging. [unconfirmed]
- A2: Nothing else reads the "Checked by hand" line, so dropping it loses no record a later stage needs (F4). [unconfirmed]

## Requirements

- R1. (must) A PR whose only untested criteria are tagged @manual passes the Verify checks with no "Checked by hand" line in its body. Needs: which criteria are tagged @manual (F3).
- R2. (must) The person reviewing the PR sees each @manual criterion with no test under its own heading, saying a person checks it before merging. Needs: which criteria are tagged @manual (F3).
- R3. (must) A criterion with no test that is neither @manual nor @release is still refused at Verify. Needs: nothing new.

## Non-functional requirements

- Performance: None, because it removes a check and reformats a list.
- Security and privacy: None, because no data, permission or input changes.
- Accessibility: None, because only command and packet text changes.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never say a criterion was checked by hand when no person merged the PR.
- Never let an untested criterion that is not @manual or @release through Verify.

## Out of scope

- Who approves gates before the PR: slice branch-autonomy (PR #51).
- Recording the merge as the hand check in a release record: not planned; the merge is on GitHub.

## Outcome metric

Metric: human stops before the PR in one gates-and-names dogfood slice
Baseline: 4 (the 2026-11-05 run, Arun)
Target: 0
Owner: Arun, plugin owner
Objective: a person is asked for a decision only at the PR (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept; R2 puts the list under its own heading in the packet the reviewer reads first.
- A2: who: Arun. Recommend: accept; F4 shows nothing else reads the line.
