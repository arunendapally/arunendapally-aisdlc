# ADR-0004: Gates that catch the real failures

Status: accepted
Date: 2026-10-22

## Context

Feedback in `docs/feedback.md` sets the test: a lifecycle that would not have caught the last three real failures is ceremony. The failures: a denial retried about thirty times (F1), a design built before reading the authoritative implementation (F2), and a branch deploy erased by the next deploy from main (F3). Six experts scored the plugin after ADR-0003: F1 caught late (and the autopilot can cause it), F2 not caught, F3 caught only when an agent deploys. The record is in [docs/decisions/2026-10-22-gates-are-the-product.md](../decisions/2026-10-22-gates-are-the-product.md).

## Options

- **Add the missing content to the existing gates and hooks:** a denial contract in the hooks and the mod, a reading-order hook and a governing fact, a release check on the remote and the live build, lessons owed after escapes, and evals that score each failure. Might lose because it adds checks right after ADR-0003 removed many.
- **Write the three lessons into `standards/traps.md` only:** cheap. Loses because a trap in prose is the feedback path existing as a sentence, which is what the feedback criticises.
- **Do nothing until a fourth failure:** loses the test the feedback set.

## Decision

Add the missing content to the existing gates and hooks. Every addition must catch one of the three failures or one like it, and fail loudly.

- **F1:** a denial is an answer. Fixed hand-back text on every denial; a per-session count by rule (`denialCap`, 2), after which non-read tools are refused until a human prompt; the autopilot counts an edit only after the tool succeeds, never submits after a denial or an abort, and only toasts on green. `retryCap` and `denialCap` are separate rules.
- **F2:** the pre-tool hook refuses a full read of a large file with the exact sliced call; brownfield and data facts need one `[governing]` fact pinned to implementation code.
- **F3:** Release refuses unless the release commit is on `origin/<protected branch>`, and unless `## Probes` records `Live: <sha>` read from the running system that contains it and the previous release. An agent's preview deploy from an unpushed branch asks a human. `deployPatterns` widens, and deploy commands written into scripts ask a human.
- **The loop with memory:** an escape or a hotfix records a lesson owed, paid by a trap with an enforced guard; it blocks that bug's merge and keeps the postmortem open.
- **The score is checkable:** golden tasks name the failures they catch, and `npm run eval` fails when a failure has none.

## Consequences

- Good: each of the three failures has a check that would have stopped it, and an eval that proves it.
- Downside: teams must expose their build id so `Live:` can be read; until then Release refuses.
- Downside: large-file reads are refused, so agents and people must slice; the threshold is configurable.
- Risk: the denial count keys on the rule that fired; a different guard catching the same intent counts separately.

## Review

Six experts, one round; the CTO settled five contested points. See the decision record.
