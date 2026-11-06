---
type: guide
title: Knowledge
description: How this folder of knowledge pages is written, checked and kept current.
---

# Knowledge

What this team and its agents have learned about this system, written down so nobody (human or agent) has to learn it twice. It is the agents' memory: every session starts by reading the index, and every change starts by reading the pages for the files it touches.

## Format

The folder is an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) (OKF 0.2) bundle: plain Markdown, one subject per page, with frontmatter:

```
---
type: system | component | decision | trap | runbook | howto | glossary | playbook
title: Payments retry
description: One line on what the page answers.
sources:
  - resource: path/one.ts
  - resource: path/two.ts
generated: { by: ai-sdlc/architect, at: 2026-01-01T00:00:00Z }
verified:
  - { by: ai-sdlc/architect, at: 2026-01-01T00:00:00Z }
verified_commit: <commit the sources were read at>
confidence: Established | Moderate | Preliminary
---
```

`verified_commit` and `confidence` are this plugin's own keys; OKF readers keep them. Link pages with `[[file-name]]`. Any tool that reads OKF, or Markdown with frontmatter, can read these pages. Older pages with `name`, `sources: [paths]` and `verified: <commit>` are still read and checked.

## Rules

- **Source-backed.** Every page names the files it describes and the commit it was verified at. When those files change, `sdlc knowledge check` marks the page stale, and the next agent to touch the area re-verifies it.
- **Graded.** Established means read in code and tests; Moderate, read in code; Preliminary, inferred.
- **Written as you go.** Learning tasks (`/ai-sdlc:learn`) write pages; every stage that learns something durable adds or updates one; Release and postmortems add traps.
- **Pruned.** A page whose sources are gone is deleted or rewritten, never left to mislead.

`sdlc knowledge index` rebuilds `index.md` and adds what changed to `log.md`, newest first. `sdlc knowledge for <files>` lists the pages to read first. `sdlc knowledge check` also lists any file here that is not OKF.
