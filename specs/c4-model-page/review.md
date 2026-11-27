# Review: c4-model-page

<!-- Verify. Owner: pre-reviewer agent. Gate: with pr.md; the gate reads every row and refuses an open blocker, major or minor.
     The findings ledger: one table row per finding, from the pre-reviewer, every lens and every human.
     Replace <feature> above. No findings is a valid ledger; the PR's "Lenses run:" line says what was looked at.

     Example:
| F1 | major | src/lists/save.ts:58 | 6 | Saving twice adds two rows: no unique key on (shopper, item). A replayed POST shows it. | fixed: 5d6e7f8 | pre-review |
| F2 | minor | src/stock/events.ts:12 | 25 | Hand-rolled retry loop where src/lib/retry.ts exists. | wontfix: src/lib/retry.ts retries 5xx only and this call must retry 409 | pre-review |
| F3 | nit | src/lists/save.ts:20 | 22 | Unrelated reformat of the import block. | open | lens:tests |
| H1 | major | src/web/SavedList.tsx:44 | 11 | Sold out is checked in the UI only; the API still saves a sold-out item. Confirmed by Ana. | fixed: 9c8d7e6 | human |

     Each cell, and what the gate refuses:
     ID        F1, F2 ... for agents; H1, H2 ... for humans. Take the next number. Never reuse, renumber or delete a row.
     Severity  blocker: wrong or unsafe, cannot ship. major: a real defect or a missing test. minor: fix before merge. nit: taste, may stay open.
     Location  file:line from the repo root, no spaces, where the code is now. When the code moves, move the line.
     Checklist the item number only from standards/code-review-checklist.md: 6, not "B6" or "idempotent". The gate finds repeats by it.
     Finding   what is wrong, why it matters, how to see it. Never type a pipe character: it splits the row and the gate refuses it.
     Status    open | fixed: <sha of the commit that fixed it> | wontfix: <reason>. On a high-risk change the commit must change
               the Location file. A blocker is never wontfix.
     Source    pre-review | human | lens:<name>, no space after the colon: lens:security, lens:tests, lens:data, lens:performance.

     A finding seen before: set its old row back to open; a new row on the same file and checklist item as a closed one is refused.
     A bug with siblings: one row that names the class and lists every place.
     Humans: agree with an agent row by adding "Confirmed by <name>." to its Finding. Add your own as an H row with source
     human; sdlc retro reads H rows to learn what the pre-review misses. -->

