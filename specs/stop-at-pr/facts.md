# System facts: stop-at-pr

## Facts

- F1: [governing] The full, light and hotfix lanes end at stage 6 (Release) and only Build passes on checks, so every feature waits for a person at Verify and again at Release. Source: scripts/lib.mjs:28-37. Verified: 22024f9.
- F2: Verify's owner is "CODEOWNER engineer" and Release's is "release owner", so the plugin today names who approves the merge and the release. Source: scripts/lib.mjs:16-18. Verified: 22024f9.
- F3: A feature is closed only when its last lane stage passes, and its outcome follow-up is read from release.md's "## Outcome metric", so with no Release a feature would never close and never get an outcome follow-up. Source: scripts/loop.mjs:381-404. Verified: 22024f9.
- F4: outcomeFollowUp() reads only the "## Outcome metric" section, which the PRD already has, so the follow-up can come from prd.md. Source: scripts/loop.mjs:335-344. Verified: 22024f9.
- F5: sdlc merge pushes the reviewed commit to main under autonomy, so the plugin can merge today. Source: scripts/sdlc.mjs:573-587. Verified: 22024f9.
- F6: Verify refuses a @release criterion in any lane without a Release stage, so once no lane has Release every @release criterion would be refused. Source: scripts/sdlc.mjs:464. Verified: 22024f9.
- F7: The guard refuses any agent push or commit to a protected branch, so with merge gone agents still cannot reach main except through a PR. Source: scripts/hooks/pre-tool.mjs:172. Verified: 22024f9.

## Not found

- Looked for any other caller of sdlc merge in scripts/, scripts/hooks/ and commands/: only commands/verify.md and commands/release.md mention it, so removing the command changes no other code path.
