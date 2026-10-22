# Knowledge

What this team and its agents have learned about this system, written down so nobody (human or agent) has to learn it twice. It is the agents' memory: every session starts by reading the index, and every change starts by reading the pages for the files it touches.

## Format

Plain Markdown, one subject per page, with frontmatter:

```
---
name: payments-retry
description: One line on what the page answers.
type: system | component | decision | trap | runbook | howto | glossary | playbook
sources: [path/one.ts, path/two.ts]
verified: <commit the sources were read at>
confidence: Established | Moderate | Preliminary
---
```

Link pages with `[[name]]`. Any wiki tool that reads Markdown with frontmatter can read these pages.

## Rules

- **Source-backed.** Every page names the files it describes and the commit it was verified at. When those files change, `sdlc knowledge check` marks the page stale, and the next agent to touch the area re-verifies it.
- **Graded.** Established means read in code and tests; Moderate, read in code; Preliminary, inferred.
- **Written as you go.** Learning tasks (`/ai-sdlc:learn`) write pages; every stage that learns something durable adds or updates one; Release and postmortems add traps.
- **Pruned.** A page whose sources are gone is deleted or rewritten, never left to mislead.

`sdlc knowledge index` rebuilds `INDEX.md`. `sdlc knowledge for <files>` lists the pages to read first.
