# Tasks: plan-roadmap

Spec: specs/plan-roadmap/prd.md, specs/plan-roadmap/acceptance.feature, specs/plan-roadmap/facts.md
Baseline: 246 passing, from the full suite on a3b8dbb, before any change
Budget: about 60 counted code lines of 300 (light lane); tests and specs do not count.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

The roadmap stays in the capability's slices.md (A1). Each slice line gains three fields: Horizon (now, next,
later; none written reads as now, A2), Kind (slice or enabler, R2) and Goes live (compatible, flag NAME, or
after slug, because reason, R3). slicesOf and roadmapProblems in scripts/lib.mjs read them; status (F1) groups
by horizon, marks enablers and names roadmap problems (R1). "after" with no reason (R4) warns at
init --capability and is refused at the Define request of a slice in that capability. A missing Goes live is
not refused, so existing capabilities keep working. sdlc tickets prints one markdown ticket per repo from the
task lines (R5, F3); nothing is created in a tracker (Never). commands/plan.md is the Plan stage (R6, F4).
The arguable choice: tickets is a new command beside packets, not a change to packets, because packets is
deploy-order planning output that tests pin, and a ticket is text a person pastes into a tracker.

## Tasks

- [x] T1 [R1, R2, R3, R4, R5, R6] files: tests/plan-roadmap.test.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 depends-on: [] Write the six criteria as tests and show them red on a3b8dbb.
  - done when: all seven tests fail on a3b8dbb for the missing behaviour (no horizons, no checker, no tickets, no plan.md).
  - traps: none
- [x] T2 [R1, R2, R3, R4] files: scripts/lib.mjs, scripts/sdlc.mjs, tests/slices.test.mjs test: AC-1, AC-2, AC-3, AC-4 depends-on: [T1] Read Horizon, Kind and Goes live; group status by horizon; refuse "after" with no reason.
  - done when: AC-1 to AC-4 pass; the existing slices tests change only in indentation.
  - traps: none
- [x] T3 [R5] files: scripts/sdlc.mjs, skills/org-ai-sdlc/templates/tasks.md test: AC-5 depends-on: [T1] Print one ticket per repo from tasks.md with "sdlc tickets".
  - done when: AC-5 passes; packets output is unchanged.
  - traps: none
- [x] T4 [R6] files: commands/plan.md, commands/start.md, skills/org-ai-sdlc/templates/slices.md, skills/org-ai-sdlc/SKILL.md, specs/gates-and-names/slices.md, CHANGELOG.md test: AC-6 depends-on: [T2, T3] Add the Plan command, route big work to it, rewrite the slices template and dogfood the format.
  - done when: AC-6 passes; status shows gates-and-names grouped with no roadmap problem.
  - traps: none

## Characterisation tests

tests/slices.test.mjs pins today's status output for a capability written before horizons (no Horizon, Kind or
Goes live). It stays, with only the slice lines' indentation moved under their horizon, so it now also proves
PRD A2: an old slices.md still reads, as "now". tests/systems.test.mjs pins packets, which is unchanged.
