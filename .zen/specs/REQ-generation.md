# Generation Requirements

> VERSION: 1.0.0 | STATUS: draft | UPDATED: 2025-12-11

## Introduction

This document defines requirements for the Zen CLI file generation system, including directory structure mirroring, file writing, conflict resolution with interactive prompts, and dry-run simulation mode.

## Glossary

- **Generation**: The process of rendering templates and writing output files
- **Conflict**: A situation where an output file already exists
- **Dry Run**: Simulation mode that reports actions without making changes
- **Directory Mirroring**: Recreating template directory structure in output

## Stakeholders

- DEVELOPER: Engineers generating agent configuration files
- CI SYSTEM: Automated pipelines regenerating files without interaction

## Requirements

### GEN-1: Directory Structure Mirroring [MUST] (proposed)

AS A developer, I WANT output structure to match template structure, SO THAT file organization is predictable.

> Ensures consistent, predictable output layout.

ACCEPTANCE CRITERIA

- AC-1.1 [ubiquitous]: The system SHALL recreate the template directory structure in the output directory
- AC-1.2 [event]: WHEN a template is at `templates/.github/agents/foo.md` THEN the output SHALL be at `<output>/.github/agents/foo.md`
- AC-1.3 [ubiquitous]: The system SHALL preserve directory nesting depth from templates

### GEN-2: Automatic Directory Creation [MUST] (proposed)

AS A developer, I WANT missing directories created automatically, SO THAT I don't need to create them manually.

> Reduces friction in generation workflow.

ACCEPTANCE CRITERIA

- AC-2.1 [conditional]: IF an output directory does not exist THEN the system SHALL create it recursively
- AC-2.2 [event]: WHEN creating directories THEN the system SHALL create all intermediate directories as needed
- AC-2.3 [event]: WHEN directory creation fails due to permissions THEN the system SHALL display an error and exit

### GEN-3: File Writing [MUST] (proposed)

AS A developer, I WANT rendered templates written to files, SO THAT I have the generated output.

> Core output functionality.

ACCEPTANCE CRITERIA

- AC-3.1 [event]: WHEN a template renders non-empty content THEN the system SHALL write the content to the corresponding output file
- AC-3.2 [ubiquitous]: The system SHALL write files with UTF-8 encoding
- AC-3.3 [ubiquitous]: The system SHALL preserve the template filename as the output filename

### GEN-4: Conflict Detection [MUST] (proposed)

AS A developer, I WANT to know when files would be overwritten, SO THAT I don't accidentally lose changes.

> Protects against unintended data loss.

ACCEPTANCE CRITERIA

- AC-4.1 [event]: WHEN an output file already exists THEN the system SHALL detect the conflict
- AC-4.2 [conditional]: IF `--force` is not provided THEN the system SHALL handle the conflict via interactive prompt
- AC-4.3 [conditional]: IF `--force` is provided THEN the system SHALL overwrite without prompting

### GEN-5: Interactive Conflict Resolution [MUST] (proposed)

AS A developer, I WANT to choose how to handle each conflict, SO THAT I have control over overwrites.

> Provides user agency over conflict handling.

ACCEPTANCE CRITERIA

- AC-5.1 [event]: WHEN conflicts are detected AND `--force` is not provided THEN the system SHALL prompt the user once with all conflicts
- AC-5.2 [ubiquitous]: The conflict prompt SHALL use a multi-select interface with checkboxes
- AC-5.3 [event]: WHEN user checks a file THEN the system SHALL overwrite that file
- AC-5.4 [event]: WHEN user unchecks a file THEN the system SHALL skip that file
- AC-5.5 [ubiquitous]: The prompt SHALL display all conflicting file paths
- AC-5.6 [ubiquitous]: All files SHALL be checked (selected for overwrite) by default
- AC-5.7 [event]: WHEN existing file content matches new content THEN the system SHALL skip the file without prompting

### GEN-6: Dry Run Mode [MUST] (proposed)

AS A developer, I WANT to preview generation without changes, SO THAT I can verify the outcome before committing.

> Enables safe verification of generation plan.

ACCEPTANCE CRITERIA

