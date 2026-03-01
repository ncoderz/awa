# Requirements Specification

## Introduction

This document defines requirements for the awa CLI command-line interface layer, including argument parsing, command structure, help/version display, and user interaction via interactive prompts.

## Glossary

- FEATURE FLAG: A string identifier enabling conditional template output
- VARIADIC OPTION: A CLI option accepting multiple space-separated values

## Stakeholders

- DEVELOPER: Engineers using awa CLI to generate agent configuration files
- MAINTAINER: Engineers maintaining and extending awa CLI

## Requirements

### CLI-1: Command Structure [MUST]

AS A developer, I WANT a clear command structure, SO THAT I can easily invoke generation.

> The CLI provides a single primary command for template generation with output directory as positional argument.

ACCEPTANCE CRITERIA

- CLI-1_AC-1 [ubiquitous]: The system SHALL provide a `generate` command as the primary entry point
- CLI-1_AC-2 [event]: WHEN the user invokes `awa` without a command THEN the system SHALL display help information
- CLI-1_AC-3 [ubiquitous]: The system SHALL accept an output directory as the first positional argument: `awa generate <output>`
- CLI-1_AC-4 [conditional]: IF the user invokes `awa generate` without an output directory AND no output is specified in config THEN the system SHALL display an error and usage information
- CLI-1_AC-5 [ubiquitous]: The help output SHALL display the positional argument syntax in the usage line

### CLI-2: Output Directory Argument [MUST]

AS A developer, I WANT to specify an output directory, SO THAT generated files go where I need them.

> Controls where generated files are written. Positional argument that can be provided via CLI or config file.

ACCEPTANCE CRITERIA

- CLI-2_AC-1 [ubiquitous]: The system SHALL accept an output directory as an optional positional argument
- CLI-2_AC-2 [state]: WHEN output is provided as positional argument THEN the system SHALL use it regardless of config file value
- CLI-2_AC-3 [state]: WHEN output is not provided as positional argument THEN the system SHALL use the value from config file
- CLI-2_AC-4 [state]: WHEN output is not provided via CLI or config THEN the system SHALL display an error
- CLI-2_AC-5 [ubiquitous]: The system SHALL accept both relative and absolute paths for the output directory
- CLI-2_AC-6 [ubiquitous]: The system SHALL accept `.` to specify the current working directory

### CLI-3: Template Source Option [MUST]

AS A developer, I WANT to specify a template source, SO THAT I can use custom templates.

> Controls where templates are loaded from.

ACCEPTANCE CRITERIA

- CLI-3_AC-1 [ubiquitous]: The system SHALL accept `--template <source>` to specify the template source
- CLI-3_AC-2 [state]: WHEN `--template` is not provided THEN the system SHALL use bundled default templates
- CLI-3_AC-3 [ubiquitous]: The system SHALL accept local paths, Git shorthand, and full Git URLs as template sources

### CLI-4: Feature Flags Option [MUST]

AS A developer, I WANT to pass feature flags, SO THAT templates can conditionally include content.

> Enables conditional template rendering based on feature selection.

ACCEPTANCE CRITERIA

- CLI-4_AC-1 [ubiquitous]: The system SHALL accept `--features <flag>...` as a variadic option
- CLI-4_AC-2 [event]: WHEN multiple features are provided THEN the system SHALL collect all values into an array
- CLI-4_AC-3 [state]: WHEN `--features` is not provided THEN the system SHALL use an empty array as default

### CLI-5: Force Overwrite Option [MUST]

AS A developer, I WANT to force overwrite existing files, SO THAT I can regenerate without prompts.

> Bypasses conflict resolution prompts for automation scenarios.

ACCEPTANCE CRITERIA

- CLI-5_AC-1 [ubiquitous]: The system SHALL accept `--force` flag to enable automatic overwriting
- CLI-5_AC-2 [conditional]: IF `--force` is provided THEN the system SHALL overwrite existing files without prompting
- CLI-5_AC-3 [state]: WHEN `--force` is not provided THEN the system SHALL prompt for each file conflict

### CLI-6: Dry Run Option [MUST]

AS A developer, I WANT a dry-run mode, SO THAT I can preview what would be generated without making changes.

> Enables safe preview of generation without file system modifications.

ACCEPTANCE CRITERIA

- CLI-6_AC-1 [ubiquitous]: The system SHALL accept `--dry-run` flag to enable simulation mode
- CLI-6_AC-2 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT write any files to disk
- CLI-6_AC-3 [conditional]: IF `--dry-run` is provided THEN the system SHALL display what files would be created, skipped, or overwritten

### CLI-7: Configuration File Option [MUST]

AS A developer, I WANT to specify an alternate config file, SO THAT I can use project-specific configurations.

