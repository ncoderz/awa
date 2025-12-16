# Requirements Specification

## Introduction

This document defines requirements for the Zen CLI `diff` command, which compares generated template output against an existing target directory to identify differences without modifying files. This enables validation workflows, CI checks, and template development iteration. The command accepts a target directory as an optional positional argument: `zen diff [target]`, which can also be specified via the `output` field in the configuration file.

## Glossary

- TARGET DIRECTORY: The existing directory containing files to compare against generated output
- UNIFIED DIFF: A standardized diff format showing context lines around changes, commonly used by Git
- TEMP DIRECTORY: An OS-provided temporary directory for intermediate file generation

## Stakeholders

- DEVELOPER: Engineers using `zen diff` to validate generated output matches expectations
- CI SYSTEM: Automated pipelines using exit codes to detect template drift

## Requirements

### DIFF-1: Temp Directory Generation [MUST]

AS A developer, I WANT templates generated to a temporary directory, SO THAT the target directory is never modified during comparison.

> The diff command must be read-only with respect to the target directory.

ACCEPTANCE CRITERIA

- [ ] DIFF-1_AC-1 [event]: WHEN `zen diff` is invoked THEN the system SHALL create a temporary directory using Node.js `os.tmpdir()`
- [ ] DIFF-1_AC-2 [ubiquitous]: The system SHALL generate all templates into the temporary directory before comparison
- [ ] DIFF-1_AC-3 [ubiquitous]: The system SHALL NOT write any files to the target directory during diff operations

### DIFF-2: File Comparison [MUST]

AS A developer, I WANT exact byte-for-byte comparison, SO THAT whitespace and formatting differences are detected.

> Markdown and YAML files are whitespace-sensitive; exact comparison ensures fidelity.

ACCEPTANCE CRITERIA

- [ ] DIFF-2_AC-1 [ubiquitous]: The system SHALL compare files using exact byte-for-byte comparison
- [ ] DIFF-2_AC-2 [ubiquitous]: The system SHALL use the `diff` npm package for cross-platform unified diff generation
- [ ] DIFF-2_AC-3 [conditional]: IF files are identical THEN the system SHALL count them as matching
- [ ] DIFF-2_AC-4 [conditional]: IF text files differ THEN the system SHALL compute a unified diff and display it to the console
- [ ] DIFF-2_AC-5 [conditional]: IF binary files differ THEN the system SHALL display "binary files differ" without diff content

### DIFF-3: Missing File Detection [MUST]

AS A developer, I WANT to see newly generated files, and optionally target-only files, SO THAT I can identify template additions and unknown files when requested.

> Default behaviour reports only generated files; target-only files are opt-in via a flag.

ACCEPTANCE CRITERIA

- [ ] DIFF-3_AC-1 [conditional]: IF a generated file has no corresponding target file THEN the system SHALL report it as "new file"
- [ ] DIFF-3_AC-2 [conditional]: IF the `--list-unknown` flag is provided AND a target file has no corresponding generated file THEN the system SHALL report it as "extra file in target"
- [ ] DIFF-3_AC-3 [conditional]: IF the `--list-unknown` flag is NOT provided THEN the system SHALL ignore target-only files in diff results and summary
- [ ] DIFF-3_AC-4 [ubiquitous]: The system SHALL include missing file information in the diff output according to the flag behaviour

### DIFF-4: Diff Output Format [MUST]

AS A developer, I WANT git-style unified diff output with color, SO THAT differences are easy to read and understand.

> Consistent with developer expectations from Git tooling.

ACCEPTANCE CRITERIA

- [ ] DIFF-4_AC-1 [ubiquitous]: The system SHALL produce unified diff format output for each differing file
- [ ] DIFF-4_AC-2 [ubiquitous]: The diff output SHALL use git-style formatting with file headers
- [ ] DIFF-4_AC-3 [conditional]: IF the terminal supports color THEN the system SHALL colorize diff output — additions green, deletions red
- [ ] DIFF-4_AC-4 [event]: WHEN all files match THEN the system SHALL display a success message indicating no differences
- [ ] DIFF-4_AC-5 [ubiquitous]: The system SHALL display a summary line with file count and difference count — e.g., "3 files compared, 0 differences"

