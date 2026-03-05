```gherkin
Feature: Create or Update Usage Examples

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md` if it exists
    And the schema `.awa/.agent/schemas/EXAMPLE.schema.yaml`

  Scenario: Create or update from user input
    Given user input is not empty
    And all relevant architecture, feat, requirements, design, and example files are loaded
    When the agent infers the target example(s) from the input
    Then it creates or updates `.awa/specs/EXAMPLE-{CODE}-{feature-name}-{nnn}.md`
    And the {CODE} matches the corresponding FEAT or REQ {CODE} for the feature
    And each example is concrete, detailed, and reproducible with context explaining its purpose
    And the document is marked as INFORMATIVE
    And if a single file would exceed the line limit it is split into -001, -002, ... files
    And normative language, acceptance criteria, traceability IDs, and design decisions are omitted
    And open points are clarified with the user
    And the agent may use todos and tools as needed

  Scenario: Reverse workflow from code
    Given user input requests derivation from existing code
    When the agent analyzes the codebase
    Then it extracts representative usage patterns, CLI invocations, and configuration samples
    And creates or updates the example files accordingly
    And any value that cannot be inferred is asked for
    And the agent may use todos and tools as needed
```
