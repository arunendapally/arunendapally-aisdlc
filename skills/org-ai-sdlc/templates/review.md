# Review: <feature>

<!-- The findings ledger. One row per finding, from every reviewer: the pre-reviewer, each lens, and
     humans. The Verify gate refuses an open blocker, major or minor; a wontfix needs a reason; a
     blocker cannot be wontfix. Humans: add what you found with an H id and source "human". Those
     rows are how the pre-review learns what it misses (sdlc retro reads them).

     ID:       F1, F2 ... for agent findings; H1, H2 ... for human findings. Never reuse or delete one:
               the gate remembers every id it has seen.
     Severity: blocker (wrong or unsafe, cannot ship), major (a real defect or missing test),
               minor (should fix), nit (taste; may stay open).
     Location: file:line where the finding was raised.  Checklist: the item in standards/code-review-checklist.md.
     Status:   open | fixed: <commit that fixed it> | wontfix: <reason>.
               A human who confirms an agent finding does not add a row: write "confirmed by <name>" in it.
     Source:   pre-review | human | lens:security | lens:tests | lens:data | lens:performance | ... -->

| ID | Severity | Location | Checklist | Finding | Status | Source |
|---|---|---|---|---|---|---|
