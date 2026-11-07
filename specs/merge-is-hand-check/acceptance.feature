# Stage 1 Plan. Owner: qa-engineer agent. Gate: with prd.md, one approval. Check: sdlc gherkin merge-is-hand-check.

Feature: The merge is the hand check
  As a person reviewing a PR
  I want to be told which criteria a person checks before merging
  So that I check them in my review instead of reading a line the agent wrote

  Background:
    Given feature "demo" whose AC-1 has a unit test and whose AC-2 "Usable by keyboard" is tagged @manual with no test

  @R1 @AC-1 @unit
  Scenario: A @manual criterion needs no "Checked by hand" line
    Given a PR body with no "Checked by hand" line
    When the Verify checks run
    Then no problem names AC-2

  @R2 @AC-2 @unit
  Scenario: The review packet lists the criteria a person checks before merging
    When the review packet is built
    Then it has a "## Check by hand before merging" section listing "AC-2 Usable by keyboard"

  @R3 @AC-3 @unit
  Scenario: An untested criterion that is not @manual is still refused
    Given AC-2 is not tagged @manual and still has no test
    When the Verify checks run
    Then a problem names AC-2
