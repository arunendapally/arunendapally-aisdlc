# How we run the AI SDLC: humans and agents, one process

*October 2026. Agreed by the CTO agent with its expert agents, reviewed twice by the security and tech-lead agents. Packaged as the `ai-sdlc` Claude Code plugin and the `ai-sdlc-autopilot` mod in this repo, so every team runs it the same way.*

**Goal:** humans and autonomous agents build our software in a way that is simple, integrated, fast, high quality and secure, and agents need less steering every month.

**In one sentence:** every piece of work is triaged into the lightest lane that is still safe; agents do the work, test it and fix it in a loop; a named human decides at the few gates that matter; and everything learned is written down so the next piece of work starts smarter.

**Kept simple on purpose** ([ADR-0003](adr/0003-simple-default-path.md)): a feature waits on a human three times (the spec, the merge, the release) and a bug once. A small safety core is mandatory everywhere; every other step is optional until the risk switches it on.

---

## 1. Who is in the room

The CTO agent convenes the experts, triages work, settles disagreements in writing, and never writes code. Each expert is a subagent in `agents/`.

| Role | Agent | Model | Leads |
|---|---|---|---|
| CTO | `cto` | opus | triage, the process, cross-area decisions, slicing and flow |
| Product owner | `product-owner` | opus | Plan: asks first, then writes the PRD |
| UI/UX designer | `ux-designer` | opus | journeys, placement, screens, accessibility |
| Architect | `architect` | opus | facts, Design, ADRs, contracts, the C4 model, learning tasks |
| Design reviewer | `design-reviewer` | opus | cross-questioning each ADR with another discipline |
| Tech lead | `tech-lead` | opus | Build, Verify, bugs, tasks |
| Builder | `builder` | sonnet | implementing batches |
| Pre-reviewer | `pre-reviewer` | opus | reviewing every PR before a human does, with expert lenses |
| QA engineer | `qa-engineer` | sonnet | the acceptance criteria and the tests that prove them, with data setup and teardown |
| Performance engineer | `performance-engineer` | opus | budgets, benchmarks before and after |
| DBA | `dba` | opus | data impact, migrations, rehearsal |
| SRE | `sre` | opus | SLOs, release safety, probes, incidents, environments, cost |
| Safe AI SDLC | `safe-ai-sdlc-expert` | opus | threat model, security findings, governance |
| Agentic AI | `agentic-ai-expert` | opus | orchestration, agent definitions, models, tools, evals |

The strongest model sits where judgement is scarce (review, architecture, security, data, reliability). A cheaper model does well-specified work.

---

## 2. Every kind of work has a route

Start anything with `/ai-sdlc:start <what you want>`. The CTO reads the code and the knowledge base, triages in five lines (what, who, how urgent, how big, how risky), and routes:

| The work | Route | Human gates |
|---|---|---|
| Production is broken now | a human types `sdlc hotfix <slug> <what is broken>`, then `/ai-sdlc:hotfix` | merge, release |
| A bug: wrong behaviour today, no dependency, schema or infra change | `/ai-sdlc:bug` (with `--kind perf` for slowness) | merge |
| A small chore users will not notice: bump, config, refactor, docs | `/ai-sdlc:task` | merge |
| A question, or someone needs to become an SME | `/ai-sdlc:learn` | none: it writes knowledge only |
| New behaviour | a feature in the light lane | spec, merge, release |
| A migration that alters or drops data, a high-risk path, a new datastore, dependency or service | a feature in the full lane | spec, design, merge, release |
| A big capability | split into slices first, one feature and one small PR per slice | per slice |
| Not worth doing | say why and stop | none |

**Kinds** add what that kind of work needs to whatever lane it runs in, and they stack (`--kind brownfield,perf`):

| Kind | Adds |
|---|---|
| brownfield | the current system in the PRD, facts pinned to the code, characterisation tests before changing behaviour |
| perf | a performance budget, a benchmark before, the same benchmark after |
| api | the API changes in the PRD and an OpenAPI contract; breaking changes must be declared |
| data | data impact and facts, a down migration, the DBA on the PR; in the full lane also an expand-contract plan, a rehearsal and a backout |

