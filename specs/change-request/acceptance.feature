# Define. Owner: qa-engineer agent. Check: sdlc gherkin change-request.

Feature: A spec change after Build starts asks change request or amendment
  As a product owner
  I want to choose how a mid-build change is taken, knowing what it does to effort
  So that the timeline stays honest

  Background:
    Given feature "save-list" in capability "saved-items" whose Define was approved

  @R1 @AC-1 @subsystem
  Scenario: A spec change at Build stops with the question
    Given "save-list" is at Build and its PRD changed after Define was approved
    When the Build gate is requested
    Then the request fails with "change request or amend the existing PRD?"
    And "save-list" is still at Build

  @R2 @AC-2 @subsystem
  Scenario: The question says why a change request is often better
    Given "save-list" is at Build and its PRD changed after Define was approved
    When the Build gate is requested
    Then the message says a change request keeps the work already done as agreed
    And it says the design and tasks may change either way

  @R3 @AC-3 @subsystem
  Scenario: The question says how the effort changes
    Given "save-list" is at Build and its PRD changed after Define was approved
    When the Build gate is requested
    Then the message says a change request gets its own effort estimate
    And it says an amendment re-does the original estimate with the added effort stated

  @R4 @AC-4 @subsystem
  Scenario: Choosing a change request creates a linked feature
    Given the person chose a change request named "save-list-offline"
    When the change request is created
    Then feature "save-list-offline" is in capability "saved-items" and its PRD names "save-list"
    And "save-list" keeps its Define approval

  @R5 @AC-5 @subsystem
  Scenario: Choosing to amend goes back to Define
    Given the person chose to amend
    When the amendment is taken
    Then "save-list" is back at Define

  @R6 @AC-6 @subsystem
  Scenario: A spec change before Build goes back to Define with no question
    Given "save-list" is at Design and its PRD changed after Define was approved
    When the Design gate is requested
    Then "save-list" is back at Define
    And the message does not say "change request"
