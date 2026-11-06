# Feedback

Feedback on the ai-sdlc plugin, for the main agent working on this repo to pick up. Each entry is dated and stands on its own. Nothing here is a decision. The entries that end in questions are asking the main agent to answer them before writing or rewriting skills.

## Format

```markdown
## YYYY-MM-DD: <short title>

**Source:** where the feedback came from.
**Claim:** the one-line version.
**Why:** the reasoning.
**Open questions:** numbered, for the main agent to answer.
```

Append new entries at the end. Do not rewrite earlier ones; if an entry is superseded, add a new entry that says so and leave the original in place.

---

## 2026-10-22: the gates are the product, not the sequence

**Source:** `docs/blog/ai-sdlc-skill/concept.md` and `standards/traps.md` on branch `claude/blog-fasting-workflow-af7250` of the fitness-companion repo. That repo is local only and was not reachable from this session, so the substance below was dictated rather than read from the files. Someone with access should diff this entry against those two files and correct it where they disagree.

**Claim:** a lifecycle that would not have caught the last three real failures is ceremony, however many stages it has.

That line is the headline. Everything else in this entry is downstream of it.

### Where this came from

An anonymised read of an enterprise SDLC plugin: a fixed chain of overview, prd, architecture, tasks, implement, code-review; specialist subagents for backend, frontend and UI test; durable artefacts per stage (`prd.md`, `architecture-overview.md`, `tasks/T*.md`, `progress.md`); and a versioned plugin marketplace with a CI version gate wrapped around the whole thing. Three conclusions came out of it.

### 1. The sequence is not the value, the gates are

That plugin's own reported effect was that it stopped the agent jumping straight to coding. That is a gate effect, not a sequence effect. A chain with no gate is a waterfall, and a waterfall run by an agent builds the wrong thing with excellent documentation.

At one-person scale the stage order can flex. The gates cannot. The load-bearing ones:

- requirements before anything else
- tasks traceable back to requirements
- review as its own step, not a pass the author makes over their own work
- verification of anything user-facing

What is ceremony at this scale, because it exists to coordinate humans rather than to catch defects: branch protocol, multi-repo coordination, approval checkpoints. Roughly half the value of an enterprise lifecycle is coordinating people, and there are no other people here.

### 2. Artefacts are a context budget, not a filing cabinet

Auditability is real but secondary. The actual mechanism is that a stage reading a file is a stage not re-deriving the work. That suggests a rule the plugin could state and then check:

> If a stage cannot be done from the artefacts alone, the artefacts are wrong, not the context window.

Stated that way it stops being a vague virtue and becomes a check that can fail. The current `SKILL.md` already has the ingredient under "Every session can cold-start", but as an assertion about why the design is safe rather than as something a stage is held to.

### 3. Positioning: a loop with memory

If this plugin is a spec toolkit plus opinions, it should not exist, because opinions belong in a constitution and the toolkits already exist. What makes it a different thing is that it is **a loop with memory**. A spec toolkit has no view on what went wrong last time. An internal enterprise plugin encodes conventions whose scar tissue origin lives outside the tool, in people who remember the outage. This plugin should put that mechanism inside itself: stage 6 feeding back into stage 1, so failures become guards.

Borrow the chain from anywhere. The gates and the feedback path are the product.

### Two smaller calls worth recording

- **Specialist dispatch is context isolation, not expertise.** Use a subagent when context is the constraint. Never use one to avoid reviewing something yourself.
- **The marketplace and distribution layer is skipped at this scale, but the question under it is kept.** "Which version is live" is failure 3 below wearing different clothes.

### The three real failures

These are the test the lifecycle has to pass.

**Failure 1. A denial retried about thirty times.** An action was denied by permissions. The agent's loop kept re-firing on it for roughly thirty more turns, each one a full turn that re-read a long conversation. It should have handed control back after the second denial, given the manual command once, and said nothing until the user replied.

Guard: a refusal is an *answer*, not a failed check, so a generic "stop after N tries" cap never fires on it. A hook that re-triggers the turn it just ended is a bug in the hook.

**Failure 2. Context spent before the source of truth.** Roughly 3,700 lines of validators, a diagram page, three design documents and a 185KB schema, all read in full, before reading the implementation that actually governed the design. The early design was wrong and had to be rewritten.

Guard: read the authoritative implementation before designing against it, and read large files in slices.

**Failure 3. A branch deploy erased by the next merge.** A feature was deployed straight from an unmerged, unpushed branch. It worked, so it looked shipped. The next deploy from main silently rolled it back, main having never contained it, and nobody noticed until the owner saw the old UI on his phone. The branch was also the only copy, with no trace on the remote.

Guard: deploy from the integration branch only, and a branch deploy is explicitly not a release.

### Mapping each failure onto the plugin as it stands

Honest reading of the current `skills/ai-sdlc/SKILL.md`.

