# PRD: test-lock

Capability: gates-and-names (specs/gates-and-names/slices.md)

## Intent

- Change: Tests proven red are locked against the builder, and a test that conflicts with the spec is escalated, not edited
- Smallest: An agent's edit to a proved test is refused, and the only way to change it is a conflict a person settles
- Drop if: Builders stall on locked tests that were simply wrong, more often than they game them

## Problem

An agent that cannot make a test pass can edit the test and run the proof again, and nothing asks why (F2). In a 2025 benchmark where tests contradicted the spec, a leading model cheated on 54 to 76% of tasks, mostly by editing the tests; giving it a sanctioned "flag for a person" outcome cut cheating from 54% to 9% (ImpossibleBench, in reports/AI SDLC stages and decision records.md). The plugin has no such outcome (facts Not found).

## Users and jobs

- Person reviewing the PR: when the tests pass, I want to know the tests are the ones that were proven against the spec, so a green suite means the behaviour, not an edited test.
- Builder agent: when a test contradicts the spec, I want a way to say so that counts as an answer, so I stop instead of bending the test.

## Questions asked

- Q1: Which research recommendations should the plugin take? A: Arun accepted the re-sliced capability, which includes test-lock: tests proven red are locked against the builder, and a conflicting test is escalated, not edited. (Arun, plugin owner, 2026-11-06)

## Current system

The proof records each test file's hash (F1); a changed test only asks for the proof again (F2). The guard is advisory in bypass mode (F3). Spec drift is detected (F4).

## Assumptions

- A1: In bypass mode the guard only audits the edit (ADR-0006); the proof refusal still stops it. [unconfirmed]
- A2: A spec change unlocks the feature's tests, since the tests must follow the new spec. [unconfirmed]

## Requirements

- R1. (must) After the proof, an agent's edit to a test file the proof recorded is refused, naming the file and how to raise a conflict. Needs: which test files the proof recorded (F1).
- R2. (must) A test changed after the proof cannot be proved again until a person settles a raised conflict or the spec changes. Needs: which conflicts were raised and settled.
- R3. (must) An agent can raise "this test conflicts with the spec" for a criterion, with a reason, and the feature then waits for a person. Needs: nothing new.
- R4. (must) Raising a conflict counts as an answer, not as a failed check against the retry cap. Needs: nothing new.
- R5. (must) A spec change unlocks the feature's tests. Needs: when the spec changed (F4).

## Non-functional requirements

- Performance: None, because the guard checks a short list of file hashes.
- Security and privacy: R1
- Accessibility: None, because only command text changes.
- Limits and quotas: None, because no new input or call is added.

## Never

- Never let an agent settle its own conflict.
- Never call a test locked when the guard only audited the edit.

## Out of scope

- Locking tests before any code is written (a red-first proof at the start of Build): a later slice.
- Mutation testing and held-out examples: a later slice.

## Outcome metric

Metric: test files changed after the proof in dogfood PRs
Baseline: none counted today; the first read sets it
Target: 0 without a settled conflict
Owner: Arun, plugin owner
Objective: a green suite means the spec's behaviour (specs/gates-and-names/slices.md)

## Open questions

- A1: who: Arun. Recommend: accept; bypass mode was his call (ADR-0006).
- A2: who: Arun. Recommend: accept.
