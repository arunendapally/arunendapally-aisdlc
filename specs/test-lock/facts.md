# System facts: test-lock

<!-- v1 pinned these to 3d2fb3c, the code before this slice. This slice's build changed that code, so the facts
     check refused them as stale when the spec was revised to v2. They now state the code at 568b41b, after the
     build; the "before" is in v1 of this file in git history. -->

## Facts

- F1: [governing] The proof records a hash of every test file it ran, so the plugin knows which test files prove which feature. Source: scripts/loop.mjs:161. Verified: 568b41b.
- F2: At Verify, a test file changed after the proof asks for the proof to run again; since this slice, `sdlc proof` first refuses a locked test changed since the last passing proof, unless a person settled its conflict or approved a new spec version. Source: scripts/loop.mjs:205-206, scripts/sdlc.mjs:761-762. Verified: 568b41b.
- F3: The pre-tool guard decides every refusal in one place and, in bypass mode, audits it as bypassed instead of refusing (ADR-0006), so a lock in the guard is advisory in bypass mode. Source: scripts/hooks/pre-tool.mjs:34-37. Verified: 568b41b.
- F4: A spec edited after approval sends the feature back to its first stage and audits a spec-drift event, so a spec change is already detected. Source: scripts/sdlc.mjs:319. Verified: 568b41b.

## Not found

- Before this slice, looked for any way for an agent to say a test conflicts with the spec in scripts/ and commands/: none; the only outcomes were a green or red gate and the retry cap. This slice adds `sdlc conflict` (scripts/sdlc.mjs:778).
