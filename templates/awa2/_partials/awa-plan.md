```gherkin
Feature: Create or Update Ad-hoc Plan(s)

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`
    And the schema `.awa/.agent/schemas/PLAN.schema.yaml`

  Scenario: Create or update from user input
    Given user input is not empty
    And all relevant architecture, feat, examples, requirements, design, API, and code files are loaded
    When the agent infers the target plan(s) from the input
    Then it creates or updates `.awa/plans/PLAN-{nnn}-{plan-name}.md`
    And the {nnn} follows sequentially from existing plans in the project
    And work is broken down into detailed, actionable steps
    And risks, dependencies, and completion criteria are identified
    And edge cases, UX, technical constraints, and success criteria are considered
    And areas needing clarification or expansion are flagged
    And significant code is not written in the plan document
    And open points are clarified with the user
    And the agent may use todos and tools as needed
```
