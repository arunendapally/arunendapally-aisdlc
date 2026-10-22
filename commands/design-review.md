---
description: Convene the design review board. Reviewers from at least three disciplines cross-question every decision in the plan; the architect answers; each decision gets a verdict before the Design gate.
argument-hint: <feature-slug>
---

Delegate to the `design-reviewer` agent for `$ARGUMENTS`, with the `architect` answering.

1. Copy the template to `specs/$ARGUMENTS/design-review.md` if it is not there.
2. The board cross-questions each decision `plan.md` names in `## Decisions` (or the plan as a whole), with at least three disciplines, as the `design-reviewer` agent describes.
3. The architect answers every question in place and revises ADRs the board sends back. Each ADR weighs at least two options and names its downsides.
4. Loop until every decision has `Verdict: accept` and every question is resolved, at most three rounds, then escalate.

`sdlc request` refuses the Design gate until then. The human architect and product lead then approve with `sdlc approve $ARGUMENTS 3`, reading the board's summary first.
