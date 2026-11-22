# Define. Owner: qa-engineer agent. Check: sdlc gherkin capability-overview.

Feature: One architecture overview per capability
  As a product owner, architect or tech lead
  I want a capability's context and agreed decisions in one place
  So that every feature in it builds on what was agreed

  Background:
    Given capability "saved-items" with its slices

  @R1 @AC-1 @subsystem
  Scenario: The first feature of a capability starts its overview
    When feature "save-list" is started in capability "saved-items"
    Then capability "saved-items" has an architecture overview with a system context and a decision log

  @R2 @AC-2 @subsystem
  Scenario: A feature is checked against its capability's systems
    Given the overview of "saved-items" lists repo "web" as modified
    And feature "save-list" has a task that changes repo "cart"
    When the Build gate is requested
    Then the request fails naming "cart"

  @R3 @AC-3 @subsystem
  Scenario: Define needs the capability's system context
    Given the overview of "saved-items" has an empty system context
    When the Define gate is requested for "save-list"
    Then the request fails naming "System context"

  @R4 @AC-4 @unit
  Scenario: A decision row must say who agreed it and where
    Given a decision row "2026-11-07 | Offline mode moves to next | | | R4 out of scope"
    When the overview is checked
    Then it fails naming "agreed by" and "source"

  @R5 @AC-5 @unit
  Scenario: An unconfirmed decision is shown in the review packet
    Given a decision row whose agreed-by reads "unconfirmed"
    When the review packet is built
    Then it lists that decision under "## Unconfirmed decisions"