A change to migrations or SQL that is not marked as data work cannot pass its gate. Agents may add a kind but never remove one.

---

## 3. Lanes: the lightest process that is still safe

| Lane | Stages | Documents | Human gates | PR limit | Review deadline |
|---|---|---|---|---|---|
| light | Plan, Build, Verify, Release | prd + acceptance.feature, tasks, pr + review, release | 3: spec, merge, release | 300 lines | 8h |
| full | Plan, Design, Build, Verify, Release | as light, plus plan and ADRs | 4: spec, design, merge, release | 400 | 24h |
| bug | Build, Verify | `bug.md` (also the PR body) | 1: merge | 200 | 8h |
| task | Build, Verify | `task.md` (also the PR body) | 1: merge | 200 | 8h |
| hotfix | Build, Verify, Release | `hotfix.md` (also the PR body) | 2: merge, release | 100 | 1h |

- Features start in the light lane. Triage starts one in the full lane (`init <slug> --full`) for a migration that alters or drops data, a high-risk path, or a new datastore, dependency or service. Only a human moves a feature to light, or declares a hotfix.
- In the light lane, Build refuses a destructive migration or a high-risk path. A human types `sdlc lane <feature> full`, and the feature goes back to Design.
- Build passes on checks in every lane: the gate is green at or above the baseline, the diff is under the limit, and for a bug the repro failed first.
- A bug fix cannot touch dependencies, schema, CI or infrastructure; the hook refuses. A hotfix can, with the on-call engineer's yes.
- After a hotfix ships, a postmortem is due within two days; session start and status flag it until it exists.
- `sdlc freeze` (error budget spent) stops new features and suspends every earned promotion until `sdlc unfreeze`. Bug, hotfix and task work stays open.

The templates are in `skills/org-ai-sdlc/templates/`; each lists its optional sections at the bottom.

---

## 4. Review wait: the bottleneck we design against

Agents write code faster than people can review it, so the process spends human attention only where it changes the outcome.

- **Small PRs.** `sdlc request` and the `pr-size` CI check refuse a PR over its lane's limit, not counting specs, docs, lock files and snapshots. A big feature ships as one PR per slice. Only a human can add the `size-exception` label.
- **Agent pre-review.** Before any human looks, the `pre-reviewer` agent reviews the diff against the spec and the checklist, sends findings back until none are open, and writes a `## Pre-review` section: the risk (low, medium, high) with the reason, `Open findings: 0`, and two or three `file:line` places where a human's judgement is needed. Neither the gate nor CI accepts a PR without it. `Risk: high` switches on the QA verdict, the security results and the strict ledger rules.
- **Review deadlines.** Each lane has a deadline. Past it, `sdlc status` and session start say OVERDUE, the autopilot mod sends a native notification, and the hourly `review-sla` workflow comments once on the PR, mentioning the requested reviewers and the backup team.
- **Approve only what was checked.** A human can approve a gate only after the agent requested it, because the request is what runs the checks.

---

## 5. Autonomy grows as it is earned (optional)

Earned trust is off by default. A repo turns it on with `"trust": true` in `.ai-sdlc/config.json`.

- **The trust ledger.** Every first-time human approval of a gate adds to that gate's clean streak (per lane and stage, for example `bug:5`). A rejection resets it to zero. Approvals are counted whether trust is on or not.
- **Promotion.** At 10 clean approvals in a row (configurable), `sdlc trust` and session start say the gate is ready. A human promotes it by typing `sdlc trust <lane> <stage>`. From then on that gate passes on checks.
- **Demotion is automatic.** A rejection, `sdlc distrust`, an escaped bug, an error-budget freeze, or turning trust off hands the gate back to a human.
- **Some gates never move:** merging a feature, and every release.
- **Who decides.** `trustOwners` in config lists who may promote; agents cannot (a shell command containing `sdlc trust` is refused, and the ledger is a guardrail file).

---

## 6. Agents test and fix their own work

The `ai-sdlc-autopilot` mod runs the loop a person would otherwise drive by hand:

