# Requirements Specification

## Introduction

Requirements for the `awa features` command that discovers feature flags available in a template set.

## Glossary

- FEATURE FLAG: A string identifier found inside `it.features.includes('name')` or `it.features.indexOf('name')` in template files
- SCAN RESULT: The aggregated output containing discovered flags, their referencing files, and total files scanned
- PRESET: A named bundle of feature flags defined in the user's `.awa.toml` config

## Requirements

### DISC-1: Template File Scanning [MUST]

AS A developer, I WANT the features command to scan all template files recursively, SO THAT no feature flags are missed.

ACCEPTANCE CRITERIA

- [x] DISC-1_AC-1 [ubiquitous]: The system SHALL recursively walk all files in the resolved template directory and read their content for feature flag extraction

### DISC-2: Feature Flag Extraction [MUST]

AS A developer, I WANT the features command to extract flag names from template conditionals, SO THAT I know which flags the template supports.

ACCEPTANCE CRITERIA

- [x] DISC-2_AC-1 [ubiquitous]: The system SHALL extract flag names from `it.features.includes('...')`, `it.features.includes("...")`, `it.features.indexOf('...')`, and `it.features.indexOf("...")` patterns

### DISC-3: Feature-to-File Aggregation [MUST]

AS A developer, I WANT each flag listed with the files that reference it, SO THAT I understand the scope of each flag.

ACCEPTANCE CRITERIA

- [x] DISC-3_AC-1 [ubiquitous]: The system SHALL aggregate discovered flags by name, listing all files that reference each flag, sorted alphabetically by flag name

### DISC-4: Template Source Resolution [MUST]

AS A developer, I WANT the features command to work with local and remote template sources, SO THAT I can inspect any template.

ACCEPTANCE CRITERIA

- [x] DISC-4_AC-1 [ubiquitous]: The system SHALL resolve the template source using the same template resolver as the generate and diff commands, supporting local paths, Git repositories, and config defaults

### DISC-5: Configuration Integration [MUST]

AS A developer, I WANT the features command to use the same configuration loading as other commands, SO THAT defaults from `.awa.toml` are respected.

ACCEPTANCE CRITERIA

- [x] DISC-5_AC-1 [ubiquitous]: The system SHALL load configuration via the config loader, using the template and refresh settings from config when not overridden by CLI options

### DISC-6: JSON Output [SHOULD]

AS A CI engineer, I WANT JSON output, SO THAT feature discovery results can be parsed programmatically.

ACCEPTANCE CRITERIA

- [x] DISC-6_AC-1 [conditional]: IF `--json` is specified THEN the system SHALL output results as valid JSON to stdout containing the features array and files scanned count

### DISC-7: Preset Display [SHOULD]

AS A developer, I WANT presets from `.awa.toml` shown alongside discovered flags, SO THAT I understand how presets map to flags.

ACCEPTANCE CRITERIA

- [x] DISC-7_AC-1 [conditional]: IF preset definitions exist in the loaded config THEN the system SHALL include them in the output

## Assumptions

- Template files contain feature flag references as `it.features.includes(...)` or `it.features.indexOf(...)` patterns
- Binary files that cannot be read as UTF-8 are silently skipped

## Constraints

- Must reuse existing template resolver — no separate template resolution logic

## Out of Scope

- Detecting feature flags in complex Eta expressions beyond includes/indexOf
- Validating that discovered flags are actually reachable from top-level templates

## Change Log

- 1.0.0 (2026-02-28): Initial requirements
