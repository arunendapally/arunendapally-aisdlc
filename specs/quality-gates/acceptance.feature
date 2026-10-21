Feature: Quality gates for requirements, design, testing and review
  As a team building with agents
  I want each gate to refuse work that guesses, skips a question, or hides risk
  So that what reaches a human is already checked, and humans judge only what needs judgement

  @R2 @AC-1 @unit
  Scenario: The acceptance template is valid Gherkin that covers its requirements
    Given the plugin's acceptance.feature template and a PRD with R1 and R2
    When the Gherkin linter checks it
    Then it reports no errors and lists three tagged scenarios

  @R2 @AC-2 @unit
  Scenario: A scenario without its criterion, requirement or level is refused
    Given a scenario tagged only with a test level
    When the linter checks it against a PRD with R1
    Then it asks for a criterion tag and a requirement tag and says R1 has no scenario

  @R2 @AC-3 @unit
  Scenario: A scenario that does two things is refused
    Given a scenario with two When steps
    When the linter checks it
    Then it says one behaviour per scenario and to split it

  @R2 @AC-4 @unit
  Scenario: An outline missing a column for its placeholder is refused
    Given a Scenario Outline that uses a placeholder its Examples do not define
    When the linter checks it
    Then it names the missing column

  @R2 @AC-5 @unit
  Scenario: Steps about selectors are refused and steps about clicks are warned
    Given a step that names a CSS selector and another that clicks a button
    When the linter checks them
    Then the selector is an error and the click is a warning

  @R1 @AC-6 @unit
  Scenario: Unmarked or unlisted assumptions stop the Plan gate
    Given a PRD with an unmarked assumption and an unconfirmed one missing from Open questions
    When the Plan gate checks the PRD
    Then it names both assumptions

  @R2 @AC-7 @unit
  Scenario: A fact whose source changed is stale
    Given a fact pinned to a line of code at a commit
    When that file changes in a later commit
    Then the Analyze gate says the fact is stale

  @R2 @AC-8 @unit
  Scenario: The Analyze gate needs acceptance criteria for every requirement
    Given a PRD with two requirements and a feature file covering one
    When the Analyze gate is requested
    Then it names the requirement with no scenario

  @R5 @AC-9 @unit
  Scenario: The review packet shows where the risk is
    Given a change to an auth file with a debug leftover and a schema migration
    When the review packet is built
    Then it lists the risk signals, the lenses to run, and the criteria with no test

  @R5 @AC-10 @unit
  Scenario: Open serious findings stop the Verify gate
    Given a findings ledger with an open major and a wontfix with no reason
    When the Verify gate is requested
    Then it names each problem and lets an open nit stay

  @R5 @AC-11 @unit
  Scenario: Findings only humans caught become retro proposals
    Given serious findings recorded by humans that the pre-review missed
    When the retro runs
    Then it proposes a pre-reviewer change with the measured recall

  @R3 @AC-12 @unit
  Scenario: An ADR with one option and no downside is refused
    Given an ADR that weighs a single option and names no cost
    When the ADR is checked
    Then it asks for a second option and a downside

  @R3 @AC-13 @unit
  Scenario: The Design gate needs three disciplines to agree
    Given a decision questioned by two reviewers with one question unanswered
    When the Design gate is requested
    Then it asks for a third discipline, the missing answer and an accept verdict

  @R4 @AC-14 @unit
  Scenario: A criterion tested at the wrong level is refused
    Given an e2e criterion that only a unit test names
    When the test matrix is built
    Then it says the criterion is only tested at the unit level

  @R4 @AC-15 @unit
  Scenario: Repeated gate runs expose a flaky test
    Given a test that passes and fails on the same code
    When the gate runs three times
    Then it reports the runs as flaky

  @R4 @AC-16 @unit
  Scenario: Leftover test data fails the gate
    Given a data check that finds rows the tests left behind
    When the gate runs
    Then it reports that test data leaked

  @R6 @AC-17 @unit
  Scenario: Data work without an ER diagram marking its changes is refused
    Given a data change whose plan has no ER diagram
    When the Design gate is requested
    Then it asks for a Mermaid erDiagram that names the changed entities

  @R7 @AC-18 @unit
  Scenario: An undeclared breaking API change is refused
    Given an OpenAPI file that drops an operation the base branch had
    When the Design gate is requested
    Then it names the breaking change until the plan declares it

  @R7 @AC-19 @unit
  Scenario: The API contract opens in Swagger
    Given a feature with no contract yet
    When the API contract is started
    Then an OpenAPI file and a Swagger viewer sit side by side and the review packet flags the contract

  @R8 @AC-20 @unit
  Scenario: The review packet names each new dependency
    Given a change that adds two packages and bumps the version of another
    When the review packet is built
    Then it names the two new packages and not the version bump

  @R8 @AC-21 @unit
  Scenario: A change far larger than its criteria is flagged
    Given a change of over three hundred code lines for one acceptance criterion
    When the review packet is built
    Then it flags the change as oversized
