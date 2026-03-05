Feature: Vibe: Idea to Implementation

  Background:
    Given the agent has loaded `.awa/.agent/awa.core.md`
    And all files matching `.awa/rules/*.md`
    And `.awa/specs/ARCHITECTURE.md` if it exists

  Scenario: Understand and scope the idea
    Given user input is not empty
    And all relevant architecture, feat, examples, requirements, design, API, task, and code files are loaded
    When the agent clarifies the idea, scope, and constraints with the user
    Then the starting point in the workflow is determined
    And clarifying questions are asked early, not mid-implementation

  Scenario: Flow through workflow stages
    Given the starting point is determined
    When the agent flows through stages in order
    Then it creates or updates specs as needed: ARCHITECTURE, FEAT, REQ, DESIGN, TASK
    And it skips stages that already exist or are not needed
    And each stage is kept minimal to avoid overengineering
    And trivial changes may collapse multiple stages into one

  Scenario: Checkpoint at each stage transition
    Given a stage has been completed
    When the next stage transition is reached
    Then the agent pauses and confirms direction with the user unless autonomous mode was requested
    And the checkpoint message identifies the completed stage and the next proposed stage

  Scenario: Implement and verify
    Given design and tasks are ready
    When the agent implements the code
    Then traceability markers are maintained throughout
    And tests covering all acceptance criteria are written
    And all acceptance criteria are verified as satisfied
    And user-facing documentation is updated if behavior, CLI, API, or configuration changed
    And the agent may use todos and tools as needed