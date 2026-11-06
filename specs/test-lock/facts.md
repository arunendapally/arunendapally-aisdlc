# System facts: test-lock

## Facts

- F1: [governing] The proof records a hash of every test file it ran, so the plugin already knows which test files prove which feature. Source: scripts/loop.mjs:167. Verified: 3d2fb3c.
- F2: A test file changed after the proof only makes Verify ask for the proof to run again, so an agent can edit a test and re-prove it with no person seeing why. Source: scripts/loop.mjs:192-193. Verified: 3d2fb3c.
- F3: The pre-tool guard decides every refusal in one place and, in bypass mode, audits it as bypassed instead of refusing (ADR-0006), so a lock in the guard is advisory in bypass mode. Source: scripts/hooks/pre-tool.mjs:34-36. Verified: 3d2fb3c.
- F4: A spec edited after approval sends the feature back to its first stage and audits a spec-drift event, so a spec change is already detected. Source: scripts/sdlc.mjs:319. Verified: 3d2fb3c.

## Not found

- Looked for any way for an agent to say a test conflicts with the spec in scripts/ and commands/: none; the only outcomes are a green or red gate and the retry cap.
