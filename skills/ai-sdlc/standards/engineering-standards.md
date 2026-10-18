# Engineering standards (generic starting point)

Copy into your repo and edit. Each standard says what and why. Where tooling enforces it, name the tool.

## Data and correctness

- **Null is not zero.** A missing value and a zero are different facts. Never coerce one into the other in storage, queries or display.
- **Every write is idempotent.** The caller supplies a key, and the database enforces uniqueness on it. Cover whole operations, including the second half (end, cancel, refund), not only the insert.
- **Mint the idempotency key where the user acts** (the form, the client), not inside the server handler, or a double submit writes twice.
- **Never resolve a row by position.** Always filter by identity and order explicitly. "Select first row" is a defect once there is more than one tenant.
- **Store instants in UTC, bucket into days in the user's time zone at read time.** A "day" is the user's day, not the server's.
- **Derive what can be derived.** Do not store a status that can be computed from records. A stored marker can claim a step is done when its write half failed.

## Security

- **Scope every query to its owner at the database layer** (row-level security or equivalent), not only in application code.
- **Enforce every rule on every entry point.** A rule in the UI must also hold in the API, background jobs and integrations.
- **Secrets never reach the browser or version control.** Secret scanning in CI.
- **Refusals are uniform.** Every auth failure returns the same response, so it does not reveal which check failed.

## Code

- **Match the surrounding code**: naming, comment density, idiom.
- **Simplicity first.** No speculative abstraction, no configuration nobody asked for, no error handling for impossible cases.
- **Pure core, thin edges.** Business rules live in pure functions with no I/O, tested first. Handlers parse, call the core and persist.
- **One validation schema shared by every writer.** Validating only in the form leaves the API unguarded.
- **Explicit locale and time zone** in any formatting that renders on both server and client.

## Changes

- **Database changes ship before the code that needs them**, and are rehearsed on a copy first.
- **Update the changelog in the same change.** Say whether it reached production, not only whether it merged.
- **Fix the spec before the code** when the build proves the spec wrong.
