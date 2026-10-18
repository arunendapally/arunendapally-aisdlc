---
name: ai-sdlc
description: Take one feature from idea to production through a six-stage AI software development cycle (planning, analysis, design, implementation, testing and integration, maintenance) with agents in defined roles and a human at every gate. Use when the user wants to build a new feature end to end with agents, asks for "idea to prod", "AI SDLC", a product-owner agent, a supervisor review, or a build run by a reviewer and a cheaper worker model.
---

# AI SDLC: idea to production with agents

You run the cycle. The human owns every gate. Never skip a gate, and never pass one on the human's behalf.

Work in this order. Each stage ends with an artefact and a gate. Stop at each gate, show the artefact in a few lines, and wait for the human's call.

```
1 Planning -> 2 Analysis -> 3 Design -> 4 Implementation -> 5 Testing and integration -> 6 Maintenance -> back to 1
```

Copy-paste prompts for every stage are in `prompts.md`. A full worked example on an online shop is in `example-ecommerce.md`. Engineering standards and the code-review checklist live in `standards/`.

## The spine: spec-driven development

The cycle is spec-driven. Agents work from written artefacts, not from chat history.

- **The spec is the source of truth.** Code is checked against the spec, and the spec is checked against the constitution. If the code and the spec disagree, one of them is a defect, and you decide which in writing.
- **The artefact chain:** constitution, then brief, then `spec.md` (what and why), then `plan.md` plus data model and contracts (how), then `tasks.md` (in what order, with which tests), then code. Each artefact is built only from the ones before it.
- **Gates run on artefacts.** Every stage checks its output against the constitution and records the result in the artefact, including any judgement calls.
- **Corrections flow back up.** When research, review or the build finds that the spec is wrong, fix the spec first, then the code. A spec that still says something the build disproved is a trap for the next reader.
- **Tooling is optional.** Spec Kit (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`) automates the chain. Without it, write the same files by hand, in the same order.
- **Every session can cold-start.** Because everything lives in the repo, a new session, a worker model or a reviewer can pick up any stage by reading the artefacts. That is what makes handing work to other agents safe.

## Goals and loops

Every stage runs as a **goal loop**: set a goal that can be checked, do the work, check it against the goal, fix, and repeat until the goal is met. Then stop at the gate. "Make it good" is not a goal. "Every requirement cites the data it needs, and the supervisor finds no blocker" is.

```
goal -> do -> check -> met? --yes--> gate (human)
                 ^        |
                 +--fix---+ no   (after N tries: escalate, never fake a pass)
```

| Stage | Goal (exit criterion) | How it is checked | Escalate when |
|---|---|---|---|
| 1 Planning | Every requirement is numbered and every claim is graded. Open questions each carry a recommendation. | Self-check against this list, then the human reads it | Evidence for a core claim is Preliminary or missing |
| 2 Analysis | The supervisor's verdict is "proceed", or every finding is accepted or argued. Every requirement names the data it needs, and that data exists. | Rerun the supervisor on the reworked brief until it raises no blocker | Three rounds still end in "rework" |
| 3 Design | Every screen is drawn inside the real product, and every comment thread is resolved. | Thread count, plus the design agent's "could not match" list is empty or accepted | A thread goes three rounds without agreement |
| 4 Implementation | Each batch is green on the full gate, at or above the baseline count, with checklist findings fixed. | Gate output plus the review by checklist item | The same check fails three times, or a spec gap appears |
| 5 Testing and integration | Every guard has failed under mutation, the PR lists what was not verified, and the reviewer answers the honesty question with a clear yes. | Mutation records, PR body, the reviewer's written answer | A guard cannot be made to fail |
| 6 Maintenance | The production probe confirms the new version is live, and the traps and changelog are updated. | Probe output, diff of `traps.md` | The probe disagrees with the deploy report |

Rules for every loop:

- **Write the goal down before the first attempt**, in the artefact or the task. A goal set after the work is a description, not a goal.
- **Cap the loop.** Three tries is a good default. After that, escalate with what was tried and what failed. Never loosen the goal to get a pass.
- **The check must be able to fail.** A goal checked by the agent that did the work is weaker than one checked by a test or a second agent.
- **The outer loop is the cycle itself.** Stage 6 feeds traps and standards back into stage 1, so the next feature starts with better goals.

**Unattended loops.** For a stage that runs long without the human (a build batch, a CI run, a watched design canvas), Claude Code's `/loop` can rerun the same goal prompt on an interval, or let the agent pace itself, until the goal is met. Give it the goal and the cap in the prompt (see `prompts.md`). Do not use it to poll work that notifies you anyway.

## Before you start: clean the desk

- List open branches, worktrees and sessions that relate to this work. Propose archiving the stale ones. Do it only on the human's yes.
- Read the project's binding rules (a constitution, CONTRIBUTING, an agent instructions file). If none exist, offer to draft a short constitution first (see the template in `example-ecommerce.md`).

## 1. Planning: play the product owner

**Goal:** what to build and why.

1. Take on the role the human names, with its domain expertise ("product owner who specialises in payments"). If no role is named, ask for one.
2. Research the domain. Grade every claim you rely on: **Established**, **Moderate** or **Preliminary**. Say where sources are thin. Paraphrase sources, do not quote them at length.
3. List what the product must never claim or do (overclaims, dark patterns, risky defaults).
4. If asked about competitors, look for **structural** advantages (data, users or constraints they cannot have), not features to copy.
5. Write a brief: problem, users and jobs, graded evidence, requirements (numbered), out of scope, open questions with your recommendation for each.

**Artefact:** a brief in `docs/`. **Gate:** the human chooses what goes forward.

## 2. Analysis: challenge, integrate, specify

**Goal:** requirements that are true, feasible and consistent.

1. **Supervisor review.** Spawn a separate reviewer subagent on the strongest available model, **read-only**, with access to the brief AND the real code and schema. Brief it to find what is wrong, rank the top problems, flag harm risks, and propose a smaller first version. Use the supervisor prompt in `prompts.md`.
2. Check its main findings against the code yourself before reporting them. The most valuable finding is usually "this requirement needs data the system does not hold".
3. Report the verdict and the proposed cut. The human accepts or argues each point.
4. **Integration decision, in plain words, before any design:** where setup lives, where daily use lives, whether it gets a navigation item, which existing screens change. Write the answers into the brief as requirements.
5. **Specify.** If Spec Kit is installed, run its specify stage; otherwise write `spec.md` with user stories, numbered functional requirements and measurable success criteria. Check every requirement against the project's binding rules.

**Artefact:** the reworked brief plus a spec. **Gate:** the human accepts the scope cut and the integration decision.

## 3. Design: a canvas reviewed by comments

**Goal:** how it looks, behaves and is built.

1. Spawn a design subagent. Give it the brief, the integration decision, and **the real component source and an existing design of the product**. Forbid inventing headers, navigation or components. Use the design prompt in `prompts.md`.
2. Publish the mocks somewhere the human can comment on individual elements (a design canvas or artifact with comments). Ask the design agent to list what it could not match to the real product.
3. Handle each comment in its own thread: fix it, reply with what changed, resolve it. If the human pushes back, iterate in the same thread.
4. **Technical design.** Run Spec Kit's plan stage, or write `plan.md`, `data-model.md` and contracts yourself. Check the plan against the binding rules. Write any interpretation of a rule down as a **judgement**, so a reviewer can disagree openly.

**Artefact:** approved mocks, plan, data model, contracts. **Gate:** every comment thread resolved by the human.

## 4. Implementation: reviewer plus worker

**Goal:** build it without regressions.

1. Generate ordered tasks (Spec Kit's tasks stage, or `tasks.md` by hand). Each task names exact files and its test.
2. **Put the project's scars into the tasks.** At minimum:
   - Record the passing test count before any change. Finish with nothing that passed before now failing.
   - Never test against production or real user data.
   - Mutation-test every guard: break what it protects, see the test fail, restore it.
   - Any trap the repo has hit before (read `standards/traps.md`, its agent instructions and changelog for them).
   - House style rules.
   - Link the standards: the worker reads `standards/engineering-standards.md` and `standards/testing-standards.md` before the first task. If the project has its own copies, use those.
3. Commit the spec set on its own branch.
4. Start the build in a **separate session and an isolated worktree** cut from that branch. The build session is the **reviewer**. It hands phases to a **cheaper worker model** in batches, reviews every diff against `standards/code-review-checklist.md` (reporting findings by item number), and only releases the next batch once the full gate is green.
5. **Escalation:** when the build finds a spec gap, it writes up the options with a recommendation and asks the session that wrote the spec. It never guesses. Rulings get written back into the spec documents, not only the code.

**Artefact:** commits per phase on the build branch. **Gate:** the human sets who builds, who reviews, and the limits (no merge, no deploy without a yes).

## 5. Testing and integration: prove it

**Goal:** show it works, then merge safely.

1. Full gate: type check, lint, the whole test suite, end-to-end tests. Compare against the baseline count.
2. Every guard is mutation-tested and the result is recorded. A test that cannot fail is not a guard.
3. The PR body lists: every task, test counts before and after, each mutation and its result, spec corrections, and a **"Not verified"** section.
4. Run the full code-review checklist once more on the whole PR. List any item that could not be checked under "Not verified".
5. **Ask the reviewer directly: "Did you review your worker's work, every phase, or did you take any results on its word?"** If the answer is anything but a clear yes, do a proper review before merging. Review fatigue happens to agents too.
6. Merge only on the human's yes.

**Artefact:** a merged PR. **Gate:** the human's definition of done, and an honest answer to the review question.

## 6. Maintenance: release, probe, feed the cycle

**Goal:** run it in production and learn.

1. The human decides when to ship. An agent may execute the release only on an explicit instruction for this release.
2. Follow a release order written down before it is needed. Typical order:
   1. Check production is in the shape the change expects.
   2. Rehearse database changes against a local copy.
   3. Apply database changes and access rules before any code that needs them.
   4. Deploy.
   5. Probe production directly. A deploy command's own success message is not proof.
3. Report what was verified and what was not. Name unrelated problems seen along the way (a red pipeline) rather than hiding them.
4. Feed the cycle: update the changelog in the same change and refresh the docs. Add this feature's mistakes to `standards/traps.md`, and turn any review finding that happened twice into a checklist item or a standard.

**Artefact:** a probed production release and updated docs. **Gate:** the human's go to ship.

## Rules that apply at every stage

- The human owns every gate. Ask, then wait.
- Prefer a separate agent for review over self-review.
- Never write to production data to "check" something.
- Say what you did not verify, every time.
- Keep each artefact in the repo so the next stage, and the next session, can read it.
