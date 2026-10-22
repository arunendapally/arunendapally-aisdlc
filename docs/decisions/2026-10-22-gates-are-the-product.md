# Council: the gates are the product (answering docs/feedback.md)

*2026-10-22. Chaired by the CTO agent. Proposed decision in [ADR-0004](../adr/0004-gates-that-catch-real-failures.md).*

The feedback (`docs/feedback.md`, entry "the gates are the product, not the sequence") sets one test: a lifecycle that would not have caught the last three real failures is ceremony. It scored the old `skills/ai-sdlc` skill, which [ADR-0003](../adr/0003-simple-default-path.md) removed, so six experts scored the plugin as it stands on `claude/simplify`: agentic AI, safe AI SDLC, SRE, architect, tech lead and QA.

The three failures:
- **F1.** A permission denial retried about thirty times by a loop.
- **F2.** Context spent reading 3,700 lines and a 185KB schema before the authoritative implementation, so the design was wrong.
- **F3.** A feature deployed from an unmerged, unpushed branch, then erased by the next deploy from main.

## The score today

| Failure | Verdict | Why (all six agreed, and the CTO checked the code) |
|---|---|---|
| F1 | caught late, and the mod can cause it | The pre-tool hook denies and logs, but nothing reads the log back. The autopilot counts an edit before the tool runs (`register.tsx`, `tool.call`), so a denied edit counts as an edit and the loop runs on. Its retry cap counts red gates, never refusals. Its green path submits a new turn on every green gate, with no cap. |
| F2 | not caught | Facts are optional, accept any file as a source, and are checked after the reading is done. Nothing touches reading order or full-file reads. |
| F3 | caught only when an agent deploys | `deployPatterns` stops agent deploys. Release checks a `Tested:` line and any "ok" under Probes; it never looks at a commit, a branch or the remote. A human deploy from a branch passes. |

One of three caught, late. The headline holds: the gates are present, the content that catches these failures is not.

## Answers to the open questions

1. **F1 belongs in the hooks and the mod, not a stage.** A denial is an answer. Contract: every denial ends with a fixed line ("final answer, not an error: give the user the command once and stop"); the pre-tool hook counts denials per session by rule, not by command text, so a rephrase hits the same count; the second says "hand back now"; from the third, the hook refuses every non-read tool in that session until a human prompt arrives (the user-prompt hook resets the count). The mod counts an edit only after the tool succeeds, never submits a turn after a denial, skips an aborted turn, and only toasts on green.
2. **Yes, two rules.** `retryCap` (3) counts failed checks after a real change. `denialCap` (2) counts refusals and hands back. The agent rules and the skill state them separately.
3. **Reading order is a hook plus a gate check.** The pre-tool hook refuses a full read of a file over a configurable size (default 1,500 lines or 100KB) and its denial gives the exact sliced call, so it cannot cause F1. For brownfield and data work, `facts.md` must hold at least one fact marked `[governing]` whose source is implementation code, not docs, Markdown or a schema. A trap entry records it.
4. **Not yet.** No cheap, checkable cold-start test was found: a dedicated cold-start subagent costs a run per feature, and a self-reported "questions: 0" line is prose. Recorded as an agent eval to build (a fixture where the artefacts omit one fact), not a gate.
5. **The release rule:** the release commit must be on `origin/<protected branch>` (fetch, then `merge-base --is-ancestor`), in every lane with a release stage; and `## Probes` records `Live: <sha>` read from the running system, which must contain the release commit and still contain the previous release's. `Live: unknown` refuses. A branch deploy is a preview and never "shipped". An agent's preview deploy from an unpushed branch asks a human. `deployPatterns` widens to the deploy commands it misses (`vercel alias`, `netlify deploy --prod`, `fly deploy`, `firebase deploy`, `wrangler deploy`, `npm run deploy`).
6. **Three waits stay for now:** spec, merge, release. Spec is the one gate every expert called load-bearing. At solo scale merge and release are the same person, and the tech lead's proposal to collapse them is deferred: F3 shows the release wait was right and its content was wrong. Review-deadline nagging is the one solo ceremony to cut, and only when `gateOwners` is empty.
7. **Feedback becomes owed, not hoped for.** An escape (`bug --caused-by`) or a hotfix records a lesson owed against its source. It is paid by a `standards/traps.md` entry naming the source and a guard that is a check, not words (the test `retro.mjs` already applies). A lesson owed blocks that bug's merge gate and keeps the hotfix postmortem open. A feature with no escape owes nothing, which keeps ADR-0002's rejection of the churn rule. Escalations and repeated denials feed the retro, not a lesson.
8. **Per-agent justification** is recorded below. None is cut: `cto` is what `/ai-sdlc:start` runs as and routes several features at org scale; `agentic-ai-expert` maintains the plugin through `/ai-sdlc:retro`.
9. **"Which version is live" is the same mechanism as 5:** the last `Live: <sha>`, which `sdlc status` prints. The plugin's own version is a separate, org-only supply-chain question and none of the three failures turns on it.
10. **The gate score lives in the evals.** Each golden task names the failures it guards (`"catches": ["F3"]`), `evals/failures.json` lists the failures, and `npm run eval` fails when a failure has no passing task. F1 and F3 replay in a throwaway repo; F2's slice rule replays, its "authoritative first" half needs an agent eval.

