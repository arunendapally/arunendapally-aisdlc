# Changelog

All notable changes to this repository. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### A smoother process: questions instead of commands, autonomy, and the calculator run's fixes

The owner ran a scientific calculator (.NET minimal API and React) through the plugin with Claude in every role; the log is [docs/feedback/2026-10-29-calculator-run.md](docs/feedback/2026-10-29-calculator-run.md).

#### Added

- **Ask, don't make people paste commands.** `sdlc ask <feature>` prints the question for a waiting gate (Approve, or Send back with a reason) or a missing intent (change, smallest, drop if). The agent asks it with the question tool, and a new PostToolUse hook (`scripts/hooks/answers.mjs`) records the person's click through the same checks as a typed command. Each question carries a marker bound to the feature, gate and fingerprint, so a stale one records nothing; the guard refuses a marked question the agent answered itself; answers inside a subagent are ignored. Typed commands remain a fallback. Every command now asks instead of telling the agent to have a person type.
- **Autonomy, granted by a person per repo.** `sdlc autonomy on <reason>` (typed or from the person's terminal): every gate then passes on its checks, recorded as granted by them; risky work moves itself to the full lane; `sdlc merge <feature>` lands exactly the reviewed commit on main, fast-forward only. Only a person grants or revokes it; the guards stay.
- **Revisions for re-approved specs and designs.** Each approval of gate 1 or 3 is a revision (v1, v2). A spec or design approved before needs `## Changes since vN` with the change request before it is approved again; the question and `status` show the revision. Git keeps v1 as approved.
- **Warn at Plan when a spec is more than one slice** (over 7 scenarios, `sliceScenarios`), instead of failing the PR size at the end of Build.
- **A new repo can be started:** the first commit in an empty repo, and the first push of main to a remote that answered with no refs.

#### Changed

- **The PR size counts only code:** tests, project and tool boilerplate (`.sln`, `.csproj`, `tsconfig`, launch and app settings, `.gitignore`) and the plugin's state no longer count, in the gate and the CI script.
- **.NET and Java tests are recognised** by the test matrix (`*Tests.cs`, `*ApiTests.cs`, `*IntegrationTests.cs`, `*Test.java`, `*IT.java`), and a file that names a criterion but is not a known test file is called out by name.
- **The review packet knows a test file by the test matrix's patterns,** so .NET and Java tests count as tests in its file counts, "no changed test mentions it" and code lines. A manifest is a dependency change only when a dependency is added or its version changes (a `package.json` "scripts" edit is not), and `.csproj` `PackageReference` additions are named as new dependencies.
- **The proof shares every installed `node_modules`,** not only the root one, and a base run that failed on a missing package no longer counts as red.
- **A gate passed on its checks records a fingerprint,** so spec or plan drift still sends work back without a person's approval.
- **The intent parser anchors its labels** ("exchange:" is not "change:") and keeps semicolons and lines inside a part; "drop:" means "drop if:".

#### Fixed

- The guard read .NET's `appsettings.json` as Claude's own settings file.

### Human commands that are never lost ([#15](https://github.com/arunendapally/arunendapally-aisdlc/issues/15))

From a real feature in another repo on plugin 0.4.0, where `sdlc intent` could not be recorded by any route.

- **Fixed: a command after a context block was ignored with no message.** The desktop app can put a context block before what the person typed, so the hook never saw `sdlc ...` at the start. The hook now drops leading context blocks and never records a command found inside one, since that text is not the person's.
- **A message from another agent is never a person's.** Checked on 27 Oct: a subagent's report reaches the prompt hook in the parent's session, wrapped in `<agent-message>`. Such a prompt now records nothing and no longer releases a session held after repeated refusals (before, any prompt did). Only whole `<system-reminder>` blocks, opening and closing on lines of their own, are dropped, so a closing tag quoted inside one cannot smuggle a command out.
- **Never silent:** a message that mentions `sdlc <verb>` anywhere but the start now says nothing was recorded.
- **A terminal path:** `node scripts/sdlc.mjs intent|approve|reject|lane|hotfix|distrust|close|...` in a person's own terminal runs the same hook with the same checks. Agents are refused it through the shell, through a terminal or remote-shell MCP tool, and by feeding the hook a prompt by hand.
- **Fixed: a quoted `gh issue|pr create|comment|edit` title or body tripped the guard** when it only mentioned a command or a guarded path. It is now text; a double-quoted body with `$( )` or backticks is still checked, because that part runs.
- Failure F5 (a person's command lost without a word) in `evals/failures.json`, caught by golden task 29 (`human-commands-are-never-lost`), and `tests/human-verbs.test.mjs`.

## [0.4.0] - 2026-10-26

### The person's intent comes first

The council record is [docs/decisions/2026-10-25-fewer-better-human-asks.md](docs/decisions/2026-10-25-fewer-better-human-asks.md): a strong intent from the person, and approvals that show it back, instead of more asks.

- **`sdlc intent <feature> change: ...; smallest: ...; drop if: ...`**, typed by a person in the prompt like `sdlc approve`; agents cannot type it. It records who and when, creates the feature in the light lane if it does not exist, and is refused past Plan or with a part missing. No word count or number rule: filler passes those.
- **The PRD waits for it:** writing `prd.md` is refused until the intent exists, and Plan cannot be requested without it. The request writes the person's words into the PRD's `## Intent`, replacing whatever an agent put there. A new intent while gate 1 waits lapses it.
- **Every approval shows it back:** the request prints the intent verbatim, the unconfirmed assumptions at Plan, and at Verify the risk tier, the number of files reviewed and what was not verified. All of it comes from data the scripts hold.
- Golden task 26 (`intent-comes-from-a-person`) and `tests/intent.test.mjs`.

### Staying agile when building is cheap

The council record is [docs/decisions/2026-10-25-agile-with-agents.md](docs/decisions/2026-10-25-agile-with-agents.md): not waterfall, but cheap building moves the batch to the spec and to work in flight. Five changes proposed; the first is built.

- **A spec changed after Plan was approved goes back to Plan.** At Build, Verify or Release, `sdlc request` compares `prd.md` and `acceptance.feature` with what the person approved. If they differ, the feature returns to stage 1 and a person approves the new spec; tests already written stay. Before this, an agent could edit the approved spec during Build and ship it unseen.
- **The same for the plan:** `plan.md` changed after Design was approved sends a full-lane feature back to Design; the spec approval stands.
- **One feature, one branch.** `gate`, `proof`, `review` and a Build or Verify request refuse when the branch checked out is not the feature's, since they judge that branch's diff. A shipped hotfix still proves itself on main.
- Golden task 25 (`spec-drift-goes-back-to-plan`) and tests in `tests/review.test.mjs`.
- **Fixed:** `npm test` now runs `tests/workflows.test.mjs`; it was left out of the test script when the council workflow shipped.

### Browser actions and web calls need a person (agile change 4)

From [docs/decisions/2026-10-25-agile-with-agents.md](docs/decisions/2026-10-25-agile-with-agents.md), change 4: the gaps to close before any browser QA.

- **An MCP tool that acts in a browser asks a person**: navigate, click, type, form input, run script, upload, batch (`mcpAskPattern`). Reading a page does not. List a tool in `mcpAllow` to let it run.
- **Paused or held, a session reads only local files.** `WebFetch` and `WebSearch` no longer count as read-only: a URL or a search query can carry data out.
- **Fixed:** a repo config could replace `mcpDenyPattern` and so remove the guard. Both MCP patterns now add to the default, never replace it.
- Golden task 28 (`browser-and-web-need-a-person`) and tests.

### The Bash guard judges each segment on what it targets

From the council proposal [docs/decisions/2026-10-23-bash-guard-targets.md](docs/decisions/2026-10-23-bash-guard-targets.md). The guard tested a whole command line's text, so it refused harmless chains five times between 22 and 26 Oct, each refusal counting toward `denialCap`, and it let `git push origin +main` through.

- **Split, then judge each part** (`scripts/segments.mjs`): on `;` `&&` `||` `|` `&` and newlines, never inside quotes, `$( )`, backticks or a heredoc body, never on a redirect's `&`. When the parse is unsure (an unclosed quote or heredoc), the whole line is judged, as before.
- **The push check** reads only the push's own arguments: `+main`, `HEAD:main`, `refs/heads/main`, `--mirror` and `--all` are refused; a `+refspec` or force flag counts only inside the push, so `rm -f` no longer reads as a force push; `sudo`, `env`, subshells and `bash -c` are still caught.
- **Guardrail files** may be named by a read segment (`cat`, `grep`, `rg` without `--pre`, `head`, `tail`, `ls`, `wc`, `jq`, and `sed -n 'N,Mp' FILE` only), by `git add`, `commit`, `status`, `diff`, `log`, `show`, or by the state CLI. Anything with a redirect, `$( )` or backticks is a write.
- **Heredocs:** a body behind a quoted delimiter, fed to `cat >`/`>>`, `tee` or a commit message, is data and skips the guardrail check; its target must not be a guardrail, CI or ownership file. Any other heredoc is code and is judged with its segment. A secret anywhere in a command is now refused.
- Golden task 27 (`guard-judges-each-segment`) and tests replaying the refused commands.

## [0.3.0] - 2026-10-23

### Easier to start

- The README opens with what the plugin is, how to install it and the first command; the original article follows.
- Getting started leads with three steps to a first feature (start, set `gateCommand`, approve), moves the team setup to its own section, and adds how to update the plugin, the council, and troubleshooting rows for an old plugin and a missing gate command.

### The council as a dynamic workflow

- `workflows/council.js` runs as `/ai-sdlc:council`: experts in parallel, a sceptic per review that checks the cited code, then the CTO writes a proposal record. Args: `question`, `record`, `date`, and optional `context`, `experts`, `words`.
- Trialled against a manual council on narrowing the Bash guard: [docs/decisions/2026-10-23-council-workflow-trial.md](docs/decisions/2026-10-23-council-workflow-trial.md). The workflow cost more (9 agents, $2.59) and caught a recommendation that would have loosened the guard. The resulting proposal is [docs/decisions/2026-10-23-bash-guard-targets.md](docs/decisions/2026-10-23-bash-guard-targets.md); it is not implemented.
- `tests/workflows.test.mjs` checks each workflow's meta block and dry-runs the council with fake agents.

### Review that converges, and risk set by the change ([ADR-0005](docs/adr/0005-review-converges-and-risk-is-set-by-the-change.md))

From the article "How the Claude Code team does code review" and a council of five agents; record in [docs/decisions/2026-10-22-code-review-at-scale.md](docs/decisions/2026-10-22-code-review-at-scale.md).

#### Added

- **Review rounds are capped.** After three Verify requests refused by the review, the gate stops and asks for a rethink; a human resets it with `sdlc reject <f> 5 rethink: ...`. `reviewRoundCap`, default 3.
- **Re-review only the new diff.** The packet lists files changed since the last review; a ledger row that repeats a closed finding is refused.
- **An approval covers what was checked.** Each request stores a fingerprint of its content; a change before approval lapses the gate. Release refuses code changed after Verify reviewed it.
- **Risk is set by the change.** Low, medium or high from the files touched; the pre-review's label can raise it, never lower it, and a lower label is refused. `sdlc metrics` shows review rounds and the tier.
- **`sdlc close <feature> <reason>`**, human-only, to retire work that will not ship.
- Every pre-review needs `Revert:`. One PR template for the plugin, the repo kit and this repo, with risk definitions.
- Failure F4 (a review loop that never converges) and two golden tasks (24 in all); `tests/review.test.mjs`.

#### Changed

- **Every merge needs a person:** `bug:5` and `task:5` joined `neverTrust`. Earned trust no longer promotes any merge.
- **Fixed:** a pre-review that said "Risk: low" turned off the strict ledger rules for its own change.
- The repo kit ignores the plugin's runtime files (`audit.jsonl`, `denials.json`, `retro-due.json`).


### Gates that catch the real failures ([ADR-0004](docs/adr/0004-gates-that-catch-real-failures.md))

Feedback (`docs/feedback.md`) set the test: a lifecycle that would not have caught the last three real failures is ceremony. Before this, the plugin caught one of three, late. The council record is in [docs/decisions/2026-10-22-gates-are-the-product.md](docs/decisions/2026-10-22-gates-are-the-product.md).

#### Added

- **F1, a denial retried as a failure.** Every denial now says it is a final answer, not an error. Denials are counted per session by the guard that fired, so a rephrase counts too. The second hands back, and after it the session may only read until a human types (`denialCap`, default 2, can only be lowered). The autopilot counts an edit only once the tool succeeded, starts nothing after a denied or aborted turn, and only toasts on green; its old green path restarted itself with no cap.
- **F2, context spent before the source of truth.** The pre-tool hook refuses a full read (or `cat`) of a file over `maxReadLines` (1,500) or `maxReadBytes` (100KB), with the sliced call. Brownfield and data facts need a `[governing]` fact pinned to implementation code, not a document or schema.
- **F3, a branch deploy erased by the next merge.** Release refuses unless the reviewed commit, or its squash, is on `origin/main`, and unless `Live: <sha>` under `## Probes` contains it and the previous release. An agent's preview deploy from an unpushed branch asks first. `deployPatterns` now also cover `vercel alias`, `netlify deploy --prod`, `fly deploy`, `firebase deploy`, `wrangler deploy` and `npm run deploy`, and a deploy written into a script or package script asks a human. `sdlc status` prints what is live.
- **Lessons owed.** A bug filed with `--caused-by`, or a hotfix, owes a trap with `- **Source:** <slug>` and a guard that is a check. The bug cannot merge, and the hotfix postmortem stays open, until it is paid.
- **The score is checkable.** Golden tasks name the failures they catch (`"catches"`), `evals/failures.json` lists them, and `npm run eval` prints CAUGHT or NOT CAUGHT for each and fails when one has no passing task. Three new golden tasks (22 in all) and `tests/failures.test.mjs`.
- Three new traps in `templates/repo/standards/traps.md`, one per failure.

#### Changed

- Verify records the reviewed commit and files, so Release checks what was reviewed even after the merge.
- The QA agent no longer mandates Postman; any API test tool will do, with Setup and Teardown.

### A simple default path ([ADR-0003](docs/adr/0003-simple-default-path.md))

Seven experts reviewed the plugin and found features far too heavy: 8 to 11 documents, about 50 required sections and 5 human waits. Now a feature waits on a human three times (the spec, the merge, the release) and a bug once. The record is in [docs/decisions/2026-10-22-simplify.md](docs/decisions/2026-10-22-simplify.md).

#### Changed

- **Features start in the light lane.** `init <slug> --full` starts one in the full lane. In the light lane, Build refuses a migration that alters or drops data, or a high-risk path; a human types `sdlc lane <feature> full` and the feature goes back to Design.
- **One spec gate.** Plan and Analyze are one stage: a 9-section PRD plus `acceptance.feature`, one approval. `spec.md` is gone. Facts are required only for brownfield and data work.
- **Build passes on checks in every lane.** An approval, or a gate that passes on checks, moves the feature on by itself; `sdlc advance` is rarely needed.
- **Gherkin:** only the `@AC-n` and `@Rn` tags, and a scenario per requirement, are errors. Everything else warns. The test matrix accepts a test at any level.
- **Design (full lane only):** each ADR the plan names needs two options and a `## Review` section. The board record, the three-discipline minimum and the "downside" keyword check are gone. ER and OpenAPI style only warn; breaking API changes still block.
- **Data:** an additive migration runs in the light lane with a down migration and the DBA on the PR.
- **Review:** `sdlc request` rebuilds a stale review packet instead of refusing. A `fixed: <sha>` commit must touch the file only when the pre-review says `Risk: high`.
- **Release:** a tested rollback and probe results block; stale knowledge and facts, unmarked superseded ADRs and unlinked postmortem actions now warn. The outcome follow-up opens only in the full lane (`outcomeWindowDays`), and `Metric: None, because ...` is allowed.
- **Bugs:** with a `proofCommand`, the repro test itself must be proved (`sdlc proof <bug> --files <test>`), not just any red gate run.
- **Templates:** PRD 14 to 9 required sections, plan 10 to 6, PR body 10 to 4, release 8 to 3; optional sections are listed at the bottom of each. `Review honesty` and the Mutations table are gone.
- **Earned trust is optional**, off unless `"trust": true`.
- **Agents 21 to 14:** agentic AI absorbs AI agents, SRE absorbs ops, QA absorbs the SDET, the CTO absorbs the project manager, the architect absorbs C4; the Confluence and GitHub experts are removed.
- **Commands 18 to 14:** `start` absorbs `kickoff`, `plan` absorbs `analyze`, `design` absorbs `design-review`, `build` absorbs `tests`.
- **Hooks:** no PostToolUse hook (it started a node process on every tool call); the stop hook checks secrets only, since house style is checked when a file is written. The mod no longer puts the knowledge index in every turn.
- The `greenfield` kind is gone; RETRO DUE shows in `status`, not at session start.

#### Removed

- `skills/ai-sdlc/`, the older cycle that competed with `org-ai-sdlc`. Its standards moved to `templates/repo/standards/`, which `init-repo` copies as before.

### The loop spine ([ADR-0002](docs/adr/0002-loop-spine.md))

Plan, test, implement, verify, review, release and observe, remember, with improve out-of-band.

### Added

- **Test proof:** `sdlc proof <feature>` runs the new `proofCommand` on the tests that trace the new criteria, green on the branch and red against the merge-base code in a throwaway git worktree. Test files are hash-locked until Verify. JUnit reports (`{report}`) judge each criterion; "no tests collected" never counts.
- **Spikes:** `sdlc spike <feature> [--off]`; a spike cannot pass Verify.
- **Hotfix proof:** after the merge, against the code before the fix; the postmortem is not done until it passes.
- **Outcome follow-up:** release opens it with an owner and a due date (`outcomeWindowDays`, or `Read on:` in release.md). `sdlc outcome <feature> met|missed|breach`, OUTCOME DUE and OVERDUE in status and at session start, and its age in `sdlc metrics`.
- **Triggered retro:** an escalation past the retry cap, or the same blocker or major checklist finding in two features, shows RETRO DUE until `sdlc retro` runs.
- Five golden tasks (17 in all) and `tests/loop.test.mjs` (14 tests).

### Changed

- **Verify** (full and light lanes) needs a passing, unchanged proof, or a PR that says the proof did not run.
- **Release** (full and light lanes) needs a rollback `Tested: <date>` line, probe results and an outcome owner. In every lane it refuses stale knowledge pages and facts about the files the change touched, ADRs superseded but not marked, and postmortem actions without a link, owner and due date.
- **Error-budget freeze** now stops every new full and light feature (`sdlc init` is refused), not only the light lane.
- The release and incident templates show the lines these checks read.

## [0.2.0] - 2026-10-21

The AI SDLC for organisations, packaged as the `ai-sdlc` Claude Code plugin and the `ai-sdlc-autopilot` mod. Start with [docs/getting-started.md](docs/getting-started.md); the full process is in [docs/org-ai-sdlc-process.md](docs/org-ai-sdlc-process.md).

### Added

- **Agents:** a CTO agent and 20 experts (product owner, UI/UX, architect, design reviewer, C4, project manager, tech lead, builder, pre-reviewer, SDET, QA, performance, DBA, SRE, ops, safe AI SDLC, AI agents, agentic AI, GitHub, Confluence).
- **Routing:** `/ai-sdlc:start` triages any work into a lane:

  | Lane | Human gates |
  |---|---|
  | full | 6 |
  | light | 5 |
  | bug | merge only |
  | task | merge only |
  | hotfix (declared by a human) | merge and release |

- **Kinds:** these add what each kind of work needs: `greenfield`, `brownfield`, `perf`, `data`, `api`.
- **Commands:**
  - `start`, `kickoff`, `plan`, `analyze`, `design`, `design-review`, `build`, `tests`, `verify`, `pre-review`, `release`
  - `bug`, `hotfix`, `task`, `learn`, `incident`, `retro`, `status`
- **Human-only gate decisions:** a gate is approved only when a person types `sdlc approve <feature> <stage>`, and only after its checks ran. The same goes for rejections, lane changes, hotfix declarations, trust promotions, the kill switch (`sdlc pause`) and the error-budget freeze.
- **Guardrail hooks:** refuse pushes to main, force pushes, `--no-verify`, merges, deploys, infrastructure applies, secrets, production writes, and agents editing their own limits. They also keep an audit log, and repo config can only tighten them.
- **Review wait:** PR size limits per lane, and review deadlines with escalation (a `review-sla` workflow).
- **Earned autonomy:** a trust ledger. Clean human approvals build a streak, a human promotes the gate, and a rejection, an escaped bug or an error-budget freeze takes the promotion back.
- **Requirements:**
  - The PRD records the questions asked before drafting, and every assumption as confirmed or unconfirmed.
  - `facts.md` pins system facts to `file:line` at a commit, and flags facts whose source changed.
  - Gherkin `acceptance.feature`, linted for structure, tags (`@AC-n @Rn` and a test level) and coverage of every requirement.
- **Design:**
  - ADRs must weigh two options and name a downside.
  - A design review board of at least three disciplines must accept every decision.
  - Data work needs a Mermaid ER diagram that marks the changed entities.
  - API work needs a checked `openapi.yaml`, with breaking changes declared. The Swagger viewer opens straight from disk.
- **Testing:**
  - A test matrix traces every criterion to a test at its level.
  - An SDET agent and scaffolds for unit, subsystem (Testcontainers), API (Postman and Newman) and E2E (Playwright) tests, each with its own data setup and teardown.
  - `--repeat` finds flaky tests, and `dataCheckCommand` catches leaked test data.
- **Review:**
  - A review packet maps the risk signals in a change: high-risk paths, schema without an ER update, API contract changes, new dependencies, oversized changes, untested code, leftovers.
  - The pre-reviewer runs expert lenses, including a Ponytail-style simplicity lens.
  - A `review.md` findings ledger that the Verify gate enforces.
- **Simplicity:** the builder climbs a ladder before writing code (needed now, standard library, platform, existing dependency, one-liner, its own code, then a new dependency with its reason).
- **Self-improvement:**
  - `sdlc retro` turns rejections, escalations, slow gates, noisy guards, escaped bugs, unenforced traps and review findings only humans caught into proposed plugin changes.
  - `sdlc bug --caused-by` records an escaped bug against the work it came from.
- **Knowledge:** Markdown pages in `knowledge/` that cite their sources and go stale when those sources change.
- **Autopilot mod:**
  - a gate board pane
  - stage rules and the knowledge index in every turn
  - a capped test-and-fix loop
  - a read-only state tool for the model
  - review-deadline notifications
- **Repo kit** (copied by the first `/ai-sdlc:kickoff`, never overwriting):
  - constitution, agent rules, config, autonomy levels and a knowledge folder
  - GitHub workflows: gate, PR size, review deadlines, test levels, docs publishing
  - a ruleset, CODEOWNERS, and a C4 workspace
- **Evals:** 12 golden tasks checked against a saved baseline in CI, and agent evals that run real agents through `claude -p`. These include five seeded-bug review evals.
- **This repo's own CI:** `.github/workflows/evals.yml` runs the tests and golden evals on every PR.
- **Dogfood record:** `specs/quality-gates/` and `docs/adr/0001-review-findings-ledger.md`.

### Changed

- The README introduces the plugin and links the getting-started guide, the process and this changelog.

### Known limitations

- The hooks were tested by running their scripts directly, not inside a live session. The autopilot pane, band and fix loop have not run on a real feature.
- The repo-kit workflows and ruleset have not run in a real product repo. The Confluence publish step has a placeholder where a publisher goes.
- The OpenAPI check is structural only; use Redocly or Spectral in CI for full validation. The Swagger viewer loads Swagger UI from unpkg.
- The test scaffolds assume TypeScript, Vitest, Postgres, Newman and Playwright.
- 8 of 9 agent evals pass. In a short brief, the product owner agent left out the outcome metric its definition requires.

## [0.1.0] - 2026-10-18

### Added

- The `ai-sdlc` skill: a six-stage AI SDLC for one developer, with a human gate at every stage.
- Copy-paste prompts, a worked e-commerce example, and the standards knowledge base (engineering standards, testing standards, code-review checklist, traps).
- The companion post `docs/first-principles.md`.

[0.4.0]: https://github.com/arunendapally/arunendapally-aisdlc/releases/tag/v0.4.0
[0.3.0]: https://github.com/arunendapally/arunendapally-aisdlc/releases/tag/v0.3.0
[0.2.0]: https://github.com/arunendapally/arunendapally-aisdlc/pull/2
[0.1.0]: https://github.com/arunendapally/arunendapally-aisdlc/commit/6007864