- AC-6.1 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT write any files
- AC-6.2 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT create any directories
- AC-6.3 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT prompt for conflict resolution
- AC-6.4 [conditional]: IF `--dry-run` is provided THEN the system SHALL display what actions would be taken

### GEN-7: Dry Run Output [MUST] (proposed)

AS A developer, I WANT clear dry-run output, SO THAT I understand what would happen.

> Provides actionable preview information.

ACCEPTANCE CRITERIA

- AC-7.1 [conditional]: IF `--dry-run` is provided THEN the system SHALL list files that would be created
- AC-7.2 [conditional]: IF `--dry-run` is provided THEN the system SHALL list files that would be skipped (empty output)
- AC-7.3 [conditional]: IF `--dry-run` is provided THEN the system SHALL list files that would conflict
- AC-7.4 [conditional]: IF `--dry-run` is provided THEN the system SHALL indicate the action that would be taken for each file

### GEN-8: Underscore Prefix Exclusion [MUST] (proposed)

AS A developer, I WANT files starting with underscore excluded, SO THAT helper files don't appear in output.

> Enables template-internal files without output pollution.

ACCEPTANCE CRITERIA

- AC-8.1 [ubiquitous]: The system SHALL NOT output files whose names start with `_`
- AC-8.2 [ubiquitous]: The system SHALL NOT output directories whose names start with `_`
- AC-8.3 [ubiquitous]: The system SHALL NOT traverse into directories whose names start with `_`

### GEN-9: Generation Summary [SHOULD] (proposed)

AS A developer, I WANT a summary after generation, SO THAT I know what was done.

> Provides confirmation and overview of actions taken.

ACCEPTANCE CRITERIA

- AC-9.1 [event]: WHEN generation completes THEN the system SHOULD display a summary
- AC-9.2 [ubiquitous]: The summary SHOULD include count of files created
- AC-9.3 [ubiquitous]: The summary SHOULD include count of files skipped
- AC-9.4 [ubiquitous]: The summary SHOULD include count of files overwritten
- AC-9.5 [conditional]: IF conflicts were skipped by user choice THEN the summary SHOULD include count of user-skipped files
- AC-9.6 [conditional]: IF no files were created or overwritten THEN the system SHOULD display a warning message indicating no files were written

### GEN-10: Exit Codes [MUST] (proposed)

AS A CI system, I WANT meaningful exit codes, SO THAT I can detect success or failure.

> Enables automation and scripting.

ACCEPTANCE CRITERIA

- AC-10.1 [event]: WHEN generation completes successfully THEN the system SHALL exit with code 0
- AC-10.2 [event]: WHEN generation fails due to error THEN the system SHALL exit with a non-zero code
- AC-10.3 [event]: WHEN user cancels during prompt THEN the system SHALL exit with a non-zero code

### GEN-11: Error Handling [MUST] (proposed)

AS A developer, I WANT clear error messages, SO THAT I can diagnose and fix problems.

> Enables effective troubleshooting.

ACCEPTANCE CRITERIA

- AC-11.1 [event]: WHEN file writing fails THEN the system SHALL display an error with the file path and reason
- AC-11.2 [event]: WHEN template rendering fails THEN the system SHALL display an error with the template path and reason
- AC-11.3 [event]: WHEN an error occurs THEN the system SHALL stop generation for remaining files
- AC-11.4 [ubiquitous]: Error messages SHALL be written to stderr

## Assumptions

- File system supports UTF-8 filenames
- User has write permissions to output directory
- Sufficient disk space for generated files

## Constraints

- Interactive prompts limited to @clack/prompts for consistency with architecture
- No partial file writes (atomic write or skip)
- No backup of overwritten files

## Out of Scope

- Backup creation before overwrite
- Diff display for conflicts
- Merge conflict resolution
- Post-generation hooks or scripts
- File permission preservation from templates

## Change Log

- 1.0.0 (2025-12-11): Initial requirements based on architecture
- 1.1.0 (2025-12-11): Updated GEN-5 to require batch conflict resolution with content comparison
- 1.2.0 (2025-12-11): Added GEN-9 AC-9.6 to require warning when no files are written
