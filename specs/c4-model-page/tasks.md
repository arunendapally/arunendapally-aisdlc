# Tasks: c4-model-page

Spec: specs/c4-model-page/prd.md, specs/c4-model-page/acceptance.feature
Baseline: 360 passing, from the first "sdlc gate c4-model-page" on acdf0a5, before any change
Budget: about 120 counted code lines of 300 (light lane); tests, specs and Markdown do not count.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

A new skill, `skills/c4-model-page/SKILL.md`, tells the architect how to build the page: inputs, sources, the five tabs, the diagram conventions and the checks (R1, R2). Its long page template (fonts, tokens, dark theme, pan/zoom frame, lazy Mermaid) lives in `skills/c4-model-page/reference/page-template.md`, as issue #71 asks (PRD Constraints).
Sources default to what the plugin writes: `design.md`, `architecture-overview.md` (the feature's or its capability's), `openapi.yaml` and `docs/architecture/workspace.dsl`; a person can name a technical design, overview or per-repo `openapi.yaml` instead, and those win (R3, PRD Q1).
The views must agree (R4), so the skill runs a checker, `skills/c4-model-page/check.mjs <page.html>`: five tabs by hash, the classDefs, every Calls row an arrow in Containers and back, every system's class matching its Changes row. It reads only the page, so it is a real check, not the agent grading itself.
`commands/design.md` hands off to the skill once the design is reviewed, before the gate, so the approver can open it (R7). The light lane has no Design step and runs the skill by hand (PRD A4).
The arguable choice: a small checker script instead of the agent eyeballing the issue's acceptance list. The other option adds no code but leaves R4 to the agent grading its own page.

## Tasks

- [x] T1 [R1, R2, R3, R4, R5, R7] files: tests/c4-model-page.test.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8 depends-on: [] Write the unit tests and see them fail.
  - done when: each test fails for the missing skill, template, checker or handoff, not a setup error.
  - traps: none
- [x] T2 [R1, R4] files: skills/c4-model-page/check.mjs test: AC-1, AC-4, AC-5 depends-on: [T1] The page checker.
  - done when: AC-1, AC-4 and AC-5 pass; the sample page passes clean.
  - traps: none
- [x] T3 [R1, R2, R3, R5, R6] files: skills/c4-model-page/SKILL.md, skills/c4-model-page/reference/page-template.md test: AC-2, AC-3, AC-6 depends-on: [T1] The skill and its page template.
  - done when: AC-2, AC-3 and AC-6 pass; AC-7 checked by hand in a browser at 375px, light and dark.
  - traps: none
- [x] T4 [R7] files: commands/design.md, README.md, changelog.d/c4-model-page.md test: AC-8 depends-on: [T3] Design hands off to the skill; README and changelog name it.
  - done when: AC-8 passes and the full gate is green.
  - traps: none

## Definition of done

- [x] Tests failed first, then pass
- [x] Gate green at or above the baseline
- [x] Every task done
- [x] Diff within the size limit
