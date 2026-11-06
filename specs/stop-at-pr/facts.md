# System facts: stop-at-pr

<!-- v1 pinned these to 22024f9, the code before this slice. This slice's build changed that code, so the facts
     check refused them as stale when the spec was revised (a plugin finding). They now state the code at
     b541cb9, after the build; the "before" is in v1 of this file in git history. -->

## Facts

- F1: [governing] Every lane now ends at Verify (stage 5) and lists Build and Verify as passing on checks, so no lane has a Release stage or a named approver. Source: scripts/lib.mjs:29-45. Verified: b541cb9.
- F2: Verify's owner reads "checks (gate green, review clean)", while the Release entry stays defined but unused by any lane until the follow-up task deletes it. Source: scripts/lib.mjs:16-18. Verified: b541cb9.
- F3: A feature closes when its last stage passes and reads its outcome follow-up from prd.md, so completing Verify opens the follow-up. Source: scripts/loop.mjs:381-400. Verified: b541cb9.
- F4: outcomeFollowUp() reads only the "## Outcome metric" section, which the PRD has. Source: scripts/loop.mjs:335-344. Verified: b541cb9.
- F5: The command list has no merge command, so "sdlc merge" fails as unknown. Source: scripts/sdlc.mjs:1015. Verified: b541cb9.
- F6: Verify refuses an untested @release criterion unless the PR body names it under "## Check after deploy". Source: scripts/sdlc.mjs:477-479. Verified: b541cb9.
- F7: The guard refuses any agent push or commit to a protected branch, so agents cannot reach main except through a PR. Source: scripts/hooks/pre-tool.mjs:172. Verified: b541cb9.

## Not found

- Looked for any other caller of a merge command in scripts/, scripts/hooks/ and commands/: none.
