# Review: quality-gates

<!-- Dogfood: the pre-reviewer (lenses: correctness, tests, security) reviewed this round's diff and raised
     F1 to F12; running the plugin on itself raised F13 to F15. Every row is fixed in c8d32d4 with a
     regression test in tests/quality.test.mjs. No human review rows yet: the human gates are waiting. -->

| ID | Severity | Location | Checklist | Finding | Status | Source |
|---|---|---|---|---|---|---|
| F1 | major | scripts/testmatrix.mjs:38 | 2 | Criterion ids were not scoped to their feature: another feature's AC-1 test traced this one. Now a test must also name the feature. | fixed: c8d32d4 | pre-review |
| F2 | major | scripts/sdlc.mjs:63 | 2 | A PRD with requirements as a table or numbered list parsed to no ids and switched coverage off. Tables now parse, and a PRD with no ids fails the gate. | fixed: c8d32d4 | pre-review |
| F3 | major | scripts/review.mjs:150 | 11 | The ledger trusted the agent: rows deleted before the first request were unseen and fixed took any commit. Ids are now recorded at sdlc review, and fixed needs a commit that changes the finding's file; CODEOWNERS covers the ledger and board files. | fixed: c8d32d4 | lens:security |
| F4 | major | scripts/design-review.mjs:21 | 2 | One option with a sub-bullet counted as two, and "No real cost." passed as a downside. Only top-level bullets count, and denials do not. | fixed: c8d32d4 | pre-review |
| F5 | major | scripts/testmatrix.mjs:13 | 2 | *.spec.ts was classed as e2e, failing every Jest, Angular and NestJS unit test. E2E is now recognised by folder or an .e2e name only. | fixed: c8d32d4 | pre-review |
| F6 | minor | scripts/gherkin.mjs:10 | 9 | File paths and hashtags were refused as selectors. Only XPath and data attributes are errors now; #id and .class warn. | fixed: c8d32d4 | pre-review |
| F7 | minor | scripts/gherkin.mjs:60 | 9 | "< 200 ms and >" was read as a placeholder. A placeholder now starts with a letter right after "<". | fixed: c8d32d4 | pre-review |
| F8 | minor | scripts/gherkin.mjs:142 | 2 | Free-text descriptions under Rule and Scenario were refused. They are allowed before the first step. | fixed: c8d32d4 | pre-review |
| F9 | minor | scripts/review.mjs:5 | 2 | The PRD said only serious findings block, the code also blocked minors. The PRD and the header now say blockers, majors and minors block and a nit may stay. | fixed: c8d32d4 | pre-review |
| F10 | minor | scripts/sdlc.mjs:146 | 2 | A stale packet passed and an empty ledger looked like a skipped review. The packet is pinned to its commit and refused when stale; the pre-review must list the lenses it ran. | fixed: c8d32d4 | pre-review |
| F11 | minor | tests/quality.test.mjs:180 | 14 | No negative tests for the bypasses and false positives above. Added one per finding, each reproducing the reviewer's failing input. | fixed: c8d32d4 | lens:tests |
| F12 | minor | scripts/sdlc.mjs:212 | 9 | --repeat x gave NaN and a crash. It now takes a whole number from 1 to 20. | fixed: c8d32d4 | pre-review |
| F13 | minor | scripts/gherkin.mjs:8 | 9 | The words "CSS selector" in a step were refused as a selector. Selector syntax, not words, is checked. | fixed: c8d32d4 | lens:dogfood |
| F14 | major | scripts/review.mjs:58 | 2 | On a real PR the packet flagged every console.log in CLI scripts and said well-tested files had no test, burying the real signals. Prints in scripts are ignored and a file counts as tested when a changed test mentions it. | fixed: c8d32d4 | lens:dogfood |
| F15 | minor | scripts/design-review.mjs:63 | 2 | "yes (residual: ...)" was read as unresolved, so a board that noted remaining risk could never pass. A yes with a note now counts. | fixed: c8d32d4 | lens:dogfood |
