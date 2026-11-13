## Summary

Runs need a person only at the intent and the PR: reads are not refused as a person's action, setup sets the checks, the proof is required, and one request runs a feature or a capability's slices.
A command that only reads is no longer refused for naming a person's command, and its refusals do not count towards the hold. `sdlc init-repo` sets the gate and proof checks from what a new repo holds and proposes them for an existing one. Verify refuses a full or light feature with no proof check unless a person waived it (`proofWaived`). `sdlc next <capability>`, a carried-over capability intent and `/ai-sdlc:run` take work from the intent to the PR. The first-read messages and docs say a person decides at the intent and the PR.
Spec: specs/unattended-runs/prd.md (R1 to R8). Not in this PR: other agents (Copilot, Gemini), the autonomy levels file, a rewrite of the README article.

## Test results

Suite: 331 passed, 0 failed (baseline 319), from "sdlc gate unattended-runs"
Golden evals: 29 of 29 pass, from "npm run eval"
New tests: tests/unattended-runs.test.mjs (AC-1 to AC-11); 11 of its 12 tests failed before the change, AC-3 passed because it pins behaviour that must not change
Changed test support: tests/helpers.mjs gives every test repo a proof waiver, so existing Verify tests keep their meaning
Removed, skipped or quarantined: none

## Pre-review

## Not verified

- The test proof on the base commit: this repo has no proof check yet (see the note to the reviewer below).
- `/ai-sdlc:run` has not been run end to end by an agent; AC-7 checks only what the command says.
- Agent evals (`npm run eval:agents`) were not run; they cost tokens and no agent prompt changed.
- The guard change was not tried in a live session: the session's hooks come from the installed plugin, not this branch.
- Stack detection for Go and .NET has no test; only Node and Python are covered (AC-4).
- `sdlc next` reads slice states in the current checkout, so a slice finished on an unmerged branch reads as not complete.

## Definition of done

- [ ] Pre-review has no open findings
- [x] Not verified is honest
- [ ] PR raised from the feature branch
