# Test scaffolds

Starting points the `sdet` agent adapts to the repo's stack. They are written for TypeScript with Vitest, Postgres via Testcontainers, Postman with Newman, and Playwright; the rules below hold for any stack.

| Level | Proves | Scaffold | Data comes from | Data goes away by |
|---|---|---|---|---|
| unit | one function or class, no I/O | `factories.ts` | factories with unique ids and overrides | nothing to clean: no I/O |
| subsystem | a service with its real database and queues | `subsystem.int.test.ts` | factories, written in a transaction | rolling the transaction back after each test |
| api | the HTTP contract, black box | `api.postman_collection.json` | a Setup folder that creates data through the API | a Teardown folder that deletes exactly what Setup created |
| e2e | a user journey through the real UI | `e2e-fixtures.ts` | a Playwright fixture that seeds through the API | the same fixture, after the test, even when it fails |

## Rules for test data

1. **Every test makes its own data.** No test relies on data another test left behind, or on a shared seed it can change.
2. **Unique by default.** Factories add a run-unique suffix to names, emails and ids, so parallel runs never collide.
3. **Tear down what you create, and only that.** Record created ids in setup and delete those ids in teardown. Never truncate shared tables in a test.
4. **Teardown runs on failure too.** Use the framework's fixture or `afterEach`, never cleanup at the end of the test body.
5. **Synthetic only.** No production data, no copies of it, no real personal data. Environment files hold placeholder values.
6. **Prove it.** Set `dataCheckCommand` in `.ai-sdlc/config.json` to a script that fails when test data is left behind (for example, a count of rows with the test suffix). `sdlc gate` runs it after every pass.
7. **Prove it is stable.** Run `sdlc gate <feature> --repeat 3` before Verify. A test that passes and fails on the same code is quarantined with an owner and a date, not retried until green.

## Naming

A test proves a criterion by naming its ID in its title: `test('AC-3 a saved item that sells out is marked unavailable', ...)`. `sdlc tests <feature>` builds the matrix from those names, and the Verify gate refuses a criterion with no test at its level.
