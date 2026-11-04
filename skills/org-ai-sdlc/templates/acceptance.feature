# Stage 1 Plan. Owner: qa-engineer agent. Gate: with prd.md, one approval. Check: sdlc gherkin <feature>.
# REPLACE THE EXAMPLE BELOW. It covers R1 and R2 of the PRD template's example; a real feature covers every R<n>.
#
# The gate refuses:
#   no "Feature:" line
#   a scenario without exactly one @AC-<n> of its own, or reusing another scenario's @AC-<n>
#   a scenario without an @R<n>, or with an @R<n> that is not in prd.md "## Requirements"
#   an R<n> in prd.md with no scenario
# Good, shown in the example:
#   one behaviour: Given the state, one When, Then what an observer can check
#   real values ("Blue mug", 200 items, "Your saved list is full"), never "valid data" or "it works"
#   what the user achieves, never what they click, type or which selector
#   each edge its own scenario or Examples row: empty, at the limit, one over, not allowed
#   one level tag, the lowest that proves it:
#     @unit no I/O | @subsystem real database or queue | @api through the API | @e2e a journey in the UI
# The scenario name says the rule; do not repeat the requirement text. More than 7 scenarios: split the feature.

Feature: Save items for later
  As a returning shopper
  I want to keep items I am not ready to buy
  So that I can find them again without searching

  Background:
    Given a signed-in shopper with an empty saved list

  @R1 @AC-1 @api
  Scenario: Saving an in-stock item adds it to the saved list
    Given "Blue mug" is in stock
    When the shopper saves "Blue mug"
    Then the saved list holds exactly 1 item, "Blue mug"

  @R1 @AC-2 @unit
  Scenario Outline: Saving an item keeps one entry, however often it is saved
    Given the shopper has saved "Blue mug" <already saved> times before
    When the shopper saves "Blue mug"
    Then the saved list holds "Blue mug" exactly <entries after> time

    Examples:
      | already saved | entries after |
      | 0             | 1             |
      | 1             | 1             |

  @R2 @AC-3 @e2e
  Scenario: A saved item that sells out shows as sold out
    Given the saved list holds "Blue mug"
    When "Blue mug" sells out
    Then within 5 minutes the shopper's saved list page shows "Blue mug" as "Sold out"
