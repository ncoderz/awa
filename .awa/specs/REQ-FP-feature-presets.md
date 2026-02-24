# Requirements Specification

## Introduction

This document defines requirements for feature presets and feature removal functionality in awa CLI. Presets allow users to define named bundles of features in the configuration file that can be activated via CLI or config. The remove-features option enables subtracting features from the final computed set.

## Glossary

- PRESET: A named collection of feature flags defined in the configuration file
- FEATURE RESOLUTION: The process of computing the final features array from base features, presets, and removals
- BASE FEATURES: Features specified via `--features` CLI option or `features` config option

## Stakeholders

- DEVELOPER: Engineers using awa CLI who want reusable feature combinations
- TEAM LEAD: Engineers establishing team-wide preset configurations

## Requirements

### FP-1: Preset Definition in Config [MUST]

AS A developer, I WANT to define named feature presets in my config file, SO THAT I can reuse common feature combinations.

> Presets reduce repetition and enable team-standardized feature bundles.

ACCEPTANCE CRITERIA

- [ ] FP-1_AC-1 [ubiquitous]: The configuration file SHALL support a `[presets]` TOML table
- [ ] FP-1_AC-2 [ubiquitous]: Each key in the `[presets]` table SHALL map to an array of feature strings
- [ ] FP-1_AC-3 [event]: WHEN a preset value is not an array of strings THEN the system SHALL display a type error and exit
- [ ] FP-1_AC-4 [conditional]: IF the `[presets]` table is absent THEN the system SHALL continue without error

### FP-2: Preset CLI Option [MUST]

AS A developer, I WANT to activate presets from the command line, SO THAT I can select feature bundles at runtime.

> CLI activation enables flexible preset selection per invocation.

ACCEPTANCE CRITERIA

- [ ] FP-2_AC-1 [ubiquitous]: The system SHALL accept `--preset <name>` as a CLI option
- [ ] FP-2_AC-2 [event]: WHEN multiple `--preset` options are provided THEN the system SHALL collect all values
- [ ] FP-2_AC-3 [event]: WHEN a preset name does not exist in config THEN the system SHALL display an error and exit
- [ ] FP-2_AC-4 [conditional]: IF `--preset` is not provided THEN the system SHALL use an empty preset list as default

### FP-3: Preset Config Option [MUST]

AS A developer, I WANT to specify default presets in my config file, SO THAT I don't need to pass `--preset` every time.

> Config-based presets enable persistent preset activation.

ACCEPTANCE CRITERIA

- [ ] FP-3_AC-1 [ubiquitous]: The configuration file SHALL support `preset` as an array of strings
- [ ] FP-3_AC-2 [conditional]: IF CLI `--preset` is provided THEN it SHALL replace the config `preset` value
- [ ] FP-3_AC-3 [conditional]: IF neither CLI nor config specifies presets THEN the system SHALL use an empty array

### FP-4: Remove Features CLI Option [MUST]

AS A developer, I WANT to remove specific features from the final set, SO THAT I can exclude unwanted features without modifying presets.

> Feature removal provides fine-grained control over the final feature set.

ACCEPTANCE CRITERIA

- [ ] FP-4_AC-1 [ubiquitous]: The system SHALL accept `--remove-features <feature>` as a CLI option
- [ ] FP-4_AC-2 [event]: WHEN multiple `--remove-features` options are provided THEN the system SHALL collect all values
- [ ] FP-4_AC-3 [ubiquitous]: The system SHALL support comma-separated values in a single `--remove-features` option
- [ ] FP-4_AC-4 [conditional]: IF a removed feature does not exist in the feature set THEN the system SHALL silently ignore it
- [ ] FP-4_AC-5 [conditional]: IF `--remove-features` is not provided THEN the system SHALL use an empty removal list

### FP-5: Remove Features Config Option [MUST]

AS A developer, I WANT to specify removed features in my config file, SO THAT I can persistently exclude features.

> Config-based removal enables persistent feature exclusion.

ACCEPTANCE CRITERIA

- [ ] FP-5_AC-1 [ubiquitous]: The configuration file SHALL support `remove-features` as an array of strings
- [ ] FP-5_AC-2 [conditional]: IF CLI `--remove-features` is provided THEN it SHALL replace the config `remove-features` value
- [ ] FP-5_AC-3 [conditional]: IF neither CLI nor config specifies removals THEN the system SHALL use an empty array

### FP-6: Feature Resolution Order [MUST]

AS A developer, I WANT a predictable feature resolution order, SO THAT I can reason about the final feature set.

> Deterministic resolution ensures predictable template output.

ACCEPTANCE CRITERIA

- [ ] FP-6_AC-1 [ubiquitous]: The system SHALL compute base features as CLI `--features` if provided, else config `features`, else empty array
- [ ] FP-6_AC-2 [ubiquitous]: The system SHALL compute preset features as the union of all features from activated presets
- [ ] FP-6_AC-3 [ubiquitous]: The system SHALL compute the combined set as the union of base features and preset features
- [ ] FP-6_AC-4 [ubiquitous]: The system SHALL compute the final features by removing all `remove-features` from the combined set
- [ ] FP-6_AC-5 [ubiquitous]: The system SHALL deduplicate the final feature set

### FP-7: Preset Feature Union [MUST]

AS A developer, I WANT multiple presets to be merged, SO THAT I can combine preset bundles.

> Union behavior enables composable preset combinations.

ACCEPTANCE CRITERIA

- [ ] FP-7_AC-1 [event]: WHEN multiple presets are activated THEN the system SHALL union their features
- [ ] FP-7_AC-2 [ubiquitous]: Duplicate features across presets SHALL appear only once in the result

## Assumptions

- Preset names are case-sensitive
- Feature names are case-sensitive
- Preset definitions do not support nesting (presets referencing other presets)

## Constraints

- Presets must be defined in the same config file that activates them
- No circular preset references (presets cannot reference other presets)
- Feature resolution happens once at startup, not lazily

## Out of Scope

- Preset inheritance or composition (preset referencing another preset)
- Conditional presets based on environment
- Preset discovery from multiple config files
- Interactive preset selection

## Change Log

- 1.0.0 (2025-12-12): Initial requirements for feature presets and remove-features
