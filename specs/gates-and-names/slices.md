# Slices: gates-and-names

## Outcome

A small team gets from an idea to a raised PR with people deciding only at the intent and the PR: 0 human stops before the PR in a dogfood run, down from 4 in the 2026-11-05 run (Arun, plugin owner).

## Slices

- branch-autonomy: work on a feature branch runs on its checks until the PR, and the PR review is the one human gate. Horizon: now. Kind: slice. Goes live: compatible. Depends on: none. Status: started
- merge-is-hand-check: the PR body no longer needs a "Checked by hand" line, because the merge review is the hand check. Horizon: now. Kind: slice. Goes live: compatible. Depends on: none. Status: started
- stop-at-pr: the plugin's work ends at a raised PR from a branch; approval, merge, deploy and release are the org's own process. Horizon: now. Kind: slice. Goes live: compatible. Depends on: none. Status: shipped
- stage-names: every stage has a name (Plan, Define, Design, Build, Verify) with its input, processing and output, and the technical how lives in design.md. Horizon: now. Kind: slice. Goes live: compatible. Depends on: stop-at-pr. Status: started
- definition-of-done: each stage's document ends with a Definition of done checklist, and a stage is ready only when the previous stage's checklist is complete. Horizon: now. Kind: slice. Goes live: compatible. Depends on: stage-names. Status: planned
- plan-roadmap: Plan writes a roadmap (now, next, later) of slices with enablers first, tasks.md lists one ticket per repo, and every PR can go live on its own. Horizon: now. Kind: slice. Goes live: compatible. Depends on: stage-names. Status: started
- decision-log: decisions about what (from meetings, emails and chats) go in a decision log, and decisions about how stay in ADRs. Horizon: next. Kind: slice. Goes live: compatible. Depends on: stage-names. Status: planned
- trace-index: a generated index traces each requirement to its scenarios, tests, ADRs and decisions, and back. Horizon: later. Kind: slice. Goes live: after decision-log, because it indexes the decisions the log records. Depends on: decision-log. Status: planned
- test-lock: tests proven red are locked against the builder, and a test that conflicts with the spec is escalated, not edited. Horizon: next. Kind: slice. Goes live: compatible. Depends on: none. Status: planned
