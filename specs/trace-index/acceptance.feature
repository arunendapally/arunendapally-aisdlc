# Define. Owner: qa-engineer agent. Check: sdlc gherkin trace-index.

Feature: Requirements trace both ways
  As a product owner or reviewer
  I want a capability's requirements traced to their scenarios, tests, ADRs and decisions, and back
  So that I see what is covered and what each artefact serves

  Background:
    Given capability "saved-items" with feature "save-list" whose R1 has scenario AC-1, proved by "tests/save-list.test.mjs"
    And a decision row whose Changes reads "save-list R1"
    And an ADR that names "save-list/R1"

  @R1 @AC-1 @subsystem
  Scenario: The index lists each requirement with its scenarios and tests
    When the index for "saved-items" is shown
    Then it lists "save-list/R1" with "AC-1" and "tests/save-list.test.mjs"

  @R2 @AC-2 @subsystem
  Scenario: The index lists the decisions and ADRs for a requirement
    When the index for "saved-items" is shown
    Then "save-list/R1" lists the decision row and the ADR

  @R3 @AC-3 @subsystem
  Scenario: A test traces back to its requirement
    When "tests/save-list.test.mjs" is looked up
    Then it traces to "save-list/R1"

  @R4 @AC-4 @subsystem
  Scenario: A requirement with no test is marked
    Given "save-list" has R2 with no scenario
    When the index for "saved-items" is shown
    Then "save-list/R2" is marked "no scenario"
