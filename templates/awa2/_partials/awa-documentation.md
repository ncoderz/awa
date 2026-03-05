Feature: Create or Update Documentation

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md`
    And the schema `.awa/.agent/schemas/README.schema.yaml`

  Scenario: Create or update from user input
    Given user input is not empty
    And all relevant architecture, requirements, design, README, and docs files are loaded
    When the agent infers the target documentation from the input
    Then it creates or updates `README.md` and/or `docs/{topic}.md` as needed
    And README.md is kept concise, user-facing, and links to /docs for details
    And /docs files are organized by topic, each covering one topic
    And content is derived from architecture and design specs without duplicating them
    And code examples are accurate and runnable
    And terminology is consistent with the glossary in specs
    And practical examples are included for each feature documented
    And files exceeding the line limit are split by topic
    And troubleshooting sections are included for common issues
    And open points are clarified with the user
    And the agent may use todos and tools as needed

  Scenario: Synchronize with updated specifications
    Given related specifications have changed
    When the agent identifies affected documentation
    Then outdated content is updated to reflect the specification changes
    And documentation for deprecated features is removed
    And the agent may use todos and tools as needed