1. After any turn that edited files on a branch whose feature is in Build or Verify, it runs the repo's `gateCommand`.
2. Red, and under the retry cap: it starts the next turn itself with the failing output and the rules (fix the cause, never skip, weaken or delete a test, never loosen the goal, stop if the spec is wrong).
3. Green: it says so once and tells the agent to record the gate and request it. It never requests or approves a human gate.
4. Past the cap, or red after a turn that changed nothing: it stops, starts one turn asking for an escalation note, and notifies the human.
5. A human turns it on and off with `/sdlc-autopilot` or the button on the board. `sdlc pause` stops it.

Inside a build, `sdlc gate` records the baseline on the first run and refuses a gate request below it, so the loop cannot "succeed" by deleting tests.

---

## 6a. The loop spine: plan, test, implement, verify, review, release and observe, remember

Decided in [ADR-0002](adr/0002-loop-spine.md), and made lighter by [ADR-0003](adr/0003-simple-default-path.md). The stages are the outer loop, once per feature; inside Build, each slice runs test, implement, gate, retry. Improve runs out-of-band.

- **Test, proved.** `sdlc proof <feature>` runs the repo's `proofCommand` on the test files that trace the new criteria: first on the branch, where they must pass, then in a throwaway git worktree of the merge-base with those test files copied in, where every new criterion's tests must fail or error. "No tests collected" does not count. With a JUnit report (`{report}`), each criterion is judged on its own.
  - The test files' hashes are recorded. Verify refuses if one changed after the proof, so a test cannot be weakened between red and green.
  - Without a `proofCommand`, Verify warns and the PR must say under `## Not verified` that the proof did not run.
  - A hotfix proves its repro after the merge (`sdlc proof <hotfix> --files <tests>`), against the code before the fix. Until it passes, its postmortem counts as not done.
  - `sdlc spike <feature>` marks a slice as a spike: it may skip the red-first habit, never the proof, and it cannot pass Verify until a non-spike slice replaces it.
- **Verify, then review.** The machine gate runs before the packet, the lenses and the human, at every scale.
- **Release and observe.** In the full and light lanes, Release refuses without a rollback line `Tested: <date>, <how>` and a result for each probe. In the full lane it also needs `## Outcome metric` naming `Metric:` and `Owner:`, or `Metric: None, because ...`. The feature closes at release and opens an outcome follow-up, due after the watch window (`outcomeWindowDays`, 14 days in the full lane; add `light` to turn it on there) or on its `Read on:` date. Status and session start show OUTCOME DUE and OVERDUE; `sdlc metrics` reports its age. `sdlc outcome <feature> breach` alerts the incident commander; only a human declares a hotfix.
- **Remember, on staleness, as warnings.** Release warns about each of these, and an agent fixes what it lists before the human review:
  - a knowledge page whose sources the change touched is stale (C4 files count as sources)
  - a fact in `facts.md` about a file the change touched is stale
  - a decision says it supersedes an ADR (in `plan.md` or a changed ADR) and that ADR is not marked `Status: superseded`
  - a changed postmortem has an action without a link to the trap, test, check or PRD it became, an owner and a due date

  There is no rule that traps or the changelog must change.
- **Improve, when triggered.** An escalation past the retry cap, or the same blocker or major checklist finding in two features, writes a trigger. Status shows RETRO DUE until `sdlc retro` runs.

---

## 6b. Gates that catch the real failures

Decided in [ADR-0004](adr/0004-gates-that-catch-real-failures.md), after the feedback in `docs/feedback.md`: a lifecycle that would not have caught the last three real failures is ceremony. `npm run eval` reports whether each is caught.

| Failure | What catches it |
|---|---|
| F1. A permission denial retried about thirty times | Every denial says it is a final answer. The pre-tool hook counts denials per session and guard (`denialCap`, 2), hands back on the second, and then holds the session to reading until a human types. The autopilot starts nothing after a denied or aborted turn, and never restarts itself on green. |
| F2. Context spent before the source of truth | The pre-tool hook refuses a full read of a large file and gives the sliced call. Brownfield and data facts need a `[governing]` fact pinned to implementation code. |
| F3. A branch deploy erased by the next merge | Release refuses unless the reviewed change is on `origin/main` and `Live: <sha>`, read from the running system, contains it and the previous release. A preview deploy from an unpushed branch asks first. |

