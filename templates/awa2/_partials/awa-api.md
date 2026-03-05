```gherkin
Feature: ARCHITECTURE.md Generation

  Background:
    Given the agent has loaded `.awa/.agent/awa-core.md`
    And all files matching `.awa/rules/*.md`
    And the schema `.awa/.agent/schemas/ARCHITECTURE.schema.yaml`
    And `.awa/specs/PROJECT.md` if it exists
    And `.awa/specs/ARCHITECTURE.md` if it exists

  Scenario: Create or update from user input
    Given user input is not empty
    When ARCHITECTURE.md does not exist then create it
    When ARCHITECTURE.md exists then solidify changes with respect to it
    Then every field and constraint in the schema is satisfied
    And any value that cannot be inferred is asked for
    And the agent may use todos and tools as needed

  Scenario: Reverse workflow from code
    Given user input requests derivation from existing code
    When the agent analyzes the codebase
    Then it extracts the required information
    And creates or updates ARCHITECTURE.md from the analysis
    And any value that cannot be inferred is asked for
    And the agent may use todos and tools as needed
```
