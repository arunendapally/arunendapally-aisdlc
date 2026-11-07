Feature: Features left at Release complete
  As a plugin user
  I want a feature an older plugin left at Release to complete
  So that status shows the truth and no release step asks for anything

  @R1 @AC-1 @unit
  Scenario: Requesting a feature left at Release completes it with no release checks
    Given a full-lane feature "demo" at stage 6 with no release.md and no remote
    When the agent runs "sdlc request demo"
    Then the command succeeds and says "demo is complete"

  @R2 @AC-2 @unit
  Scenario: Advancing a feature left at Release completes it with no approval
    Given a full-lane feature "demo" at stage 6 with no approved gate
    When the agent runs "sdlc advance demo"
    Then the command succeeds and says "demo is complete"

  @R3 @AC-3 @unit
  Scenario: Completing a feature left at Release opens its outcome follow-up
    Given a full-lane feature "demo" at stage 6 whose PRD names "share of saved items bought" owned by "Priya"
    When the feature completes
    Then the output says 'Outcome follow-up: Priya reads "share of saved items bought"'
    And "sdlc status" shows "demo: complete (full lane)"

  @R4 @AC-4 @unit
  Scenario: A feature at Verify whose checks fail still stops
    Given a light-lane feature "demo" at Verify whose PR body has no "## Test results"
    When the agent runs "sdlc request demo"
    Then the command fails and names "## Test results"