**Lessons owed.** A bug filed with `--caused-by`, or a hotfix, owes a trap in `standards/traps.md` that names it under `Source` and is guarded by a check. The bug cannot merge, and the postmortem stays open, until it is paid. This is how Release and incidents feed Plan by mechanism rather than by instruction.

---

## 7. Knowledge: the agents' memory

What one session learns, the next one must not have to learn again.

- **Open format.** `knowledge/` holds plain Markdown pages with frontmatter: `name`, `description`, `type` (system, component, decision, trap, runbook, howto, glossary, playbook), `sources` (the files the page describes), `verified` (the commit they were read at) and `confidence` (Established, Moderate, Preliminary). Pages link with `[[name]]`. Any wiki tool that reads Markdown can read them.
- **Source-backed, so it cannot silently rot.** `sdlc knowledge check` marks a page stale when its sources changed since its verified commit, and fails on unusable pages (missing fields, unknown types, broken links).
- **Read before you change.** `sdlc knowledge for <files>` lists the pages that cover them. Session start reports the size of the knowledge base and how much is stale, and the autopilot mod reminds every turn to look before changing an area.
- **Written as you go.** `/ai-sdlc:learn` writes pages and a self-check for a human becoming the expert. Release updates the pages a feature taught us. Postmortems add traps. Knowledge is reviewed in PRs like code.

---

## 7a. The plugin improves itself, from evidence

Sections 5 to 7 make each repo better. This loop makes the plugin better, for every team.

- **Evidence is recorded as the work runs:** rejection reasons, goals that escalated past the retry cap, how long each gate waited, guards that fired (the audit log), traps and how they are guarded, and escaped bugs. A bug that escaped shipped work is recorded with `sdlc bug <slug> --caused-by <feature>`, which also takes back the streak and any promotion of every gate that feature passed.
- **`sdlc retro`** mines one or more repos (`--repos a,b`) over a window (`--since 30`) and ranks proposals: a rejection theme seen twice at the same gate becomes a checklist or command change; an escalating goal, a command change; a gate waiting past its deadline, a pre-review and PR-size change; a guard firing again and again, an agent rule or a narrower guard; an escape, a new Verify check; a trap guarded only by prose, a hook or test. One event is never a pattern.
- **`/ai-sdlc:retro`** takes at most three proposals, changes the named plugin files on a `retro/<date>` branch, adds an eval for each that fails before the change and passes after, and opens a PR with the before and after numbers. It never loosens a guard, gate, limit or approval rule. A human platform owner merges it.
- **Golden-task evals** (`evals/golden/`, `npm run eval`) are the promises the process makes, one per file, replayed in throwaway repos: agents cannot approve, a bug needs a repro, bugs stay small, only humans declare hotfixes, no PR without a pre-review, data work is detected, no merge, push or deploy, guardrails hold, the kill switch works, escapes cost trust, knowledge goes stale, code waits for Build, tests prove themselves against the base code, release needs a tested rollback, the outcome outlives the release, a frozen budget stops new features, an escalation triggers the retro, features start light with one spec approval, and risk leaves the light lane. CI fails on any task that passed in `evals/baseline.json` and fails now.
- **Agent evals** (`evals/agents/`, `npm run eval:agents`) run real agents through `claude -p` on small fixed tasks and score the answers: the CTO routes an outage to a human-declared hotfix and a schema change to the data kind, the pre-reviewer scores risk and finds the untested branch, the product owner grades its evidence. They cost tokens, so they run by hand and in every retro.

---

## 7b. Quality gates for requirements, design, testing and review

Each gate refuses work that guesses, skips a question or hides risk, so what reaches a human is already checked.