| ID | Severity | Location | Checklist | Finding | Status | Source |
|---|---|---|---|---|---|---|
| F1 | major | skills/c4-model-page/check.mjs:25 | 2 | The arrow regex silently skips arrow lines Mermaid accepts, so an arrow with no Calls row passes (R4, the "and back" half). Probed on the template page: adding `api --> stock;` (trailing semicolon), `api --> stock --> listener` (chain) or `api -- "asks" --> stock` (text label) each returns no problems. Fix: report any line in the containers diagram that contains an arrow token but does not parse, so the page is fixed rather than the call missed. | fixed: HEAD | pre-review |
| F2 | minor | skills/c4-model-page/check.mjs:48 | 2 | When the Changes table is missing or its `data-table="changes"` is renamed, rows() returns nothing and the colour check never runs: the page passes clean (probed). The calls table and each diagram are reported when missing; the changes table should be too. | fixed: HEAD | pre-review |
| F3 | minor | skills/c4-model-page/check.mjs:16 | 7 | Table cells are read by position from exact `<tr>` and `<td>` tags. A `<td class=...>` drops the cell and shifts the columns, giving a wrong message (probed: the cart-api row reported its contract path as its change); an empty `<tr></tr>` in the calls tbody throws a TypeError at check.mjs:44 instead of reporting a problem. Match `<td[^>]*>` and skip or report rows with too few cells. | fixed: HEAD | pre-review |
| F4 | minor | skills/c4-model-page/SKILL.md:48 | 2 | The SKILL contradicts itself for a system outside the journey that does not change: line 47 colours it purple (outside), line 48 and the checker want it grey because its Changes row says No change. Probed: listing mobile as No change in Changes fails the check in both diagrams. The template only passes because mobile is left out of Changes although its Calls row says No change. Say which wins (for example: outside systems are not listed in Changes, or outside counts as No change in check.mjs). | fixed: HEAD | pre-review |
| F5 | minor | skills/c4-model-page/reference/page-template.md:333 | 2 | Refit logic (R5). The fullscreenchange listener refits every diagram, including those on hidden tabs whose frame is 0 by 0, so fit() sets scale 0.2 and a negative offset; because moved is already true, the ResizeObserver does not refit when that tab is shown again and the diagram opens off screen. Separately, moved is set by any pointerdown (line 306) and by every controls click including Fit (line 332), so one plain click ends the automatic refit on resize. Fix: skip fit when the frame has no size, and set moved only on an actual pan or zoom. | fixed: HEAD | pre-review |
| F6 | minor | skills/c4-model-page/reference/page-template.md:331 | 18 | The Full screen button calls Element.requestFullscreen with no feature check. iPhone Safari does not provide it for non-video elements, so on a phone (R6, 375px) the button throws a TypeError and does nothing. Hide the button when document.fullscreenEnabled is false. Not run on an iPhone; the PR also lists full screen and touch as not verified. | fixed: HEAD | pre-review |
| F7 | minor | skills/c4-model-page/reference/page-template.md:67 | 18 | The selected tab is white text on var(--accent); in the dark theme that is #4fb3a7, about 2.5 to 1 contrast at .85rem, below the 4.5 to 1 AA minimum (light theme #0b6b63 is about 6.4 to 1 and passes). Use a dark text colour on the dark-theme accent, or a darker accent for the selected tab. | fixed: HEAD | pre-review |
| F8 | minor | tests/c4-model-page-edges.test.mjs:37 | 14 | AC-3 default-source assertions are partly vacuous: `architecture-overview.md` and `openapi.yaml` are also matched by the team-override sentence (SKILL.md:26, `its own architecture-overview.md` and `Teams/<repo>/openapi.yaml`), so deleting the default lines SKILL.md:21-22 keeps the test green. Assert the full default paths (`specs/<feature>/architecture-overview.md`, `specs/<feature>/openapi.yaml`). | fixed: HEAD | pre-review |
| F9 | minor | tests/c4-model-page.test.mjs:53 | 15 | AC-6 greps the template for labels, key names and code fragments (`Math.min(6, Math.max(0.2,`) and never exercises pan, zoom or fit; F5 passes it. Either move the controls into the AC-7 hand check by name (each button, each key, wheel, pinch, full screen, on a hidden-then-shown tab) or record that AC-6 proves presence only. | wontfix: the proved test file is locked and a DOM run needs a new dependency; pan zoom fit and refit after a hidden tab were run by hand in Chromium and are named under Not verified for touch and full screen | pre-review |
| F10 | nit | skills/c4-model-page/reference/page-template.md:42 | 26 | The `data-theme` override (the second dark token block at lines 42-49, the `:not([data-theme="light"])` guard at line 33 and the checks at line 285) serves a theme switch nothing on the page sets and R6 does not ask for. The smaller version is the prefers-color-scheme block alone and `matchMedia` in the script. | open | pre-review |
| F11 | nit | skills/c4-model-page/reference/page-template.md:282 | 24 | Mermaid is loaded as `mermaid@11` from the CDN with no exact version and no integrity check, so every page already written changes renderer when a new 11.x ships. PRD A3 accepts the CDN; pin the exact version the AC-7 check ran on. | fixed: HEAD | pre-review |
| F12 | minor | skills/c4-model-page/SKILL.md:17 | 18 | The skill reads feature documents into the prompt but did not say they are data, not instructions, so text planted in a design or contract could steer the agent. Raised by GitHub code scanning on PR 75. | fixed: HEAD | lens:security |
