# Tasks: stage-names

Spec: specs/stage-names/prd.md, specs/stage-names/acceptance.feature, specs/stage-names/facts.md
Baseline: 240 passing, from the first "sdlc gate stage-names" on 1b2bfb6, before any change
Budget: about 60 counted code lines of 300 (light lane); tests and specs do not count.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

Stage 1 is renamed Define in STAGES (scripts/lib.mjs, F1) and its command becomes commands/define.md (R2, F6).
Stage 3's artefact becomes design.md, and the plan template becomes templates/design.md (R3).
One helper, designDoc(dir, state) in scripts/lib.mjs, names the design file: design.md, or plan.md when a
feature has plan.md and no design.md (R4, F5). Every reader of plan.md calls it: missingHeadings, the Design
fingerprint and supersede check (loop.mjs), the plan-drift and revision checks, contracts (sdlc.mjs),
design-review.mjs and review.mjs.
Gate, advance and status messages lead with the stage name (R1, F2 to F4).
The arguable choice: stage numbers stay in state.json and typed commands (PRD A1), so no state migration and
"sdlc approve <feature> 1" still works; only what people read changes.
Each stage command gets Input, Processing and Output lines (R5).

## Tasks

- [ ] T1 [R1, R2, R3, R4, R5] files: tests/stage-names.test.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5 depends-on: [] Write the five criteria as tests and show them red on the current code.
  - done when: each AC test fails on 1b2bfb6 for the reason the AC names.
  - traps: none
- [ ] T2 [R2, R3, R4] files: scripts/lib.mjs, scripts/loop.mjs, scripts/sdlc.mjs, scripts/design-review.mjs, scripts/review.mjs, scripts/hooks/pre-tool.mjs test: AC-2, AC-3, AC-4 depends-on: [T1] Rename stage 1 to Define and stage 3's artefact to design.md, with designDoc for every plan.md reader.
  - done when: AC-2, AC-3, AC-4 pass; the existing plan.md tests (review, quality, loop, db-design) stay green.
  - traps: none
- [ ] T3 [R1] files: scripts/sdlc.mjs, scripts/loop.mjs, scripts/hooks/user-prompt.mjs, scripts/hooks/session-start.mjs test: AC-1 depends-on: [T2] Lead gate, advance and status messages with the stage name.
  - done when: AC-1 passes; tests matching the old wording are updated, never loosened.
  - traps: none
- [ ] T4 [R2, R3, R5] files: commands/define.md, commands/design.md, commands/build.md, commands/verify.md, commands/start.md, scripts/retro.mjs, skills/org-ai-sdlc/templates/design.md test: AC-2, AC-5 depends-on: [T2] Move commands/plan.md to define.md and templates/plan.md to design.md; add Input, Processing and Output lines.
  - done when: AC-2 and AC-5 pass; no live reference to commands/plan.md or /ai-sdlc:plan remains.
  - traps: none
- [ ] T5 [R1, R2, R3] files: skills/org-ai-sdlc/SKILL.md, docs/org-ai-sdlc-process.md, docs/getting-started.md, skills/org-ai-sdlc/templates/*.md, agents/*.md, CHANGELOG.md test: AC-2 depends-on: [T4] Update live docs to Define and design.md; leave docs/decisions, docs/releases and past CHANGELOG entries alone.
  - done when: the full gate is green; grep finds no "Stage 1 Plan" in live docs.
  - traps: none

## Characterisation tests

The existing tests that write plan.md for a full-lane feature (tests/review.test.mjs plan drift and Design v2,
tests/quality.test.mjs contracts and ADR checks, tests/loop.test.mjs supersede, tests/db-design.test.mjs
fingerprint) pin today's plan.md behaviour. They stay as they are, so they now prove R4 for features already
in flight. Only assertions on message wording change (R1).