**Requirements (Plan, one gate).**
- The product owner asks the questions that would change the PRD before drafting, and records them with the answers in `## Questions asked`. Every belief without a source is an assumption marked `[confirmed]` or `[unconfirmed]`; every unconfirmed one must be in Open questions.
- The PRD (`prd.md`) carries the problem, users, numbered testable requirements (R1, R2 ...), never-claims, scope, an outcome metric and open questions. Stakeholders, dependencies and release criteria are optional.
- `acceptance.feature` holds every acceptance criterion as Gherkin, approved with the PRD. The gate enforces an `@AC-n` and the `@Rn` it proves on every scenario, and a scenario for every PRD requirement. Narrative, one When, step order, a level tag, Outlines and selectors are advice: the linter warns.
- For brownfield and data work, `facts.md` pins what is true about the current system to `file:line` at a commit. A fact whose source changed is stale; a requirement citing an undefined fact is refused.

**Design (full lane).**
- Every ADR the plan names weighs at least two options and records its review in `## Review`: the `design-reviewer` and at least one other discipline ask, the architect answers. A plan with no ADR has nothing to review.
- A breaking API change against the base branch must be declared in `## Contracts`. The ER diagram and the OpenAPI style checks only warn. `sdlc api` puts a Swagger viewer beside the contract.

**Testing.**
- Tests come first in Build. `sdlc tests` builds the test matrix: each criterion and the tests that name it in a file that names the feature. The Verify gate refuses a criterion with no test; the level is a hint.
- `sdlc proof` shows each new criterion's tests pass here and fail on the base code (section 6a). It replaces the old mutation table and "show each test failing" prose.
- The `qa-engineer` writes the tests from scaffolds for unit (factories), subsystem (Testcontainers, rolled-back transactions), API (Postman with Setup and Teardown folders, run by Newman) and E2E (Playwright fixtures that seed through the API and clean up even on failure).
- Optional: `gateRepeats` exposes flaky tests; `dataCheckCommand` fails the gate when tests leave data behind.

**Review.**
- `sdlc review` builds a review packet: risk signals per file (high-risk paths, schema without an ER update, API contract changes, dependencies, CI, untested code, leftovers), the criteria with no test, and which lenses to run. It is pinned to the commit it was built at, and `sdlc request` rebuilds it when it is stale.
- The pre-reviewer runs those lenses in parallel (security, data, performance, test quality, operability, API compatibility) and records every finding in `review.md`: an F or H id, a severity, a `file:line`, a checklist item, a status and a source. The gate refuses malformed rows, open blockers, majors and minors, `fixed` without a commit (one that changed the file, when the risk is high), a wontfix without a reason, and any row that was removed instead of closed. A human approves every ledger change through CODEOWNERS.
- **Simplicity, the Ponytail way.** The builder climbs a ladder before writing code and stops at the first rung that works: is it needed now, the standard library, a platform feature, a dependency or helper already in the repo, a one-liner, a little code of its own, and only then a new dependency, with the reason. The pre-reviewer runs a simplicity lens on every PR (checklist section G). The packet names every new dependency (compared with the base branch, so version bumps do not count) and flags a change of more than 150 code lines per acceptance criterion as oversized. Validation, error handling, security and accessibility are never where lines are saved.
- Findings only humans caught become retro proposals with the measured pre-review recall (reported from five serious findings up), and seeded-bug review evals keep the pre-reviewer honest: it currently catches an SQL injection, a missing ownership check, an off-by-one and a test that asserts nothing.

**Dogfooded on itself.** This work ran through the plugin as the `quality-gates` feature (`specs/quality-gates/`): a PRD with the questions you answered, facts pinned to the code, 19 Gherkin scenarios traced to 26 tests, a design review board on ADR-0001 (11 questions, revise, then accept after code changes), and a pre-review that found 12 defects in the new gates, all fixed with regression tests and recorded in the ledger. The human gates stay waiting for a person.

## 8. Gates: humans decide, and the platform proves it

