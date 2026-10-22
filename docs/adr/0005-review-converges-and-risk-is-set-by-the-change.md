# ADR-0005: Review converges, an approval covers what was checked, and the change sets its risk

Status: accepted for the decisions below; zero-human merges proposed, not decided
Date: 2026-10-22

## Context

The article "How the Claude Code team does code review" (claude.dev, 15 October 2026) describes review at agent volume: review that must converge (one PR went through more than fifty rounds), approval scaled by a risk tier that the change sets, an approval that covers one commit, and a PR that says how to revert. Five of the plugin's agents compared it with the plugin; the record is in [docs/decisions/2026-10-22-code-review-at-scale.md](../decisions/2026-10-22-code-review-at-scale.md). They also found that an agent could lower its own scrutiny by writing "Risk: low".

## Options

- **Adopt the convergence and approval rules now, and compute risk tiers without letting them remove a person:** every merge still needs a human; the tier is recorded on every Verify request so evidence builds. Might lose because the tiers change nothing until the evidence exists.
- **Adopt everything, including zero-human merges for low risk:** the article's full model. Loses for now: nothing counts reverts, approvals are bound to `git config user.name`, and no baseline exists.
- **Adopt nothing:** loses because review can loop without end, an approval can cover code nobody saw, and an agent can label its own work low.

## Decision

Adopt the convergence and approval rules now, and compute risk tiers without letting them remove a person.

- **Review converges.** A Verify request refused by the review itself is a round; after `reviewRoundCap` (3) the gate stops until a human types `sdlc reject <f> 5 rethink: ...`. The packet lists what changed since the last review. A finding that repeats a closed one is refused.
- **An approval covers what was checked.** Each request stores a fingerprint of what it checked: the PRD and feature file at Plan, the plan at Design, the content of every changed file otherwise. If it changed, the approval lapses. Release refuses code that changed after Verify reviewed it.
- **The change sets its risk tier.** Low is documents and specs only; medium is code; high is a path that always needs a person (`highRiskPaths`, `askPaths`, `.github/`, migrations) or a destructive migration. The pre-review's label may raise it, never lower it; a lower label is refused. High risk turns on the strict ledger rules.
- **Every pre-review says how to revert**, in one PR template shared by the plugin, the repo kit and this repo.
- **`sdlc close <feature> <reason>`** retires work, human-only, never while a lesson is owed or a postmortem is open.
- **Every merge needs a person.** `bug:5` and `task:5` join `neverTrust`. Earned-trust streaks no longer apply to any merge.
- **Proposed, not decided:** low-risk merges with no person. Before the founder decides, the plugin needs a revert counter, at least fifty low-tier merges reviewed by a person with no reverts, incidents or serious human findings, a recall eval built from real escapes, and approvals bound to a verified identity.

## Consequences

- Good: an agent can no longer loop review without end, slip code in after approval, or talk its own risk down.
- Downside: a rebase onto a changed main lapses an approval when it changes a file the PR touches, so the gate is requested again.
- Downside: every pre-review gains one required line.
- Risk: the tier rule is path-based; a dangerous change in an ordinary file reads as medium. The pre-review can raise it, and humans still review every merge.

## Review

Five agents, one round; the CTO settled the zero-human question by deferring it. See the decision record.
