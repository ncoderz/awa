# Requirements Specification

## Introduction

This document defines requirements for multi-target configuration in awa CLI, allowing per-agent target sections in `.awa.toml` with single-command batch generation.

## Glossary

- TARGET: A named configuration section (`[targets.<name>]`) defining agent-specific generation options
- BATCH MODE: Processing multiple targets in a single command invocation (`--all` or `--target`)
- ROOT CONFIG: Top-level configuration in `.awa.toml` (outside any `[targets.*]` section)

## Stakeholders

- DEVELOPER: Engineers using awa to configure multiple AI agents
- TEAM LEAD: Engineers standardizing multi-agent configuration across a team

## Requirements

### MULTI-1: Target Section Parsing [MUST]

AS A developer, I WANT to define `[targets.<name>]` sections in `.awa.toml`, SO THAT I can configure different agents with different settings.

> Enables per-agent configuration without multiple config files or repeated CLI invocations.

ACCEPTANCE CRITERIA

- [ ] MULTI-1_AC-1 [ubiquitous]: The configuration file SHALL support `[targets.<name>]` sections as TOML tables

### MULTI-2: Target Section Fields [MUST]

AS A developer, I WANT each target section to specify output, features, preset, remove-features, and template, SO THAT I can customize each agent's generation independently.

> All generation-related fields should be configurable per target.

ACCEPTANCE CRITERIA

- [ ] MULTI-2_AC-1 [ubiquitous]: Each target section SHALL support `output`, `features`, `preset`, `remove-features`, and `template` fields (all optional; inherit from root)

### MULTI-3: Target Inheritance [MUST]

AS A developer, I WANT target sections to inherit from root config, SO THAT I only need to specify what differs per agent.

> Reduces duplication when targets share most configuration.

ACCEPTANCE CRITERIA

- [ ] MULTI-3_AC-1 [ubiquitous]: Target sections SHALL inherit from root config via nullish coalescing (target values override root)

### MULTI-4: Generate All Targets [MUST]

AS A developer, I WANT `awa generate --all` to process all named targets, SO THAT I can regenerate all agent configs in one command.

> Enables single-command multi-agent generation.

ACCEPTANCE CRITERIA

- [ ] MULTI-4_AC-1 [event]: WHEN `--all` is provided THEN the system SHALL process all named `[targets.*]` sections
- [ ] MULTI-4_AC-2 [event]: WHEN `--all` is provided AND no `[targets.*]` sections exist THEN the system SHALL error with `NO_TARGETS`

### MULTI-5: Generate Single Target [MUST]

AS A developer, I WANT `awa generate --target <name>` to process a specific target, SO THAT I can regenerate one agent's config.

> Enables targeted regeneration without processing all agents.

ACCEPTANCE CRITERIA

- [ ] MULTI-5_AC-1 [event]: WHEN `--target <name>` is provided THEN the system SHALL process only the named target
- [ ] MULTI-5_AC-2 [event]: WHEN `--target <name>` is provided AND the name doesn't exist THEN the system SHALL error with `UNKNOWN_TARGET`

### MULTI-6: Diff All Targets [MUST]

AS A developer, I WANT `awa diff --all` and `awa diff --target` to work identically to generate, SO THAT I can check all agents for drift.

> Consistent batch behavior across commands.

ACCEPTANCE CRITERIA

- [ ] MULTI-6_AC-1 [ubiquitous]: The diff command SHALL support `--all` and `--target` identically to the generate command

### MULTI-7: Backward Compatibility [MUST]

AS A developer, I WANT existing behavior unchanged when no `--all` or `--target` flags are used, SO THAT my workflows don't break.

> Zero-disruption upgrade path.

ACCEPTANCE CRITERIA

- [ ] MULTI-7_AC-1 [conditional]: IF neither `--all` nor `--target` is provided THEN the system SHALL use existing single-target behavior

### MULTI-8: Per-Target Reporting [MUST]

AS A developer, I WANT results reported per target with clear labels, SO THAT I can identify which agent's output changed.

> Distinguishes output when processing multiple targets.

ACCEPTANCE CRITERIA

- [ ] MULTI-8_AC-1 [ubiquitous]: Batch mode output SHALL prefix log lines with `[target-name]`

### MULTI-9: Missing Output Error [MUST]

AS A developer, I WANT a clear error naming the target when output is unresolvable, SO THAT I know which target to fix.

> Better error messages for multi-target configuration issues.

ACCEPTANCE CRITERIA

- [ ] MULTI-9_AC-1 [event]: WHEN a target has no output AND root has no output THEN the system SHALL error with `MISSING_OUTPUT` naming the target

### MULTI-10: Non-Interactive Batch Mode [MUST]

AS A developer, I WANT `--all` and `--target` to suppress interactive prompting, SO THAT batch generation works in CI/scripts.

> Batch mode must be non-interactive for automation.

ACCEPTANCE CRITERIA

- [ ] MULTI-10_AC-1 [conditional]: IF `--all` or `--target` is set THEN the system SHALL NOT prompt for tool feature selection

### MULTI-11: CLI Output Override [MUST]

AS A developer, I WANT consistent CLI positional behavior with batch flags, SO THAT override semantics are predictable.

> Maintains CLI-over-file precedence consistency.

ACCEPTANCE CRITERIA

- [ ] MULTI-11_AC-1 [conditional]: IF `--all` is set THEN CLI positional `[output]` SHALL be ignored; IF `--target` is set THEN CLI positional SHALL override the target's output

### MULTI-12: Diff Exit Code Aggregation [MUST]

AS A developer, I WANT `diff --all` to return an aggregated exit code, SO THAT CI pipelines can detect any drift.

> Enables CI integration with multi-target diff.

ACCEPTANCE CRITERIA

- [ ] MULTI-12_AC-1 [ubiquitous]: `diff --all` exit code SHALL be `1` if any target has differences, `0` if all identical, `2` on error

## Assumptions

- Users understand TOML table syntax
- Configuration files are UTF-8 encoded

## Constraints

- Target sections limited to generation-related fields (no boolean flags)
- Boolean flags apply globally when used with `--all`

## Out of Scope

- Overlay support within targets (deferred to PLAN-003)
- JSON output for multi-target results (deferred to PLAN-009)

## Change Log

- 1.0.0 (2026-02-28): Initial requirements specification
