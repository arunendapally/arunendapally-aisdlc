# Council: templates at every stage

*2026-11-04. Chaired by the CTO agent. Accepted under the owner's instruction of the same day to run without a person at each step; landed with the db-design.md gate wiring and the tests named below.*

## The brief

The owner asked for better templates at every stage, judged by three rules: clarity over repetition, accuracy over bluff, consistency over randomness. Directions given: C4 Level 1 as Mermaid in architecture-overview.md and Levels 2 and up in the technical design (plan.md); the ER diagram moves into a new db-design.md, a data contract like openapi.yaml that shows the delta. Later direction: the PRD is functional, not technical. It says what people and the business need and why; code, APIs, tables, fields, hosting and deploy mechanics belong in plan.md, db-design.md and openapi.yaml. The template now says so, its "Data needed: <fields>" became "Needs: <information, in plain words>", and its examples carry no technical detail.

Five experts drafted (product owner, architect, tech lead, QA, SRE); five sceptics tested the drafts against the real parsers and against each other (plan, design, build, release, consistency). The final set is 17 templates: the 16 in skills/org-ai-sdlc/templates/ plus db-design.md.

## Proposals and verdicts

| Template | Proposed by | What the expert proposed | Sceptic's verdict |
|---|---|---|---|
| prd.md | product owner | Intent, job lines, one worked example, gate rules in the header | Accept with 3 must-fix: the Security example taught the lane escape, the Objective example leaked template text, the gate-refuses list repeated the gate |
| acceptance.feature | product owner | Saved-items example, refusal list, level tags | Accept, no must-fix; should add a boundary row and a journey Then |
| facts.md | product owner | One shape line, governing fact, Not found | 2 must-fix: "None, because" in Not found lets a data feature with no facts pass (scripts/facts.mjs:60); incomplete not-implementation list |
| slices.md | product owner | Outcome and slice line shapes | 1 must-fix: save-share both "later slice" and "dropped (Q4)", and Q4 does not exist |
| plan.md | architect | Summary with a requirement map, C4 L2 to L4, examples per section | 4 must-fix: "(unconfirmed)" marker, Level 4 mislabelled, Level 3 too loose, L2 example with no boundary and drifting names |
| adr.md | architect | Guidance and example per section; one copy with the repo kit | 1 must-fix: add MADR Confirmation |
| architecture-overview.md | architect | C4 L1 Mermaid, exact table rules, Between deploys | Accept; marker and "required" wording |
| db-design.md | architect (with the dba role) | New file: Data impact, Data model (delta ER), Migration plan, Rehearsal, Down migration, Backout | Accept; needs gate wiring in code (below) |
| tasks.md | tech lead | Baseline, budget, one line per task with done-when and traps | 1 must-fix: the depends-on rule was worded unlike the code (scripts/sdlc.mjs:73) |
| task.md | tech lead | Shared Pre-review block, Summary for CI | 2 must-fix: test counts contradicted each other; Not verified cited a repro the lane does not have |
| bug.md | tech lead | Shared Pre-review block, proof route, caused-by lesson | 1 must-fix: the Repro comment ran the red-gate and proof routes together |
| hotfix.md | tech lead | Shared Pre-review block, Live moved into the comment | Should-fix only |
| pr.md | QA | Corrected risk table, Checked mechanically and Could not check lines | Must-fix shared by four files: the risk table was still wrong three ways (scripts/loop.mjs:334-346) |
| review.md | QA | Filled ledger rows, cell rules | Pass |
| release.md | SRE | Decision, Order, tested rollback, probe table, Backout | No must-fix; cut repeated steps, Backout belongs to data work only |
| incident.md | SRE | Blameless postmortem with sourced timeline and Actions | No must-fix; add Trigger, "where we got lucky", earlier incidents |
| knowledge-page.md | SRE | New frontmatter, body sections | 1 must-fix: the description line was not valid YAML |

## What changed, per template

