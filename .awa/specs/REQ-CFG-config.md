# Requirements Specification

## Introduction

This document defines requirements for the awa CLI configuration system, including TOML file loading, option parsing, CLI argument override behavior, feature presets, and feature removal.

## Glossary

- CONFIGURATION FILE: A `.awa.toml` file containing persistent CLI options
- OVERRIDE: CLI arguments taking precedence over configuration file values
- KEBAB-CASE: Naming convention using hyphens (e.g., `dry-run`)
- PRESET: A named collection of feature flags defined in the configuration file
- FEATURE RESOLUTION: The process of computing the final features array from base features, presets, and removals
- BASE FEATURES: Features specified via `--features` CLI option or `features` config option

## Stakeholders

- DEVELOPER: Engineers using awa CLI who want persistent configuration
- TEAM LEAD: Engineers establishing team-wide configuration standards

## Requirements

### CFG-1: Configuration File Loading [MUST]

AS A developer, I WANT configuration loaded from a file, SO THAT I don't need to specify options every time.

> Enables persistent configuration without repetitive CLI arguments.

ACCEPTANCE CRITERIA

- CFG-1_AC-1 [event]: WHEN the system starts THEN it SHALL attempt to load `.awa.toml` from the current directory
- CFG-1_AC-2 [conditional]: IF `.awa.toml` does not exist THEN the system SHALL continue without error
- CFG-1_AC-3 [conditional]: IF `--config <path>` is provided THEN the system SHALL load configuration from the specified path
- CFG-1_AC-4 [event]: WHEN `--config <path>` points to a non-existent file THEN the system SHALL display an error and exit

### CFG-2: TOML Format Support [MUST]

AS A developer, I WANT configuration in TOML format, SO THAT I can use a human-readable, standard format.

> TOML provides clear syntax for configuration without complexity of YAML or verbosity of JSON.

ACCEPTANCE CRITERIA

- CFG-2_AC-1 [ubiquitous]: The system SHALL parse configuration files as TOML format
- CFG-2_AC-2 [event]: WHEN TOML parsing fails THEN the system SHALL display a descriptive error with line number
- CFG-2_AC-3 [ubiquitous]: The system SHALL support TOML 1.0 specification

### CFG-3: Supported Configuration Options [MUST]

AS A developer, I WANT all CLI options configurable in the file, SO THAT I can set any option persistently.

> All generation options should be specifiable in configuration.

ACCEPTANCE CRITERIA

- CFG-3_AC-1 [ubiquitous]: The configuration file SHALL support `output` as a string path
- CFG-3_AC-2 [ubiquitous]: The configuration file SHALL support `template` as a string source
- CFG-3_AC-3 [ubiquitous]: The configuration file SHALL support `features` as an array of strings
- CFG-3_AC-4 [ubiquitous]: The configuration file SHALL support `force` as a boolean
- CFG-3_AC-5 [ubiquitous]: The configuration file SHALL support `dry-run` as a boolean
- CFG-3_AC-6 [ubiquitous]: The configuration file SHALL support `refresh` as a boolean
- CFG-3_AC-7 [ubiquitous]: The configuration file SHALL support `delete` as a boolean
- CFG-3_AC-8 [ubiquitous]: The configuration file SHALL support `list-unknown` as a boolean
- CFG-3_AC-9 [ubiquitous]: The configuration file SHALL support `preset` as an array of strings
- CFG-3_AC-10 [ubiquitous]: The configuration file SHALL support `remove-features` as an array of strings

### CFG-4: CLI Override Behavior [MUST]

AS A developer, I WANT CLI arguments to override config file values, SO THAT I can make one-off changes without editing the file.

> CLI arguments provide runtime flexibility over persistent configuration.

ACCEPTANCE CRITERIA

- CFG-4_AC-1 [conditional]: IF a CLI argument is provided THEN it SHALL override the corresponding config file value
- CFG-4_AC-2 [conditional]: IF a CLI argument is not provided THEN the config file value SHALL be used
- CFG-4_AC-3 [conditional]: IF neither CLI argument nor config file value exists THEN the default value SHALL be used
- CFG-4_AC-4 [ubiquitous]: The `features` array from CLI SHALL replace (not merge with) the config file array

### CFG-5: Option Name Convention [MUST]

AS A developer, I WANT consistent option naming, SO THAT I can easily map between CLI and config file.

> Consistent naming reduces cognitive load when switching between CLI and config.

ACCEPTANCE CRITERIA

- CFG-5_AC-1 [ubiquitous]: Configuration file options SHALL use kebab-case naming (e.g., `dry-run`)
- CFG-5_AC-2 [ubiquitous]: CLI options SHALL use the same kebab-case names as config file options

### CFG-6: Unknown Option Handling [SHOULD]

AS A developer, I WANT warnings for unknown config options, SO THAT I can catch typos in my configuration.

> Helps users identify configuration errors that would otherwise be silently ignored.

ACCEPTANCE CRITERIA

- CFG-6_AC-1 [conditional]: IF the configuration file contains an unknown option THEN the system SHOULD display a warning
- CFG-6_AC-2 [conditional]: IF the configuration file contains an unknown option THEN the system SHALL continue execution

### CFG-7: Preset Definition in Config [MUST]

AS A developer, I WANT to define named feature presets in my config file, SO THAT I can reuse common feature combinations.

