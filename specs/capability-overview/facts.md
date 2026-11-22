# System facts: capability-overview

## Facts

- F1: [governing] The systems-under-change check reads architecture-overview.md from the feature's own folder and asks for it only when tasks name more than one repo, so there is no overview per capability and none for single-repo work. Source: scripts/sdlc.mjs:132-143. Verified: 47df4d4.
- F2: A slice is created with a capability, and init refuses one whose capability has no slices.md, so a capability folder already exists before its features do. Source: scripts/sdlc.mjs:245-250. Verified: 47df4d4.
- F3: Status lists each capability with its slices, so the plugin already knows which features share a capability. Source: scripts/sdlc.mjs:690. Verified: 47df4d4.

## Not found

- Looked for any place that records decisions made after the PRD (meetings, emails, chats) in scripts/, skills/org-ai-sdlc/templates/ and commands/: none; the PRD's "Questions asked" holds only what was asked before it was written.
