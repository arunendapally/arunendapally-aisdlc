# Code review checklist

The reviewer runs this on every batch and again before merge. Report findings by item number. Anything you could not check goes in the PR's "Not verified" section, not silently past.

## A. Against the spec

1. Every task claimed done has code AND a test that would fail without that code.
2. Behaviour matches the spec's requirements and contracts. Where it differs, the spec was corrected in writing, or this is a defect.
3. Nothing was built that the spec does not ask for.
4. Judgement calls made during the build are recorded in the spec, not only in a commit message.

## B. Correctness

5. Null and zero are handled as different facts.
6. Every write is idempotent, including the second half of each operation (end, cancel, undo). Replay a request and check that nothing duplicates.
7. No row is resolved by position.
8. Day and time logic uses the user's time zone. At least one test runs in a zone other than the default.
9. Boundaries are tested on both sides: empty, one, many, the limit, and limit plus one.

## C. Security

10. Every new table or collection is scoped to its owner at the database layer, and a coverage check proves it.
11. Every rule enforced in the UI is also enforced in the API and in jobs. There is a test that goes through the non-UI path.
12. No secret, token or personal data appears in logs, URLs or client bundles.

## D. Tests

13. The suite count is at or above the baseline, and nothing that passed before now fails.
14. Each new guard was mutation-tested: what was broken, and that the test failed. Re-run at least one mutation per guard yourself rather than taking it on the worker's word.
15. Tests read what the user actually sees (rendered text), not hidden markup or internal state.
16. No test asserts on a global count, or depends on another test's data or on execution order.

## E. Copy and UX

17. Visible copy follows the house style and banned-phrase list.
18. Accessibility: contrast, nothing told apart by colour alone, a label on every control, screen-reader text that reads sensibly.
19. Works at phone width with no horizontal scroll.

## F. Change hygiene

20. Database changes come before the code that needs them, with a rehearsal noted.
21. The changelog is updated in the same change.
22. No unrelated edits, reformatting or drive-by refactors.
23. Every new trap or repeated finding has been proposed for `traps.md` or this checklist.

## G. Simplicity (the ladder)

24. Every new dependency is justified by the ladder: the need exists now, and no standard library, platform feature or dependency already installed does the job. A one-function use of a large library is a finding.
25. No hand-rolled code for what the standard library, the platform or an existing dependency or helper in this repo already does (deep copy, dates, retries, unique lists, HTTP clients, parsing).
26. No speculative generality: no option, flag, abstraction, interface or extension point the spec does not ask for, and no code larger than the requirement it serves. What it keeps: validation, error handling, security and accessibility.

## The reviewer's honesty check

Before you approve, answer in writing: "Did I review every phase at the same depth, or did I take any result on the worker's word?" If it was the second, go back and review properly.
