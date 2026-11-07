# System facts: definition-of-done

## Facts

- F1: [governing] Each stage names one artefact (Define prd.md, Design design.md, Build tasks.md, Verify pr.md) whose required headings the gate checks, so every stage already has one document a checklist can close. Source: scripts/lib.mjs:10-16. Verified: 8037e92.
- F2: missingHeadings() refuses a stage's artefact when a required section is empty or holds only a comment, so a new required section is checked the same way. Source: scripts/lib.mjs:270. Verified: 8037e92.
- F3: Each stage command states its input, processing and output, so its readiness can be stated next to its input. Source: commands/define.md:8. Verified: 8037e92.

## Not found

- Looked for any definition of done or definition of ready in scripts/, commands/ and skills/org-ai-sdlc/templates/: none.
