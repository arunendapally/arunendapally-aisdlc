# How we run the AI SDLC: humans and agents, one process

*October 2026. Agreed by the CTO agent with its expert agents, reviewed twice by the security and tech-lead agents. Packaged as the `ai-sdlc` Claude Code plugin and the `ai-sdlc-autopilot` mod in this repo, so every team runs it the same way.*

**Goal:** humans and autonomous agents build our software in a way that is simple, integrated, fast, high quality and secure, and agents need less steering every month.

**In one sentence:** every piece of work is triaged into the lightest lane that is still safe; agents do the work, test it and fix it in a loop; a named human decides at each gate that has not yet been earned by the agents; and everything learned is written down so the next piece of work starts smarter.

---

## 1. Who is in the room

The CTO agent convenes the experts, triages work, settles disagreements in writing, and never writes code. Each expert is a subagent in `agents/`.

| Role | Agent | Model | Leads |
|---|---|---|---|
| CTO | `cto` | opus | triage, the process, cross-area decisions |
| Product owner | `product-owner` | opus | Plan: the graded brief |
| UI/UX designer | `ux-designer` | opus | journeys, placement, screens, accessibility |
| Architect | `architect` | opus | Analyze (supervisor), Design, learning tasks |
| C4 diagrams | `c4-diagrams-expert` | sonnet | the C4 model as code |
| Project manager | `project-manager` | sonnet | slices, board, flow numbers, risks |
| Tech lead | `tech-lead` | opus | Build, Verify, bugs, tasks |
| Builder | `builder` | sonnet | implementing batches |
| Pre-reviewer | `pre-reviewer` | opus | reviewing every PR before a human does |
| QA engineer | `qa-engineer` | sonnet | test IDs, strategy, independent verdict |
| Performance engineer | `performance-engineer` | opus | budgets, benchmarks before and after |
| DBA | `dba` | opus | data impact, expand-contract migrations, rehearsal |
| SRE | `sre` | opus | SLOs, observability, probes, incidents, hotfixes |
| Ops engineer | `ops-engineer` | sonnet | environments, IaC, secrets, cost, runbooks |
| Safe AI SDLC | `safe-ai-sdlc-expert` | opus | threat model, security gate, governance |
| AI agents | `ai-agents-expert` | opus | agent definitions, models, tools, evals |
| Agentic AI | `agentic-ai-expert` | opus | orchestration, autonomy levels, loops |
| GitHub | `github-expert` | sonnet | rulesets, workflows, templates |
| Confluence | `confluence-expert` | sonnet | publishing for the wider organisation |

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
| A schema or data change | `/ai-sdlc:kickoff --kind data` | all six, DBA co-owns Design and Release |
| New behaviour in an existing codebase | `/ai-sdlc:kickoff --kind brownfield` | six, or five in the light lane |
| A new service or product | `/ai-sdlc:kickoff --kind greenfield` | all six |
| A big capability | split into slices first, one kickoff and one small PR per slice | per slice |
| Not worth doing | say why and stop | none |

**Kinds** add what that kind of work needs to whatever lane it runs in, and they stack (`--kind brownfield,perf`):

| Kind | Adds |
|---|---|
| greenfield | a walking skeleton in the plan |
| brownfield | the current system (from code and knowledge) in the spec, characterisation tests before changing behaviour |
| perf | a performance budget, a benchmark before, the same benchmark after |
| data | data impact, an expand-contract migration plan, a rehearsal on a copy, a backout; DBA co-owns the gates; full lane only |

A change to migrations or SQL that is not marked as data work cannot pass its gate. Agents may add a kind but never remove one.

---

## 3. Lanes: the lightest process that is still safe

