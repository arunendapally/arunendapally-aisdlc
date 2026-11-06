# Slices: gates-and-names

## Outcome

A person running a feature is asked for a decision only at the pull request: 0 human stops before the PR in a dogfood run, down from 4 in the 2026-11-05 run (Arun, plugin owner).

## Slices

- branch-autonomy: work on a feature branch runs plan to verify on its checks, and the PR review is the one human gate. Depends on: none. Status: started
- merge-is-hand-check: the PR body no longer needs a "Checked by hand" line, because the merge review is the hand check. Depends on: none. Status: started
- design-rename: the technical how lives in design.md, and Stage 1 has a name that says what it is. Depends on: none. Status: planned
- plan-roadmap: plan.md is a roadmap (now, next, later, enablers, contract first) and the architecture overview carries C4 Level 1. Depends on: design-rename. Status: planned
