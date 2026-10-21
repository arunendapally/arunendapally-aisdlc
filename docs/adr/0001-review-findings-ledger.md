# ADR-0001: Review findings live in a Markdown ledger in the repo

Status: proposed
Date: 2026-10-21

## Context

Code review is the slowest and least measured part of the AI SDLC. Agent pre-reviews were free text in the PR body, so nothing could check that serious findings were fixed, and nothing could measure what the pre-review missed compared with humans. The retro needs findings as data; the Verify gate needs to refuse open serious findings; both must work offline and in any Git host.

## Options

- **A Markdown ledger in the repo (`specs/<feature>/review.md`):** one table row per finding with severity, `file:line`, checklist item, status and source. Versioned with the change, readable by agents, the gate and the retro without network access. Might lose because it duplicates what reviewers write in PR comments.
- **GitHub PR review comments as the source of truth:** findings stay where reviewers already work. Might lose because it ties the gate and the retro to one host's API and tokens, comments have no severity or status fields, and agents running offline cannot read them.
- **The ledger as the gate's source, plus an importer for PR review comments:** humans keep commenting on the PR; an adapter copies their comments into H rows with the comment's resolved state. Wins once a host adapter exists, because it removes the double entry that makes human catches under-count. Loses today because the adapter is host-specific work that is not built.
- **A findings service or database:** strong querying across repos. Might lose because it is a new system to run and secure for a problem a file solves.

## Decision

A Markdown ledger in the repo, with the PR-comment importer as the planned next step (option three) rather than a replacement. The Verify gate parses the ledger; the retro mines the ledgers of every repo it is given (`sdlc retro --repos <paths>`).

Controls the design review board asked for, all enforced by the gate:

- IDs are `F1, F2 ...` for agent findings and `H1, H2 ...` for human ones, so the two sources never collide; a duplicate within a source fails the gate.
- Any table row that is not a well-formed finding fails the gate, so a mistyped ID cannot hide a blocker.
- `fixed` must name the commit that fixed it, and that commit must change the finding's file. A fixed row may point at a file the fix removed.
- The gate remembers every ID it has seen, from `sdlc review` and from each request; a removed row fails the gate.
- An `H` id must have source `human` and an `F` id must not.
- The pre-review states which lenses ran, so an empty ledger is not mistaken for a review.
- Recall is reported only with at least five serious findings; below that the retro says the sample is too small.
- `specs/**/review.md` and `specs/**/design-review.md` are owned in CODEOWNERS by the reviewers and architects, so on GitHub a human must approve any change to them, including an agent marking a human's finding fixed.
- Feature folders under `specs/` are kept after merge; they are the retro's history.

## Consequences

- Good: the gate and the retro work in any repo, offline, with no tokens; findings are reviewed in the same PR as the code; the controls above make the ledger hard to game without a human noticing.
- Downside: until the importer exists, humans who write findings only as PR comments are not counted, so measured recall reads too high (PRD assumption A3).
- Downside: authorship is a git user name (fact F2), so a source column can still be mislabelled locally; CODEOWNERS approval is the real check.
- Downside: two reviewers editing the table at once can still conflict in git; IDs per source keep the conflict to a textual merge, not a gate failure.
- Risk: deleting a whole feature folder after merge loses its history for the retro.

## Review

The design review board (design-reviewer, safe-ai-sdlc-expert, qa-engineer, sre) asked 11 questions; the controls in the Decision come from them. See `specs/quality-gates/design-review.md`.
