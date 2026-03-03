# Requirements Specification

## Introduction

This document defines requirements for the awa CLI command-line interface layer, including argument parsing, command structure, help/version display, user interaction via interactive prompts, and the `awa check` command that verifies traceability chain integrity between code markers and spec files.

## Glossary

- FEATURE FLAG: A string identifier enabling conditional template output
- VARIADIC OPTION: A CLI option accepting multiple space-separated values
- MARKER: A code comment annotation like `@awa-impl`, `@awa-test`, or `@awa-component`
- SPEC ID: An identifier in spec files such as requirement IDs, AC IDs, property IDs, or component names
- ORPHANED MARKER: A code marker referencing a spec ID that does not exist
- UNCOVERED AC: An acceptance criterion in a spec with no corresponding `@awa-test` marker in code
- CROSS-REFERENCE: A reference from one spec file to an ID in another (e.g., DESIGN IMPLEMENTS → REQ AC)

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
- CLI-1_AC-3 [ubiquitous]: The system SHALL accept an output directory as the first positional argument: `awa template generate <output>`
- CLI-1_AC-4 [conditional]: IF the user invokes `awa template generate` without an output directory AND no output is specified in config THEN the system SHALL display an error and usage information
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
- CLI-9_AC-2 [event]: WHEN the user invokes `awa template generate --help` THEN the system SHALL display generate command options
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

### CLI-15: All-Targets Option [MUST]

AS A developer, I WANT to process all named targets with a single flag, SO THAT I can generate or diff all config targets at once.

ACCEPTANCE CRITERIA

- CLI-15_AC-1 [ubiquitous]: The system SHALL accept `--all-targets` flag to process all named targets from config
- CLI-15_AC-2 [ubiquitous]: The system SHALL accept `--target <name>` to process a specific named target

### CLI-16: Marker Scanning [MUST]

AS A developer, I WANT the check command to scan source files for traceability markers, SO THAT I know which markers exist in the codebase.

ACCEPTANCE CRITERIA

- CLI-16_AC-1 [ubiquitous]: The system SHALL scan files matching configured code globs for `@awa-impl`, `@awa-test`, and `@awa-component` markers, extracting the marker type and referenced ID
- CLI-16_AC-2 [optional]: IF awa-code skill is active THEN it SHOULD instruct running `awa check` after implementation
- CLI-16_AC-3 [optional]: IF awa-refactor skill is active THEN it SHOULD instruct running `awa check` to confirm markers are preserved

### CLI-17: Spec Parsing [MUST]

AS A developer, I WANT the check command to parse spec files for IDs, SO THAT markers can be matched against real specs.

ACCEPTANCE CRITERIA

- CLI-17_AC-1 [ubiquitous]: The system SHALL parse files matching configured spec globs to extract requirement IDs, AC IDs, property IDs, and component names

### CLI-18: Orphaned Marker Detection [MUST]

AS A developer, I WANT orphaned markers reported as errors, SO THAT I can fix stale references.

ACCEPTANCE CRITERIA

- CLI-18_AC-1 [conditional]: IF a code marker references an ID that does not exist in any parsed spec file THEN the system SHALL report it as an error

DEPENDS ON: CLI-16, CLI-17

### CLI-19: Uncovered AC Detection [MUST]

AS A developer, I WANT uncovered ACs reported, SO THAT I know which criteria lack test coverage.

ACCEPTANCE CRITERIA

- CLI-19_AC-1 [conditional]: IF a spec AC has no `@awa-test` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: CLI-16, CLI-17

### CLI-20: Cross-Reference Validation [MUST]

AS A developer, I WANT broken cross-references between spec files reported, SO THAT spec integrity is maintained.

ACCEPTANCE CRITERIA

- CLI-20_AC-1 [conditional]: IF a DESIGN file IMPLEMENTS or VALIDATES reference does not resolve to a real REQ ID or AC ID THEN the system SHALL report it as an error
- CLI-20_AC-2 [optional]: IF awa-requirements skill is active THEN it SHOULD instruct running `awa check` after updating requirements
- CLI-20_AC-3 [optional]: IF awa-design skill is active THEN it SHOULD instruct running `awa check` after updating design

DEPENDS ON: CLI-17

### CLI-21: ID Format Validation [MUST]

AS A developer, I WANT malformed IDs detected, SO THAT naming conventions are enforced.

ACCEPTANCE CRITERIA

- CLI-21_AC-1 [conditional]: IF a marker references an ID that does not match the configured ID pattern regex THEN the system SHALL report it as an error

### CLI-22: Orphaned Spec Warning [MUST]

