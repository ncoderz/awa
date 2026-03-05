```gherkin
Feature: Create or Update Design(s)

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`
    And the schema `.awa/.agent/schemas/DESIGN.schema.yaml`
    And the schema `.awa/.agent/schemas/REQ.schema.yaml` if it exists

  Scenario: Create or update from user input
    Given user input is not empty
    And all relevant architecture, feat, examples, requirements, design, and API files are loaded
    When the agent infers the target design(s) from the input
    Then it creates or updates `.awa/specs/{nnn}-{CODE}-DESIGN-{feature-name}-{nnn}.md`
    And it creates or updates `.awa/specs/{nnn}-{CODE}-API-{api-name}-{nnn}.tsp` in TypeSpec format
    And the {CODE} matches the corresponding REQ {CODE} for the same feature if one exists
    And `awa spec codes` is run to help choose or extend an existing {CODE}
    And component interfaces, data models, and error handling strategies are defined
    And edge cases, UX, technical constraints, and success criteria are considered
    And IMPLEMENTS and VALIDATES cross-references resolve to real requirement and AC IDs
    And open points are clarified with the user
    And the agent may use todos and tools as needed

  Scenario: Reverse workflow from code
    Given user input requests derivation from existing code
    When the agent analyzes the codebase
    Then it extracts component structure, interfaces, data models, and design patterns
    And creates or updates the design and API specifications accordingly
    And any value that cannot be inferred is asked for
    And the agent may use todos and tools as needed

  Scenario: Research requirement
    Given the design reveals areas of uncertainty
    When the agent identifies that research is needed
    Then it conducts research and builds up context in the conversation thread
    And proceeds only once sufficient context is established
```
