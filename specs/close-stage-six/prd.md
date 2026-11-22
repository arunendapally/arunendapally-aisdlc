# PRD: close-stage-six

## Intent

- Change: features left at stage 6 (Release) by an older plugin complete, and the release evals that test the removed Release check go (ADR-0008)
- Smallest: the next request or advance on such a feature completes it
- Drop if: no repo holds a feature at stage 6 (this repo holds nine: specs/*/state.json read on 2026-11-07)

## Problem

ADR-0008 ended every lane at Verify, but a feature an older plugin moved to Release still waits there for a Release check nobody runs any more (F1, F4). This repo holds nine such features (specs/*/state.json read on 2026-11-07). Until they complete, the Release code stays reachable and cannot be removed.

## Users and jobs

- Plugin user: when a feature of mine sits at Release from an older plugin, I want it to complete, so status shows the truth and the old release step stops asking for things.

## Questions asked

- Q1: Should a feature at stage 6 complete, with its outcome follow-up? A: Yes, on its next request or advance, as at Verify. (coordinator, on the owner's ADR-0008)

## Assumptions

- A1: Only state written by an older plugin can be at stage 6, since no lane runs it. [confirmed: F1]

## Requirements

- R1. (must) A feature left at Release completes the next time it is requested, with no release checks. Needs: the stage the feature is at (F1).
- R2. (must) A feature left at Release completes the next time it is advanced, with no approval. Needs: the stage the feature is at (F1).
- R3. (must) Completing such a feature opens its outcome follow-up from its PRD, and status then shows it complete. Needs: the PRD's outcome metric (F3).
- R4. (must) A feature at Verify whose checks fail still stops with the reasons. Needs: nothing new.

## Non-functional requirements

- Performance: None, because completing reads one state file and one PRD, as at Verify (F3).
- Security and privacy: None, because no stage that people approve changes: Verify passes on checks already (F1).
- Accessibility: None, because this is command output only.
- Limits and quotas: None, because nothing new is stored or counted.

## Never

- Never send a feature at stage 6 back to an earlier stage.
- Never complete a feature at Define, Design, Build or Verify without its checks.

## Out of scope

- Removing the unused Release code, template and docs: the next task, remove-release.

## Outcome metric

Metric: None, because this closes old state once; success is the nine features in this repo showing complete in sdlc status.

## Open questions

None, because every assumption is confirmed and every question answered.

## Current system

A feature completes when its lane has no next stage (F2), which opens its outcome follow-up from the PRD (F3). No lane runs stage 6 (F1), and the Release check (F4) runs only for a feature already at stage 6.