- prd.md: safe Security example ("Naming auth, payments or personal data ... needs the full lane"), 14-day metric that can be read at day 14, job-story lines, "Or: None, because" everywhere; 115 to 106 lines.
- acceptance.feature: AC-2 is the boundary (0 and 1 earlier saves), AC-3 reads as a journey, "no Feature: line" in the refusal list.
- facts.md: Not found's empty form is "Nothing missing; searched <where>." with the reason; full not-implementation list; saved-items facts.
- slices.md: save-share planned, 14-day outcome, PR limit linked to tasks.md, "behind a flag" dropped (no source for it).
- plan.md: C4 levels per the owner (L1 elsewhere, L2 when a container changes, L3 only when a component is added, removed or rewired, no L4); Summary gains Not doing and Open; "## Data model" says "See db-design.md." for data work; one example per section; 163 to 121 lines.
- adr.md: MADR "Confirmed by:" as the Decision's last line; the repo kit copy is now the same file.
- architecture-overview.md: L1 C4Context example matching the table; "required by this process, not checked by the gate".
- db-design.md: new. The delta ER (columns marked "added", "altered: <from> to <to>", "dropped"), expand-contract steps with lock time and undo, Rehearsal at Build, Backout for Release.
- tasks.md: header in the common shape, one home for every lane's line limit, depends-on rule as coded, repos syntax, down migration pointed to db-design.md.
- task.md, bug.md, hotfix.md, pr.md: one Pre-review instruction block, byte-identical in the four, with the accurate risk floor; each lane's own example (lodash, a saved-items bug, checkout-timeouts, saved items).
- review.md: header in the common shape; saved-items rows.
- release.md: steps that repeated the gate cut, rehearsal and backout point to db-design.md, Decision says no check reads it, window stated once (outcomeWindowDays); 95 to 84 lines.
- incident.md: retold as checkout-timeouts to match hotfix.md; Trigger line, "Where we got lucky", "Earlier incidents with this cause".
- knowledge-page.md: valid YAML, four "# e.g." lines cut, saved-list example.

Across all 17: one header shape (stage or lane, Owner, Gate); one empty-section sentence; "Or: None, because ..."; "[unconfirmed]" as the single marker for any claim not checked; "Example:" before every sample and "Not:" before a counter-example; "file:line" from the repo root; one running example per family (saved items for feature files, bug and knowledge; checkout-timeouts for hotfix and incident; lodash for task), with ids, people and shas that agree. No em dashes.

## Contested points and how they were settled

- **Risk table.** QA's draft table claimed "data" and "infrastructure" were high and missed .mcp.json and *.txt. Settled on the build sceptic's table, which reads riskTier and DEFAULT_CONFIG (scripts/loop.mjs:334-346, scripts/lib.mjs:95-96): low is only *.md, *.txt, docs/ and specs/; auth, payments and migrations folders are always high. The "high" line keeps exactly four spaces before "auth, payments" for tests/review.test.mjs:169.
- **task.md "## Summary".** Kept. CI picks the lane from the body and checks a task body as full, which needs Summary (templates/repo/.github/scripts/check-pr-body.mjs:13-16). It goes when CI learns the task lane (later change 5).
- **Spec Kit [P] markers and phases.** Not adopted. depends-on already encodes order and parallelism (scripts/sdlc.mjs:65-76); a second marker can disagree with it.
- **Y-statement in the ADR.** Not adopted. The title states the decision and the Decision's first line names the option; a Y-statement would repeat both.
- **C4 Level 3 and Level 4.** L3 only when a component is added, removed or rewired; no L4, with a sequenceDiagram (a C4 dynamic view) only where ordering, retries or concurrency decide correctness.
- **Backout placement.** The data backout, rehearsal and down migration live once, in db-design.md. release.md and tasks.md point to it. The gate wiring landed with the templates: the gate asks for each section in db-design.md at its stage (tests/db-design.test.mjs).
- **db-design.md against "no new document where a section will do".** A new file won, because the data sections are due at four different gates and today land in four different documents (prd, plan, tasks, release; scripts/lib.mjs:57-60). One file the dba owns, read like openapi.yaml, replaces four scattered sections; plan.md keeps "## Data model" as a required one-line pointer so undeclared data work still shows.
- **Marker.** The consistency sceptic proposed "[unverified]" beside the PRD's "[unconfirmed]". The owner's brief asked for one marker, so "[unconfirmed]" is used everywhere. Only prd.md "## Assumptions" is parsed for it (scripts/facts.mjs:88, scripts/sdlc.mjs:485); elsewhere it is for the reader.
- **"None, because" in facts.md.** The one exception to the house wording, until later change 3 scopes the check: in Not found it would pass a data feature with no facts.
- **Size.** plan.md is 121 lines, over the 100 target: ten required sections plus Summary and C4, each with one example, and the Mermaid example alone is 17 lines. prd.md is 106. Every other template is 84 or under.