> Allows override of default configuration file location.

ACCEPTANCE CRITERIA

- CLI-7_AC-1 [ubiquitous]: The system SHALL accept `--config <path>` to specify an alternate configuration file
- CLI-7_AC-2 [state]: WHEN `--config` is not provided THEN the system SHALL look for `.awa.toml` in the current directory

### CLI-8: Template Refresh Option [MUST]

AS A developer, I WANT to refresh cached templates, SO THAT I can get the latest version from remote sources.

> Forces re-fetch of cached Git templates.

ACCEPTANCE CRITERIA

- CLI-8_AC-1 [ubiquitous]: The system SHALL accept `--refresh` flag to force re-fetch of cached templates
- CLI-8_AC-2 [conditional]: IF `--refresh` is provided AND template source is a Git repository THEN the system SHALL re-fetch the template regardless of cache state

### CLI-9: Help Display [MUST]

AS A developer, I WANT to view help information, SO THAT I understand available options.

> Provides usage documentation within the CLI.

ACCEPTANCE CRITERIA

- CLI-9_AC-1 [event]: WHEN the user invokes `awa --help` or `awa -h` THEN the system SHALL display usage information
- CLI-9_AC-2 [event]: WHEN the user invokes `awa generate --help` THEN the system SHALL display generate command options
- CLI-9_AC-3 [ubiquitous]: The help output SHALL list all available options with descriptions

### CLI-10: Version Display [MUST]

AS A developer, I WANT to view the version, SO THAT I can verify which version is installed.

> Provides version identification for debugging and compatibility.

ACCEPTANCE CRITERIA

- CLI-10_AC-1 [event]: WHEN the user invokes `awa --version` or `awa -v` THEN the system SHALL display the version number
- CLI-10_AC-2 [ubiquitous]: The version output SHALL match the version in package.json

### CLI-11: Input Validation [MUST]

AS A developer, I WANT clear error messages for invalid input, SO THAT I can correct mistakes quickly.

> Ensures user receives actionable feedback for invalid arguments.

ACCEPTANCE CRITERIA

- CLI-11_AC-1 [event]: WHEN an unknown option is provided THEN the system SHALL display an error with the unknown option name
- CLI-11_AC-2 [event]: WHEN a required option value is missing THEN the system SHALL display an error indicating the missing value
- CLI-11_AC-3 [event]: WHEN validation fails THEN the system SHALL exit with a non-zero exit code

### CLI-12: Delete Enable Option [MUST]

AS A developer, I WANT to opt-in to file deletions, SO THAT stale files from previous template versions are cleaned up only when I explicitly request it.

> Prevents accidental data loss from delete list processing.

ACCEPTANCE CRITERIA

- CLI-12_AC-1 [ubiquitous]: The system SHALL accept `--delete` flag to enable deletion of files listed in the delete list
- CLI-12_AC-2 [conditional]: IF `--delete` is not provided THEN the system SHALL warn about files eligible for deletion without deleting them
- CLI-12_AC-3 [conditional]: IF `--delete` is provided THEN the system SHALL proceed with delete list processing

### CLI-13: Preset Option [MUST]

AS A developer, I WANT to activate feature presets from the command line, SO THAT I can select feature bundles at runtime.

> CLI activation enables flexible preset selection per invocation.

ACCEPTANCE CRITERIA

- CLI-13_AC-1 [ubiquitous]: The system SHALL accept `--preset <name...>` as a variadic option
- CLI-13_AC-2 [event]: WHEN multiple `--preset` options are provided THEN the system SHALL collect all values

### CLI-14: Remove Features Option [MUST]

AS A developer, I WANT to remove specific features from the command line, SO THAT I can exclude unwanted features without modifying config.

> Feature removal provides fine-grained control over the final feature set.

ACCEPTANCE CRITERIA

- CLI-14_AC-1 [ubiquitous]: The system SHALL accept `--remove-features <flag...>` as a variadic option
- CLI-14_AC-2 [event]: WHEN multiple `--remove-features` options are provided THEN the system SHALL collect all values

## Assumptions

- Users have Node.js 24 or later installed
- Users invoke the CLI from a terminal environment
- The CLI is installed globally or via npx

## Constraints

- CLI framework limited to commander for consistency with architecture
- Interactive prompts limited to @clack/prompts for consistency with architecture

## Out of Scope

- GUI interface
- Watch mode for continuous regeneration
- Remote execution or server mode

## Change Log

- 1.0.0 (2025-12-11): Initial requirements based on architecture
- 1.1.0 (2026-02-24): Added CLI-12 (`--delete`), CLI-13 (`--preset`), CLI-14 (`--remove-features`)
