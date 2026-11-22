# Define. Owner: qa-engineer agent. Check: sdlc gherkin plan-roadmap.

Feature: Plan is a roadmap of pieces that go live on their own
  As a product owner, architect or tech lead
  I want a capability cut into pieces placed now, next or later
  So that we build one by one without blocking each other

  @R1 @AC-1 @subsystem
  Scenario: Status groups slices by horizon
    Given capability "saved-items" with "save-api" now, "save-list" now and "save-share" later
    When status is shown
    Then "save-api" and "save-list" are listed under "now" and "save-share" under "later"

  @R2 @AC-2 @unit
  Scenario: An enabler can be a slice
    Given a slice "save-api" marked as an enabler: the saved-items API contract
    When the roadmap is checked
    Then no problem names "save-api"

  @R3 @AC-3 @unit
  Scenario Outline: Each slice says how it goes live on its own
    Given a slice whose "Goes live" reads "<how>"
    When the roadmap is checked
    Then no problem names that slice

    Examples:
      | how                                             |
      | compatible                                      |
      | flag SAVED_ITEMS                                |
      | after save-api, because the list needs its data |

  @R4 @AC-4 @unit
  Scenario: Going live after another slice needs a reason
    Given a slice whose "Goes live" reads "after save-api"
    When the roadmap is checked
    Then it fails naming "reason"

  @R5 @AC-5 @unit
  Scenario: Tasks give one ticket per repo
    Given tasks that change repos "web" and "cart"
    When the tickets are listed
    Then there is one ticket for "web" and one for "cart", each naming its tasks

  @R6 @AC-6 @unit
  Scenario: The Plan command states its input, processing and output
    When commands/plan.md is read
    Then it has "**Input:**", "**Processing:**" and "**Output:**"