| Lane | Stages | Document | Human gates | PR limit | Review deadline |
|---|---|---|---|---|---|
| full | Plan, Analyze, Design, Build, Verify, Release | brief, spec, plan, tasks, pr, release | 6 | 400 lines | 24h |
| light | as full, without Design | as full, without plan | 5 | 300 | 8h |
| bug | Build, Verify | `bug.md` (also the PR body) | 1: merge | 200 | 8h |
| task | Build, Verify | `task.md` (also the PR body) | 1: merge | 200 | 8h |
| hotfix | Build, Verify, Release | `hotfix.md` (also the PR body) | 2: merge, release | 100 | 1h |

- Every feature starts full. Only a human moves one to light (`sdlc lane <feature> light`), and only a human declares a hotfix.
- In the bug, task and hotfix lanes, Build passes on checks rather than a person: the gate is green at or above the baseline, the diff is under the limit, and for a bug a red run was recorded before the fix (the repro).
- A bug fix cannot touch dependencies, schema, CI or infrastructure; the hook refuses. A hotfix can, with the on-call engineer's yes.
- After a hotfix ships, a postmortem is due within two days; session start and status flag it until it exists.
- `sdlc freeze` (error budget spent) closes the light lane and suspends every earned promotion until `sdlc unfreeze`.

The full lane's stages, artefacts and section requirements are unchanged: see the templates in `skills/org-ai-sdlc/templates/`.

---

## 4. Review wait: the bottleneck we design against

Agents write code faster than people can review it, so the process spends human attention only where it changes the outcome.

- **Small PRs.** `sdlc request` and the `pr-size` CI check refuse a PR over its lane's limit, not counting specs, docs, lock files and snapshots. A big feature ships as one PR per slice. Only a human can add the `size-exception` label.
- **Agent pre-review.** Before any human looks, the `pre-reviewer` agent reviews the diff against the spec and the checklist, sends findings back until none are open, and writes a `## Pre-review` section: the risk (low, medium, high) with the reason, `Open findings: 0`, and two or three `file:line` places where a human's judgement is needed. Neither the gate nor CI accepts a PR without it.
- **Review deadlines.** Each lane has a deadline. Past it, `sdlc status` and session start say OVERDUE, the autopilot mod sends a native notification, and the hourly `review-sla` workflow comments once on the PR, mentioning the requested reviewers and the backup team.
- **Approve only what was checked.** A human can approve a gate only after the agent requested it, because the request is what runs the checks.

---

## 5. Autonomy grows as it is earned

Human steering shrinks gate by gate, on evidence, never on a hunch.

- **The trust ledger.** Every first-time human approval of a gate adds to that gate's clean streak (per lane and stage, for example `bug:5`). A rejection resets it to zero.
- **Promotion.** At 10 clean approvals in a row (configurable), `sdlc trust` and session start say the gate is ready. A human promotes it by typing `sdlc trust <lane> <stage>`. From then on that gate passes on checks.
- **Demotion is automatic.** A rejection, `sdlc distrust`, or an error-budget freeze hands the gate back to a human.
- **Some gates never move:** merging a full or light feature, and every release. Those stay with humans.
- **Who decides.** `trustOwners` in config lists who may promote; agents cannot (a shell command containing `sdlc trust` is refused, and the ledger is a guardrail file).
- Autonomy levels for activities (L0 to L4) are in `.ai-sdlc/autonomy.json`; earned trust is how gates move up within them.

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

## 7. Knowledge: the agents' memory

What one session learns, the next one must not have to learn again.

- **Open format.** `knowledge/` holds plain Markdown pages with frontmatter: `name`, `description`, `type` (system, component, decision, trap, runbook, howto, glossary, playbook), `sources` (the files the page describes), `verified` (the commit they were read at) and `confidence` (Established, Moderate, Preliminary). Pages link with `[[name]]`. Any wiki tool that reads Markdown can read them.
- **Source-backed, so it cannot silently rot.** `sdlc knowledge check` marks a page stale when its sources changed since its verified commit, and fails on unusable pages (missing fields, unknown types, broken links).
- **Read before you change.** `sdlc knowledge for <files>` lists the pages that cover them. Session start reports the size of the knowledge base and how much is stale, and the autopilot mod puts the index in the system prompt of every turn.
- **Written as you go.** `/ai-sdlc:learn` writes pages and a self-check for a human becoming the expert. Release updates the pages a feature taught us. Postmortems add traps. Knowledge is reviewed in PRs like code.

