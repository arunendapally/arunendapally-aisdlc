Feature: Runs that need a person only at the intent and the PR
  As a person running work through the plugin
  I want agents stopped only for decisions
  So that a run reaches a raised PR while I am away

  @R1 @AC-1 @unit
  Scenario Outline: A command that only reads is not refused as a person's action
    When an agent runs "<command>"
    Then it is <result>

    Examples:
      | command                                         | result  |
      | cat scripts/hooks/user-prompt.mjs               | allowed |
      | grep -rn "sdlc approve" docs                    | allowed |
      | node scripts/sdlc.mjs approve demo 1            | refused |
      | cat notes.txt && gh pr merge 5                  | refused |
      | grep -rn "sdlc approve" docs > out.txt          | refused |

  @R2 @AC-2 @unit
  Scenario: Two refused reads do not hold the session
    Given a session whose read of a 2,000 line file was refused twice
    When the agent writes a file in that session
    Then the write is allowed

  @R2 @AC-3 @unit
  Scenario: Two refused actions still hold the session
    Given a session whose "gh pr merge 5" was refused twice
    When the agent writes a file in that session
    Then the write is refused until a person replies

  @R3 @AC-4 @unit
  Scenario Outline: Setting up a new repo puts its checks in place
    Given a new repo that holds <what>
    When the repo is set up
    Then its test check is "<gate>" and its proof check is "<proof>"

    Examples:
      | what                                     | gate       | proof               |
      | a package.json whose test runs node:test | npm test   | node --test {files} |
      | a pyproject.toml                         | pytest     | pytest {files}      |

  @R3 @AC-5 @unit
  Scenario: Setting up a repo that already has its settings changes none of them
    Given a repo whose settings name no test check, and a package.json with a test script
    When the repo is set up
    Then the settings are unchanged and the output proposes "npm test" for a person to set

  @R4 @AC-6 @unit
  Scenario Outline: Verify needs the proof or a person's waiver
    Given a light feature at Verify with everything else in order
    And the repo has <setup>
    When Verify is requested
    Then it <result>

    Examples:
      | setup                                               | result                              |
      | no proof check and no waiver                        | is refused, naming the proof check  |
      | no proof check and the waiver "legacy suite, no CI" | passes                              |

  @R5 @AC-7 @unit
  Scenario: One request names every stage from intent to the PR
    When a person reads the run command
    Then it takes a feature through Define, Design in the full lane, Build, Verify and the PR in that order
    And it stops only for the intent, a gate a person holds, a conflict or an escalation

  @R6 @AC-8 @unit
  Scenario: The next slice is the first one whose dependencies are complete
    Given a capability with slices "save-api", then "save-list" depending on "save-api", then "save-share" placed later
    And "save-api" is complete
    When the person asks for the next slice
    Then the answer is "save-list"

  @R6 @AC-9 @unit
  Scenario: A slice whose dependency is not complete is not offered
    Given a capability with slices "save-api", then "save-list" depending on "save-api"
    And "save-api" is at Build
    When the person asks for the next slice
    Then the answer is "save-api", at Build

  @R7 @AC-10 @unit
  Scenario: A new slice carries the capability's intent
    Given a capability where "save-api" has the intent "change: shoppers keep items" given by "Test Human"
    When the slice "save-list" is started in that capability
    Then "save-list" has the same intent, by "Test Human", marked as carried over from "save-api"

  @R8 @AC-11 @unit
  Scenario: The first messages say who decides
    When a session starts in a repo that runs the plugin
    Then it is told a person decides at the intent and the PR
    And it is not told that people own every gate or that gates are approved only by typing
    And the README, the plugin's description and the getting-started guide do not tell a person to type an approval for each gate
