# ADR-0003: A simple default path, with a small safety core and optional steps

Status: accepted
Date: 2026-10-22

## Context

A feature in the light lane takes 8 to 11 documents, about 50 required sections and 5 human waits, and every feature starts in the full lane. The bug lane takes one document and one wait, and works. Seven experts reviewed the repo; the record is in [docs/decisions/2026-10-22-simplify.md](../decisions/2026-10-22-simplify.md).

## Options

- **Keep everything, document it better:** no code change. Loses because the weight is in the gates and templates, not the docs.
- **A small mandatory core, everything else optional:** the bug lane's shape for every lane. Build passes on checks, one spec approval, light by default, warnings instead of blocks for bookkeeping. Might lose because some teams lose checks they valued, until they switch them on.
- **Strip to the bug lane for everything:** loses because data changes and releases need more than a merge review.

## Decision

A small mandatory core, everything else optional. Supersedes parts of ADR-0002: the "remember" checks warn at Release instead of blocking.

- **Mandatory in every lane:** human-only approvals, hotfix declaration, merge and deploy; the gate green at or above the baseline; the test proof for features and a base-proved repro for bugs; the pre-review and a CODEOWNER review; the PR line limit; a tested rollback, probe results and a human release approval; schema and breaking-API detection; the kill switch, secret scans and retry cap.
- **Default path for a feature:** light lane; one spec approval (short PRD plus `acceptance.feature`); Build on checks; Verify; merge; Release. Three human waits.
- **Full lane only for:** migrations that alter or drop, high-risk paths, a new component or dependency.
- **Optional, off by default:** the Design stage and board, C4, screens, facts, ER, OpenAPI linting beyond breaking changes, repeats and data checks, the QA verdict, extra lenses, the outcome follow-up on light, freeze, earned trust, metrics, retro and evals.
- **Cuts:** the sections, templates, agents, commands and hooks listed in the decision record.

## Consequences

- Good: a feature reaches a PR after one human approval; the concepts a new team must learn drop from about 25 to about 8; per-turn context and per-tool-call cost fall.
- Downside: stale knowledge and unmarked ADRs can now ship, with a warning.
- Downside: a large change touching many files across the plugin and its tests; golden tasks that encode the old gates must be rewritten, not deleted.
- Risk: teams leave optional checks off when they matter; the triage in `start` must switch them on by risk, not by request.

## Review

Seven experts, one round; the CTO settled seven contested points. See the decision record.
