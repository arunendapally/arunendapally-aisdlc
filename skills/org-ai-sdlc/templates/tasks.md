# Tasks: <feature>

<!-- Stage 4 Build. Owner: tech-lead agent. Gate: none, it passes on checks (the gate green at or above the
     baseline, the diff under the lane limit, every task line valid).
     Written before any code. A required section with only a comment in it is empty, and the gate refuses it.
     Never start a line with "# " or "## " inside a section. Link the PRD and plan; do not restate them.
     Kind work adds its Build section here (Characterisation tests, Benchmark before); the gate names the
     one missing. Data work keeps its rehearsal and down migration in db-design.md. -->

Spec: specs/<feature>/prd.md, specs/<feature>/acceptance.feature, specs/<feature>/plan.md (full lane only)
Baseline: <n> passing, from the first "sdlc gate <feature>" on <sha>, before any change
Budget: about <n> counted code lines of <lane limit> (light 300, full 400, bug and task 200, hotfix 100);
tests and specs do not count. Over budget: split into slices now, not after the build.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

<!-- How this will be built: the home for the solution, so it never goes into the PRD. Required in the light
     lane, which has no plan.md: this is its design. The parts that change and where each lives, the one choice
     a reviewer could argue with and why it won, and the PRD constraints it follows. At most ten lines.
     In the full lane it is optional: link plan.md and add only what the tasks need. Example:
The saved list is a second list beside the basket, in src/lists/, keyed by the signed-in shopper (R1, R5),
so it reuses the basket's storage and sign-in (PRD Constraints). Sell-outs reach it from the existing
stock.changed event (R2, T2), not by polling. The arguable choice: a saved item keeps no price, so the list
always shows today's price; the other option, keeping the price seen, needs a price history we do not have.
     Or, full lane: See plan.md. -->

## Tasks

<!-- One task per line, with everything the gate reads on that line:
     - [ ] T<n> [R<n>] files: <paths> test: AC-<n> depends-on: [<task ids>] <what it does, one sentence>
     Then two indented lines a reviewer can check against a test or a trap:
       - done when: <the named test passes, plus the one thing a test cannot show>
       - traps: <names from standards/traps.md>, or none
     The gate enforces: every task line has "depends-on: [...]" ("depends-on: []" for none), names only
     tasks in this file, and has no loop.
     The tech lead enforces: a task touches only its files; it proves an AC that already exists in
     acceptance.feature (a new AC changes the spec and sends it back to Plan: stop and escalate); its diff
     fits on one screen.
     A task in another repo adds "repos: [<repo>]" after its ID; in the light lane that moves the work to
     the full lane, and architecture-overview.md needs a row for that repo.
     Example:
- [ ] T1 [R1] files: src/lists/save.ts, tests/lists/save.test.ts test: AC-1, AC-2 depends-on: [] Save an item to the shopper's list, once.
  - done when: AC-1 and AC-2 pass; a save with no session gets 401.
  - traps: none
- [ ] T2 [R2] files: src/stock/events.ts, tests/stock/events.test.ts test: AC-3 depends-on: [T1] Mark saved items sold out on stock.changed.
  - done when: AC-3 passes; a redelivered event marks the item once.
  - traps: duplicate event delivery
-->
