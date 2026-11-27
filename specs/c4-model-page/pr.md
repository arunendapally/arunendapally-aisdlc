## Summary

A new `c4-model-page` skill builds one self-contained HTML C4 model page for a feature: Context, Containers, Calls, Run and Changes tabs, hash-routed, with Mermaid diagrams you can pan, zoom, fit and show full screen (issue #71). Design hands off to it before its gate, so the approver reads one page instead of four files; `check.mjs` proves the views agree (every call is an arrow and back, every changed system coloured as its change).
Inputs, the open question in #71: the page reads the plugin's own documents by default (`specs/<feature>/design.md`, `architecture-overview.md`, `openapi.yaml`, `docs/architecture/workspace.dsl`); a team can name its own `technical-design.md`, overview or `Teams/<repo>/openapi.yaml` instead, and those win. Overrule this here if you want the issue's paths as the default.
Spec: specs/c4-model-page/prd.md (R1 to R7). Not in this PR: an offline page with Mermaid inlined (PRD A3), a handoff from the light lane (PRD A4), and no account-level copy of the skill (issue #71 point 4).

## Test results

Suite: 372 passed, 0 failed (baseline 360), sdlc gate c4-model-page on this branch
Evals: 29/29 golden tasks pass, npm run eval
Proof: sdlc proof c4-model-page green on the branch, red on the base 3d0c3a5, 2 test files
Criteria: 7 of 8 traced at their level; AC-7 by hand (specs/c4-model-page/test-matrix.md)
New tests: tests/c4-model-page.test.mjs (AC-1 to AC-6, AC-8), tests/c4-model-page-edges.test.mjs (AC-3 to AC-5 edges from the pre-review)
Removed, skipped or quarantined: none
AC-7 by hand: the template's example page served on localhost in the built-in browser (Chromium): all five tabs by hash, the three diagrams drawn with no console errors, dark and light themes, 375px wide with no sideways scroll, + and Fit change the zoom; re-run after the pre-review fixes on Mermaid 11.17.2, a diagram drawn while its tab was hidden refits when shown.

## Pre-review

Risk: medium, because it adds code (a checker script and the page script) with no auth, data, contract or infrastructure path
Open findings: 0 (nits left open: F10)
Look here first: skills/c4-model-page/check.mjs:36 (the arrow parser: does it read every arrow form an agent will write, or report the line? F1), skills/c4-model-page/reference/page-template.md:304 (refit on resize only while the reader has not moved the diagram: is that the behaviour you want? F5), skills/c4-model-page/SKILL.md:20 (the default sources versus the issue's paths: the open question in #71)
Lenses run: correctness against the spec, simplicity (checklist G), test quality
Revert: git revert of the merge; nothing else depends on the skill and no data changes
Checked mechanically: 11 findings in specs/c4-model-page/review.md, F1 to F8 and F11 fixed with tests where the file was not locked, F9 wontfix with reason; the new tests fail on the base; no em dashes in the diff; the checker passes the template page
Could not check: touch pinch and full screen on a phone; Firefox and Safari

## Not verified

Firefox and Safari: the page was opened in Chromium only.
Touch pinch-zoom and full screen: in the code, not exercised in a browser.
A page built by an agent from a real feature's documents: only the template's worked example was rendered and checked.
The issue asks for "all 4 diagrams"; its own tab spec has three (Context, Containers, Run), and the page has three.

## Definition of done

- [x] Pre-review has no open findings
- [x] Not verified is honest
- [x] Work committed on the feature branch
