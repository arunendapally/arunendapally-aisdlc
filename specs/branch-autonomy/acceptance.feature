# Stage 1 Plan. Owner: qa-engineer agent. Gate: with prd.md, one approval. Check: sdlc gherkin branch-autonomy.

Feature: Work on a feature branch runs on its own until the PR
  As a person running a feature
  I want gates before the PR to pass on their checks
  So that I review the work once, in the PR

  Background:
    Given feature "save-list" lives on branch "feature/save-list" in the full lane
    And its intent was answered by "Arun"

  @R1 @AC-1 @subsystem
  Scenario: A complete spec on a feature branch passes Plan on its checks
    Given a PRD and acceptance criteria that pass every Plan check
    When the Plan gate is requested
    Then the Plan gate is approved by "checks"
    And the feature is at stage 3 (Design)

  @R2 @AC-2 @subsystem
  Scenario: A complete design on a feature branch passes Design on its checks
    Given the feature is at stage 3 with a design that passes every Design check
    When the Design gate is requested
    Then the Design gate is approved by "checks"
    And the feature is at stage 4 (Build)

  @R3 @AC-3 @subsystem
  Scenario: Verify passes on its checks and nothing reaches main
    Given the feature is at stage 5 with every Verify check passing
    When the Verify gate is requested
    Then the Verify gate is approved by "checks"
    And main points at the same commit as before

  @R4 @AC-4 @subsystem
  Scenario: Editing a spec that passed on checks sends the work back to Plan
    Given the Plan gate passed on checks and the feature is at stage 4
    When a requirement in the PRD is changed and the Build gate is requested
    Then the feature is back at stage 1 (Plan)

  @R5 @AC-5 @subsystem
  Scenario: A spec that fails its checks is refused with the reasons
    Given a PRD with no "## Requirements" section
    When the Plan gate is requested
    Then the request fails naming "## Requirements"
    And the Plan gate is not approved

  @R6 @AC-6 @unit
  Scenario: The PR says which gates passed on checks
    Given the Plan gate passed on checks at "2026-11-06T06:00:00Z"
    When the PR body is built
    Then it says "Plan: passed on checks, 2026-11-06T06:00:00Z"
