```gherkin
Feature: Validate Alignment of Source(x) with Target(y)

  Background:
    Given the agent has loaded `.awa/.agent/awa-core.md`
    And all files matching `.awa/rules/*.md`
    And the schema `.awa/.agent/schemas/ALIGN_REPORT.schema.yaml`
    And `.awa/specs/PROJECT.md` if it exists
    And `.awa/specs/ARCHITECTURE.md` if it exists

  Scenario: Resolve source and target from user input
    Given user input is not empty
    When the agent infers source:x and target:y from the input
    And target:y is omitted and source:x is a plan
    Then ask for clarification
    When target:y is omitted and previous work was validated against a plan
    Then use that plan as target:y
    When target:y is omitted otherwise
    Then walk up the workflow toward architecture

  Scenario: Validate alignment and report
    Given source:x and target:y are resolved
    And all relevant spec, task, plan, and code files are loaded
    When the agent validates that source:x aligns with target:y
    Then all differences are reported
    And missing trace IDs are reported
    And the report is written to `.awa/align/{nnn}-{CODE}-ALIGN-{x}-WITH-{y}-{nnn}.md`
    And the CLI outputs `STATUS: PASSED ✅` or `STATUS: FAILED ❌`
    And the agent may use todos and tools as needed
```