AS A developer, I WANT orphaned spec files flagged as warnings, SO THAT I am aware of unused specs without blocking my workflow.

ACCEPTANCE CRITERIA

- CLI-22_AC-1 [conditional]: IF a spec file's CODE prefix is not referenced by any other spec file or code marker THEN the system SHALL report it as a warning

DEPENDS ON: CLI-17

### CLI-23: Exit Code [MUST]

AS A CI system, I WANT deterministic exit codes, SO THAT validation results can gate pipelines.

ACCEPTANCE CRITERIA

- CLI-23_AC-1 [ubiquitous]: The system SHALL exit with code 0 when no errors or warnings are found, exit with code 1 when errors or warnings are found, unless `--allow-warnings` is active

DEPENDS ON: CLI-18, CLI-32

### CLI-24: JSON Output [SHOULD]

AS A CI engineer, I WANT JSON output, SO THAT validation results can be parsed programmatically.

ACCEPTANCE CRITERIA

- CLI-24_AC-1 [conditional]: IF `--json` is specified THEN the system SHALL output results as valid JSON to stdout
- CLI-24_AC-2 [conditional]: IF `--format json` is specified THEN the system SHALL treat it as equivalent to `--json` for backward compatibility
- CLI-24_AC-3 [conditional]: IF both `--json` and `--format` are specified THEN `--json` SHALL take precedence

DEPENDS ON: CLI-18

### CLI-25: Path Exclusion [SHOULD]

AS A developer, I WANT to exclude paths from validation, SO THAT irrelevant files are skipped.

ACCEPTANCE CRITERIA

- CLI-25_AC-1 [conditional]: IF `--ignore` patterns are provided THEN the system SHALL exclude matching paths from scanning

### CLI-26: Configurable Markers [SHOULD]

AS A template author, I WANT configurable marker names, SO THAT custom workflows are supported.

ACCEPTANCE CRITERIA

- CLI-26_AC-1 [conditional]: IF `[check].markers` is set in config THEN the system SHALL use those marker names instead of defaults

DEPENDS ON: CLI-16

### CLI-27: Configurable Spec Globs [SHOULD]

AS A template author, I WANT configurable spec file globs, SO THAT custom project layouts are supported.

ACCEPTANCE CRITERIA

- CLI-27_AC-1 [conditional]: IF `[check].spec-globs` is set in config THEN the system SHALL use those globs instead of defaults

DEPENDS ON: CLI-17

### CLI-28: Configurable Code Globs [SHOULD]

AS A template author, I WANT configurable code file globs, SO THAT custom project layouts are supported.

ACCEPTANCE CRITERIA

- CLI-28_AC-1 [conditional]: IF `[check].code-globs` is set in config THEN the system SHALL use those globs instead of defaults

DEPENDS ON: CLI-16

### CLI-29: Configurable ID Pattern [SHOULD]

AS A template author, I WANT a configurable ID pattern regex, SO THAT custom naming conventions are supported.

ACCEPTANCE CRITERIA

- CLI-29_AC-1 [conditional]: IF `[check].id-pattern` is set in config THEN the system SHALL use that regex for ID format validation instead of the default

DEPENDS ON: CLI-21

### CLI-30: Configurable Cross-Reference Patterns [SHOULD]

AS A template author, I WANT configurable cross-reference keywords, SO THAT custom spec formats are supported.

ACCEPTANCE CRITERIA

- CLI-30_AC-1 [conditional]: IF `[check].cross-ref-patterns` is set in config THEN the system SHALL use those patterns instead of defaults

DEPENDS ON: CLI-20

### CLI-31: Sensible Defaults [SHOULD]

AS A developer using the bundled awa workflow, I WANT all configuration to have sensible defaults, SO THAT `awa check` works out of the box with zero config.

ACCEPTANCE CRITERIA

- CLI-31_AC-1 [ubiquitous]: The system SHALL provide default values for all check configuration that match the bundled awa template workflow

DEPENDS ON: CLI-26, CLI-27, CLI-28, CLI-29, CLI-30

### CLI-32: Allow Warnings Flag [SHOULD]

AS A developer, I WANT an `--allow-warnings` flag, SO THAT I can opt into the previous behavior where warnings do not affect the exit code.

ACCEPTANCE CRITERIA

- CLI-32_AC-1 [conditional]: IF `--allow-warnings` is specified THEN the system SHALL exit with code 0 when only warnings are found
- CLI-32_AC-2 [conditional]: IF `[check].allow-warnings` is set to `true` in config THEN the system SHALL treat it the same as `--allow-warnings`
- CLI-32_AC-3 [ubiquitous]: The system SHALL default `allow-warnings` to `false` (warnings are errors by default)

