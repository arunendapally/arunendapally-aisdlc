# Slices: <capability>

<!-- Plan, the stage before Define, run per capability. Owner: the CTO, in /ai-sdlc:plan, as specs/<capability>/slices.md. Gate: none.
     Each slice is a feature with its own PRD and lane: "sdlc init <slug> --capability <capability>".
     "sdlc status" prints the first line of Outcome and one line per slice, so keep both to the shapes below. -->

## Outcome

<!-- One sentence on the first line: what changes for the users when every slice ships, with a number and its source.
     Example:
Returning shoppers buy items they saved: 8% of saved items bought within 14 days of saving (Priya, product lead). -->

## Slices

<!-- The capability's roadmap, written by /ai-sdlc:plan. One line per slice, enablers first, riskiest assumption first:
     "- <slug>: <what it delivers>. Horizon: now | next | later. Kind: slice | enabler. Goes live: compatible | flag <NAME> | after <slug>, because <reason>. Depends on: <slugs or none>. Status: planned | started | shipped | dropped"
     Example:
- save-api: the saved-items API contract, so the list and the service build in parallel. Horizon: now. Kind: enabler. Goes live: compatible. Depends on: none. Status: planned
- save-list: a signed-in shopper saves an item and sees it in their list. Horizon: now. Kind: slice. Goes live: flag SAVED_ITEMS. Depends on: save-api. Status: planned
- save-share: a shopper shares their saved list by link. Horizon: later. Kind: slice. Goes live: after save-list, because the link opens the list. Depends on: save-list. Status: planned
     A slice is vertical (a user sees a change), unless it is an enabler other slices build on, such as an API
     contract. Each: at most 7 scenarios, under the lane's PR line limit (see tasks.md Budget).
     Goes live on its own: prefer compatible, then a flag; "after" is a sequence, a coupling smell, and needs its
     reason or the slice's Define request is refused. No Horizon reads as now.
     The slug is the feature slug (lowercase, digits, hyphens). No full stop inside a field. -->
