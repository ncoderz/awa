# Requirements Specification

## Introduction

This document defines requirements for the `awa init` command alias — a user-friendly entry point that maps to the existing `generate` command with identical behaviour.

## Glossary

- ALIAS: A secondary name for a command that invokes the same handler with the same options
- CONFIG HINT: A non-blocking informational message suggesting config file creation

## Stakeholders

- DEVELOPER: Engineers using awa CLI for the first time or in daily workflow
- MAINTAINER: Engineers maintaining and extending awa CLI

## Requirements

### INIT-1: Init Alias Registration [MUST]

AS A developer, I WANT to run `awa init` as an alternative to `awa generate`, SO THAT the CLI uses familiar onboarding vocabulary.

> `init` is registered as an alias on the generate command using commander's `.alias()` API.

ACCEPTANCE CRITERIA

- INIT-1_AC-1 [ubiquitous]: The system SHALL register `init` as an alias for the `generate` command

### INIT-2: Option Parity [MUST]

AS A developer, I WANT `awa init` to accept all options that `awa generate` accepts, SO THAT I can use any option with either command name.

> Both command names share the same commander definition, so option parity is structural.

ACCEPTANCE CRITERIA

- INIT-2_AC-1 [ubiquitous]: The `init` alias SHALL accept all options defined on the `generate` command

### INIT-3: Behavioural Identity [MUST]

AS A developer, I WANT `awa init <args>` to produce the same result as `awa generate <args>`, SO THAT the choice of command name has no observable effect.

> Identical handler ensures identical behaviour.

ACCEPTANCE CRITERIA

- INIT-3_AC-1 [ubiquitous]: `awa init <args>` SHALL produce output identical to `awa generate <args>` for the same arguments

### INIT-4: Help Visibility [MUST]

AS A developer, I WANT both `init` and `generate` to appear in help output, SO THAT I can discover both names.

> Commander automatically renders aliases in the command list.

ACCEPTANCE CRITERIA

- INIT-4_AC-1 [event]: WHEN the user invokes `awa --help` THEN the help output SHALL list both `generate` and `init`

### INIT-5: Config-Not-Found Hint [SHOULD]

AS A developer, I WANT an informational hint when no config file is found, SO THAT I know how to save my options for next time.

> Non-blocking info message surfaced only when no `.awa.toml` is present and no `--config` was provided.

ACCEPTANCE CRITERIA

- INIT-5_AC-1 [conditional]: IF no `.awa.toml` is found AND `--config` was not provided THEN the system SHALL log an info-level hint suggesting config file creation

## Assumptions

- Users invoke the CLI from a terminal environment
- Commander `.alias()` API is available (commander ≥ 7)

## Constraints

- No behaviour changes to `generate` beyond hint addition
- `generate` must remain fully functional and undeprecated

## Out of Scope

- Making `init` the primary command and `generate` the alias (both are equally valid)
- Interactive config creation wizard

## Change Log

- 1.0.0 (2026-02-28): Initial requirements for PLAN-001
