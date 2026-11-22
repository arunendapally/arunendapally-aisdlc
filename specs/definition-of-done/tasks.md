# Tasks: definition-of-done

## Approach

- What changes: the four stage templates (`prd.md`, `design.md`, `tasks.md`, `pr.md`, and both PR template copies) end with `## Definition of done`, 3 to 5 `- [ ]` items for that stage (R1).
- The check: `openDoneItems(text, doc)` in `scripts/lib.mjs` reads that section; each `- ` line must be `- [x] ...` or `- N/A: <reason>`, else it names the item (or says the N/A needs a reason) (R2, Never).
- Where it runs: `sdlc request` adds those problems to the stage's refusals for stages 1, 3, 4 and 5, reading the stage's own artefact (F1).
- Old documents: no section means no problems, so every document written before this passes as before (R4).
- Ready: each stage command gets `**Ready when:**` next to `**Input:**`, naming the previous stage's definition of done (R3, F3).
- The arguable choice: the check lives in the request, not in `missingHeadings()`, so a human's typed approval is not blocked by it; the checklist is a record for the reviewer (A2) and the hard checks stay the gate's own.
- Not done: the section is not a required heading, since R4 forbids refusing documents without it.

## Tasks

- [x] T1 [R1, R2, R3, R4] files: tests/definition-of-done.test.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 depends-on: [] Write the tests first and see them fail.
  - done when: AC-1, AC-2, AC-4 and AC-5 fail before the change; AC-3 and AC-6 hold.
  - traps: none
- [x] T2 [R2, R4] files: scripts/lib.mjs, scripts/sdlc.mjs test: AC-2, AC-3, AC-4, AC-6 depends-on: [T1] Add openDoneItems and call it from the request for stages 1, 3, 4, 5.
  - done when: AC-2, AC-3, AC-4 and AC-6 pass.
  - traps: none
- [x] T3 [R1] files: skills/org-ai-sdlc/templates/prd.md, skills/org-ai-sdlc/templates/design.md, skills/org-ai-sdlc/templates/tasks.md, skills/org-ai-sdlc/templates/pr.md, .github/pull_request_template.md, templates/repo/.github/pull_request_template.md test: AC-1 depends-on: [T1] End each template with its checklist; keep the three PR templates identical.
  - done when: AC-1 and the one-PR-template test pass.
  - traps: none
- [x] T4 [R3] files: commands/define.md, commands/design.md, commands/build.md, commands/verify.md, skills/org-ai-sdlc/SKILL.md, CHANGELOG.md test: AC-5 depends-on: [T1] State each command's definition of ready; document the change.
  - done when: AC-5 passes.
  - traps: none

## Characterisation tests

- Before the change: 246 tests, 246 pass. Existing tests that build complete PRDs and PR bodies have no `## Definition of done` and must keep passing unchanged (R4).

## Definition of done

- [x] Tests failed first, then pass
- [x] Gate green at or above the baseline
- [x] Every task done
- [x] Diff within the size limit
