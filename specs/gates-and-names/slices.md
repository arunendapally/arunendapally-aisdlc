# Slices: gates-and-names

## Outcome

A small team gets from an idea to a raised PR with people deciding only at the intent and the PR: 0 human stops before the PR in a dogfood run, down from 4 in the 2026-11-05 run (Arun, plugin owner).

## Slices

- branch-autonomy: work on a feature branch runs on its checks until the PR, and the PR review is the one human gate. Depends on: none. Status: started
- merge-is-hand-check: the PR body no longer needs a "Checked by hand" line, because the merge review is the hand check. Depends on: none. Status: started
- stop-at-pr: the plugin's work ends at a raised PR from a branch; approval, merge, deploy and release are the org's own process. Depends on: none. Status: shipped
- stage-names: every stage has a name (Plan, Define, Design, Build, Verify) with its input, processing and output, and the technical how lives in design.md. Depends on: stop-at-pr. Status: started
- definition-of-done: each stage's document ends with a Definition of done checklist, and a stage is ready only when the previous stage's checklist is complete. Depends on: stage-names. Status: planned
- plan-roadmap: Plan writes a roadmap (now, next, later) of slices with enablers first, tasks.md lists one ticket per repo, and every PR can go live on its own. Depends on: stage-names. Status: planned
- capability-overview: a capability has one architecture overview beside its slices, with C4 Level 1 and a decision log of what was agreed after the PRD (who, when, source). Depends on: stage-names. Status: started
- change-request: once Build has started and the spec must change, the person is asked whether it is a change request or an amendment, with why a change request is often better and how the effort changes. Depends on: capability-overview. Status: planned
- trace-index: a generated index traces each requirement to its scenarios, tests, ADRs and decisions, and back. Depends on: capability-overview. Status: planned
- test-lock: tests proven red are locked against the builder, and a test that conflicts with the spec is escalated, not edited. Depends on: none. Status: started
