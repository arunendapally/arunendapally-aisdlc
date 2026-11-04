# Slices: <capability>

<!-- A record, not a stage. Owner: the CTO, in /ai-sdlc:start, as specs/<capability>/slices.md. Gate: none.
     Each slice is a feature with its own PRD and lane: "sdlc init <slug> --capability <capability>".
     "sdlc status" prints the first line of Outcome and one line per slice, so keep both to the shapes below. -->

## Outcome

<!-- One sentence on the first line: what changes for the users when every slice ships, with a number and its source.
     Example:
Returning shoppers buy items they saved: 8% of saved items bought within 14 days of saving (Priya, product lead). -->

## Slices

<!-- One line per slice, in shipping order, riskiest assumption first:
     "- <slug>: <what a user can do once it ships>. Depends on: <slugs, or none>. Status: planned | started | shipped | dropped"
     Example:
- save-list: a signed-in shopper saves an item and sees it in their list. Depends on: none. Status: planned
- sold-out-mark: a saved item that sells out shows as sold out. Depends on: save-list. Status: planned
- save-share: a shopper shares their saved list by link. Depends on: save-list. Status: planned
     Each slice: vertical (a user sees a change; "the database layer" is not a slice), at most 7 scenarios,
     under the lane's PR line limit (see tasks.md Budget), shippable alone.
     The slug is the feature slug (lowercase, digits, hyphens). No full stop inside "Depends on" or "Status". -->
