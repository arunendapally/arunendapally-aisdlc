# Debate: plan, test, implement, review, verify, remember, improve

*2026-10-22. Chaired by the CTO agent. Decision recorded in [ADR-0002](../adr/0002-loop-spine.md).*

The founder proposed a seven-step loop as the spine of every lane: plan, test, implement, review, verify, remember, improve. The CTO asked eight experts to argue it in two rounds: product owner, architect, tech lead, QA, SRE, agentic AI, safe AI SDLC and project manager. In round 1 each took a position independently. In round 2, five of them (architect, tech lead, QA, SRE, project manager) answered a draft that resolved the contested points.

## Where they agreed in round 1

| Point | Who | Result |
|---|---|---|
| Two loops, not one: the stages stay as the outer loop per feature; a fast inner loop runs per slice inside Build (test, implement, gate, retry) | architect, agentic AI, tech lead | Adopted |
| Machine verification before human review, at every scale; a reviewer's queue costs hours, the gate costs minutes | tech lead, architect, agentic AI, project manager, QA | Adopted: the founder's order holds inside a slice only where the tech lead reviews a batch |
| Prove the tests by evidence, not by ordering: an order rule ("red before code") is easy to game and breaks on UI work | QA, tech lead | Adopted, as the test proof |
| Remember gates on staleness, not on churn: "traps.md or the changelog must change" rewards filler and enlarges the poisoning surface | security, SRE, project manager, product owner, architect, QA, agentic AI | Adopted: the churn rule is dropped |
| Improve is out-of-band: a periodic and triggered retro that only opens PRs, never a per-change step, never changing a running lane's rules | all eight | Adopted |
| A step is missing: release and observe; a feature is done when its outcome is measured, not when it merges | SRE, product owner | Adopted, without blocking flow |
| Security lives inside every step; knowledge carries provenance and is data, never instructions | security | Adopted |

## The three contested points, and how round 2 settled them

**C1. Is "remember" a blocking gate?** Architect and QA wanted Release to fail on stale knowledge. The project manager and product owner wanted a tracked follow-up so docs never block a ship.
- *Settled:* split it.
  - **Blocking at Release:** no stale knowledge page or fact whose sources the change touched (C4 files count as sources), no contradicted ADR left unmarked as superseded (architect), and no postmortem action without a link to a trap, test or PRD (SRE).
  - **No new human wait** (project manager): an agent re-verifies stale pages before the existing human review.
  - **Non-blocking:** the outcome read, and anything learned after release, goes to a follow-up with an owner taken from the PRD's metric section (tech lead).

**C2. How do we prove the tests came first?** The first draft counted only assertion failures as red. The architect, tech lead and QA all showed this rejects good tests for new code, which fail on import against the base branch.
- *Settled:* `sdlc proof` runs only the traced tests, via a `proofCommand` with a `{files}` placeholder. It runs in a git worktree of the merge-base, with the new and changed test files copied in, and takes seconds (tech lead).
- A test counts as red if the runner reports it failed or errored there. Only "no tests collected" is rejected.
- The test files' hashes at the proof must match the final green run, so nobody can weaken a test between red and green (QA).
- **Not set up:** without a `proofCommand`, the step warns and the PR records "proof not run" under Not verified (tech lead).
- **Hotfix:** the proof runs after the merge, and a failure blocks the postmortem rather than the production fix (project manager).
- **Spikes:** a slice tagged spike may skip the inner-loop red run, but never the proof. Spike code merges only when a non-spike slice replaces it (architect).
- The CTO chose this over parsing each runner's failure types. QA's JUnit approach was sound but heavier, and an import failure on new code already proves the test depends on the change.

**C3. Release and observe as its own step?** SRE wanted a feature to count as done only once its outcome was green after a watch window. The project manager warned that would hold features open.
- *Settled:* the feature closes at release. Its outcome follow-up is tracked as its own flow number, so "closed but not done" cannot hide (project manager).
- **Blocking at Release:** the rollout plan, a tested rollback and probe results (SRE).
- The plan names the outcome metric and the watch window N; each lane sets a default N (architect, QA, project manager).
- When the error budget is spent, the freeze stops new feature work in both the full and light lanes; bug, hotfix and reliability tasks stay open (SRE).
- **Overruled:** SRE asked for a breach during the watch window to open a hotfix automatically. The CTO kept the rule that only a human declares a hotfix: a breach raises an alert and notifies the incident commander instead.

## Cuts

- The "traps.md or changelog must change" check (seven experts).
- Improve as a per-change step (all eight).
- The review-and-verify ordering argument at the stage level: the code already runs the gate before review, which is the right order (architect, tech lead).