### DIFF-5: Exit Codes [MUST]

AS A CI system, I WANT predictable exit codes, SO THAT I can automate template drift detection in pipelines.

> Enables scriptable automation and CI integration.

ACCEPTANCE CRITERIA

- [ ] DIFF-5_AC-1 [event]: WHEN all files match THEN the system SHALL exit with code 0
- [ ] DIFF-5_AC-2 [event]: WHEN any differences are found THEN the system SHALL exit with code 1
- [ ] DIFF-5_AC-3 [event]: WHEN an error occurs THEN the system SHALL exit with code 2

### DIFF-6: Temp Directory Cleanup [MUST]

AS A developer, I WANT the temp directory cleaned up automatically, SO THAT disk space is not consumed by orphaned files.

> Prevents accumulation of temporary files over time.

ACCEPTANCE CRITERIA

- [ ] DIFF-6_AC-1 [event]: WHEN diff completes successfully THEN the system SHALL delete the temporary directory
- [ ] DIFF-6_AC-2 [event]: WHEN diff encounters an error THEN the system SHALL still delete the temporary directory
- [ ] DIFF-6_AC-3 [ubiquitous]: The system SHALL use try/finally or equivalent to ensure cleanup occurs

### DIFF-7: CLI Options [MUST]

AS A developer, I WANT `diff` to share options with `generate`, SO THAT I can use the same configuration for both commands.

> Reduces cognitive load and ensures consistent behavior.

ACCEPTANCE CRITERIA

- [ ] DIFF-7_AC-1 [ubiquitous]: The system SHALL accept a target directory as an optional positional argument
- [ ] DIFF-7_AC-2 [state]: WHEN target is provided as positional argument THEN the system SHALL use it regardless of config file value
- [ ] DIFF-7_AC-3 [state]: WHEN target is not provided as positional argument THEN the system SHALL use the output value from config file
- [ ] DIFF-7_AC-4 [state]: WHEN target is not provided via CLI or config THEN the system SHALL display an error
- [ ] DIFF-7_AC-5 [ubiquitous]: The system SHALL accept both relative and absolute paths for the target directory
- [ ] DIFF-7_AC-6 [ubiquitous]: The system SHALL accept `--template <source>` to specify the template source
- [ ] DIFF-7_AC-7 [ubiquitous]: The system SHALL accept `--features <flag>...` as a variadic option
- [ ] DIFF-7_AC-8 [ubiquitous]: The system SHALL accept `--config <path>` to specify an alternate configuration file
- [ ] DIFF-7_AC-9 [ubiquitous]: The system SHALL accept `--refresh` flag to force re-fetch of cached templates
- [ ] DIFF-7_AC-10 [ubiquitous]: The system SHALL NOT accept `--force` or `--dry-run` flags — they are not applicable to diff
- [ ] DIFF-7_AC-11 [ubiquitous]: The system SHALL accept `--list-unknown` to include target-only files in diff results

DEPENDS ON: CLI-2, CLI-3, CLI-4, CLI-7, CLI-8

## Assumptions

- The `diff` npm package is installed and available
- Target directory exists and is readable
- Templates render deterministically (same input produces same output)

## Constraints

- Uses `diff` npm package for cross-platform unified diff generation (not shell diff command)
- Uses Node.js `os.tmpdir()` for cross-platform temp directory location
- Read-only operation — target directory is never modified

## Out of Scope

- Interactive diff resolution or patching
- Side-by-side diff format
- Binary file diff visualization (only reports as different)
- Ignoring specific files or patterns

## Change Log

- 1.2.0 (2025-12-16): Added `--list-unknown` flag and made target-only file reporting opt-in
- 1.1.0 (2025-12-14): Updated DIFF-7 to make target directory optional (can come from CLI or config)
- 1.0.0 (2025-12-11): Initial requirements based on architecture
