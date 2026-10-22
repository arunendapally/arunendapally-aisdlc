# ADR-0002: The loop spine: plan, test, implement, verify, review, release and observe, remember

Status: accepted
Date: 2026-10-22

## Context

The founder proposed plan, test, implement, review, verify, remember, improve as the spine of every lane. Today, test-first is enforced only in the bug lane, and "remember" is only an instruction at release. Eight expert agents debated it over two rounds; the record is in [docs/decisions/2026-10-22-loop-spine.md](../decisions/2026-10-22-loop-spine.md).

## Options

- **The founder's seven steps, as a new set of stages for every lane:** one clear loop. Might lose because it replaces stages teams already use, puts human review before cheap machine checks, makes improve a per-change chore, and has no release step.
- **Two loops on the existing stages:** the stages stay as the outer loop per feature; an inner loop per slice runs test, implement, gate, retry. Test-first is proved by evidence at Verify, remember gates on staleness, release and observe is explicit, and improve stays out-of-band. Might lose because it is less obvious than one linear list.
- **Keep the plugin as it is:** no change. Loses because test-first and remember stay unenforced for features.

## Decision

Two loops on the existing stages. The spine every lane follows is: plan, test, implement, verify, review, release and observe, remember. Improve runs out-of-band.

- **Plan:** unchanged. The PRD, facts, Gherkin acceptance criteria and the design review board.
- **Test:** the inner loop starts each slice with a red run. At Verify, `sdlc proof` runs the traced tests against the merge-base code, in a git worktree, through `proofCommand` with a `{files}` placeholder.
  - Every new criterion's tests must fail or error there; "no tests collected" does not count.
  - The test files' hashes must match the final green run.
  - Without a `proofCommand`, the step warns and the PR says the proof did not run.
  - Hotfixes run the proof after merge, and a failure blocks the postmortem.
  - A slice tagged spike may skip the inner-loop red run, never the proof, and spike code merges only once a non-spike slice replaces it.
- **Implement:** unchanged. The builder with the simplicity ladder, and the tech lead reviewing each batch.
- **Verify, then review:** the machine gate first, then the packet, lenses and ledger, then the human.
- **Release and observe:** Release blocks on a rollout plan, a tested rollback and probe results.
  - The feature closes at release. Its outcome follow-up has an owner from the PRD and a due date from the plan's watch window, and its age is a flow number of its own.
  - A breach during the window alerts the incident commander, who decides whether to declare a hotfix.
  - A spent error budget freezes new full-lane and light-lane features.
- **Remember:** Release blocks on any of these:
  - stale knowledge pages or facts whose sources the change touched (C4 files count)
  - ADRs the change contradicts that are not marked superseded
  - postmortem actions without a link to a trap, test or PRD

  An agent re-verifies stale pages before the human review, so there is no new wait. Knowledge pages carry provenance and are scanned for instruction-like text. There is no rule that traps or the changelog must change.
- **Improve:** `sdlc retro` runs on a schedule, and whenever an escalation passes the cap or the same review finding appears twice. It only opens PRs, which pass CODEOWNERS and the evals, and never changes a running lane's rules.

## Consequences

- Good: test-first and remember become checks for every lane without new human waits; tests are proved to depend on the change rather than ordered by ceremony; the loop now ends in production, not at merge.
- Downside: `sdlc proof` needs a `proofCommand` per repo and a runner that can target files; until a team sets it, the proof only warns.
- Downside: counting any failure on the base code as red accepts a test that fails there for an unrelated environment reason; the hash lock and the green run limit the damage but do not remove it.
- Risk: the outcome follow-up depends on someone reading the metric after N days; the flow number makes a forgotten one visible, not impossible.

## Review

Debated by eight experts over two rounds; see the decision record.