DEPENDS ON: CLI-23

### CLI-33: Uncovered Component Detection [SHOULD]

AS A developer, I WANT uncovered DESIGN components reported, SO THAT I know which components lack a corresponding `@awa-component` marker in code.

ACCEPTANCE CRITERIA

- CLI-33_AC-1 [conditional]: IF a DESIGN component has no `@awa-component` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: CLI-16, CLI-17

### CLI-34: Unimplemented AC Detection [SHOULD]

AS A developer, I WANT unimplemented ACs reported, SO THAT I know which acceptance criteria lack an `@awa-impl` marker in code.

ACCEPTANCE CRITERIA

- CLI-34_AC-1 [conditional]: IF a spec AC has no `@awa-impl` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: CLI-16, CLI-17

### CLI-35: Uncovered Property Detection [MUST]

AS A developer, I WANT uncovered DESIGN properties reported, SO THAT I know which correctness properties lack test coverage.

ACCEPTANCE CRITERIA

- CLI-35_AC-1 [conditional]: IF a DESIGN property has no `@awa-test` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: CLI-16, CLI-17

### CLI-36: Unlinked AC Detection [MUST]

AS A developer, I WANT REQ ACs not claimed by any DESIGN IMPLEMENTS reported, SO THAT I know which acceptance criteria lack a design component.

ACCEPTANCE CRITERIA

- CLI-36_AC-1 [conditional]: IF a REQ AC is not referenced by any DESIGN IMPLEMENTS line THEN the system SHALL report it as an error

DEPENDS ON: CLI-17

### CLI-37: IMPLEMENTS vs @awa-impl Consistency [MUST]

AS A developer, I WANT inconsistencies between DESIGN IMPLEMENTS lists and code @awa-impl markers reported, SO THAT coverage inflation is caught.

ACCEPTANCE CRITERIA

- CLI-37_AC-1 [conditional]: IF a component's @awa-impl markers in code do not match its DESIGN IMPLEMENTS list THEN the system SHALL report each mismatch as a warning

DEPENDS ON: CLI-16, CLI-17

### CLI-38: Matrix Generation [MUST]

AS A developer, I WANT the check command to regenerate Requirements Traceability sections in DESIGN and TASK files by default, SO THAT traceability matrices stay in sync with IMPLEMENTS/VALIDATES/TESTS lines.

ACCEPTANCE CRITERIA

- CLI-38_AC-1 [conditional]: UNLESS `--no-fix` is specified THEN the system SHALL regenerate the Requirements Traceability section in each DESIGN file by inverting component IMPLEMENTS and property VALIDATES lines
- CLI-38_AC-2 [conditional]: UNLESS `--no-fix` is specified THEN the system SHALL regenerate the Requirements Traceability section in each TASK file by inverting task IMPLEMENTS and TESTS lines

DEPENDS ON: CLI-17

### CLI-39: Summary Output [SHOULD]

AS A CI engineer, I WANT a compact one-line summary, SO THAT pipeline logs are concise.

ACCEPTANCE CRITERIA

- CLI-39_AC-1 [conditional]: IF `--summary` is specified THEN the system SHALL output a single line with error and warning counts and suppress interactive output

### CLI-40: Feature Codes Table Generation [MUST]

AS A developer, I WANT the check command to regenerate the Feature Codes table in ARCHITECTURE.md from spec data, SO THAT the table stays in sync as features are added or removed.

ACCEPTANCE CRITERIA

- CLI-40_AC-1 [conditional]: UNLESS `--no-fix` is specified THEN the system SHALL regenerate the Feature Codes table in ARCHITECTURE.md using codes discovered from REQ files and scope text from the FEAT/REQ/DESIGN fallback chain
- CLI-40_AC-2 [state]: WHEN a code has no discoverable scope text THEN the system SHALL warn with the code identifier

DEPENDS ON: CLI-17

## Assumptions

- Users have Node.js 24 or later installed
- Users invoke the CLI from a terminal environment
- The CLI is installed globally or via npx
- Spec files are Markdown with identifiable patterns for IDs
- Code files contain markers in comments

## Constraints

- CLI framework limited to commander for consistency with architecture
- Interactive prompts limited to @clack/prompts for consistency with architecture
- Must run in CI environments (no interactive prompts for check)
- Must handle large codebases efficiently (respect ignore patterns)
- Warnings affect exit code by default; use `--allow-warnings` to suppress

## Out of Scope

- GUI interface
- Watch mode for continuous regeneration
- Remote execution or server mode
- Automatic marker insertion or repair
- Git integration (blame, history)
- Runtime validation of marker correctness
