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
- [x] T9 [R9] files: scripts/lib.mjs, scripts/hooks/answers.mjs, scripts/hooks/user-prompt.mjs, tests/unattended-runs-edges.test.mjs test: AC-12 depends-on: [] Record a decision in the checkout where its feature lives.
  - done when: AC-12 passes; a feature in no checkout still records where the session is.
  - traps: none
- [x] T10 [R10] files: scripts/hooks/pre-tool.mjs, tests/unattended-runs-edges.test.mjs test: AC-13 depends-on: [] Refuse an inline program that names a proved test.
  - done when: AC-13 passes; running the test file is still allowed.
  - traps: none
- [x] T11 [R11] files: scripts/hooks/pre-tool.mjs, tests/unattended-runs-edges.test.mjs test: AC-14, AC-15 depends-on: [] Refuse code edits on the protected branch before work is started.
  - done when: AC-14 and AC-15 pass; a repo with no first commit is not refused.
  - traps: none
- [x] T12 [R12] files: scripts/hooks/pre-tool.mjs, tests/unattended-runs-edges.test.mjs test: AC-16 depends-on: [] Refuse a recursive delete outside the repo.
  - done when: AC-16 passes.
  - traps: none
- [x] T13 [R13] files: templates/repo/.ai-sdlc/autonomy.json, docs/getting-started.md, tests/unattended-runs-edges.test.mjs test: AC-17 depends-on: [] Remove the autonomy levels file nothing reads.
  - done when: AC-17 passes. The file is a guardrail path, so a person removes it.
  - traps: none
- [x] T14 [R14] files: scripts/sdlc.mjs, tests/gate-state.test.mjs test: AC-18 depends-on: [] Read the feature's record again after a gate run, before writing it.
  - done when: AC-18 passes; a run whose feature moved stage meanwhile records nothing.
  - traps: none

## Definition of done

- [x] Tests failed first, then pass
- [x] Gate green at or above the baseline
- [x] Every task done
- [x] Diff within the size limit
