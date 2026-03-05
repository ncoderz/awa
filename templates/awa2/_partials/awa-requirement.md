```gherkin
Feature: Create or Update Requirements

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`
    And the schema `.awa/.agent/schemas/REQ.schema.yaml`

  Scenario: Create or update from user input
    Given user input is not empty
    And the corresponding FEAT document is loaded
    And all relevant architecture, examples, and requirements files are loaded
    When the agent infers the target requirements from the input
    Then it creates or updates `.awa/specs/REQ-{CODE}-{feature-name}.md`
    And the {CODE} matches the corresponding FEAT {CODE} for the same feature if one exists
    And `awa spec codes` is run to help choose or extend an existing {CODE}
    And requirements are written in EARS format (INCOSE-compliant)
    And requirement IDs and AC IDs follow the format `{CODE}-{n}`, `{CODE}-{n}_AC-{m}`, or `{CODE}-{n}.{p}_AC-{m}`
    And existing requirements to update and new requirements to create are identified
    And edge cases, UX, technical constraints, and success criteria are considered
    And open points are clarified with the user
    And the agent may use todos and tools as needed

  Scenario: Reverse workflow from code
    Given user input requests derivation from existing code
    When the agent analyzes the codebase
    Then it extracts implicit requirements, acceptance criteria, and behavioral expectations
    And creates or updates the requirements document accordingly
    And any value that cannot be inferred is asked for
    And the agent may use todos and tools as needed
```
