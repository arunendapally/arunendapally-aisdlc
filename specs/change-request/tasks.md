# Tasks: change-request

## Approach

- What changes: the spec-drift block of `request()` in `scripts/sdlc.mjs`. Spec drift found at Build or later (stage >= 4) no longer moves the feature; the request fails with the question "change request or amend the existing PRD?", the reasons, the effort change and the two commands (R1 to R3). Design drift, and spec drift before Build, go back as today (R6).
- Where it lives: the drift lookup and the way back move out of `request()` into `driftOf` and `goBack`, so `sdlc amend <feature>` (R5) runs exactly today's path. `sdlc cr <feature> <new-slug>` (R4) creates a feature in the original's lane and capability, its PRD starting with `Changes: <feature>` under the title, and never touches the original's state.
- The arguable choice: `cr` and `amend` are agent commands, not human verbs. The person's answer comes through the question tool (A2); `amend` only does what every request did before, and `cr` only adds a feature, so neither passes a gate.
- PRD constraints: guidance only, the person decides (Never: choose for them); the original keeps its approvals on a change request; no effort estimating (out of scope).

## Tasks

- [x] T1 Tests first: `tests/change-request.test.mjs`, one test per AC-1 to AC-6 (AC-1 to AC-3 share one setup). Shown red before the code (3 fail; AC-6 passes as a characterisation of today). Traps: test data inside each test; a repo on the feature's own branch. depends-on: []
- [x] T2 `scripts/sdlc.mjs`: the question at Build, `driftOf`/`goBack`, `cr`, `amend`, usage line. Update `tests/review.test.mjs` and `tests/autonomy.test.mjs`, which relied on the silent amendment at Build, to answer with `sdlc amend`. Proves AC-1 to AC-6. Traps: never loosen an existing assertion, only route it through `amend`; `cr` keeps the frozen-budget guard `init` has. depends-on: [T1]
- [x] T3 Docs: `commands/build.md` one paragraph, `skills/org-ai-sdlc/SKILL.md` one line, `CHANGELOG.md` [Unreleased]. depends-on: [T2]

## Characterisation tests

- AC-6 (`tests/change-request.test.mjs`): a spec change at Design goes back to Define with no question. Passed before the change and after it.
- `tests/review.test.mjs` "a spec changed after Plan was approved..." and "...design changed..." keep today's messages for amend and for design drift at Build.
- Baseline before any change: 246 tests, 246 passing (HEAD 52638a0).
