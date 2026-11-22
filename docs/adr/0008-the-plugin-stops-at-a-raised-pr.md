# ADR-0008: The plugin stops at a raised PR

Status: proposed
Date: 2026-11-06

## Context

Every lane runs to Release, Verify and Release wait for named people, and under autonomy `sdlc merge` pushes to main (scripts/lib.mjs:16-37, scripts/sdlc.mjs:573-587; facts F1, F2, F5 in specs/stop-at-pr/facts.md). Teams already have approval, merge and promotion rules; in some, QA tests the image in a lower environment and the merge itself promotes to production. The owner ruled that approval, merge, deploy and release are the org's process, and that deploying continuously is distinct from releasing with sign-off (PRD Q1, Q2). Agents still cannot push to main (scripts/hooks/pre-tool.mjs:172, F7). ADR-0004 added a Release check for failure F3 (a branch deploy erased by the next merge); ADR-0005 decided that every merge needs a person.

## Options

- **Every lane ends at Verify, which passes on its checks; the plugin never merges:** the PR is the hand-off. Might win: no rule that duplicates or fights the org's own; less code. Might lose: the plugin no longer checks that a release is on main and live (ADR-0004 F3).
- **Keep Release as an optional stage a repo turns on:** Might win: teams without their own release process keep a checklist. Might lose: a second path to maintain and test, for a step the owner placed out of scope.
- **Keep today's gates and only drop sdlc merge:** Might win: smallest change. Might lose: Verify and Release still name approvers the org already names.

## Decision

Every lane ends at Verify, which passes on its checks; the plugin never merges.

- Lanes: full runs 1, 3, 4, 5; light runs 1, 4, 5; bug, task and hotfix run 4, 5. Build and Verify pass on checks in every lane.
- A feature is complete when Verify passes. Its outcome follow-up is read from the PRD's "## Outcome metric" (facts F3, F4).
- `sdlc merge` is removed. Agents still never push to main (F7); the agent pushes the branch and raises the PR.
- A @release criterion is not refused at Verify; the review packet lists it under "## Check after deploy".
- ADR-0004's F3 guard stays where the plugin still acts: an agent deploy from a branch is held by the hook. Its Release check is no longer run. ADR-0005's "every merge needs a person" becomes the org's rule, not the plugin's.
- The now-unused release code, template and evals are deleted in a follow-up task.

Confirmed by: tests/stop-at-pr.test.mjs, which fails if any lane has a stage after 5, if Verify waits for a named owner, if a merge command exists, or if a @release criterion is refused at Verify.

## Consequences

- Good: no plugin rule duplicates or fights the org's approval, merge and release rules.
- Good: no human stop inside the plugin after the intent; the PR is where people come in.
- Downside: the plugin no longer proves a release is on main and live; that is now the org's release check.
- Downside: under autonomy, Verify passing no longer means a person looked; only the PR review does.
- Risk: a team with no review rule on main could merge an unreviewed PR. Revisit if a dogfood PR merges with no review; GitHub branch protection is the fix, not a plugin gate.

## Review

- Q1 (product, Arun): Who may approve a merge? A: Not the plugin's call; orgs have their own policies. The agent only uses a branch and always raises a PR. Changed: Verify owner removed; sdlc merge removed.
- Q2 (product, Arun): Is Release in scope? A: No. Deploy continuously; release needs sign-offs, which the plugin does not own. Changed: no lane has Release.
- Q3 (security, design-review lens): Does removing the merge gate let work reach main unreviewed? A: The plugin can no longer reach main at all: the push guard stays (F7) and the merge command goes. Whether a PR needs a reviewer is the repo's branch protection. Changed: Consequences name the risk and the fix.
- Q4 (operability, design-review lens): ADR-0004 F3 was caught at Release; what catches it now? A: The hook still holds an agent's deploy from a branch; a release from main is the org's process. Changed: Decision says which part of ADR-0004 still runs.
- Open: none.
