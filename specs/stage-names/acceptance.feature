# Define. Owner: qa-engineer agent. Check: sdlc gherkin stage-names.

Feature: Stages have names
  As a person running a feature
  I want every stage called by its name
  So that I know where the work is without a lookup

  @R1 @AC-1 @subsystem
  Scenario: A passed gate names the stage and the next one
    Given feature "demo" in the light lane with a spec that passes every check
    When the gate is requested
    Then the message says "Define passed on checks"
    And it says "now at Build"
    And it does not say "stage 4"

  @R2 @AC-2 @unit
  Scenario: The stage that writes the PRD is Define
    When the stage list is read
    Then the stage that writes "prd.md" is named "Define"
    And commands/define.md exists

  @R3 @AC-3 @subsystem
  Scenario: A new feature's design is design.md
    Given a new feature "demo" in the full lane at Design
    When the Design gate is requested with no design file
    Then the request names "design.md"

  @R4 @AC-4 @subsystem
  Scenario: A feature with plan.md keeps passing Design
    Given feature "old" at Design whose complete design is in "plan.md"
    When the Design gate is requested
    Then it passes on checks

  @R5 @AC-5 @unit
  Scenario: Every stage command states its input, processing and output
    When each of commands/define.md, design.md, build.md and verify.md is read
    Then each has "**Input:**", "**Processing:**" and "**Output:**"