**Failure 1: no stage catches this, and the loop rules make it worse.** The closest thing is "Cap the loop. Three tries is a good default." That cap is exactly what the failure defeats, because the loop never registered a failed check: each denial was a successful, correct answer that the loop treated as a reason to try again. This is not a stage concern at all. It is a concern about who controls the turn, which means it probably belongs in the hooks rather than in the six stages. Nothing in the current artefact chain or gate structure would have stopped it.

**Failure 2: partially covered, and covered too late.** Stage 2 puts a read-only supervisor against the real code and schema, and `standards/traps.md` already has "Requirements needed data nobody records" from the same mechanism. But that is a reviewer catching a wrong design after it was written. Failure 2 is about reading order during the work, and nothing in stages 2 or 3 says to reach the authoritative implementation first or to read large files in slices. The supervisor would likely have caught the wrong design eventually, at the cost of the rewrite that actually happened.

**Failure 3: the gate fired and still let it through.** Stage 4 says no merge and no deploy without a human yes, and the human said yes. Stage 6 has a written release order, but that order is about database changes going before code; it says nothing about which branch a release may come from, nothing about the remote holding a copy, and nothing that distinguishes a branch deploy from a release. `standards/traps.md` has "Deploying before the database change", which is the adjacent failure, not this one. So: approval gate present, correct content absent.

Score as it stands: one of three caught late, one of three partially gated with the wrong content, one of three not addressed by any stage.

### Flags: what the plugin currently has that is ceremony at solo scale

Listed as candidates, not as cuts.

- **Six fixed stages each ending in "ask, then wait".** Six mandatory human gates per feature at one-person scale risks gate fatigue, which is the same failure mode as the reviewer rubber-stamping already recorded in `standards/traps.md`. Which of the six are load-bearing and which are habit?
- **Branch and worktree protocol in stage 4** (commit the spec set on its own branch, separate session, isolated worktree). Some of this is context isolation and earns its place on those grounds. Some of it is the human coordination protocol the concept calls ceremony. Worth separating the two reasons explicitly, especially given that failure 3 was caused by branch handling rather than prevented by it.
- **PR body requirements in stage 5.** A PR is a human coordination artefact. The honesty record it carries (counts before and after, mutation results, "Not verified") is load-bearing. The PR as a venue for it may not be.
- **Design thread resolution in stage 3** ("every comment thread resolved", three-round escalation). Real when there is a canvas and a reviewer. Pure ceremony on work with no UI.
- **The agent roster and specialist roles on the in-flight branches.** `claude/ai-sdlc-subagents-process-1018aa` carries fourteen role-titled agents (cto, dba, sre, performance-engineer, ux-designer and so on). The concept says dispatch is context isolation and not expertise. `docs/first-principles.md` principle 2 says a role changes what the model looks for. Both can be true, but the roster should be justified on one of those grounds per agent rather than by analogy to an org chart.
- **The marketplace, versioning and CI version gate** on the in-flight branch. Skipped at this scale per the concept, but see the open question below, because the question underneath it is failure 3.

### Open questions for the main agent

To answer before writing or rewriting skills.

1. Does failure 1 belong in the hooks rather than in any stage? If so, what is the hook contract: how does a refusal get classified as an answer rather than as a failed check, and what stops a hook re-triggering the turn it just ended?
2. Should the loop rules distinguish a failed check from a refusal explicitly, so that "cap at three tries" and "hand back after the second denial" are two separate rules rather than one?
3. Should stage 2 or stage 3 carry a reading-order rule (authoritative implementation before design, large files in slices), and if so, is it a gate, a checklist item in `standards/`, or a trap entry?
4. Is there a cheap check for "the artefacts are sufficient"? The proposed rule only bites if some stage can fail on it. Could a stage be made to cold-start from artefacts alone as its own verification, and if so which one?
5. What is the release rule that would have caught failure 3? Candidates: deploy only from the integration branch; a branch deploy is labelled a preview and never called shipped; the branch must exist on the remote before any deploy; after a deploy from main, check that what was previously live is still live. Which of these are in scope for a solo lifecycle?
6. Which of the six gates survive at solo scale, and which collapse into one another? If the answer is fewer than six, does the stage count change or just the number of stops?
7. How does stage 6 feed stage 1 mechanically rather than by instruction? Right now step 4 of stage 6 tells the agent to update `standards/traps.md`. That is the feedback path existing as a sentence. What makes it fail loudly when it is skipped?
8. Per-agent justification for the specialist roster: for each agent, is it there for context isolation or for what a role makes the model look for? Any that are neither should probably go.
9. The version question survives the marketplace being skipped. What is the solo-scale answer to "which version is live", and is it the same mechanism as the answer to question 5?
10. Where does the gate score live? If the headline claim is the test, the plugin should be able to state which of the three failures each gate catches, and that mapping should be checkable rather than asserted. Does that belong in the evals, in `standards/`, or here?
