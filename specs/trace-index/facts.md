# System facts: trace-index

## Facts

- F1: [governing] matrix() maps each acceptance criterion of one feature to the test files that name it, so the trace from a scenario to its tests exists per feature only. Source: scripts/testmatrix.mjs:37. Verified: f67ea18.
- F2: decisionsOf() reads the capability overview's decision rows with a "Changes" cell naming the features and requirement ids they affect, so decisions can be traced to requirements. Source: scripts/lib.mjs:477-479. Verified: f67ea18.
- F3: slicesOf() lists a capability's slices, which are its features, so the plugin can walk every feature in a capability. Source: scripts/lib.mjs:313. Verified: f67ea18.

## Not found

- Looked for a repo-wide index from requirements to scenarios, tests, ADRs and decisions, or back from a test or ADR to its requirement, in scripts/ and commands/: none.
