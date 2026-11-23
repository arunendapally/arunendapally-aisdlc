# Testing standards

- **Baseline first.** Record the passing count before any change. The finish line is baseline plus new tests, with nothing that passed before now failing.
- **Local data only.** Tests never run against production or real user data. If the configuration could point at production, the test runner refuses unless an explicit override is set, and the override's error message says plainly what it will write to.
- **Mutation-test every guard.** Break the thing the guard protects, watch the test fail, restore it, and record what you broke. A guard that cannot fail is decoration.
- **Make the fixture realistic.** Some tests pass vacuously against an empty database. Seed data that has actually been used, through the app's own write paths, so the fixture cannot drift from the real shape.
- **Test the dangerous direction.** For anything that must NOT happen (a read creating a record, a missed day being filled in, a second tenant's data being visible), assert on the full table with no date or owner shortcut that could hide the leak.
- **Read what the user reads.** In end-to-end tests, assert on rendered visible text, not raw markup that can include hidden payloads.
- **Scope cleanup by a marker you wrote**, such as an idempotency key prefix. Never by a name a real user might also have.
- **Isolate state-changing end-to-end tests** in a serial group, so parallel workers do not see each other's changes and report random flakes.
- **One concurrent run per database.** Use a lock, or give each checkout its own database.
- **Read the error before calling a failure.** A dropped connection, a sleeping machine or a stale dev server can look exactly like a product bug.
