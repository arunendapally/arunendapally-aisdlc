# System facts: change-request

## Facts

- F1: [governing] When the spec changes after Define was approved, the next request sends the feature straight back to Define and drops every later approval, with no question to anyone, so a change found in the middle of Build silently becomes an amendment. Source: scripts/sdlc.mjs:318-334. Verified: 47df4d4.
- F2: A feature can be created as a slice of a capability, so a change request can be created as another feature in the same capability. Source: scripts/sdlc.mjs:245-250. Verified: 47df4d4.

## Not found

- Looked for a change request, or any question about how to take a spec change, in scripts/, commands/ and skills/org-ai-sdlc/: none.
