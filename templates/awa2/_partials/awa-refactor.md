Feature: Refactor Code

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`

  Scenario: Refactor from user input
    Given user input is not empty
    And all relevant architecture, requirements, design, API, task, and code files are loaded
    When the agent infers the refactor scope from the input
    Then scope and risks are clarified with the user before any major changes
    And changes are made incrementally, not as wholesale rewrites
    And existing behavior is preserved unless explicitly asked to change it
    And all traceability markers (@awa-component, @awa-impl, @awa-test) are maintained
    And public interfaces are not changed without explicit approval
    And test files are updated if structure changed
    And user-facing documentation is updated if behavior, CLI, API, or configuration changed

  Scenario: Verify refactor
    Given refactoring is complete
    When the agent runs `awa check`
    Then all traceability markers are confirmed to be preserved and resolve correctly
    And tests pass after refactoring
    And the agent may use todos and tools as needed