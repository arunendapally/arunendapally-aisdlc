---
description: Plan. Cut a big requirement into a roadmap of slices placed now, next or later, enablers first, each able to go live on its own; run once per capability, before Define.
argument-hint: <capability-slug>
---

Plan for the capability `$ARGUMENTS`. You are the `cto`, with the `product-owner` for what each slice delivers and the `architect` for enablers and how each goes live.

**Input:** an idea or outcome from a person, and `specs/$ARGUMENTS/slices.md` when the capability already has one.
**Processing:** cut the work into slices that run one by one with no dependency between them, enablers first (an API contract first, so the UI and the service build in parallel), place each now, next or later, and say how each goes live on its own.
**Output:** `specs/$ARGUMENTS/slices.md` from the `slices.md` template: the outcome and one line per slice. It is the capability's roadmap; there is no other document.

1. **Outcome.** One sentence with a number and its source, from what the person said.
2. **Slices.** One line each, in the template's shape: what it delivers, `Horizon`, `Kind`, `Goes live`, `Depends on`, `Status`. A slice is vertical (a user sees a change) unless it is an enabler other slices build on.
3. **Going live.** Prefer `compatible`, then `flag <NAME>`, and only when neither works `after <slug>, because <reason>`. A sequence shows tight coupling: say why, or cut the slices differently.
4. **Horizons.** `now` is being built, `next` is ready to start, `later` is re-planned before it starts.
5. **Check.** Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" status`: it lists the slices under now, next and later, marks enablers, and names any slice that goes live after another with no reason. A slice's Define request is refused until that is fixed.
6. **Start the now slices.** One feature per slice: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdlc.mjs" init <slug> --capability $ARGUMENTS`, then `/ai-sdlc:define <slug>`.

**Gate:** none. The roadmap is a record; each slice's Define gate is where a person decides.
