# Architecture overview: <feature>

<!-- For work that changes more than one repo or system. Owner: the architect, written before tasks.md.
     Build refuses tasks across repos without it, and checks it both ways: every repo a task names is in
     the table, and every new or modified system has a task. "sdlc packets <feature>" prints each repo's
     share of the work in deploy order. One repo needs none of this. -->

## Systems under change

<!-- Change type: new, modified, config-only, or consumer-only (verify) for a system that does not change
     but depends on a changed contract, so it still gets checked. Deploy order: 1, 2, ... or n/a. -->

| System / repo | Change type | Owner | Contract impact | Data impact | Deploy order |
|---|---|---|---|---|---|
| `<repo>` | modified | <team> | OpenAPI delta / reads a changed field / none | migration / none | 1 |
