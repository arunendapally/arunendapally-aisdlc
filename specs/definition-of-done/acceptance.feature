# Define. Owner: qa-engineer agent. Check: sdlc gherkin definition-of-done.

Feature: Every stage has a definition of done
  As a person running a feature
  I want each stage to end with what done means
  So that the next stage starts only when the last one is done

  @R1 @AC-1 @unit
  Scenario Outline: Each stage template ends with a checklist
    When the <template> template is read
    Then its last section is "## Definition of done" with at least 3 checklist items

    Examples:
      | template  |
      | prd.md    |
      | design.md |
      | tasks.md  |
      | pr.md     |

  @R2 @AC-2 @subsystem
  Scenario: An open item stops the gate
    Given a complete PRD whose checklist has "- [ ] Open questions answered or owned"
    When the Define gate is requested
    Then the request fails naming "Open questions answered or owned"

  @R2 @AC-3 @subsystem
  Scenario: A ticked item or a reasoned N/A passes
    Given a complete PRD whose checklist items are "- [x]" or "- N/A: no screen in this change"
    When the Define gate is requested
    Then it passes on checks

  @R2 @AC-4 @unit
  Scenario: N/A without a reason is refused
    Given a checklist item "- N/A"
    When the checklist is checked
    Then it fails naming "reason"

  @R3 @AC-5 @unit
  Scenario: Each command states its definition of ready
    When commands/design.md, build.md and verify.md are read
    Then each has "**Ready when:**" naming the previous stage's definition of done

  @R4 @AC-6 @subsystem
  Scenario: A document without a checklist is not refused for it
    Given a complete PRD written before this change, with no "## Definition of done"
    When the Define gate is requested
    Then no refusal names "Definition of done"