- `sdlc.mjs request <feature>` checks the artefact's sections (each must hold real content), the gate run, the PR size and the pre-review, then either passes an automatic or earned gate on checks and moves on, or marks the gate waiting on its named owner. An approval moves the feature on by itself.
- **Only a human records a decision**, by typing `sdlc approve <feature> <stage>` or `sdlc reject <feature> <stage> <reason>`. A `UserPromptSubmit` hook records it with their git name. If `gateOwners` lists names for a stage, only they can approve it. The autopilot board's buttons only put that text in the prompt; the human presses Enter.
- Agents cannot type for a human: shell commands containing `sdlc approve`, `reject`, `lane`, `hotfix`, `trust`, `distrust`, `resume` or `unfreeze` are refused.
- **On GitHub** the `gate-approvals` check confirms the Build gate and requires an approving review from a human who is not the PR author. `state.json` is owned by security in CODEOWNERS, and the `main` ruleset requires CODEOWNER approval and every check. GitHub is the authority; local hooks make a breach fail sooner.

---

## 9. Guardrails, hooks and mods: what each is for

| Need | Mechanism | Why there |
|---|---|---|
| Refuse a dangerous command or edit before it runs | classic `PreToolUse` hook | runs on every tool call, outside the model's control, works in every Claude Code |
| Record a human decision | classic `UserPromptSubmit` hook | fires only on what a person typed |
| Refuse to finish with secrets in added lines | classic `Stop` hook | runs as the agent stops |
| Hold for everyone, humans included | GitHub rulesets and Actions | cannot be bypassed from a laptop |
| Start the next fix turn on its own, cap it, and stop | mod (`turn.complete` + `$.prompt.submit`) | hooks can block a stop but cannot run the gate, count attempts across turns and start fresh turns |
| Stage rules in every turn without filling the transcript | mod (`prompt.compose`) | hooks only add text at session start or to a prompt |
| A board with buttons a person presses | mod (pane, `$.prompt.fill`) | MCP and hooks have no UI beside the chat |
| Structured state for the model | mod (`$.tool.register`) | no server to run; the tool reads the repo directly |
| Nudge a human when a review is late | mod (`$.ui.notify`) and the `review-sla` workflow | a native notification, and a PR comment for people not in the session |

**Pre-tool hook:** blocks push to main, force push, `--no-verify`, commits on main, merges (including `gh api` writes), deploys, publishing, `terraform apply`, rulesets, secrets, git aliases, `curl | sh`, secrets files, any command touching state, guardrails, settings, CI or CODEOWNERS (reads, `git add` and the state CLI on its own excepted), and production commands that are not read-only probes. It blocks MCP tools whose names merge, deploy, publish or change settings unless allowed. It blocks writes to guardrails, secrets, tfstate, secret-looking content, banned house-style text and `.only` tests; the plan and tasks before the spec is approved; code before Build; and bug-lane edits to dependencies, schema, CI or infra. It asks a human for CI, CODEOWNERS, agent and hook files, high-risk paths, skipped tests, and hotfix edits to dependencies.

**Config can only tighten.** List settings in `.ai-sdlc/config.json` add to the plugin's defaults and never replace them. Agents cannot edit the file.

**The kill switch.** Any human types `sdlc pause`; every agent write and command is refused, and the autopilot stops, until `sdlc resume`.

---

## 10. The tensions, and how we settled them

| Tension | Decision |
|---|---|
| Full gates on every change are too slow | lanes by blast radius; a feature waits on a human three times, bugs and chores once; Build passes on checks; security findings block in every lane |
| Process grows with every lesson | a small mandatory core; everything else optional, switched on by risk (ADR-0003); bookkeeping warns instead of blocking |
| Agents produce more than humans can review | small PRs, agent pre-review that points humans at the two or three places that need judgement, deadlines with escalation |
| Less human steering vs safety | Build on checks everywhere; earned trust optional per repo, granted by a human, lost on any rejection or a frozen error budget; merges of features and every release never move |
| Unattended fix loops vs runaway agents | a retry cap, a baseline that cannot drop, a stop when a turn changes nothing, the kill switch, and a human notified on every stop |
| Builder writes its own tests | tests come first, and the proof shows each one fails on the base code; a bug fix needs its repro red first |
| Hotfix speed vs safety | a human declares it; a 1h review; rollback written before the fix; a postmortem is enforced, and the repro is proved after the merge |
| Data changes hide inside "small" work | schema files force the data kind; an additive migration stays light with the DBA on the PR; altering or dropping data needs the full lane |
| Knowledge rots | every page names its sources and verified commit; stale pages are flagged mechanically and warned about at Release |

