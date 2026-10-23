# Changelog

All notable changes to this repository. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[0.2.0]: https://github.com/arunendapally/arunendapally-aisdlc/pull/2
[0.1.0]: https://github.com/arunendapally/arunendapally-aisdlc/commit/6007864
