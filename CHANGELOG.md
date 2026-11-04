# Changelog

All notable changes to this repository. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Templates at every stage, and db-design.md as the data contract

A council of five experts drafted each stage's templates, five sceptics tested the drafts against the parsers and against each other, and research on PRDs, Gherkin, C4, design docs, ADRs, release plans and postmortems fed both. The record: `docs/decisions/2026-11-04-templates-at-every-stage.md`.

- **Every template shows a filled example in its comments instead of prose,** keeps one running story per lane (saved items for features, checkout timeouts for the hotfix and its postmortem, a lodash bump for a task), marks unchecked claims `[unconfirmed]`, and says which of its sections the gate checks.
- **Bugs the old templates had:** a blank `release.md` passed the outcome check and recorded "<the PRD's outcome metric>" as the metric; every new knowledge page failed `sdlc knowledge check` on a sample link; the bug, task and hotfix bodies lacked `Lenses run:` and `Revert:`, which Verify and CI require; every task-lane PR failed CI for want of `## Summary`; the hotfix's visible `Live: <sha>` made an unprobed Probes section look filled; the ADR's untouched Status line passed; the overview's placeholder row passed Design; `plan.md`'s own ER example failed its lint; the risk table in the PR body was wrong (`.github/` is high; copy inside code is medium).
- **C4:** Level 1 (System Context) in Mermaid in `architecture-overview.md`; Level 2 in `plan.md` when a container is added or changed, Level 3 only when a component is added, removed or rewired, and no Level 4 (a sequence diagram only where ordering, retries or concurrency decide correctness).
- **`db-design.md`, the data contract the DBA owns,** as `openapi.yaml` is the API's: data impact at Plan, the ER diagram of the change and the expand-contract plan at Design (at Build in the light lane, which never asked for them before), rehearsal and down migration at Build, backout at Release. Plan and Design approvals cover their own sections; filling the later ones does not lapse them. `plan.md` "## Data model" says "See db-design.md.". A data feature started before this change keeps its sections where they were, so its approvals hold.
- **The ADR has a "Confirmed by:" line** (the check that fails if the code breaks the decision), and its `## Review` is questions and answers, not a link. The repo's ADR template is the same file, and a test keeps it so.
- **The postmortem keeps the trigger apart from the root cause,** asks why each check missed it, and records where we got lucky; each miss becomes a dated action with an owner. **The release** opens with a three-line Decision, lists its order as a checklist, and records the rollback's command, test date, duration and what it leaves behind.
- Tests in `tests/db-design.test.mjs`.
### Checks that passed on what nobody wrote

From the council on templates (its later changes 1 to 3).

- **A value must be on its own line.** `Metric:`, `Owner:`, `Risk:`, `Open findings:`, `Lenses run:` and `Revert:` read across a line break, so an empty one passed on the next line's text, and the outcome follow-up recorded "Owner: Priya" as the metric. A value holding a `<placeholder>` is not a value either, and `**Metric:**` is read without its stars.
- **A failed probe stops the release.** "## Probes" passed on any result word, "fail" included. A probe's result is read from its last table cell, or from the words after its last ": ": "5xx rate: ok, was red yesterday" passed, "checkout: FAIL, expected pass" failed. A table's header row is not a probe.
- **A rollback is tested on a date it ran.** "Not tested yet, planned 2026-11-05" passed. Now the date must follow "Tested:" ("**Tested:**" and "Tested on" too) and be no later than today.
- **"None, because" in `facts.md` counts only under "## Facts".** Under Not found it passed a feature with no facts. Brownfield work still needs a fact; greenfield data work may say "None, because ..." under "## Facts".
- Considered, not done: running the full-lane check on a "None, because" security reason. A pattern cannot tell "no personal data is stored" from a reason that touches it, and the first is a deliberate light-lane answer (`tests/nonfunctional.test.mjs`).
- Tests in `tests/harden.test.mjs`; golden eval `release-needs-tested-rollback` gains a failed probe and a planned date.

### Every test file runs

- **`npm test` runs every `tests/*.test.mjs`,** by a quoted glob that node expands, instead of a hand-kept list. Merging two branches that each added a file to the list dropped one of them silently; now a new test file runs without being listed.

