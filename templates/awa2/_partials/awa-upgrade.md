Feature: Upgrade Specs to Current Schemas

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`
    And all schemas: ARCHITECTURE, FEAT, EXAMPLE, REQ, DESIGN, TASK, PLAN, and ALIGN_REPORT

  Scenario: Orient and identify targets
    Given user input is not empty
    And all existing spec, task, plan, align report, and relevant code files are loaded
    When the agent infers the target artifacts from the input
    Then it confirms which artifacts will be upgraded
    And clarifies any missing or ambiguous targets with the user

  Scenario: Check, fix, and verify
    Given target artifacts are confirmed
    When the agent runs `awa check` in the terminal
    Then it parses the output to build a list of schema violations and traceability errors
    And for each error it edits the file to resolve the violation
    And fixes cover section structure, heading levels, missing required content, prohibited patterns, and broken trace IDs
    And trace IDs and filenames are upgraded if necessary
    And files exceeding line limits are split logically
    And destructive edits are avoided; clarifications are proposed when unsure
    When the agent runs `awa check` again
    Then it repeats fix and recheck until the check passes cleanly
    And warnings and info findings are acceptable

  Scenario: Report
    Given all errors are resolved
    Then the agent summarizes changes made and any remaining open questions
    And the agent may use todos and tools as needed