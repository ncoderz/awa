# Diff Command Requirements

> VERSION: 1.0.0 | STATUS: draft | UPDATED: 2025-12-11

## Introduction

This document defines requirements for the Zen CLI `diff` command, which compares generated template output against an existing target directory to identify differences without modifying files. This enables validation workflows, CI checks, and template development iteration.

## Glossary

- **Target Directory**: The existing directory containing files to compare against generated output
- **Unified Diff**: A standardized diff format showing context lines around changes, commonly used by Git
- **Temp Directory**: An OS-provided temporary directory for intermediate file generation

## Stakeholders

- DEVELOPER: Engineers using `zen diff` to validate generated output matches expectations
- CI SYSTEM: Automated pipelines using exit codes to detect template drift

## Requirements

### DIFF-1: Temp Directory Generation [MUST] (proposed)

AS A developer, I WANT templates generated to a temporary directory, SO THAT the target directory is never modified during comparison.

> The diff command must be read-only with respect to the target directory.

ACCEPTANCE CRITERIA

- AC-1.1 [event]: WHEN `zen diff` is invoked THEN the system SHALL create a temporary directory using Node.js `os.tmpdir()`
- AC-1.2 [ubiquitous]: The system SHALL generate all templates into the temporary directory before comparison
- AC-1.3 [ubiquitous]: The system SHALL NOT write any files to the target directory during diff operations

### DIFF-2: File Comparison [MUST] (proposed)

AS A developer, I WANT exact byte-for-byte comparison, SO THAT whitespace and formatting differences are detected.

> Markdown and YAML files are whitespace-sensitive; exact comparison ensures fidelity.

ACCEPTANCE CRITERIA

- AC-2.1 [ubiquitous]: The system SHALL compare files using exact byte-for-byte comparison
- AC-2.2 [ubiquitous]: The system SHALL use the `diff` npm package for cross-platform unified diff generation
- AC-2.3 [conditional]: IF files are identical THEN the system SHALL count them as matching
- AC-2.4 [conditional]: IF text files differ THEN the system SHALL compute a unified diff and display it to the console
- AC-2.5 [conditional]: IF binary files differ THEN the system SHALL display "binary files differ" without diff content

### DIFF-3: Missing File Detection [MUST] (proposed)

AS A developer, I WANT to see files that exist in one directory but not the other, SO THAT I can identify new or removed templates.

> Ensures complete coverage of template additions and removals.

ACCEPTANCE CRITERIA

- AC-3.1 [conditional]: IF a generated file has no corresponding target file THEN the system SHALL report it as "new file"
- AC-3.2 [conditional]: IF a target file has no corresponding generated file THEN the system SHALL report it as "extra file in target"
- AC-3.3 [ubiquitous]: The system SHALL include missing file information in the diff output

### DIFF-4: Diff Output Format [MUST] (proposed)

AS A developer, I WANT git-style unified diff output with color, SO THAT differences are easy to read and understand.

> Consistent with developer expectations from Git tooling.

ACCEPTANCE CRITERIA

- AC-4.1 [ubiquitous]: The system SHALL produce unified diff format output for each differing file
- AC-4.2 [ubiquitous]: The diff output SHALL use git-style formatting with file headers
- AC-4.3 [conditional]: IF the terminal supports color THEN the system SHALL colorize diff output — additions green, deletions red
- AC-4.4 [event]: WHEN all files match THEN the system SHALL display a success message indicating no differences
- AC-4.5 [ubiquitous]: The system SHALL display a summary line with file count and difference count — e.g., "3 files compared, 0 differences"

### DIFF-5: Exit Codes [MUST] (proposed)

AS A CI system, I WANT predictable exit codes, SO THAT I can automate template drift detection in pipelines.

> Enables scriptable automation and CI integration.

ACCEPTANCE CRITERIA

- AC-5.1 [event]: WHEN all files match THEN the system SHALL exit with code 0
- AC-5.2 [event]: WHEN any differences are found THEN the system SHALL exit with code 1
- AC-5.3 [event]: WHEN an error occurs THEN the system SHALL exit with code 2

### DIFF-6: Temp Directory Cleanup [MUST] (proposed)

AS A developer, I WANT the temp directory cleaned up automatically, SO THAT disk space is not consumed by orphaned files.

> Prevents accumulation of temporary files over time.

ACCEPTANCE CRITERIA

- AC-6.1 [event]: WHEN diff completes successfully THEN the system SHALL delete the temporary directory
- AC-6.2 [event]: WHEN diff encounters an error THEN the system SHALL still delete the temporary directory
- AC-6.3 [ubiquitous]: The system SHALL use try/finally or equivalent to ensure cleanup occurs

### DIFF-7: CLI Options [MUST] (proposed)

AS A developer, I WANT `diff` to share options with `generate`, SO THAT I can use the same configuration for both commands.

> Reduces cognitive load and ensures consistent behavior.

ACCEPTANCE CRITERIA

- AC-7.1 [ubiquitous]: The system SHALL accept `--output <path>` to specify the target directory for comparison
- AC-7.2 [ubiquitous]: The system SHALL accept `--template <source>` to specify the template source
- AC-7.3 [ubiquitous]: The system SHALL accept `--features <flag>...` as a variadic option
- AC-7.4 [ubiquitous]: The system SHALL accept `--config <path>` to specify an alternate configuration file
- AC-7.5 [ubiquitous]: The system SHALL accept `--refresh` flag to force re-fetch of cached templates
- AC-7.6 [ubiquitous]: The system SHALL NOT accept `--force` or `--dry-run` flags — they are not applicable to diff

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

- 1.0.0 (2025-12-11): Initial requirements based on architecture
