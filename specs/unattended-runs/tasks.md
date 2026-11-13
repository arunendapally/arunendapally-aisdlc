# Tasks: unattended-runs

Spec: specs/unattended-runs/prd.md, specs/unattended-runs/acceptance.feature
Baseline: 319 passing, from the first "sdlc gate unattended-runs" on a13d051, before any change
Budget: about 130 counted code lines of 300; tests, specs and docs do not count.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

Four small changes, each in the file that already owns the behaviour.
The guard (scripts/hooks/pre-tool.mjs) gets one `readOnly(segment)` test, built from the read verbs it already exempts for guardrail files; read-only segments are left out of the person's-action patterns, and a command made only of them does not count towards the denial cap. It is still refused where another guard refuses it (secrets files, large files).
`sdlc init-repo` detects the stack from the files present (package.json, pyproject.toml or requirements.txt, go.mod, a .csproj or .sln) and writes gateCommand, proofCommand and runtimeCommand only into a config it has just created; into an existing config it writes nothing and prints the proposal. `proofProblems` (scripts/loop.mjs) refuses Verify with no proofCommand unless the config holds `proofWaived: "<reason>"`; a person sets the proof with `sdlc proof-command`, the twin of `gate-command`.
`sdlc next <capability>` reads slices.md and each slice's state and prints the first slice not complete whose dependencies are; `sdlc init --capability` copies a sibling's person-given intent, marked `inheritedFrom`. `commands/run.md` chains the existing stage commands.
The arguable choice: an agent-run setup writes the gate command. It comes from a fixed table keyed on files, never from the agent, and only into a config that did not exist; the other option, always asking a person, keeps the stop this feature exists to remove.

## Tasks

- [x] T1 [R1] files: scripts/hooks/pre-tool.mjs, tests/unattended-runs.test.mjs test: AC-1 depends-on: [] Leave read-only segments out of the person's-action patterns.
  - done when: AC-1 passes; a read with a redirect, a pipe into a shell or command substitution is still refused.
  - traps: none
- [x] T2 [R2] files: scripts/hooks/pre-tool.mjs, tests/unattended-runs.test.mjs test: AC-2, AC-3 depends-on: [T1] Do not count a refusal of an all-read-only command towards the cap.
  - done when: AC-2 and AC-3 pass.
  - traps: none
- [x] T3 [R3] files: scripts/sdlc.mjs, tests/unattended-runs.test.mjs test: AC-4, AC-5 depends-on: [] Detect the stack in init-repo; write into a new config, propose for an existing one.
  - done when: AC-4 and AC-5 pass; an existing config is byte-identical after the run.
  - traps: none
- [x] T4 [R4] files: scripts/loop.mjs, scripts/sdlc.mjs, scripts/lib.mjs, tests/helpers.mjs, tests/unattended-runs.test.mjs test: AC-6 depends-on: [] Require the proof or a waiver at Verify; add the person's proof-command.
  - done when: AC-6 passes; agents are refused proof-command like gate-command.
  - traps: none
- [x] T5 [R6] files: scripts/sdlc.mjs, scripts/lib.mjs, tests/unattended-runs.test.mjs test: AC-8, AC-9 depends-on: [] Add sdlc next for a capability.
  - done when: AC-8 and AC-9 pass.
  - traps: none
- [x] T6 [R7] files: scripts/sdlc.mjs, tests/unattended-runs.test.mjs test: AC-10 depends-on: [] Carry a capability's intent to a new slice.
  - done when: AC-10 passes; a carried-over intent is never carried again as if a person gave it.
  - traps: none
- [x] T7 [R5] files: commands/run.md, commands/plan.md, tests/unattended-runs.test.mjs test: AC-7 depends-on: [T5] Add the run command.
  - done when: AC-7 passes.
  - traps: none
- [x] T8 [R8] files: scripts/hooks/session-start.mjs, .claude-plugin/plugin.json, .claude-plugin/marketplace.json, README.md, docs/getting-started.md, skills/org-ai-sdlc/SKILL.md, tests/unattended-runs.test.mjs test: AC-11 depends-on: [T7] Say who decides, everywhere a person or agent reads first.
  - done when: AC-11 passes.
  - traps: none

## Definition of done

- [x] Tests failed first, then pass
- [x] Gate green at or above the baseline
- [x] Every task done
- [x] Diff within the size limit