### The proof and the test matrix say only what is true

Found in the unit-converter run (that repo's `docs/plugin-feedback.md`, V1 to V3 and B2).

- **The proof names only criteria a test traces.** It listed all 29 criteria as "failed on the base code and pass here" while six had no test. Now it proves the traced ones and adds "Not proved, no test traces them: AC-21, AC-29."; with none traced it says which criteria still need a test.
- **Fixed: the proof counted criteria the base already had.** The check that leaves them out wrote `\b` inside a template string, which is a backspace, so it never matched: a second slice of a feature re-proved the first slice's criteria.
- **A base holding only the init-repo scaffold is greenfield.** The standards, `.github` scripts and `.claude` rules `sdlc init-repo` copies counted as code, so the "Greenfield" note never showed in a new repo.
- **A Markdown file never names a test.** The plugin's own `standards/traps.md` cited "AC-7", and `sdlc tests` told the product to rename it as a test. The "not a recognised test file" hint now skips `*.md`, and the repo template's `traps.md` names the plugin test by file, not by id.
- **End-to-end tests do not count toward the PR line limit,** in the gate and in CI alike: exactly the paths the test matrix calls e2e (`e2e/`, `tests/e2e/`, `test/e2e/`, `playwright/`, `*.e2e.*`, `*.e2e-spec.*`). A product folder such as `src/e2e/` still counts.
- Tests in `tests/proof-accuracy.test.mjs`.
### Requirements, not solutions

The unit-converter run's PRD named a meta tag, a commit sha, a workflow, a Node module and browser storage in its requirements. The light lane has no Design stage, so the solution had nowhere else to go, and nothing checked.

- **The PRD template says it:** a requirement is what a user or the business can observe, true whatever is built. `Data needed: <fields>` is now `Needs: <information, in plain words>`. The outcome metric is value to users or the business; uptime is a release probe. Each section shows a filled example in its comment instead of prose, with one running example (saved items) whose requirements, non-functional lines and scope agree. The template now has `## Intent` (the request writes the person's words there) and an optional `## Constraints` for solutions a person already chose, with who chose them. Stakeholders and Release criteria are gone (both were optional and restated the brief or the gate); Dependencies stays optional.
- **`## Approach` in `tasks.md` is required at Build in the light lane:** it is that lane's design (what changes, where it lives, the one arguable choice). In the full lane it is optional and links `plan.md`. `tasks.md` also opens with the spec links, the baseline and the line budget, and each task gets "done when" and "traps" lines.
- **The Plan gate warns** when a requirement or a scenario step names a mechanism: code in backticks, real markup, a file, an identifier (`saved_items`, `useEffect`), an endpoint, a status code, or named storage or technology (Postgres, React, local storage, GitHub Actions). It reads only signs that are almost never a need, so business words such as branch, queue, table or commit do not fire. In api work the endpoints, status codes and fields are the requirement, and in data work the datasets are, so those signs are skipped. It never refuses. `tests/fixtures/solution-corpus.json` measures it: no need is flagged, and at least 85% of solutions are; add a line whenever it is wrong in a real run.
- **The product owner** writes needs, asks at most three questions, and passes solution ideas to the architect or tech lead; the tech lead writes the Approach.
- **Fixed: the CTO's intake did not look at the folder** when told not to run commands. Looking is not running: it reads with Glob, Grep and Read, or read-only `ls`, `find` and `grep` where those tools are missing, and names each file it found.
- Agent eval `product-owner-assumes-instead-of-asking` now accepts any unconfirmed assumption, not only A1: an assumption the request itself states is rightly confirmed.
- Tests in `tests/solutions.test.mjs`, golden eval `requirements-not-solutions`, agent eval `product-owner-states-needs-not-solutions`.
### A broken gate command is named, and the gate records its runtime

Found in the unit-converter run (that repo's `docs/plugin-feedback.md`, P2 and B1).

- **A gate command that cannot start is named as the command.** `node --test test/` fails on Node 22 before any test runs, and the first Build run read it as a new repo ("Nothing passes yet ... the baseline is 0"). Now, when what is missing is the command's own program or a file or folder it names, the gate says "The gate command failed before any test ran (Cannot find module ...)", asks a person to fix `gateCommand`, records the run as red and sets no baseline. A module a test imports that is not written yet is still the ordinary red-first run, in a new repo and as a bug's repro.
- **The gate records its runtime:** `runtimeCommand` (default `node --version`, run like the gate) with each run and with the baseline, and prints "RUNTIME CHANGED" when they differ. A newer Node cancelled 43 and failed 12 of 88 subtests that were never awaited, and nothing said the runtime had changed. A green run that raises the baseline moves its runtime too.
- **The gate clears `NODE_TEST_CONTEXT`** before running, as the proof already did, so a node test runner inside another one runs its tests instead of skipping them.
- **A starter trap, "Subtests that were never awaited",** in the repo template's `standards/traps.md`, and the getting-started guide gives the quoted `node --test "test/**/*.test.mjs"` form.
- Not done: `sdlc init-repo` does not run the gate command once; the first `sdlc gate` names a broken one instead.
- Tests in `tests/gate-runtime.test.mjs`.
### A read may silence its errors; process substitution is refused

- **Fixed: `ls .ai-sdlc .github/workflows 2>/dev/null` was refused** as a write to a guardrail, and the refusal counted toward the cap that holds the session. Sending output to `/dev/null` (`>/dev/null`, `2>/dev/null`, `&>/dev/null`) or stderr to stdout (`2>&1`) writes no file, so a listed read with it is allowed, and `stat` joins the listed reads. Only those exact bytes count: `2>nul` (a real file in Bash), `2>/DEV/NULL`, a no-break space or any other redirect is still refused. Found in the unit-converter run (G1).
- **Fixed: process substitution ran unchecked.** `ls .ai-sdlc <(touch .ai-sdlc/PAUSED)` was allowed, because `<(...)` holds no `>`, `$(` or backtick. A segment that names a guardrail with `<(` or `>(` is now refused.
- Not done: a refused read-only command still counts toward the refusal cap.
- Tests in `tests/hooks.test.mjs`.

## [0.6.0] - 2026-11-02

Issues [#26](https://github.com/arunendapally/arunendapally-aisdlc/issues/26) to [#29](https://github.com/arunendapally/arunendapally-aisdlc/issues/29), the calculator run's open findings, agile change 2, the rest of the human-asks record, and agent evals that cannot touch the person's accounts.

### Systems under change and work packets ([#27](https://github.com/arunendapally/arunendapally-aisdlc/issues/27) d, [#26](https://github.com/arunendapally/arunendapally-aisdlc/issues/26))

- **A feature-level `architecture-overview.md`** (new template) holds `## Systems under change`: system or repo, change type (new, modified, config-only, consumer-only (verify)), owner, contract impact, data impact and deploy order, written before the tasks. One repo needs none of it.
- **Build checks it both ways:** tasks that name more than one repo need the overview; every repo a task names must be in the table, and every new or modified system needs a task. Design checks the change types when the overview exists.
- **`sdlc packets <feature>`** prints one packet per repo, in deploy order: its tasks, the scenarios they prove, and the tasks it waits on in another repo. Printed, never written, so the specs stay the one source.
- Tests in `tests/systems.test.mjs`.

### Fixed before release, from the pre-review of v0.6.0

- **"This repo" is named by its `origin` remote,** falling back to its folder, so a worktree or a renamed clone is no longer read as a second repo.
- **An aligned table separator** (`|:---|`) is not read as a system.
- **Task lines in other common shapes** (`- T1`, `1. [ ] T1`, `- [ ] **T1**`) are checked like `- [ ] T1`; before, they passed every task check unseen.
- **More auth and personal-data wording routes to the full lane:** OAuth, SSO, login, sign-in, credentials, access tokens, email and home addresses, phone numbers, GDPR.
- **A failed or empty file listing of the base is never called greenfield.**
- Tests in `tests/prereview-060.test.mjs`.

### Non-functional requirements in every PRD ([#29](https://github.com/arunendapally/arunendapally-aisdlc/issues/29))

In the light lane, the default for new behaviour, a feature could ship without anyone saying what "fast enough" or "safe enough" means.

- **`prd.md` has `## Non-functional requirements`:** one line each for performance, security and privacy, accessibility, and limits and quotas. Each names the requirement that states it (`R3`), so `acceptance.feature` must test it, or says "None, because ...".
- **The Plan gate checks it** like the other sections. A missing line, a line that is neither a requirement nor "None, because ...", or a requirement that does not exist is refused, and the first refusal says what each line expects.
- **A security and privacy need that touches auth, payments or personal data needs the full lane,** the same route as a high-risk path at Build: in the light lane the request asks a human for `sdlc lane <feature> full`, and under autonomy the feature moves itself.
- Tests in `tests/nonfunctional.test.mjs`. The shared test PRD and five golden PRD fixtures gain the section.
### Task order as data, two plan sections, and a contract field check ([#26](https://github.com/arunendapally/arunendapally-aisdlc/issues/26))

- **Every task says what it waits for.** A task in `tasks.md` ends with `depends-on: [T1, T2]`, or `depends-on: []` when it waits for none. The Build gate refuses a missing list, a dependency on a task that does not exist, and a loop (it names the loop, for example `T1 > T3 > T2 > T1`). The tech lead releases batches in that order and can run tasks with nothing unfinished before them in parallel.
- **`plan.md` has `## Error handling`** (the errors callers get, what is retried, what users see) **and `## Data and tenancy`** (how data is scoped to its owner or tenant). The Design gate checks both like the other sections, and its first refusal says what each expects. Security, observability, performance and rollback were already covered by the Threat model, Run it, Test plan and `release.md`, so there is no new checklist.
- **Field names the contract does not define are a warning.** At Design and Build, when the feature has `openapi.yaml`, names in `acceptance.feature` and `tasks.md` that look like fields (snake_case or camelCase, in backticks or quotes) and that the contract never defines are listed. It never refuses; it becomes blocking only if it proves reliable.
- Not in this change: work packets per repo, which wait for a design decision.
- Tests in `tests/tasks.test.mjs`.
### A record of how a big capability was sliced ([#28](https://github.com/arunendapally/arunendapally-aisdlc/issues/28))

`start` slices a big capability into features, but nothing recorded the slices, their order or which had shipped.

- **`specs/<capability>/slices.md`**, from the new `slices.md` template: the capability's outcome, then one line per slice with its slug, what it delivers, what it depends on and its status. `start` writes it when it slices work. It is a record, not a stage: no gate, and no PRD or plan for the capability.
- **`sdlc init <slug> --capability <capability>`** names the capability in the slice's `prd.md` and its state, and refuses a capability with no `slices.md`.
- **`sdlc status`** shows each capability with its slices: the stage of each slice that is a feature, and the written status of each one not started, with what it depends on.
- Tests in `tests/slices.test.mjs`.
### `start` builds on what is there, assumptions instead of questions, and a second repo moves up a lane ([#27](https://github.com/arunendapally/arunendapally-aisdlc/issues/27))

- **`start` looks before it triages.** It looks in the folder for drafts, requirements, architecture notes and code. If it finds any, it asks one question that names them: build on it, or start fresh? In an empty folder it asks nothing.
- **The product owner asks only what is essential:** a decision that cannot be undone, a conflict with the existing docs, or a fork where a wrong guess means redoing most of the work. Everything else goes into the PRD's existing `## Assumptions` as `[unconfirmed]` and into `## Open questions`, which the Plan gate already checks. No new mechanism.
- **A task in a second repo moves light-lane work up to the full lane.** A task in `tasks.md` with `repos: [web]` naming a repo other than this one is refused in the light lane with "ask a human to type `sdlc lane <feature> full`", and under autonomy moves the feature to Design itself, as a destructive migration or a high-risk path already did. A schema change already needed the data kind, so it is unchanged.
- Agent evals `cto-intake-names-what-it-found`, `cto-intake-empty-folder-asks-nothing` and `product-owner-assumes-instead-of-asking`, and a test in `tests/lanes.test.mjs`.
### Agent evals run apart from the person's own setup

- **Fixed: an agent eval could act on the person's accounts.** `claude -p` loaded the person's MCP servers, hooks and plugins, and one run added a task to their Todoist. The runner now passes `--strict-mcp-config` (no MCP servers) and `--setting-sources project,local` (no user settings).
- **The product owner no longer grades evidence** (Established, Moderate, Preliminary). ADR-0003 removed `## Evidence` from `prd.md`, and an unproven claim already goes in `## Assumptions` as `[unconfirmed]`. Its eval, which failed on every run for that line, is now `product-owner-writes-the-brief`.
### The calculator run's open findings ([log](docs/feedback/2026-10-29-calculator-run.md))

- **F-7, a new repo's first gate:** the first Build run with nothing passing says the baseline is 0, which is expected, and to write the first test and see it fail before the code. `build.md` says the same.
- **F-9, a new repo's proof:** when the base commit holds no code, the proof passes with a "Greenfield" note: the tests failed there because the code is missing, not because they check its behaviour.
- **F-8, reading state:** the guard still refuses an interpreter (`node -e`) on feature state, since it could write, and the refusal now says to run `sdlc status <feature> --json` or use the Read tool.
- **F-23, stale ledger locations:** an open or wontfix finding whose line is past the end of its file is refused until it points at the code as it is now.
- **F-22 is closed by design:** a new scenario for an existing requirement still sends the spec back for approval, since it changes what "done" means.
- Tests in `tests/calculator-run.test.mjs`.
### The outcome follow-up in the light lane, and an Objective line (agile change 2)

From [docs/decisions/2026-10-25-agile-with-agents.md](docs/decisions/2026-10-25-agile-with-agents.md): most features run in the light lane, where nobody was asked whether the change worked.

- **The light lane opens an outcome follow-up at release,** read after 7 days (the full lane keeps 14). Release in the light lane now needs `Metric:` and `Owner:` under `## Outcome metric`, or `Metric: None, because ...`, which opens none. An overdue outcome is a reminder in `status` and at session start, never a block on the next feature. A repo turns it off with `"outcomeWindowDays": { "light": 0 }`.
- **`prd.md` asks for an `Objective:` line** beside the outcome metric: the objective or OKR key result the feature moves, so features roll up to one.
- Tests in `tests/loop.test.mjs`.
### The rest of the human-asks record ([decision](docs/decisions/2026-10-25-fewer-better-human-asks.md))

- **`sdlc outcome` shows the person their own drop-if line** from their intent, when the outcome is read. It is shown, never required as a note (ruling 6).
- **Rubber-stamp signals, per gate and never per person** (ruling 5): `sdlc metrics` and the retro report list, for each gate a person approved (lane:stage), the number of approvals, the fastest, median and slowest time to approve, and the longest run with no rejection and no human finding (an H row at review). Gates passed on checks are left out. There are no thresholds until a human picks them from real data.
- **The product owner recommends no answer on intent, taste or risk,** and a wholesale "go with your recommendations" is recorded as `(recommended, accepted)` with its assumption kept `[unconfirmed]`. It is a rule the agent follows, not a hook, as the decision says.
- Tests in `tests/human-asks.test.mjs`, and agent eval `product-owner-records-accepted-recommendations`.

## [0.5.2] - 2026-10-30

- **The gate and proof scripts no longer count toward PR size.** The scripts `gateCommand` and `proofCommand` run, directly or through an npm script, are the harness the plugin asks a repo for, not the change under review. A first feature with its own gate scripts was refused at 305 of 300 lines for them (finding F-26).

## [0.5.1] - 2026-10-30

### Agents talk to people briefly

- The repo rules and the skill tell agents to lead with the outcome or the one thing the person must do, in a few lines, and not to ask again for a step the person already agreed (owner feedback, 30 Oct).

### The Plan gate says what it expects, the first time ([#17](https://github.com/arunendapally/arunendapally-aisdlc/issues/17))

A brownfield and data feature took three rounds of refusals at Plan, each fixing something the previous message did not explain.

- **Every artefact a kind needs is there before the agent writes:** `sdlc init` and `sdlc kind` copy `facts.md` for brownfield and data work and add each kind's PRD sections (`## Current system`, `## Data impact`) to `prd.md`.
- **A fact in the wrong shape is named, with the expected shape.** A line that starts like a fact (`- **F1.`, `* F2`) is reported as "looks like a fact but is not in the expected shape" with the format, instead of "facts.md has no facts" plus one "does not define" per cited fact.
- **An assumption tag may name its evidence:** `[confirmed: src/a.ts:3]` and `[confirmed, code]` are accepted, and the refusal says what a valid tag looks like.
- Tests in `tests/gate-messages.test.mjs`, including one request listing every problem at once.

## [0.5.0] - 2026-10-29

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

### The guard judges the repo an action targets (F-4 of the calculator run)

From [docs/feedback/2026-10-29-calculator-run.md](docs/feedback/2026-10-29-calculator-run.md), where a session sitting in the plugin repo built a calculator in another repo.

- **Fixed: a write into another repo skipped every check.** A Write, Edit, MultiEdit or NotebookEdit outside the session's repo is now judged by the repo that holds the file, when that repo has the plugin set up (`.ai-sdlc` or `specs/`): its guardrail files, artefact order, intent, stage, lane, autonomy, pause flag and branch. A file in a repo without the plugin, or outside any repo, is not judged, as before.
- **Fixed: a command that starts with `cd <path> &&` or `Set-Location <path>;` was judged by the session's branch.** Committing on a protected branch, pushing to one, the first push of a new repo and the preview check now use the branch and remote of the repo the command changes into. Text rules (deploys, production, secrets) apply as before.
- Git is asked about another repo only when the target is outside the session's repo. Tests in `tests/hooks.test.mjs`.

### Knowledge pages in the Open Knowledge Format

`knowledge/` is now an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) (OKF 0.2) bundle, so tools that read OKF can read what agents learned.

- **The page format is OKF:** `type`, `title`, `description`, `sources` as `- resource: <path>`, `generated: { by, at }` and `verified: [{ by, at }]`, plus the plugin's own `verified_commit` and `confidence`. The knowledge template and `/ai-sdlc:learn` write this format. Pages in the older format (`name`, `sources: [paths]`, `verified: <commit>`) are still read and checked, and go stale the same way.
- **Staleness stays git-based:** a page is stale when a source changed since `verified_commit` (or the older `verified`). An OKF `stale_after` in the past also makes it stale; sources that are URLs are not looked for on disk.
- **The frontmatter reader handles nested YAML:** block and flow lists and mappings, quotes and comments, with no new dependency.
- **`sdlc knowledge index` writes `knowledge/index.md`** in the OKF shape (`okf_version: "0.2"`, one `* [Title](page.md) - description` line per page) and replaces the older `INDEX.md`. It adds what changed (created, updated, removed pages) to `knowledge/log.md`, newest first. The autopilot mod reads `index.md`, falling back to `INDEX.md`.
- **`sdlc knowledge check` reports OKF conformance:** every file but `index.md` and `log.md` needs frontmatter with a non-empty `type`. Files that are not OKF are listed as `NOT OKF` and do not fail the check. The repo kit's `knowledge/README.md` now has frontmatter, so a new repo's bundle conforms.
- `tests/knowledge.test.mjs`.

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

[0.5.2]: https://github.com/arunendapally/arunendapally-aisdlc/releases/tag/v0.5.2
[0.5.1]: https://github.com/arunendapally/arunendapally-aisdlc/releases/tag/v0.5.1
[0.5.0]: https://github.com/arunendapally/arunendapally-aisdlc/releases/tag/v0.5.0
[0.4.0]: https://github.com/arunendapally/arunendapally-aisdlc/releases/tag/v0.4.0
[0.3.0]: https://github.com/arunendapally/arunendapally-aisdlc/releases/tag/v0.3.0
[0.2.0]: https://github.com/arunendapally/arunendapally-aisdlc/pull/2
[0.1.0]: https://github.com/arunendapally/arunendapally-aisdlc/commit/6007864