## Level 1 in single-repo work (settled on the recommendation)

architecture-overview.md is only required when tasks span repos (scripts/sdlc.mjs:120), so a single-repo full-lane feature has no L1 view. Recommended, and written into plan.md "## C4 views": single-repo work draws L1 in plan.md only when the system context changes (a new person or external system); otherwise one line, "Level 1: unchanged (workspace.dsl)". Alternatives: (b) every full-lane feature writes architecture-overview.md; (c) always link docs/architecture/workspace.dsl and never draw L1 per feature.

## Bugs in today's templates that the new ones fix

1. plan.md's own ER example fails its lint: LOYALTY_POINTS is in "%% changed:" with no attribute block (skills/org-ai-sdlc/templates/plan.md:16-18; scripts/contracts.mjs:29).
2. Small-lane Pre-review stubs: "Risk: low | medium | high, and why" left untouched reads as "Risk: low", and there is no "Lenses run:" or "Revert:", so gate 5 refuses (task.md:18, bug.md:25, hotfix.md:23).
3. pr.md's risk floor is wrong: "documents, copy and specs" low, "data" high, .github missing (pr.md:15-17).
4. A task-lane PR fails CI: no "## Summary" (check-pr-body.mjs:13-16).
5. release.md placeholders after "Metric:" and "Owner:" pass the gate and are recorded as the metric (release.md:28-29; scripts/loop.mjs:171).
6. hotfix.md's visible "Live: <sha>" makes an unfilled Probes section non-empty (hotfix.md:36).
7. adr.md "Status: proposed | accepted | superseded by ADR-NNNN" passes the status check untouched (adr.md:3); the repo kit copy still says "board" (templates/repo/docs/adr/0000-template.md:11,21).
8. architecture-overview.md's placeholder row says "modified", so it passes Design untouched, and offers slash-separated values agents copy (architecture-overview.md:15).
9. knowledge-page.md's "[[file-name]]" makes every new page invalid (knowledge-page.md:35).
10. prd.md's visible "- R1. (must) ... Data needed: ..." passes the empty-section check (prd.md:32).
11. Data work is told nothing about the sections the gate demands (scripts/lib.mjs:58) or "## Changes since vN" (scripts/sdlc.mjs:300).

## Code changes the templates cannot make

Must (a template depends on it). All five landed with the templates:

1. **db-design.md gate wiring.** scripts/lib.mjs:57-60 KINDS.data gets `artefact: 'db-design.md'` and headings `{1: Data impact, 3: Data model, Migration plan (expand-contract), 4: Rehearsal, Down migration, 6: Backout}`; scripts/lib.mjs:72 stageSpec returns the kind artefact with every heading due up to this stage (so the light lane gets stage-3 sections at stage 4); scripts/lib.mjs:249 missingHeadings checks it and names "sdlc kind <f> data" when the file is missing. Without this, data work is still asked for "## Backout" in release.md (verified) and the other sections in prd, plan and tasks.
2. scripts/sdlc.mjs:199 scaffoldKinds copies db-design.md for kind data and stops appending "## Data impact" to prd.md.
3. scripts/sdlc.mjs:182 runs erProblems on db-design.md, not plan.md, and also at Build in the light lane; scripts/contracts.mjs:14 names db-design.md in its message. Until then plan.md's "See db-design.md." draws an ER warning (warning only).
4. scripts/loop.mjs:357 gateFingerprint hashes the db-design.md sections due at stages 1 and 3, not the whole file, so Build sections do not lapse an approval; scripts/review.mjs:80,110 count db-design.md as the ER change.
5. Tests that pin the old homes: tests/gate-messages.test.mjs:17, tests/lanes.test.mjs:87 and :119, tests/quality.test.mjs:378 (AC-17); add one for the light lane at stage 4.

