# Tasks: capability-overview

Spec: specs/capability-overview/prd.md, specs/capability-overview/acceptance.feature, specs/capability-overview/facts.md
Baseline: 246 passing, from "npm test" on d8bb636, before any change
Budget: about 40 counted code lines of 300 (light lane); tests, specs and docs do not count.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

One helper, overviewFile(dir, state) in scripts/lib.mjs, names the overview: specs/<capability>/ when the feature has a
capability, else the feature's own folder (R2, PRD A2, F1). systemProblems and "sdlc packets" read it.
init with --capability copies the template to the capability folder if missing, reusing copyTemplate (R1, F2).
The template becomes capability level and gains "## Decision log" (Date, Decision, Agreed by, Source, Changes).
decisionsOf and decisionProblems in lib.mjs read that table by cell position, like systemsOf (R4); the Define and
Verify requests refuse a row with no Agreed by or Source. Define refuses a capability feature whose overview has
no "## System context" once template comments are stripped (R3). The review packet lists "unconfirmed" rows (R5).
The arguable choice: in a capability overview, a new or modified system that this feature's tasks do not change is
not refused, because another feature in the capability may change it; a feature's own overview keeps that check.

## Tasks

- [x] T1 [R1, R2, R3, R4, R5] files: tests/capability-overview.test.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5 depends-on: [] Write the five criteria as tests and show them red on d8bb636.
  - done when: all five fail on the base code (AC-4's import stubbed), each for the reason its AC names.
  - traps: none
- [x] T2 [R1, R4] files: skills/org-ai-sdlc/templates/architecture-overview.md test: AC-1 depends-on: [T1] Make the template capability level with a Decision log table and its rules.
  - done when: AC-1 passes; the System context section is comment only, so a fresh copy fails R3.
  - traps: none
- [x] T3 [R1, R2, R3, R4, R5] files: scripts/lib.mjs, scripts/sdlc.mjs, scripts/review.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5 depends-on: [T2] overviewFile, decisionsOf, decisionProblems; wire init, systemProblems, packets, the Define and Verify requests and the review packet.
  - done when: all five ACs pass; tests/systems.test.mjs and tests/slices.test.mjs stay green; each guard mutated makes its AC fail.
  - traps: none
- [x] T4 [R3] files: specs/gates-and-names/architecture-overview.md test: AC-3 depends-on: [T3] Dogfood: this repo's capability overview, with its system context, one modified system and the decisions agreed after the PRDs.
  - done when: sdlc request at Build reports no architecture-overview.md problem; rows with no verbatim quote on record read "unconfirmed".
  - traps: none
- [x] T5 [R1, R3, R4, R5] files: commands/define.md, commands/design.md, skills/org-ai-sdlc/SKILL.md, CHANGELOG.md test: AC-1 depends-on: [T3] Say where the capability overview lives and what Define, Build and Verify check in it.
  - done when: the full gate is green.
  - traps: none

## Characterisation tests

tests/systems.test.mjs and tests/prereview-060.test.mjs pin the per-feature overview for features with no capability
(PRD A2). They stay unchanged and green, so they prove nothing changed for those features.
