# Requirements Specification

## Introduction

This document defines requirements for the Zen CLI configuration system, including TOML file loading, option parsing, and CLI argument override behavior.

## Glossary

- CONFIGURATION FILE: A `.zen.toml` file containing persistent CLI options
- OVERRIDE: CLI arguments taking precedence over configuration file values
- KEBAB-CASE: Naming convention using hyphens (e.g., `dry-run`)

## Stakeholders

- DEVELOPER: Engineers using Zen CLI who want persistent configuration
- TEAM LEAD: Engineers establishing team-wide configuration standards

## Requirements

### CFG-1: Configuration File Loading [MUST]

AS A developer, I WANT configuration loaded from a file, SO THAT I don't need to specify options every time.

> Enables persistent configuration without repetitive CLI arguments.

ACCEPTANCE CRITERIA

- [ ] AC-1.1 [event]: WHEN the system starts THEN it SHALL attempt to load `.zen.toml` from the current directory
- [ ] AC-1.2 [conditional]: IF `.zen.toml` does not exist THEN the system SHALL continue without error
- [ ] AC-1.3 [conditional]: IF `--config <path>` is provided THEN the system SHALL load configuration from the specified path
- [ ] AC-1.4 [event]: WHEN `--config <path>` points to a non-existent file THEN the system SHALL display an error and exit

### CFG-2: TOML Format Support [MUST]

AS A developer, I WANT configuration in TOML format, SO THAT I can use a human-readable, standard format.

> TOML provides clear syntax for configuration without complexity of YAML or verbosity of JSON.

ACCEPTANCE CRITERIA

- [ ] AC-2.1 [ubiquitous]: The system SHALL parse configuration files as TOML format
- [ ] AC-2.2 [event]: WHEN TOML parsing fails THEN the system SHALL display a descriptive error with line number
- [ ] AC-2.3 [ubiquitous]: The system SHALL support TOML 1.0 specification

### CFG-3: Supported Configuration Options [MUST]

AS A developer, I WANT all CLI options configurable in the file, SO THAT I can set any option persistently.

> All generation options should be specifiable in configuration.

ACCEPTANCE CRITERIA

- [ ] AC-3.1 [ubiquitous]: The configuration file SHALL support `output` as a string path
- [ ] AC-3.2 [ubiquitous]: The configuration file SHALL support `template` as a string source
- [ ] AC-3.3 [ubiquitous]: The configuration file SHALL support `features` as an array of strings
- [ ] AC-3.4 [ubiquitous]: The configuration file SHALL support `force` as a boolean
- [ ] AC-3.5 [ubiquitous]: The configuration file SHALL support `dry-run` as a boolean
- [ ] AC-3.6 [ubiquitous]: The configuration file SHALL support `refresh` as a boolean

### CFG-4: CLI Override Behavior [MUST]

AS A developer, I WANT CLI arguments to override config file values, SO THAT I can make one-off changes without editing the file.

> CLI arguments provide runtime flexibility over persistent configuration.

ACCEPTANCE CRITERIA

- [ ] AC-4.1 [conditional]: IF a CLI argument is provided THEN it SHALL override the corresponding config file value
- [ ] AC-4.2 [conditional]: IF a CLI argument is not provided THEN the config file value SHALL be used
- [ ] AC-4.3 [conditional]: IF neither CLI argument nor config file value exists THEN the default value SHALL be used
- [ ] AC-4.4 [ubiquitous]: The `features` array from CLI SHALL replace (not merge with) the config file array

### CFG-5: Option Name Convention [MUST]

AS A developer, I WANT consistent option naming, SO THAT I can easily map between CLI and config file.

> Consistent naming reduces cognitive load when switching between CLI and config.

ACCEPTANCE CRITERIA

- [ ] AC-5.1 [ubiquitous]: Configuration file options SHALL use kebab-case naming (e.g., `dry-run`)
- [ ] AC-5.2 [ubiquitous]: CLI options SHALL use the same kebab-case names as config file options

### CFG-6: Unknown Option Handling [SHOULD]

AS A developer, I WANT warnings for unknown config options, SO THAT I can catch typos in my configuration.

> Helps users identify configuration errors that would otherwise be silently ignored.

ACCEPTANCE CRITERIA

- [ ] AC-6.1 [conditional]: IF the configuration file contains an unknown option THEN the system SHOULD display a warning
- [ ] AC-6.2 [conditional]: IF the configuration file contains an unknown option THEN the system SHALL continue execution

## Assumptions

- Users understand TOML syntax basics
- Configuration files are UTF-8 encoded
- File system permissions allow reading the configuration file

## Constraints

- TOML parsing limited to smol-toml library for consistency with architecture
- No environment variable interpolation in configuration values
- No configuration file inheritance or includes

## Out of Scope

- Environment variable expansion in config values
- Config file creation wizard
- Config file validation command
- Multiple config file merging

## Change Log

- 1.0.0 (2025-12-11): Initial requirements based on architecture