## Contested points, and how the CTO settled them

**C1. What happens after the third denial?** Safe AI SDLC wanted the third denial to write `.ai-sdlc/PAUSED`; agentic AI wanted a hand-back only.
- *Settled:* neither. PAUSED stops every agent in the repo for one session's mistake. The session is held instead: non-read tools refused until a human types something.

**C2. Facts everywhere?** The architect proposed refusing any change to existing code without `facts.md`.
- *Settled:* no. Nearly every feature changes existing code, so it would undo ADR-0003. The `[governing]` fact applies to brownfield and data work, and triage tags brownfield.

**C3. `Live: <sha>` with no escape?** It blocks a team whose app does not expose its build.
- *Settled:* yes, no escape. F3 is the test; exposing a build id is one line in most stacks. The template says how.

**C4. Collapse merge and release at solo scale?** Tech lead for; safe AI SDLC against at org scale.
- *Settled:* deferred. Revisit once the F3 checks have run on real releases.

**C5. Drop `cto` and `agentic-ai-expert` from the roster?** Agentic AI proposed it.
- *Settled:* kept, justified above.

## Other calls

- **Postman is not mandated.** Keep "Teardown deletes what Setup made"; any API test tool will do (QA).
- **The worktree and no-commits-on-main rules stay.** They are safety and context guards, not coordination, and they did not cause F3 (tech lead, safe AI SDLC).
- **The PR stays at solo scale.** Pushing it is what puts a copy on the remote, half of F3 (tech lead).
- **Scripts that wrap a deploy.** New content of executable files and package scripts is checked against `deployPatterns`, and a match asks a human, because today a deploy inside a `.sh` file slips past (safe AI SDLC).

## Per-agent justification (question 8)

| Agent | Why it exists | Ground |
|---|---|---|
| product-owner | asks the questions that would change the PRD | role |
| architect | pins facts to the code; the F2 guard | role |
| design-reviewer | argues the second-best option | role, full lane |
| tech-lead | the reviewer is not the author | isolation |
| builder | one batch in its own worktree on a cheaper model | isolation |
| pre-reviewer | reviews from a fresh context | isolation |
| qa-engineer | tests written by someone other than the implementer | role and isolation |
| dba | expand-contract and backout | role, data kind |
| sre | tested rollback, live probes; the F3 rule | role |
| safe-ai-sdlc-expert | threats and permission boundaries | role |
| performance-engineer | measure before and after | role, perf kind |
| ux-designer | screens from real components | role |
| cto | triage and routing across features | isolation, org scale |
| agentic-ai-expert | maintains the plugin through the retro | role, plugin upkeep |
