# System facts: plan-roadmap

## Facts

- F1: [governing] Status reads each slice line under "## Slices" for its slug, "Depends on" and "Status", so a slice line can carry more fields without breaking it. Source: scripts/sdlc.mjs:693-701. Verified: 9684f22.
- F2: The slices template says each slice must be vertical and that "the database layer" is not a slice, so an enabler such as an API contract cannot be a slice today. Source: skills/org-ai-sdlc/templates/slices.md:21. Verified: 9684f22.
- F3: A task names the repos it changes ("repos: [<repo>]"), so tasks.md already knows which repos a feature touches. Source: skills/org-ai-sdlc/templates/tasks.md:40. Verified: 9684f22.
- F4: There is no Plan stage command; the commands start at define.md, so nothing runs the roadmap. Source: commands/define.md:1. Verified: 9684f22.

## Not found

- Looked for now, next or later, horizons, enablers, tickets or feature flags in scripts/, commands/ and skills/org-ai-sdlc/templates/: none.
