# Tasks: merge-is-hand-check

Spec: specs/merge-is-hand-check/prd.md, specs/merge-is-hand-check/acceptance.feature
Baseline: 229 passing on main, from npm test before any change
Budget: about 20 counted code lines of 300 (light lane).
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

Verify stops asking for the line: manualProblems() in scripts/testmatrix.mjs and its one caller in the Verify request (F1, F2) are removed, since nothing else reads the line (facts.md Not found). The review packet moves untested @manual criteria out of "Criteria with no test" into their own "Check by hand before merging" section (R2, F4). The matrix's refusal of untested criteria that are neither @manual nor @release is untouched (R3, F3). The arguable choice: removing the check rather than making it optional, because an optional line the agent writes is the same line nobody asked for.

## Characterisation tests

tests/release-criteria.test.mjs V4 and V5 (proof) pin today's @release and @manual handling and stay green; the V5 test for the "Checked by hand" line is replaced by the AC-1 test, since R1 removes that behaviour.

## Tasks

- [ ] T1 [R1, R2, R3] files: tests/release-criteria.test.mjs test: AC-1, AC-2, AC-3 depends-on: [] Tests first for the three criteria.
  - done when: AC-1 and AC-2 fail on the current code and AC-3 passes.
  - traps: none
- [ ] T2 [R1] files: scripts/testmatrix.mjs, scripts/sdlc.mjs test: AC-1 depends-on: [T1] Remove the "Checked by hand" check from Verify.
  - done when: AC-1 passes.
  - traps: none
- [ ] T3 [R2] files: scripts/review.mjs test: AC-2 depends-on: [T1] List untested @manual criteria under "Check by hand before merging".
  - done when: AC-2 passes.
  - traps: none
- [ ] T4 [R1] files: skills/org-ai-sdlc/SKILL.md, skills/org-ai-sdlc/templates/pr.md, skills/org-ai-sdlc/templates/acceptance.feature, templates/repo/.github/pull_request_template.md, .github/pull_request_template.md, docs/org-ai-sdlc-process.md, scripts/gherkin.mjs, CHANGELOG.md test: AC-1 depends-on: [T2] Docs and templates stop asking for the line.
  - done when: npm test and npm run eval pass; no doc asks for the line.
  - traps: none
