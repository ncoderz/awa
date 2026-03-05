Feature: Implement Code and Tests

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`

  Scenario: Implement from user input
    Given user input is not empty
    And all relevant architecture, feat, examples, requirements, design, API, task, and code files are loaded
    When the agent infers the implementation scope from the input
    Then components are identified from DESIGN with their interfaces and IMPLEMENTS references
    And acceptance criteria types are understood from REQ
    And open points are clarified with the user before proceeding

  Scenario: Implement with tasks
    Given a TASK file is provided
    When the agent implements code
    Then tasks are followed strictly in order
    And each task is completed and its checkbox updated before proceeding to the next
    And blockers are reported and await user instruction

  Scenario: Implement without tasks
    Given no TASK file is provided
    When the agent implements code
    Then components are implemented in dependency order: bootstrapping → types/interfaces → core logic → entry points

  Scenario: Apply traceability markers
    Given a component is being implemented
    Then `@awa-component: {CODE}-{ComponentName}` is placed at the top of each implementing file
    And `@awa-impl: {CODE}-{n}[.{p}]_AC-{m}` is placed above code satisfying each AC
    And `@awa-test: {CODE}_P-{n}` is placed above property-based tests
    And `@awa-test: {CODE}-{n}[.{p}]_AC-{m}` is placed above acceptance tests
    And partial implementations are marked with a comment stating the reason

  Scenario: Verify and finalize
    Given implementation is complete
    When the agent runs `awa check`
    Then all traceability markers resolve to valid spec IDs
    And every feature implementation traces to at least one AC
    And every test file traces to at least one design property
    And no acceptance criteria are left uncovered
    And user-facing documentation is updated if behavior, CLI, API, or configuration changed
    And the agent may use todos and tools as needed