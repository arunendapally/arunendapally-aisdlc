# Define. Owner: qa-engineer agent. Gate: with prd.md, one approval. Check: sdlc gherkin c4-model-page.

Feature: C4 model page for a feature
  As the person approving a feature's design
  I want its context, containers, calls, run order and changes on one page
  So that I can decide without assembling four files

  @R1 @AC-1 @unit
  Scenario: A finished page has five views, each with its own link
    Given the page built for the feature "saved-items"
    When it is checked
    Then it has the tabs "#1", "#2", "#calls", "#run" and "#changes"
    And it has 3 diagrams: context, containers and run order

  @R2 @AC-2 @unit
  Scenario: A fact the documents do not hold shows as Open with an owner
    Given the skill's instructions for building the page
    When a fact is not in the feature's documents
    Then the instructions say to mark it "Open" and name who decides it

  @R3 @AC-3 @unit
  Scenario Outline: The page reads the plugin's documents unless a team names its own
    Given the skill's instructions for building the page
    When the team names "<team input>"
    Then the page is built from "<source>"

    Examples:
      | team input                   | source                                     |
      | nothing                      | specs/saved-items/design.md                |
      | nothing                      | specs/saved-items/architecture-overview.md |
      | technical-design.md          | technical-design.md                        |
      | Teams/cart/openapi.yaml      | Teams/cart/openapi.yaml                    |

  @R4 @AC-4 @unit
  Scenario: A call with no matching arrow is reported
    Given a page whose calls view lists "web -> cart-api"
    And its containers diagram has no arrow from "web" to "cart-api"
    When it is checked
    Then the check fails naming "web -> cart-api"

  @R4 @AC-5 @unit
  Scenario: A system coloured unchanged but listed as changed is reported
    Given a page whose changes view lists "cart-api" as "Changed"
    And its containers diagram colours "cart-api" as unchanged
    When it is checked
    Then the check fails naming "cart-api"

  @R5 @AC-6 @unit
  Scenario: Every diagram can be panned, zoomed, fitted and shown full screen
    Given the page template
    Then each diagram frame has the controls "-", "+", "Fit", "100%" and "Full screen"
    And the keys "+", "-", "0" and the arrow keys move the diagram

  @R6 @AC-7 @e2e @manual
  Scenario: The page reads well in both themes and on a phone
    Given the page built for this feature
    When it is opened at 375px width in the light theme and then the dark theme
    Then every diagram draws with no Mermaid error
    And the page has no sideways scroll

  @R7 @AC-8 @unit
  Scenario: Design offers the page when it finishes
    Given the Design command
    When the design is done
    Then it hands off to the c4-model-page skill
