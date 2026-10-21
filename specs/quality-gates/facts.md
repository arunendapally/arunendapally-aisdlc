# System facts: quality-gates

<!-- Read from the code at 75b1643, the commit before this change. -->

## Facts

- F1: Only a human prompt can approve a gate, and only after the agent requested it, because the request runs the checks. Source: scripts/hooks/user-prompt.mjs:95. Verified: 75b1643.
- F2: An approval is recorded under the git user name of whoever typed it, not a verified identity. Source: scripts/hooks/user-prompt.mjs:19. Verified: 75b1643.
- F3: Knowledge pages already detect staleness by comparing their sources against a verified commit, so facts can reuse the same mechanism. Source: scripts/knowledge.mjs:45. Verified: 75b1643.
- F4: The Stop hook checks only added lines, so pre-existing text is left alone. Source: scripts/hooks/stop.mjs:2. Verified: 75b1643.
- F5: Agent evals score answers with must and must-not rules, so seeded-bug review evals need no new harness. Source: evals/agents.mjs:21. Verified: 75b1643.

## Not found

- No structured record of review findings existed before this change; the pre-review was a free-text section in the PR body, so nothing could measure what it missed.
- No check linked acceptance criteria to tests.
