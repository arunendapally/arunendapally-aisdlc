# Stage 2 Analyze. Every acceptance criterion, as executable Gherkin.
# Rules the gate enforces (sdlc gherkin <feature>):
# - One Feature with a narrative: As a ..., I want ..., So that ...
# - Every scenario has exactly one @AC-n (unique), the @Rn requirement(s) from prd.md it proves,
#   and one test level: @unit, @subsystem, @api or @e2e. Every PRD requirement has a scenario.
# - Given (context), one When (the behaviour), Then (observable outcome), in that order.
# - Scenario Outline only with an Examples table that has a column for every <placeholder>.
# - Describe behaviour, not UI mechanics: no selectors; "clicks the button" is a warning.
# Replace the example below with this feature's scenarios.

Feature: Save items for later
  As a shopper
  I want to save items I am not ready to buy
  So that I can come back to them without searching again

  Background:
    Given a signed-in shopper with an empty saved list

  @R1 @AC-1 @api
  Scenario: Saving an item adds it to the saved list
    Given the item "Blue mug" is in stock
    When the shopper saves "Blue mug" for later
    Then the saved list contains "Blue mug"
    And the basket does not contain "Blue mug"

  @R1 @AC-2 @unit
  Scenario Outline: Saving the same item twice keeps one entry
    Given "<item>" is already in the saved list
    When the shopper saves "<item>" for later
    Then the saved list contains "<item>" exactly once

    Examples:
      | item     |
      | Blue mug |
      | Red mug  |

  @R2 @AC-3 @e2e
  Scenario: A saved item that sells out is marked unavailable
    Given "Blue mug" is in the saved list
    When "Blue mug" sells out
    Then the saved list shows "Blue mug" as unavailable
    And the shopper can ask to be told when it is back
