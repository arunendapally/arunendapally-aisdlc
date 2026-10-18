# Traps

The project's memory of its own mistakes. Every task brief inherits the relevant entries. Add one whenever a mistake costs a session.

## Format

```markdown
### <short name>
- **What happened:** one or two sentences.
- **How it was found:** a test, a review, production, a user.
- **Guard now:** the test, lint rule or checklist item that prevents it.
```

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
