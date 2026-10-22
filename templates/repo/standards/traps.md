# Traps

The project's memory of its own mistakes. Every task brief inherits the relevant entries. Add one whenever a mistake costs a session.

## Format

```markdown
### <short name>
- **What happened:** one or two sentences.
- **How it was found:** a test, a review, production, a user.
- **Source:** the bug or hotfix slug that taught it, when there is one.
- **Guard now:** the test, hook, lint rule, CI check or eval that prevents it.
```

An escaped bug (`sdlc bug <slug> --caused-by <feature>`) or a hotfix owes a lesson: it cannot merge, or its postmortem stays open, until a trap here names it under **Source** and its **Guard now** is a check rather than words.

## Starter entries (generic, from real cycles)

### Requirements needed data nobody records
- **What happened:** a third of a feature brief depended on information the system never captured. The author and the product owner both assumed it existed.
- **How it was found:** a read-only supervisor review that read the schema, not only the brief.
- **Guard now:** the supervisor prompt asks, as its first check, whether every requirement has the data it needs.

### Design started before integration
- **What happened:** the first mocks invented their own navigation and components and did not look like the product.
- **How it was found:** the owner's first look.
- **Guard now:** the integration decision is a gate in Analysis, and the design prompt requires the real component source.

### Idempotency covered only half an operation
- **What happened:** retrying the start of an action was safe. Retrying its end was refused, because the data model had nowhere to store the end key.
- **How it was found:** the build session, which escalated instead of guessing.
- **Guard now:** checklist item 6; reviewers replay the second half of every operation.

### The reviewer started rubber-stamping
- **What happened:** later phases got lighter review, and mutation results were accepted on the worker's word.
- **How it was found:** the owner asked directly, "did you review your subagent's work?"
- **Guard now:** the reviewer's honesty check in the code-review checklist, and a re-run of at least one mutation per guard.

### A style rule in prose leaked
- **What happened:** a banned character appeared in a test even though every brief forbade it.
- **How it was found:** the reviewer, by reading the diff.
- **Guard now:** a copy guard test that scans source files for the banned characters and phrases.

### Deploying before the database change
- **What happened:** new code queried a table production did not have yet, and every signed-in screen broke.
- **How it was found:** production.
- **Guard now:** the release order puts database changes and access rules first, after a check of production's current shape.

### A refusal was retried as if it were a failure
- **What happened:** a permission denial was retried about thirty times by a loop, each try a full turn that re-read a long conversation.
- **How it was found:** the owner, after the session had spent most of its budget.
- **Guard now:** the pre-tool hook ends every denial with "a final answer, not an error", counts denials per session and rule, and holds the session after the second until a human types (test: "a denial is an answer"); the autopilot starts nothing after a denied turn (mod test); golden eval 20.

### Context spent before the source of truth
- **What happened:** thousands of lines of validators, design documents and a 185KB schema were read in full before the implementation that governed the design, and the design had to be rewritten.
- **How it was found:** the rewrite.
- **Guard now:** the pre-tool hook refuses a full read of a large file and gives the sliced call; brownfield and data facts need a "[governing]" fact pinned to implementation code (tests: AC-7, "large files are read in slices"); golden eval 21.

### A branch deploy was erased by the next merge
- **What happened:** a feature was deployed from an unmerged, unpushed branch, looked shipped, and was rolled back by the next deploy from main. The branch was the only copy.
- **How it was found:** the owner saw the old screen on a phone.
- **Guard now:** the Release gate refuses unless the reviewed change is on origin/main and "Live: <sha>" contains it and the previous release; an agent's preview deploy from an unpushed branch asks first (tests: "release is on the remote's main"); golden eval 22.
