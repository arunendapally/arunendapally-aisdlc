# AI SDLC: copy-paste prompts

Replace anything in `<angle brackets>`. Each prompt is short on purpose: the skill carries the procedure, the prompt carries the intent.

## The goal-loop wrapper (use with any stage)

Wrap any stage prompt below in this:

```
Goal: <exit criterion that can be checked, from the SKILL.md goals table>.
Check: <how you will prove it: a test, the gate, a second agent, a count>.
Loop: do the work, run the check, fix what failed, repeat. Stop after 3 tries.
If the goal is still not met, stop and tell me what you tried, what failed and
what you recommend. Do not loosen the goal to get a pass.
Then: <stage prompt>
```

**Unattended, with Claude Code's `/loop`** (self-paced, until the goal is met):

```
/loop Goal: batch <n> of specs/<feature>/tasks.md is green on the full gate at or
above the baseline, with every checklist finding fixed. Each run: check the worker's
latest report, review the diff against standards/code-review-checklist.md, send
fixes or release the next batch. Stop the loop when all tasks are done or a check
fails 3 times, and report.
```

## 0. Clean the desk

```
Before we start <feature>, list the branches, worktrees and sessions related to it.
Tell me which are stale and why. Archive them only after I say yes.
```

## 1. Planning

**The role prompt** (the most important one):

```
You are the product owner for <feature> in <product>. You are also an expert in
<domain expertise>. Research the domain: what experts and evidence say, who could be
harmed, and what the product must never claim. Grade every claim you rely on as
Established, Moderate or Preliminary, and say where sources are thin.
Write a brief in docs/<feature>-requirements.md with numbered requirements, out of
scope, and open questions with your recommendation for each.
```

**Structural innovation:**

```
Study <competitor> from public reviews. Do not list their features. Tell me what we
can do that they structurally cannot, because of data, users or constraints we have
and they do not. Propose up to five ideas and the risk of each.
```

## 2. Analysis

**Supervisor review** (spawn as a read-only subagent on your strongest model):

```
You are a supervising reviewer. Read docs/<feature>-requirements.md and the real code,
especially the schema and every entry point (UI, API, integrations). Do not edit
anything. Report:
1. A verdict: proceed, or rework before specifying.
2. The top five required changes, ranked. For each, cite the file that proves it.
   Check first whether every requirement has the data it needs.
3. Anything that could harm a user, or bypass a rule through another entry point.
4. A smaller first version: keep, defer, and why.
```

**Integration decision:**

```
Before any design: where does <feature> live in the product? Answer in plain words:
where setup goes, where daily use goes, whether it gets a navigation item, and which
existing screens change. Recommend one option and add the result to the brief as
requirements.
```

**Specify:**

```
Specify <feature> v1 as defined in docs/<feature>-requirements.md. Use Spec Kit if it
is installed, otherwise write spec.md with user stories, numbered functional
requirements and measurable success criteria. Check each requirement against
<constitution file> and record the check.
```

## 3. Design

**Design subagent:**

```
Design <feature> on a design canvas I can comment on. Draw every screen INSIDE the
real product: copy the header, navigation, layout width and components from
<component source paths> and from <existing design of the product>. Do not invent
headers, navigation or components. Desktop at <width> and phone at <width>.
Cover these screens: <list from the brief>. When done, list everything you could not
match to the real product.
```

**Comment handling** (for the session watching the canvas):

```
For each comment I send from the canvas: make the change, reply in that thread with
what changed in one or two sentences, then resolve it. If you are unsure what I meant,
make your best change and ask in the thread.
```

**Technical plan:**

```
Plan <feature> from spec.md: data model, contracts and research decisions with
alternatives. Name exact files. Check the plan against <constitution file>. Where a
rule needs interpreting, record your call as a judgement in the spec so a reviewer can
disagree with it.
```

## 4. Implementation

**Tasks with scars:**

```
Generate ordered tasks from the plan, each naming its files and its test. Add these
rules to the top of the task list:
- Record the passing test count before any change; finish with nothing that passed
  before now failing.
- Never test against production or real user data.
- Mutation-test every guard and record the result.
- <trap this repo has hit before>
- <house style rules>
Commit the spec set on its own branch.
```

**Build session, reviewer plus worker:**

```
Build <feature> from specs/<feature>/tasks.md in your own worktree, cut from
<spec branch>. You are the reviewer: hand phases to <cheaper model> in batches, read
every diff, and only start the next batch when the full gate is green. If you find a
gap in the spec, write up the options with a recommendation and ask me (or the session
that wrote the spec). Do not guess. Open a PR when done. Do not merge or deploy.
```

## 5. Testing and integration

**The question that matters most:**

```
Did you review your worker's work, every phase, or did you take any results on its
word? Answer honestly. If any phase got lighter checks, review it properly now,
including re-running at least one mutation per guard yourself.
```

**PR body:**

```
Open a PR titled "<feature> v1". The body lists every task, test counts before and
after, every mutation test and its result, spec corrections, and a "Not verified"
section. Do not merge.
```

## 6. Maintenance

**Release, on an explicit go:**

```
You have my go to release <feature> now. Follow the release order in
<runbook path>: check production is in the expected shape, rehearse database changes
locally, apply database changes and access rules before any code, deploy, then probe
production directly. Report what you verified, what you did not, and anything
unrelated you saw that is broken.
```

**Feed the cycle:**

```
<feature> is live. Update the changelog, refresh the docs, and add every mistake from
this feature to the trap list future task briefs inherit. Show me the trap list diff.
```
