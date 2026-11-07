# System facts: merge-is-hand-check

## Facts

- F1: [governing] manualProblems() refuses each untested @manual criterion unless the PR's "## Test results" has a dated, attributed "Checked by hand: AC-n, who, date, how, pass" line, so the line is required today. Source: scripts/testmatrix.mjs:76-91. Verified: 5c1a71c.
- F2: The Verify request adds manualProblems() to its refusals, so a PR without the line cannot pass Verify. Source: scripts/sdlc.mjs:462. Verified: 5c1a71c.
- F3: The test matrix marks a @manual criterion with no test as due "manual" and does not count it as a missing test, so which criteria a person checks is already known. Source: scripts/testmatrix.mjs:49-54. Verified: 5c1a71c.
- F4: The review packet lists untested criteria, @manual ones with "by hand: judge whether a test was possible", in "## Criteria with no test", so the reviewer is told today but not under its own heading. Source: scripts/review.mjs:195. Verified: 5c1a71c.

## Not found

- Looked for any other reader of the "Checked by hand" line in scripts/, scripts/hooks/ and the CI scripts in .github/scripts and templates/repo/.github/scripts: none, so dropping it loses no record (A2).