---

## 8. Gates: humans decide, and the platform proves it

- `sdlc.mjs request <feature>` checks the artefact's sections (each must hold real content), the gate run, the PR size and the pre-review, then either passes an automatic or earned gate on checks or marks the gate waiting on its named owner.
- **Only a human records a decision**, by typing `sdlc approve <feature> <stage>` or `sdlc reject <feature> <stage> <reason>`. A `UserPromptSubmit` hook records it with their git name. If `gateOwners` lists names for a stage, only they can approve it. The autopilot board's buttons only put that text in the prompt; the human presses Enter.
- Agents cannot type for a human: shell commands containing `sdlc approve`, `reject`, `lane`, `hotfix`, `trust`, `distrust`, `resume` or `unfreeze` are refused.
- **On GitHub** the `gate-approvals` check confirms the Build gate and requires an approving review from a human who is not the PR author. `state.json` is owned by security in CODEOWNERS, and the `main` ruleset requires CODEOWNER approval and every check. GitHub is the authority; local hooks make a breach fail sooner.

---

## 9. Guardrails, hooks and mods: what each is for

| Need | Mechanism | Why there |
|---|---|---|
| Refuse a dangerous command or edit before it runs | classic `PreToolUse` hook | runs on every tool call, outside the model's control, works in every Claude Code |
| Record a human decision | classic `UserPromptSubmit` hook | fires only on what a person typed |
| Refuse to finish with secrets or banned text in added lines | classic `Stop` hook | runs as the agent stops |
| Hold for everyone, humans included | GitHub rulesets and Actions | cannot be bypassed from a laptop |
| Start the next fix turn on its own, cap it, and stop | mod (`turn.complete` + `$.prompt.submit`) | hooks can block a stop but cannot run the gate, count attempts across turns and start fresh turns |
| Stage rules and knowledge in every turn without filling the transcript | mod (`prompt.compose`) | hooks only add text at session start or to a prompt |
| A board with buttons a person presses | mod (pane, `$.prompt.fill`) | MCP and hooks have no UI beside the chat |
| Structured state for the model | mod (`$.tool.register`) | no server to run; the tool reads the repo directly |
| Nudge a human when a review is late | mod (`$.ui.notify`) and the `review-sla` workflow | a native notification, and a PR comment for people not in the session |

**Pre-tool hook:** blocks push to main, force push, `--no-verify`, commits on main, merges (including `gh api` writes), deploys, publishing, `terraform apply`, rulesets, secrets, git aliases, `curl | sh`, secrets files, any command touching state, guardrails, settings, CI or CODEOWNERS (reads, `git add` and the state CLI on its own excepted), and production commands that are not read-only probes. It blocks MCP tools whose names merge, deploy, publish or change settings unless allowed. It blocks writes to guardrails, secrets, tfstate, secret-looking content, banned house-style text and `.only` tests; artefacts before their gate; code before Build; and bug-lane edits to dependencies, schema, CI or infra. It asks a human for CI, CODEOWNERS, agent and hook files, high-risk paths, skipped tests, and hotfix edits to dependencies.

**Config can only tighten.** List settings in `.ai-sdlc/config.json` add to the plugin's defaults and never replace them. Agents cannot edit the file.

**The kill switch.** Any human types `sdlc pause`; every agent write and command is refused, and the autopilot stops, until `sdlc resume`.

---

## 10. The tensions, and how we settled them