---

## 11. Run it

```bash
claude plugin marketplace add arunendapally/arunendapally-aisdlc
```

```bash
claude plugin install ai-sdlc@arunendapally-aisdlc
```

```bash
claude plugin install ai-sdlc-autopilot@arunendapally-aisdlc
```

Then, in a product repo: `/ai-sdlc:start <what you want>`. The first `/ai-sdlc:start` adds the repo kit (constitution, agent rules, config, autonomy levels, knowledge folder, GitHub workflows and templates, ruleset, CODEOWNERS, C4 workspace, standards) without overwriting anything. A human then sets `gateCommand`, `proofCommand` and `gateOwners` in `.ai-sdlc/config.json`, replaces the teams in CODEOWNERS, sets `BACKUP_REVIEWERS`, applies the ruleset, and gives agents a GitHub App or token with no admin or bypass rights.

**Commands:** `start`, `plan`, `design`, `build`, `verify`, `pre-review`, `release`, `bug`, `hotfix`, `task`, `learn`, `incident`, `retro`, `status` (all `/ai-sdlc:...`), plus the mod's `/sdlc-board` and `/sdlc-autopilot`.

**Typed by humans only:** `sdlc approve | reject <feature> <stage>`, `sdlc lane <feature> light|full`, `sdlc hotfix <slug> <what is broken>`, `sdlc trust | distrust <lane> <stage>`, `sdlc pause | resume`, `sdlc freeze | unfreeze`.

---

## How it was tested

- `npm test`: 93 tests in throwaway git repos, covering the default path, the lanes end to end, each of the three real failures, every guard, every lane end to end, the gate chain, review deadlines, PR size, pre-review, kinds, the trust ledger, the knowledge base, the CI scripts, the retro miner, escape charging, both eval runners, and every bypass the two reviews found.
- `npm run eval:agents`: 7 of 8 pass, including all four seeded-bug review evals. The CTO routed an outage to a human-declared hotfix and a schema change to the data kind with a DBA; the pre-reviewer scored risk and flagged the untested branch. The product owner's short brief left out the outcome metric its definition requires. The eval stays strict: that gap is the first input for a retro.
- `npm run eval`: 22 golden tasks, all passing, saved as the baseline; each of the three real failures in `evals/failures.json` is caught by at least one. The plugin's own CI (`.github/workflows/evals.yml`) runs the tests and the golden evals on every PR.
- `claude plugin test mods/ai-sdlc-autopilot`: 7 tests of the mod against the engine's test kit: the fix loop (red, green, cap, no-change stop, pause), the system-prompt section, the board's buttons on two surfaces, and the model tool.
- Guards were mutation-tested: broken on purpose, the matching test failed, then restored. One mutation survived at first (promotion before the threshold); a test was added and it now fails as it should.

## Not verified

- The hooks were tested by running the scripts with hook input, not inside a live session. The mod was loaded live: its `sdlc_board` tool failed at first (a live session needs a text result, which the test kit did not enforce), was fixed, has a test for it, and now works live. The pane, the band and the fix loop have not been exercised live on a real feature.
- The mod's `prompt.compose` hook does not run where an organisation manages Claude Code unless the organisation lists the mod in managed settings; there, the stage rules arrive only through session start.
- The GitHub workflows and ruleset are templates that have not run in a real repository. The Confluence publish step has a placeholder for your publisher.
- The hooks match text, so a determined agent could still get round them locally. GitHub's ruleset, CODEOWNERS and required checks are the enforcement.
- Escaped bugs are charged only when someone names the cause with `--caused-by`; nothing finds the causing feature automatically.
- `/ai-sdlc:retro` has not yet been run end to end to open a real PR on the plugin repo; its miner and evals are tested, the command's flow is not.
- The theme detector groups rejections by shared words, so it can miss a pattern described in different words.
- No real feature, bug or hotfix has gone through the whole process yet.
