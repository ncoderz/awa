```gherkin
Feature: Create or Update Task List(s)

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`
    And the schema `.awa/.agent/schemas/TASK.schema.yaml`
    And the schemas `.awa/.agent/schemas/REQ.schema.yaml` and `.awa/.agent/schemas/DESIGN.schema.yaml` if they exist

  Scenario: Parse inputs
    Given all relevant architecture, feat, examples, requirements, design, and API files are loaded
    When the agent parses the REQ document
    Then requirements with priorities and acceptance criteria are extracted
    And dependencies between requirements are noted
    When the agent parses the DESIGN document
    Then components, interfaces, IMPLEMENTS references, properties, VALIDATES references, and error types are extracted
    When architecture is provided
    Then project structure, technology stack, and architectural constraints are extracted

  Scenario: Generate tasks
    Given inputs have been parsed
    When the agent generates tasks
    Then Phase 1 covers setup with project initialization, dependencies, and configuration
    And Phase 2 covers foundation with core types, error types, and shared interfaces
    And Phase 3+ contains one phase per requirement in priority order: must → should → could
    And each requirement phase contains types, implementation tasks, and test tasks
    And the final phase covers integration and polish
    And the documentation phase covers user-facing changes or explicitly states no changes

  Scenario: Validate and output
    Given tasks have been generated
    When the agent validates the task list
    Then every AC has at least one implementing task
    And every property has a test task
    And no orphan tasks exist
    And dependencies respect component order from the DESIGN document
    And the task list is written to `.awa/tasks/TASK-{CODE}-{feature-name}-{nnn}.md`
    And open points are clarified with the user
    And the agent may use todos and tools as needed
```
