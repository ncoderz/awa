# Requirements Specification

## Introduction

This document defines requirements for the Zen CLI command-line interface layer, including argument parsing, command structure, help/version display, and user interaction via interactive prompts.

## Glossary

- FEATURE FLAG: A string identifier enabling conditional template output
- VARIADIC OPTION: A CLI option accepting multiple space-separated values

## Stakeholders

- DEVELOPER: Engineers using Zen CLI to generate agent configuration files
- MAINTAINER: Engineers maintaining and extending Zen CLI

## Requirements

### CLI-1: Command Structure [MUST]

AS A developer, I WANT a clear command structure, SO THAT I can easily invoke generation.

> The CLI provides a single primary command for template generation.

ACCEPTANCE CRITERIA

- [ ] AC-1.1 [ubiquitous]: The system SHALL provide a `generate` command as the primary entry point
- [ ] AC-1.2 [event]: WHEN the user invokes `zen` without a command THEN the system SHALL display help information
- [ ] AC-1.3 [event]: WHEN the user invokes `zen generate` THEN the system SHALL execute the generation workflow

### CLI-2: Output Directory Option [MUST]

AS A developer, I WANT to specify an output directory, SO THAT generated files go where I need them.

> Controls where generated files are written.

ACCEPTANCE CRITERIA

- [ ] AC-2.1 [ubiquitous]: The system SHALL accept `--output <path>` to specify the output directory
- [ ] AC-2.2 [state]: WHEN `--output` is not provided THEN the system SHALL use the current working directory as default
- [ ] AC-2.3 [ubiquitous]: The system SHALL accept both relative and absolute paths for `--output`

### CLI-3: Template Source Option [MUST]

AS A developer, I WANT to specify a template source, SO THAT I can use custom templates.

> Controls where templates are loaded from.

ACCEPTANCE CRITERIA

- [ ] AC-3.1 [ubiquitous]: The system SHALL accept `--template <source>` to specify the template source
- [ ] AC-3.2 [state]: WHEN `--template` is not provided THEN the system SHALL use bundled default templates
- [ ] AC-3.3 [ubiquitous]: The system SHALL accept local paths, Git shorthand, and full Git URLs as template sources

### CLI-4: Feature Flags Option [MUST]

AS A developer, I WANT to pass feature flags, SO THAT templates can conditionally include content.

> Enables conditional template rendering based on feature selection.

ACCEPTANCE CRITERIA

- [ ] AC-4.1 [ubiquitous]: The system SHALL accept `--features <flag>...` as a variadic option
- [ ] AC-4.2 [event]: WHEN multiple features are provided THEN the system SHALL collect all values into an array
- [ ] AC-4.3 [state]: WHEN `--features` is not provided THEN the system SHALL use an empty array as default

### CLI-5: Force Overwrite Option [MUST]

AS A developer, I WANT to force overwrite existing files, SO THAT I can regenerate without prompts.

> Bypasses conflict resolution prompts for automation scenarios.

ACCEPTANCE CRITERIA

- [ ] AC-5.1 [ubiquitous]: The system SHALL accept `--force` flag to enable automatic overwriting
- [ ] AC-5.2 [conditional]: IF `--force` is provided THEN the system SHALL overwrite existing files without prompting
- [ ] AC-5.3 [state]: WHEN `--force` is not provided THEN the system SHALL prompt for each file conflict

### CLI-6: Dry Run Option [MUST]

AS A developer, I WANT a dry-run mode, SO THAT I can preview what would be generated without making changes.

> Enables safe preview of generation without file system modifications.

ACCEPTANCE CRITERIA

- [ ] AC-6.1 [ubiquitous]: The system SHALL accept `--dry-run` flag to enable simulation mode
- [ ] AC-6.2 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT write any files to disk
- [ ] AC-6.3 [conditional]: IF `--dry-run` is provided THEN the system SHALL display what files would be created, skipped, or overwritten

### CLI-7: Configuration File Option [MUST]

AS A developer, I WANT to specify an alternate config file, SO THAT I can use project-specific configurations.

> Allows override of default configuration file location.

ACCEPTANCE CRITERIA

- [ ] AC-7.1 [ubiquitous]: The system SHALL accept `--config <path>` to specify an alternate configuration file
- [ ] AC-7.2 [state]: WHEN `--config` is not provided THEN the system SHALL look for `.zen.toml` in the current directory

### CLI-8: Template Refresh Option [MUST]

AS A developer, I WANT to refresh cached templates, SO THAT I can get the latest version from remote sources.

> Forces re-fetch of cached Git templates.

ACCEPTANCE CRITERIA

- [ ] AC-8.1 [ubiquitous]: The system SHALL accept `--refresh` flag to force re-fetch of cached templates
- [ ] AC-8.2 [conditional]: IF `--refresh` is provided AND template source is a Git repository THEN the system SHALL re-fetch the template regardless of cache state

### CLI-9: Help Display [MUST]

AS A developer, I WANT to view help information, SO THAT I understand available options.

> Provides usage documentation within the CLI.

ACCEPTANCE CRITERIA

- [ ] AC-9.1 [event]: WHEN the user invokes `zen --help` or `zen -h` THEN the system SHALL display usage information
- [ ] AC-9.2 [event]: WHEN the user invokes `zen generate --help` THEN the system SHALL display generate command options
- [ ] AC-9.3 [ubiquitous]: The help output SHALL list all available options with descriptions

### CLI-10: Version Display [MUST]

AS A developer, I WANT to view the version, SO THAT I can verify which version is installed.

> Provides version identification for debugging and compatibility.

ACCEPTANCE CRITERIA

- [ ] AC-10.1 [event]: WHEN the user invokes `zen --version` or `zen -v` THEN the system SHALL display the version number
- [ ] AC-10.2 [ubiquitous]: The version output SHALL match the version in package.json

### CLI-11: Input Validation [MUST]

AS A developer, I WANT clear error messages for invalid input, SO THAT I can correct mistakes quickly.

> Ensures user receives actionable feedback for invalid arguments.

ACCEPTANCE CRITERIA

- [ ] AC-11.1 [event]: WHEN an unknown option is provided THEN the system SHALL display an error with the unknown option name
- [ ] AC-11.2 [event]: WHEN a required option value is missing THEN the system SHALL display an error indicating the missing value
- [ ] AC-11.3 [event]: WHEN validation fails THEN the system SHALL exit with a non-zero exit code

## Assumptions

- Users have Node.js 24 or later installed
- Users invoke the CLI from a terminal environment
- The CLI is installed globally or via npx

## Constraints

- CLI framework limited to citty for consistency with architecture
- Interactive prompts limited to @clack/prompts for consistency with architecture

## Out of Scope

- GUI interface
- Watch mode for continuous regeneration
- Remote execution or server mode

## Change Log

- 1.0.0 (2025-12-11): Initial requirements based on architecture