> Presets reduce repetition and enable team-standardized feature bundles.

ACCEPTANCE CRITERIA

- CFG-7_AC-1 [ubiquitous]: The configuration file SHALL support a `[presets]` TOML table
- CFG-7_AC-2 [ubiquitous]: Each key in the `[presets]` table SHALL map to an array of feature strings
- CFG-7_AC-3 [event]: WHEN a preset value is not an array of strings THEN the system SHALL display a type error and exit
- CFG-7_AC-4 [conditional]: IF the `[presets]` table is absent THEN the system SHALL continue without error

### CFG-8: Preset CLI Option [MUST]

AS A developer, I WANT to activate presets from the command line, SO THAT I can select feature bundles at runtime.

> CLI activation enables flexible preset selection per invocation.

ACCEPTANCE CRITERIA

- CFG-8_AC-1 [ubiquitous]: The system SHALL accept `--preset <name>` as a CLI option
- CFG-8_AC-2 [event]: WHEN multiple `--preset` options are provided THEN the system SHALL collect all values
- CFG-8_AC-3 [event]: WHEN a preset name does not exist in config THEN the system SHALL display an error and exit
- CFG-8_AC-4 [conditional]: IF `--preset` is not provided THEN the system SHALL use an empty preset list as default

### CFG-9: Preset Config Option [MUST]

AS A developer, I WANT to specify default presets in my config file, SO THAT I don't need to pass `--preset` every time.

> Config-based presets enable persistent preset activation.

ACCEPTANCE CRITERIA

- CFG-9_AC-1 [ubiquitous]: The configuration file SHALL support `preset` as an array of strings
- CFG-9_AC-2 [conditional]: IF CLI `--preset` is provided THEN it SHALL replace the config `preset` value
- CFG-9_AC-3 [conditional]: IF neither CLI nor config specifies presets THEN the system SHALL use an empty array

### CFG-10: Remove Features CLI Option [MUST]

AS A developer, I WANT to remove specific features from the final set, SO THAT I can exclude unwanted features without modifying presets.

> Feature removal provides fine-grained control over the final feature set.

ACCEPTANCE CRITERIA

- CFG-10_AC-1 [ubiquitous]: The system SHALL accept `--remove-features <feature>` as a CLI option
- CFG-10_AC-2 [event]: WHEN multiple `--remove-features` options are provided THEN the system SHALL collect all values
- CFG-10_AC-3 [ubiquitous]: The system SHALL support comma-separated values in a single `--remove-features` option
- CFG-10_AC-4 [conditional]: IF a removed feature does not exist in the feature set THEN the system SHALL silently ignore it
- CFG-10_AC-5 [conditional]: IF `--remove-features` is not provided THEN the system SHALL use an empty removal list

### CFG-11: Remove Features Config Option [MUST]

AS A developer, I WANT to specify removed features in my config file, SO THAT I can persistently exclude features.

> Config-based removal enables persistent feature exclusion.

ACCEPTANCE CRITERIA

- CFG-11_AC-1 [ubiquitous]: The configuration file SHALL support `remove-features` as an array of strings
- CFG-11_AC-2 [conditional]: IF CLI `--remove-features` is provided THEN it SHALL replace the config `remove-features` value
- CFG-11_AC-3 [conditional]: IF neither CLI nor config specifies removals THEN the system SHALL use an empty array

### CFG-12: Feature Resolution Order [MUST]

AS A developer, I WANT a predictable feature resolution order, SO THAT I can reason about the final feature set.

> Deterministic resolution ensures predictable template output.

ACCEPTANCE CRITERIA

- CFG-12_AC-1 [ubiquitous]: The system SHALL compute base features as CLI `--features` if provided, else config `features`, else empty array
- CFG-12_AC-2 [ubiquitous]: The system SHALL compute preset features as the union of all features from activated presets
- CFG-12_AC-3 [ubiquitous]: The system SHALL compute the combined set as the union of base features and preset features
- CFG-12_AC-4 [ubiquitous]: The system SHALL compute the final features by removing all `remove-features` from the combined set
- CFG-12_AC-5 [ubiquitous]: The system SHALL deduplicate the final feature set

### CFG-13: Preset Feature Union [MUST]

AS A developer, I WANT multiple presets to be merged, SO THAT I can combine preset bundles.

> Union behavior enables composable preset combinations.

ACCEPTANCE CRITERIA

- CFG-13_AC-1 [event]: WHEN multiple presets are activated THEN the system SHALL union their features
- CFG-13_AC-2 [ubiquitous]: Duplicate features across presets SHALL appear only once in the result

## Assumptions

- Users understand TOML syntax basics
- Configuration files are UTF-8 encoded
- File system permissions allow reading the configuration file
- Preset names are case-sensitive
- Feature names are case-sensitive
- Preset definitions do not support nesting (presets referencing other presets)

## Constraints

- TOML parsing limited to smol-toml library for consistency with architecture
- No environment variable interpolation in configuration values
- No configuration file inheritance or includes
- Presets must be defined in the same config file that activates them
- No circular preset references
- Feature resolution happens once at startup, not lazily

## Out of Scope

- Environment variable expansion in config values
- Config file creation wizard
- Config file validation command
- Multiple config file merging
- Preset inheritance or composition
- Conditional presets based on environment
- Interactive preset selection
