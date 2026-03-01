# Requirements Specification

## Introduction

This document defines requirements for restructuring the awa CLI to group template-related commands under a `template` subcommand, separating them from awa-specific commands that remain at the top level.

## Glossary

- TEMPLATE COMMAND: A CLI command that operates on template files (generate, diff, features, test)
- AWA COMMAND: A CLI command that operates on awa specs or code traceability (check, trace)
- SUBCOMMAND GROUP: A parent command that acts as a namespace for child commands

## Stakeholders

- DEVELOPER: Engineers using awa CLI to generate and manage agent configuration
- CI PIPELINE: Automated build systems invoking awa commands

## Requirements

### TCLI-1: Template Subcommand Group [MUST]

AS A developer, I WANT template commands grouped under `awa template`, SO THAT I can immediately distinguish template operations from awa operations.

> Groups generate, diff, features, and test under a single parent command.

ACCEPTANCE CRITERIA

- TCLI-1_AC-1 [ubiquitous]: The system SHALL provide a `template` parent command
- TCLI-1_AC-2 [ubiquitous]: The `template` command SHALL contain `generate`, `diff`, `features`, and `test` as subcommands
- TCLI-1_AC-3 [event]: WHEN the user invokes `awa template` without a subcommand THEN the system SHALL display help listing available template subcommands
- TCLI-1_AC-4 [ubiquitous]: The `generate` subcommand under `template` SHALL accept the same options as the current top-level `generate` command
- TCLI-1_AC-5 [ubiquitous]: The `diff` subcommand under `template` SHALL accept the same options as the current top-level `diff` command
- TCLI-1_AC-6 [ubiquitous]: The `features` subcommand under `template` SHALL accept the same options as the current top-level `features` command
- TCLI-1_AC-7 [ubiquitous]: The `test` subcommand under `template` SHALL accept the same options as the current top-level `test` command

### TCLI-2: Top-Level Init Convenience [MUST]

AS A developer, I WANT `awa init` to work as a top-level convenience command equivalent to `awa template generate`, SO THAT new users have a short entry point without navigating the template subgroup.

> Provides a top-level init command for onboarding ergonomics.

ACCEPTANCE CRITERIA

- TCLI-2_AC-1 [ubiquitous]: The system SHALL provide `awa init` as a top-level command
- TCLI-2_AC-2 [ubiquitous]: The `init` command SHALL accept the same arguments and options as `awa template generate`

### TCLI-3: Top-Level Awa Commands [MUST]

AS A developer, I WANT `check` and `trace` to remain top-level commands, SO THAT awa-specific operations are not nested under an unrelated parent.

> Awa commands that operate on specs and traceability stay at the root level.

ACCEPTANCE CRITERIA

- TCLI-3_AC-1 [ubiquitous]: The system SHALL provide `check` as a top-level command under `awa`
- TCLI-3_AC-2 [ubiquitous]: The system SHALL provide `trace` as a top-level command under `awa`
- TCLI-3_AC-3 [ubiquitous]: The `check` command SHALL accept the same options as the current implementation
- TCLI-3_AC-4 [ubiquitous]: The `trace` command SHALL accept the same options as the current implementation

### TCLI-4: Help and Discovery [MUST]

AS A developer, I WANT `awa --help` to show both top-level commands and the template group, SO THAT I can discover all available commands.

> Clear help output for the restructured command tree.

ACCEPTANCE CRITERIA

- TCLI-4_AC-1 [event]: WHEN the user invokes `awa --help` THEN the output SHALL list `init`, `template`, `check`, and `trace` as available commands
- TCLI-4_AC-2 [event]: WHEN the user invokes `awa template --help` THEN the output SHALL list `generate`, `diff`, `features`, and `test` as available subcommands

### TCLI-5: Remove Top-Level Template Commands [MUST]

AS A developer, I WANT the old top-level `generate`, `diff`, `features`, and `test` commands removed, SO THAT the CLI has a single clear structure.

> Clean break — no deprecated aliases at the root level.

ACCEPTANCE CRITERIA

- TCLI-5_AC-1 [ubiquitous]: The system SHALL NOT provide `generate` as a top-level command
- TCLI-5_AC-2 [ubiquitous]: The system SHALL NOT provide `diff` as a top-level command
- TCLI-5_AC-3 [ubiquitous]: The system SHALL NOT provide `features` as a top-level command
- TCLI-5_AC-4 [ubiquitous]: The system SHALL NOT provide `test` as a top-level command

## Assumptions

- Users can update their scripts to use the new command paths
- CI pipelines will be updated alongside CLI changes

## Constraints

- Must use commander's nested subcommand support
- All existing command options remain unchanged — only the command path changes

## Out of Scope

- Backward-compatible aliases at the root level for diff, features, or test
- New commands beyond the existing set

## Change Log

- 1.0.0 (2026-03-01): Initial requirements for CLI restructure
- 1.1.0 (2026-03-01): Changed TCLI-2 from template alias to top-level init convenience command

