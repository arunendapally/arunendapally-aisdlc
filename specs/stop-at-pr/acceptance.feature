# Stage 1 Plan. Owner: qa-engineer agent. Gate: with prd.md, one approval. Check: sdlc gherkin stop-at-pr.

Feature: The plugin stops at a raised PR
  As a person running a feature
  I want the plugin's work to end at a PR from a branch
  So that my team's own review, merge and release process takes over

  @R1 @AC-1 @subsystem
  Scenario Outline: Every lane ends at Verify
    Given a feature in the <lane> lane at stage 5 with every Verify check passing
    When the Verify gate is requested
    Then the feature is complete

    Examples:
      | lane   |
      | light  |
      | full   |
      | hotfix |

  @R2 @AC-2 @subsystem
  Scenario: Verify does not wait for a named approver
    Given a feature at stage 5 with every Verify check passing and no autonomy
    When the Verify gate is requested
    Then the Verify gate is approved by "checks"

  @R3 @AC-3 @unit
  Scenario: There is no merge command
    When "sdlc merge demo" is run
    Then it fails with "Unknown command"

  @R4 @AC-4 @unit
  Scenario: A @release criterion is listed to check after deploy
    Given AC-3 "The live page shows the new price" is tagged @release with no test
    When the review packet is built
    Then it lists "AC-3" under "## Check after deploy"
    And no Verify problem names AC-3

  @R5 @AC-5 @subsystem
  Scenario: Completing a feature opens its outcome follow-up
    Given a PRD whose outcome metric is "share of saved items bought" owned by "Priya"
    When the feature completes at Verify
    Then its outcome follow-up names "Priya" and "share of saved items bought"

  @R6 @AC-6 @subsystem
  Scenario: A failing Verify still stops with the reasons
    Given a feature at stage 5 whose PR body has no "## Test results"
    When the Verify gate is requested
    Then the request fails naming "## Test results"