Later (hardening; the templates stand without them). Status as of this change: 6 (ADR sync test, tests/db-design.test.mjs) and 10 (docs) land with the templates; 9 (the PRD stays functional) landed in #40; 1 to 5, 7 and 8 are open, for the next change.

1. Metric:, Owner:, Lenses run: and Revert: use `\s*`, which crosses a newline, so an empty value takes the next line (scripts/loop.mjs:171, scripts/sdlc.mjs:429-430, check-pr-body.mjs:37): use `[ \t]*`.
2. A failed probe passes Release (scripts/loop.mjs:168); the Tested regex accepts a planned date (scripts/loop.mjs:166).
3. facts.md: "None, because" anywhere passes a data feature with no facts (scripts/facts.mjs:60); scope it to "## Facts" and require a fact for data work. Then facts.md can use the house wording.
4. "None, because" skips the high-risk check on Security and privacy (scripts/sdlc.mjs:156 runs before :160): run HIGH_RISK_NEED on it too.
5. CI task lane: detect "^## Behaviour change" in check-pr-body.mjs:13-16, then drop "## Summary" from task.md.
6. ADR sync test after tests/review.test.mjs:166: templates/repo/docs/adr/0000-template.md equals skills/org-ai-sdlc/templates/adr.md.
7. Tests that every blank template is refused by its gate, and its uncommented example passes.
8. *.txt in DOCS_ONLY makes a requirements.txt bump low risk (scripts/loop.mjs:335).
9. The PRD stays functional: the api kind's stage-1 heading "## API changes" (scripts/lib.mjs:54) asks for interface detail in the PRD; move it to Design (or to openapi.yaml), and keep in the PRD only who gains or loses what. agents/product-owner.md says the same: no fields, endpoints or mechanisms in requirements. A product-owner eval that fails on a technical requirement (for example a meta tag or an endpoint in an R line).
10. Docs: skills/org-ai-sdlc/SKILL.md:88 lists legacy knowledge frontmatter; agents/product-owner.md:15 lists sections the PRD does not have (goals, stakeholders, release criteria); agents/dba.md:13-17 and commands/design.md:10 put the ER diagram, rehearsal and backout in plan.md and release.md.

## What stays human

Every gate approval; merge, apply and deploy; declaring a hotfix; running a down migration in production (db-design.md Backout names a person); the Review answers in an ADR; the outcome read; postmortem owners and dates. Templates make a bluff easier to see; they do not replace the person who judges it.

## How it was checked

In a scratch copy of the repo (scratchpad/final-check) with the 17 templates installed, pr.md also at templates/repo/.github/pull_request_template.md and .github/pull_request_template.md, adr.md also at templates/repo/docs/adr/0000-template.md:

- `npm test`: 181 pass, 0 fail (one failure on the first run: tests/gate-messages.test.mjs:15 pins facts.md's shape line; restored).
- Blank refused, example passes: prd.md through `sdlc request` (blank: 9 empty sections, 4 Non-functional lines, no R ids; filled: reaches the product lead); facts.md for data work with the template's Not found wording is refused for having no facts; plan.md all 8 required sections empty, examples fill them; adr.md blank fails 4 sections and 0 options, filled passes; architecture-overview.md placeholder row refused; db-design.md blank empty and no ER, filled passes erProblems; tasks.md blank 0 tasks, filled T1, T2 with depends-on, no "repos:" on a task line, no field-shaped quoted names; pr, task, bug and hotfix blank fail CI on every section, filled pass CI and the Pre-review lines; review.md blank 0 rows, example 4 rows none malformed; release.md blank refused 4 ways, filled passes with the right follow-up; knowledge-page.md blank invalid, filled 0 invalid 0 stale, both parse as YAML; incident.md example rows pass, a row without Becomes warns.
- The three Mermaid examples render with @mermaid-js/mermaid-cli.
- No em dash in any of the 17 files or this record.

## Not verified

- Data work end to end on a real product: the wiring is tested through `sdlc request` and the fingerprint in tests, not on a real migration.
- How the Mermaid diagrams read on GitHub; the CLI render only proves the syntax (Mermaid C4 has no auto layout, so labels can overlap).
- That agents fill the new templates better than the old ones: no eval was run.
- The blank-incident case: a postmortem with no Actions rows passes, as before; no script checks it.
