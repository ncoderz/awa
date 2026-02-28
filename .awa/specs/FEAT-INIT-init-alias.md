# Init Command Alias [INFORMATIVE]

## Problem

New users expect `awa init` as the entry point for setting up a project. The word "generate" implies creating something new; "init" implies initialising a project setup, which is the common first-run scenario. Requiring new users to learn "generate" first creates unnecessary friction.

## Conceptual Model

`init` is a friendly alias for `generate`. It registers the same command, accepts the same options, and produces the same behaviour. The distinction is purely ergonomic: documentation and quick-start guides lead with `awa init`, while `awa generate` remains equally valid and is never deprecated.

An optional first-run hint surfaces when no `.awa.toml` configuration file is found and no `--config` flag is provided. This non-blocking info message suggests running `awa init .` to generate a configuration — lowering the barrier for first-time users without interrupting existing workflows.

## Scenarios

### Scenario 1: New user runs `awa init .`

A developer discovers awa and follows the README Quick Start. They run `awa init .` and get the same output as `awa generate .`. No mental model gap.

### Scenario 2: Existing user runs `awa generate .`

Nothing changes. `awa generate .` continues to work identically. Both `init` and `generate` appear in `awa --help`.

### Scenario 3: First-run hint

A developer runs `awa init .` in a project with no `.awa.toml`. After generation completes, a non-blocking info message appears:
`Tip: create .awa.toml to save your options for next time.`

### Scenario 4: Feature-flag passthrough

`awa init . --features copilot claude` behaves identically to `awa generate . --features copilot claude`.

## Change Log

- 1.0.0 (2026-02-28): Initial feature context for PLAN-001
