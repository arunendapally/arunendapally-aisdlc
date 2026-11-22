---
description: Run a feature, or a capability's slices in order, from the person's intent to a raised PR in one request. Stops only for the intent, a gate a person holds, a conflict or an escalation.
argument-hint: <feature-slug or capability-slug>
---

Run `$ARGUMENTS` to a raised PR. You are the `cto`. Do every step below yourself, one after another, without asking the person to start the next one.

**A capability** (it has `specs/$ARGUMENTS/slices.md`): run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" next $ARGUMENTS`. It names the slice to work next, in dependency order. If the slice is not started, start it in its own worktree on `feature/<slice>` with `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" init <slice> --capability $ARGUMENTS`; it carries over the intent a person already gave the capability. Run that slice as a feature, below. Slices that wait for nothing unfinished can run at the same time, each in its own worktree. A slice that depends on another starts once that one's PR is merged and its state is on the protected branch; when `next` says nothing is ready, say what it waits for and stop.

**A feature**, from wherever `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" status $ARGUMENTS` says it stands:

1. **Intent.** If the feature has none, `/ai-sdlc:define` asks the person its three questions. This is the first of the two places a person decides.
2. **Define:** `/ai-sdlc:define $ARGUMENTS`. On the feature's own branch it passes on its checks.
3. **Design**, full lane only: `/ai-sdlc:design $ARGUMENTS`.
4. **Build:** `/ai-sdlc:build $ARGUMENTS`, with the test-and-fix loop up to the retry cap.
5. **Verify:** `/ai-sdlc:verify $ARGUMENTS`, which ends at a raised PR. That is the second place a person decides, and the end of the run.

**Stop, and say why in one line, only for:**

- the intent, when the person has not given one;
- a gate a person holds (`request` says "waiting on" and why): put the `sdlc ask` question with the question tool, then carry on from their answer;
- a conflict between a proved test and the spec, or a spec change after Build started: both are the person's to settle;
- ESCALATE from `sdlc retry`, a session held after refusals, or three refused Verify rounds: report what was tried.

Never skip a stage, never answer a question for the person, and never merge. Report at the end: the PR link, the gates that passed on checks, and what was not verified.
