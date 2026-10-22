# Changelog

All notable changes to this repository. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

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
