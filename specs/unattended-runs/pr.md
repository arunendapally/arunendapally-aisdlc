## Summary

Runs need a person only at the intent and the PR: reads are not refused as a person's action, setup sets the checks, the proof is required, and one request runs a feature or a capability's slices.
A command that only reads is no longer refused for naming a person's command, and its refusals do not count towards the hold. `sdlc init-repo` sets the gate and proof checks from what a new repo holds and proposes them for an existing one. Verify refuses a full or light feature with no proof check unless a person waived it (`proofWaived`). `sdlc next <capability>`, a carried-over capability intent and `/ai-sdlc:run` take work from the intent to the PR. The first-read messages and docs say a person decides at the intent and the PR.
Amended to v2 at Arun's choice (16 Nov): a person's answer is recorded in the checkout where its feature lives, an inline program cannot change a proved test, code on the protected branch waits for started work, a recursive delete outside the repo is refused, and setup no longer copies the autonomy levels file nothing reads.
Building v2 found a lost-update bug (R14): a gate run wrote its stale copy of the feature's record back when it ended, wiping an amendment made while it ran. A run now keeps what was recorded meanwhile.
Spec: specs/unattended-runs/prd.md (R1 to R14, v2). Not in this PR: other agents (Copilot, Gemini), collapsing the ways a repo grants autonomy, the other 6 Nov dogfood flaws, a rewrite of the README article.

## Test results

Suite: 334 passed, 0 failed (baseline 319 before any change), from "sdlc gate unattended-runs"
Pre-review: 12 findings (1 blocker, 4 major, 5 minor, 2 nits), 11 fixed and 1 answered, in specs/unattended-runs/review.md
Proof: "sdlc proof unattended-runs" passed against a13d051: AC-1 to AC-11 fail on the base code and pass here, 1 test file locked
Golden evals: 29 of 29 pass, from "npm run eval"
Guard cases from the review: tests/read-only-guard.test.mjs (3 tests)
New tests: tests/unattended-runs.test.mjs (AC-1 to AC-11, 15 tests); 11 of the first 12 failed before the change, AC-3 passed because it pins behaviour that must not change
Changed test support: tests/helpers.mjs gives every test repo a proof waiver, so existing Verify tests keep their meaning
Removed, skipped or quarantined: none

## Pre-review

Risk: high, because the change adds and loosens guards (which commands count as reads, which refusals count towards the hold, recursive deletes, code on the protected branch), records a person's decisions in another checkout, and makes Verify refuse every full or light feature in a repo with no proof check.
Open findings: 0 (nits left open: F13)
Look here first: scripts/hooks/pre-tool.mjs:189 (the delete guard sees shell deleters and mirroring tools; a program that deletes from its own code is not judged, F21), scripts/hooks/pre-tool.mjs:241 (which folder a delete is judged in: one leading cd is followed, any other move before the delete makes it unknown and refused), scripts/lib.mjs:285 (featureDir decides which checkout a person's decision lands in; a stale worktree on the feature's branch would win), scripts/sdlc.mjs:851 (a gate run whose feature moved stage meanwhile is not recorded, F24)
Lenses run: correctness, simplicity, tests, security
Revert: git revert of the merge commit; no data to back out. A repo that set proofWaived or proofCommand keeps it; decisions already recorded in a worktree stay there.
Checked mechanically: checklist item 2 and every scenario AC-1 to AC-18 walked through the code; the guard run on 65 cases (12 locked-test, 30 delete, 21 ordinary delete, 10 protected-branch) in scratch repos, plus the read-only allowlist cases from earlier rounds; the v1 test proof (AC-1 to AC-11 fail on the base); no reader of autonomy.json left; no new dependencies; no secrets in the diff
Could not check: featureDir with two checkouts holding the same slug, live (the probe was refused by the session's guard); a symlink delete; how real bash and PowerShell parse the hand-built cases

## Security results

The security lens of the pre-review ran on the guard change only; no scanner ran. It found F1 (blocker, reopened twice, now an allowlist), F3 (tries at secrets were not counted) and F6 (names that only start like a read verb), all fixed. A person should accept or reject the remaining judgement under "Look here first".

## QA verdict

None, because the change has no screen and no journey to explore; the guard was probed case by case instead, and those cases are committed as tests.

## Not verified

- The proof judges the test file as a whole (no JUnit report), so AC-3, whose tests pin behaviour that must not change, is counted as failing on the base with the rest.
- `sdlc proof-command` rewrote the whole of `.ai-sdlc/config.json` in JSON's long form when Arun set the proof check, as `gate-command` does; the diff of that file is mostly layout.
- `/ai-sdlc:run` has not been run end to end by an agent; AC-7 checks only what the command says.
- Agent evals (`npm run eval:agents`) were not run; they cost tokens and no agent prompt changed.
- The guard change was not tried in a live session: the session's hooks come from the installed plugin, not this branch.
- Stack detection for Go and .NET has no test; only Node and Python are covered (AC-4).
- No guard judges a program that writes or deletes from its own code (node fs.rmSync or writeFileSync, python shutil.rmtree, git checkout of a file): the delete guard (F21), the locked-test check (F19) and the protected-branch check (F18) see shell commands and named paths only. The Verify proof's file hashes still catch a changed locked test.
- The final round of fixes (F21 to F24) was not re-reviewed by the reviewer agent; the cases it named are in tests/delete-guard.test.mjs and tests/gate-state.test.mjs.
- The allowlist turns away some ordinary reads: unquoted square or curly brackets and an exclamation mark, and double-quoted text holding a dollar or a backslash. Such a command only loses the new exemption and is judged as before.
- The reviewer judged the hook's decisions, not what real PowerShell and bash do with the hand-built cases.
- R2 says a refused read never moves a session towards a hold. After review finding F3, a try at a secrets file is still counted, though it only reads. The spec was not amended for this: a person should judge it.
- `sdlc next` reads slice states in the current checkout, so a slice finished on an unmerged branch reads as not complete.

## Definition of done

- [ ] Pre-review has no open findings
- [x] Not verified is honest
- [ ] PR raised from the feature branch
