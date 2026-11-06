# Define. Owner: qa-engineer agent. Check: sdlc gherkin test-lock.

Feature: Proved tests are locked
  As a person reviewing a PR
  I want the tests that prove the spec to stay as they were proved
  So that a green suite means the behaviour, not an edited test

  Background:
    Given feature "demo" whose proof recorded "tests/demo.test.mjs" for AC-1

  @R1 @AC-1 @subsystem
  Scenario: An agent's edit to a proved test is refused
    When an agent writes to "tests/demo.test.mjs"
    Then the write is refused naming "tests/demo.test.mjs" and "sdlc conflict"

  @R2 @AC-2 @subsystem
  Scenario: A changed test cannot be proved again without a settled conflict
    Given "tests/demo.test.mjs" changed after the proof
    When the proof is run again
    Then it fails naming "tests/demo.test.mjs" and "conflict"

  @R3 @AC-3 @subsystem
  Scenario: An agent raises a conflict and the feature waits for a person
    When the agent raises a conflict on AC-1 "the spec says 200 items, the test checks 100"
    Then the feature shows a conflict on AC-1 waiting for a person

  @R4 @AC-4 @subsystem
  Scenario: Raising a conflict does not count against the retry cap
    Given the feature has 2 failed checks recorded
    When the agent raises a conflict on AC-1
    Then the feature still has 2 failed checks recorded

  @R5 @AC-5 @subsystem
  Scenario: A spec change unlocks the tests
    Given the PRD changed after it passed Define
    When an agent writes to "tests/demo.test.mjs"
    Then the write is allowed
