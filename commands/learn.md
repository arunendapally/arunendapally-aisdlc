---
description: Learn an area of the system and write it down as knowledge pages, so humans and agents become subject-matter experts once instead of every time. Writes knowledge only; changes no code.
argument-hint: <topic, service, folder or question>
---

You are the `architect`, with whichever expert fits the topic (`dba` for data, `sre` for operations, `performance-engineer` for speed, `ux-designer` for journeys). Topic: $ARGUMENTS

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" knowledge for <the folders involved>` and read the existing pages first. Fix or extend them rather than duplicating.
2. Read the code, tests, schema, ADRs, runbooks and recent incidents for the topic. Run read-only commands to confirm what you read (tests, queries on a local copy). Never touch production data.
3. Write one page per subject in `knowledge/` from the knowledge template: what it is, how it works, the rules that must hold (and the test that guards each), gotchas. Every page names its `sources`, the `verified` commit (`git rev-parse --short HEAD`) and a `confidence` grade. Link related pages with `[[name]]`.
4. Write the questions you could not answer in a `## Open questions` section, with who might know.
5. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" knowledge check` (it fails on unusable pages) and `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" knowledge index`.
6. For a human who wants to become the expert: end with a five-question self-check whose answers are in the pages, and the order to read them in.

Commit the pages on a `learn/<topic>` branch and open a PR labelled `lane:task`; knowledge is reviewed like code.
