# Tasks: trace-index

Spec: specs/trace-index/prd.md, specs/trace-index/acceptance.feature, specs/trace-index/facts.md
Baseline: 303 passing, from "npm test" on a clean checkout of 4b245a4, before any change
Budget: about 60 counted code lines of 300 (light lane)
Read first: templates/repo/standards/engineering-standards.md, templates/repo/standards/testing-standards.md, templates/repo/standards/traps.md

## Approach

A new read-only module scripts/trace.mjs with trace(dir, capability) and traceBack(dir, ref), wired as
"sdlc trace" in scripts/sdlc.mjs. trace walks the capability's slices (slicesOf, F3), takes each feature's
R ids from its PRD (requirementsFrom), and joins them to matrix() rows (F1) for scenarios and tests, to
decision rows whose Changes cell names "<feature> R<n>" or "<feature>/R<n>" (decisionsOf, F2), and to
docs/adr/*.md that contain "<feature>/R<n>" (A1). traceBack builds every capability's index and keeps the
requirements whose tests, ADRs or "decision:<date> <text>" equal the given ref (R3). The arguable choice:
backwards lookup recomputes the whole index instead of a reverse map, since it is on demand and small.
Nothing is written to disk (PRD A2, Never). An ADR naming only a bare R id in its Context is not matched;
A1's second half is left for a person to confirm, since a bare "R2" in an ADR is ambiguous across features.

## Tasks

- [x] T1 [R1, R2, R3, R4] files: tests/trace-index.test.mjs test: AC-1, AC-2, AC-3, AC-4 depends-on: [] Write the four scenario tests and see them fail ("Unknown command: trace").
  - done when: all four fail before T2.
  - traps: none
- [x] T2 [R1, R2, R3, R4] files: scripts/trace.mjs, scripts/sdlc.mjs test: AC-1, AC-2, AC-3, AC-4 depends-on: [T1] Add the trace module and the "sdlc trace" command, forward and --file.
  - done when: AC-1 to AC-4 pass; each filter and marker mutation-tested.
  - traps: none
- [x] T3 [R1, R3] files: skills/org-ai-sdlc/SKILL.md, CHANGELOG.md test: AC-1 depends-on: [T2] One SKILL.md line and the CHANGELOG [Unreleased] entry.
  - done when: both name "sdlc trace" and "--file".
  - traps: none

## Characterisation tests

- The existing per-feature trace is unchanged: matrix() and "sdlc tests" are only read, not edited; tests/proof-accuracy.test.mjs, tests/release-criteria.test.mjs and the rest of the suite stay green.
- Mutation checks run on scripts/trace.mjs: matching every decision row fails AC-2; matching every ADR fails AC-2 and AC-3; dropping "no scenario" or "no test" fails AC-4; keeping the "(level)" suffix on test paths fails AC-3.

## Definition of done

- [x] Tests failed first, then pass
- [x] Gate green at or above the baseline
- [x] Every task done
- [x] Diff within the size limit