| Tension | Decision |
|---|---|
| Full gates on every change are too slow | lanes by blast radius; bugs and chores get one human gate; security findings block in every lane |
| Agents produce more than humans can review | small PRs, agent pre-review that points humans at the two or three places that need judgement, deadlines with escalation |
| Less human steering vs safety | autonomy is earned per gate on a clean streak, granted by a human, lost on any rejection or a frozen error budget; merges of features and every release never move |
| Unattended fix loops vs runaway agents | a retry cap, a baseline that cannot drop, a stop when a turn changes nothing, the kill switch, and a human notified on every stop |
| Every scan on every batch slows the loop | tiered gate: fast checks per batch, full scans on the PR, criticals block at merge |
| Builder writes its own tests | QA owns test IDs from Analyze; a bug fix needs a recorded red run before the fix |
| Repo truth vs stakeholders in Confluence | publish on merge; comments flow back as issues |
| Hotfix speed vs safety | a human declares it; a 1h review; rollback written before the fix; a postmortem is enforced |
| Data changes hide inside "small" work | schema files force the data kind: full lane, DBA review, rehearsal |
| Knowledge rots | every page names its sources and verified commit; stale pages are flagged mechanically |

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

Then, in a product repo: `/ai-sdlc:start <what you want>`. The first kickoff adds the repo kit (constitution, agent rules, config, autonomy levels, knowledge folder, GitHub workflows and templates, ruleset, CODEOWNERS, C4 workspace, standards) without overwriting anything. A human then sets `gateCommand`, `gateOwners` and `trustOwners` in `.ai-sdlc/config.json`, replaces the teams in CODEOWNERS, sets `BACKUP_REVIEWERS`, applies the ruleset, and gives agents a GitHub App or token with no admin or bypass rights.

**Commands:** `start`, `kickoff`, `plan`, `analyze`, `design`, `build`, `verify`, `release`, `bug`, `hotfix`, `task`, `learn`, `pre-review`, `incident`, `status` (all `/ai-sdlc:...`), plus the mod's `/sdlc-board` and `/sdlc-autopilot`.

**Typed by humans only:** `sdlc approve | reject <feature> <stage>`, `sdlc lane <feature> light|full`, `sdlc hotfix <slug> <what is broken>`, `sdlc trust | distrust <lane> <stage>`, `sdlc pause | resume`, `sdlc freeze | unfreeze`.

---

## How it was tested

- `npm test`: 32 tests in throwaway git repos, covering every guard, every lane end to end, the gate chain, review deadlines, PR size, pre-review, kinds, the trust ledger, the knowledge base, the CI scripts, and every bypass the two reviews found.
- `claude plugin test mods/ai-sdlc-autopilot`: 7 tests of the mod against the engine's test kit: the fix loop (red, green, cap, no-change stop, pause), the system-prompt section, the board's buttons on two surfaces, and the model tool.
- Guards were mutation-tested: broken on purpose, the matching test failed, then restored. One mutation survived at first (promotion before the threshold); a test was added and it now fails as it should.

## Not verified

- The hooks were tested by running the scripts with hook input, not inside a live session. The mod was loaded live: its `sdlc_board` tool failed at first (a live session needs a text result, which the test kit did not enforce), was fixed, has a test for it, and now works live. The pane, the band and the fix loop have not been exercised live on a real feature.
- The mod's `prompt.compose` hook does not run where an organisation manages Claude Code unless the organisation lists the mod in managed settings; there, the stage rules arrive only through session start.
- The GitHub workflows and ruleset are templates that have not run in a real repository. The Confluence publish step has a placeholder for your publisher.
- The hooks match text, so a determined agent could still get round them locally. GitHub's ruleset, CODEOWNERS and required checks are the enforcement.
- The golden-task eval runner for agents is policy, not built. Nothing yet detects a defect after merge and charges it to the gate that let it through; rejections and freezes are the only demotion signals today.
- No real feature, bug or hotfix has gone through the whole process yet.
