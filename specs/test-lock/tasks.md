# Tasks: test-lock

Spec: specs/test-lock/prd.md, specs/test-lock/acceptance.feature, specs/test-lock/facts.md
Baseline: 229 passing, from the first "sdlc gate test-lock" on 4340743, before any change
Budget: about 90 counted code lines of 300 (light lane); tests and specs do not count.
Read first: standards/engineering-standards.md, standards/testing-standards.md, standards/traps.md

## Approach

One predicate, `lockedFiles(dir, state)` in scripts/loop.mjs, says which proved test files are locked: the files of a passing proof (F1), none once the spec drifted after it (gate 1 not approved, approved after the proof, or its fingerprint changed; F4, R5), less the files of a criterion whose conflict a person settled as "change" after the proof (R2).
The pre-tool guard refuses a Write or Edit (and a heredoc write) to a locked file through the existing decide(), so bypass mode audits it (F3, PRD A1), naming the file and "sdlc conflict" (R1).
`sdlc proof` refuses before running when a locked file changed, and keeps the old proof, so the lock survives the refusal (R2).
`sdlc conflict <feature> <AC-n> <reason>` records an open conflict with the criterion's test files, audits it and leaves retries alone (R3, R4); a Build or Verify request waits while one is open.
A person settles it with `sdlc settle <feature> <AC-n> change|keep`, a human verb recorded only by the user-prompt hook; `sdlc ask` puts it as a question and the answers hook records the click, as for gates (PRD Never: an agent never settles its own conflict).
The arguable choice: the lock applies to the feature of the branch checked out, not every open feature, because a proof hashes that branch's files; locking all open features would stop unrelated work on shared test files.

## Tasks

- [ ] T1 [R1, R2, R3, R4, R5] files: tests/test-lock.test.mjs test: AC-1, AC-2, AC-3, AC-4, AC-5 depends-on: [] Write the five subsystem tests and see them fail.
  - done when: each test fails for the missing behaviour, not a setup error.
  - traps: none
- [ ] T2 [R1, R5] files: scripts/loop.mjs, scripts/hooks/pre-tool.mjs test: AC-1, AC-5 depends-on: [T1] lockedFiles and the guard refusal.
  - done when: AC-1 and AC-5 pass; in bypass mode the edit is audited, not refused.
  - traps: none
- [ ] T3 [R2] files: scripts/sdlc.mjs test: AC-2 depends-on: [T2] The proof refuses a changed locked file without overwriting the proof.
  - done when: AC-2 passes; state.proof is unchanged after the refusal.
  - traps: none
- [ ] T4 [R3, R4] files: scripts/sdlc.mjs, scripts/hooks/user-prompt.mjs, scripts/hooks/answers.mjs, scripts/hooks/pre-tool.mjs, scripts/lib.mjs test: AC-3, AC-4 depends-on: [T2] sdlc conflict, status, ask, settle and the request wait.
  - done when: AC-3 and AC-4 pass; an agent typing sdlc settle is refused.
  - traps: none
- [ ] T5 [R1, R3] files: commands/build.md, skills/org-ai-sdlc/SKILL.md, CHANGELOG.md test: AC-1 depends-on: [T3, T4] Document how to raise a conflict.
  - done when: the full gate is green.
  - traps: none

## Characterisation tests

The existing suite (229 passing) is the characterisation: tests/hooks.test.mjs, tests/bypass.test.mjs, tests/ask.test.mjs and tests/proof-accuracy.test.mjs cover the guard, bypass, the ask path and the proof this change touches.
