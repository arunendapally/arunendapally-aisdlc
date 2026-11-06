# System facts: <feature>

<!-- Define, brownfield and data work. Owner: architect agent. Gate: with prd.md; no separate approval.
     What is true about the current system that this feature depends on, each pinned to the code line that
     shows it. Read the code; never infer from a name, a doc or a schema. Write "None, because ..." under
     "## Facts" only when there is no current system (greenfield). prd.md cites facts by id (F1); it does not copy them.

     One fact per line, one line each, nothing after the commit:
     - F1: [governing] <statement>. Source: path/to/file.ts:42. Verified: <short commit>.
     Statement: "<what the code does>, so <what that means for this feature>". Example:
     - F1: [governing] BasketRepo.add() keeps one row per shopper and item with a unique key, so the saved list can take the same shape and saving twice keeps one entry (AC-2). Source: src/basket/repo.ts:42-48. Verified: 1a2b3c4.
     - F2: cart-service consumes stock.changed events, published within one minute of a change, so R2 can listen instead of polling. Source: src/stock/events.ts:17. Verified: 1a2b3c4.
     Not: "F3: The system handles lists." (no behaviour, no consequence)

     The gate refuses: a line starting "- F<n>" in any other shape (bold, a note after the commit); an id
     used twice; a path (from the repo root) or line that does not exist; a commit that is not in this repo;
     a source changed since that commit (stale: read the committed file, then "git rev-parse --short HEAD").
     Brownfield work: at least one fact. Brownfield and data work: one marked [governing], pinned to
     implementation code, read first. Docs, *.md, *.sql, *.json, *.yaml, *.yml, *.graphql, schema files
     and migrations do not count. A fact worth keeping beyond this feature goes to knowledge/ as well. -->

## Facts

## Not found

<!-- What you looked for in the code and could not find, where you looked, and the requirement it puts at risk.
     Example:
- Looked for a per-shopper list size limit in src/lists/: none, so R4 is new behaviour.
- Looked for any guest identity in src/session/: none, which agrees with Q1.
     Found everything: "Nothing missing; searched <where>." (not "None, because": the gate would read it
     as "no current system" and pass a data feature with no facts). -->
