```gherkin
Feature: Create or Update Feature Doc

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`
    And the schema `.awa/.agent/schemas/FEAT.schema.yaml`

  Scenario: Create or update from user input
    Given user input is not empty
    And all relevant architecture, feat, and requirements files are loaded
    When the agent infers the target feature context from the input
    Then it creates or updates `.awa/specs/FEAT-{CODE}-{feature-name}.md`
    And `awa spec codes` is run to help choose or extend an existing {CODE}
    And the document describes the problem, motivation, conceptual model, and usage scenarios
    And the document is marked as INFORMATIVE
    And normative language, acceptance criteria, traceability IDs, and design decisions are omitted
    And jargon is defined in a glossary if needed
    And open points are clarified with the user
    And the agent may use todos and tools as needed

  Scenario: Reverse workflow from code or requirements
    Given user input requests derivation from existing code or requirements
    When the agent analyzes the codebase and specs
    Then it extracts the problem statement, conceptual model, and usage scenarios
    And creates or updates the feature context document accordingly
    And any value that cannot be inferred is asked for
    And the agent may use todos and tools as needed
```
