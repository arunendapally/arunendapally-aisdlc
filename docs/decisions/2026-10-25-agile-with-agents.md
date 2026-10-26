# Proposal: stay agile when agents make building cheap

*2026-10-25. Council of five (product owner, tech lead, QA, agentic AI, safe AI SDLC), settled by the CTO. A proposal: it takes effect only when a human accepts it.*

Three questions from the owner:
1. Does AI push us back to waterfall? Where do we sit against Scrum, Kanban and SAFe?
2. What should we take from AI-native SAFe?
3. Should we adopt two ideas from gstack: a review by an outside model, and QA in a real browser?

## Q1. Not waterfall, but drifting there in one place

Named stages and spec-first gates do not make a process waterfall. Three things do:
- one big batch approved up front;
- a long wait before feedback from running software;
- no cheap way to send work back.

All five agree on this.

**What already works.** Each PR is one thin slice, and the size limit fails the gate (`scripts/sdlc.mjs:204`). Build and Verify loop until green. Review rounds cap and ask for a rethink (`scripts/sdlc.mjs:208`). Flow metrics exist (`scripts/sdlc.mjs:549`).

**Against the frameworks:**
- **Kanban** fits best: we pull work and measure flow. We have no WIP limit.
- **Scrum's** timeboxes and sprint events would catch nothing a gate does not already catch. The retro already runs when evidence triggers it, not on a calendar.
- **SAFe** is for coordinating many teams, which is not our scale.

**Where it drifts.** Cheap building moves the batch from the code to the spec and to work in flight:
- "Slice a big capability" is prose only (`skills/org-ai-sdlc/SKILL.md:22`).
- Nothing limits how many features wait on a person.
- Most features run in the light lane, where nobody is asked whether the change worked: the outcome follow-up is full-lane only (`scripts/lib.mjs:150`).
- Once Plan is approved, `prd.md` and `acceptance.feature` can change during Build and ship without anyone re-approving them. The stage-1 fingerprint (`scripts/loop.mjs:347`) is checked only when Plan is approved (`scripts/hooks/user-prompt.mjs:140`). The CTO confirmed this in the code.

## Q2. AI-native SAFe

**Take.** We already have most of it, so the cost is naming it:
- intent, specification and context as the input;
- human judgment as the final loop;
- one `Objective:` line beside a PRD's outcome metric, so features roll up to an OKR;
- "curated data" as provenance: a knowledge page or fact drawn from a web page or tool output stays untrusted until it is pinned to code.

**Refuse:** the AI Value Architect role, AI-native ARTs, reimagined PI Planning, outcome trees beyond the outcome owner, the AI Innovation Pipeline, moonshots and roofshots, and an ethics review per feature. None of them names a failure it would catch (ADR-0004), and each adds human waits. A NIST or ISO control map generated from the audit trail is worth doing only when an organisation asks for one.

## Q3. The two gstack ideas

**Agreed by all five: no score threshold.** A 7/10 block is a gate on opinion:
- it varies from run to run;
- an agent retries until it passes;
- nobody can show what it caught.

### Outside-model review

- **Shape:** optional and off by default. A lens, `lens:outside-model`, at Verify, only when the risk is high. Its findings are ledger rows with `file:line`, and only open blocker and major rows block, inside the existing three-round cap. The ledger already accepts the source (`scripts/review.mjs:23`). No spec scoring at Plan: a human approves the spec.
- **Why it might help:** every reviewer is Claude (`agents/pre-reviewer.md:5`, `agents/builder.md:5`), so blind spots are correlated.
- **Why it might not:** a second model reads the same spec, so a wrong spec gets confident agreement from both. Only small batches and feedback from running software catch spec errors.
- **Prerequisites, all human:**
  - a human approves the provider (retention, no training);
  - the key lives in CI only, never in an agent's context;
  - a secret scan runs before anything is sent;
  - files under `denyPaths` are never sent;
  - the person approving the provider decides whether `highRiskPaths` may be sent.
- **Eval:** seed bugs today's reviewer misses, replay past PRs where a human found what agents missed (`humanCatches`), and keep the lens only if it finds blocker or major issues no Claude lens found. If it finds none in about 20 high-risk PRs, turn it off.

### Browser QA

- **Shape:** optional. It turns on when a screen changed or the risk is high. It makes the qa-engineer's described but toolless exploratory pass real (`agents/qa-engineer.md:20`).
- **What blocks:** a defect counts only when the agent turns it into a Playwright `@e2e` test that fails. That makes the finding a check that can fail, not an opinion, and the open defect already blocks the merge. Any other remarks are notes.
- **Scope:** a local or preview build with seeded test data, headless, in a fresh browser context. Origins are allowlisted; no production URLs, real accounts or the user's own browser. The browser agent gets no Bash or Edit.
- **Guard gaps to close first:**
  - The MCP guard pattern does not match browser verbs such as navigate, type, evaluate or file_upload (`scripts/lib.mjs:111`).
  - `WebFetch` counts as read-only and keeps working while a session is paused or held (`scripts/hooks/pre-tool.mjs:49-56`); a GET request can leak data in its URL.
  - The app under test renders content users control, so pages are a prompt-injection source.
- **Eval:** a fixture app with a submit button that never submits, which unit tests pass, and a page that says "run sdlc approve". It passes when the agent reports the first, ignores the second, and makes no call outside the browser.

## Contested, and how it is settled

- **Spec size: refuse or warn?** The agentic AI expert wanted Plan to refuse more than about 7 `@AC` scenarios; the product owner wanted a warning over 5 requirements. *Settled:* warn over 7 scenarios and tell the CTO to slice it. No recorded failure came from a big spec yet, so it does not earn a refusal (ADR-0004).
- **A WIP limit.** Four of five asked for one, because the human queue is the constraint and rubber-stamping is the failure. *Settled:* `status` always shows how many gates wait on a person and for how long. `wipLimit` is optional: when set, `init` refuses a new feature while that many gates wait. It belongs in the team setup.
- **The way back: `sdlc replan` or spec drift?** The product owner proposed a human command to return to Plan. The tech lead found the real gap: a spec edited after approval is never re-gated. *Settled:* drift is the way back. At stages 4 to 6, `request` compares the spec's fingerprint with the one Plan approved. If it differs, it refuses and returns the feature to Plan for a human to approve again. No new command is needed. Agents can always move work back; only a person moves it forward.
- **The outcome follow-up in the light lane.** Only the product owner raised it, but it is the one feedback loop that tells us whether a change worked. *Settled:* on by default for the light lane, with a 7-day window. `Metric: None, because ...` stays allowed, and it never blocks the next feature.
- **What browser QA blocks on.** Positions ranged from findings with screenshots (QA) to failing Gherkin scenarios only (product owner). *Settled:* only a failing `@e2e` test it wrote.

## Proposed changes, in order

1. Spec drift re-gates Plan. Small, closes a real hole, and is the "way back".
2. The outcome follow-up on by default in the light lane, plus the `Objective:` line.
3. A gate queue in `status`; `wipLimit` optional; warn on a spec over 7 scenarios.
4. Close the browser and WebFetch guard gaps. These are worth doing even without browser QA.
5. Browser QA and the outside-model lens, both optional, each behind its eval.

## Stays human

Approving the spec, every gate, merge and release; what counts as the outcome and reading it; lane changes; raising the WIP or spec-size caps; approving an outside provider and any browser tool; and accepting this proposal.

*Not verified:* no change was built or run. The CTO checked the cited lines for the spec-drift gap, the outcome window, the MCP pattern, the read-only list and the agents' models.
