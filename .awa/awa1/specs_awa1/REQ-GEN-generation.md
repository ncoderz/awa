# Requirements Specification

## Introduction

This document defines requirements for the awa CLI file generation system, including directory structure mirroring, file writing, conflict resolution with interactive prompts, dry-run simulation mode, and the `awa init` convenience alias.

## Glossary

- GENERATION: The process of rendering templates and writing output files
- CONFLICT: A situation where an output file already exists
- DRY RUN: Simulation mode that reports actions without making changes
- DIRECTORY MIRRORING: Recreating template directory structure in output
- ALIAS: A secondary command that invokes the same handler with the same options as the primary command
- CONFIG HINT: A non-blocking informational message suggesting config file creation

## Stakeholders

- DEVELOPER: Engineers generating agent configuration files
- CI SYSTEM: Automated pipelines regenerating files without interaction

## Requirements

### GEN-1: Directory Structure Mirroring [MUST]

AS A developer, I WANT output structure to match template structure, SO THAT file organization is predictable.

> Ensures consistent, predictable output layout.

ACCEPTANCE CRITERIA

- GEN-1_AC-1 [ubiquitous]: The system SHALL recreate the template directory structure in the output directory
- GEN-1_AC-2 [event]: WHEN a template is at `templates/.github/agents/foo.md` THEN the output SHALL be at `<output>/.github/agents/foo.md`
- GEN-1_AC-3 [ubiquitous]: The system SHALL preserve directory nesting depth from templates

### GEN-2: Automatic Directory Creation [MUST]

AS A developer, I WANT missing directories created automatically, SO THAT I don't need to create them manually.

> Reduces friction in generation workflow.

ACCEPTANCE CRITERIA

- GEN-2_AC-1 [conditional]: IF an output directory does not exist THEN the system SHALL create it recursively
- GEN-2_AC-2 [event]: WHEN creating directories THEN the system SHALL create all intermediate directories as needed
- GEN-2_AC-3 [event]: WHEN directory creation fails due to permissions THEN the system SHALL display an error and exit

### GEN-3: File Writing [MUST]

AS A developer, I WANT rendered templates written to files, SO THAT I have the generated output.

> Core output functionality.

ACCEPTANCE CRITERIA

- GEN-3_AC-1 [event]: WHEN a template renders non-empty content THEN the system SHALL write the content to the corresponding output file
- GEN-3_AC-2 [ubiquitous]: The system SHALL write files with UTF-8 encoding
- GEN-3_AC-3 [ubiquitous]: The system SHALL preserve the template filename as the output filename

### GEN-4: Conflict Detection [MUST]

AS A developer, I WANT to know when files would be overwritten, SO THAT I don't accidentally lose changes.

> Protects against unintended data loss.

ACCEPTANCE CRITERIA

- GEN-4_AC-1 [event]: WHEN an output file already exists THEN the system SHALL detect the conflict
- GEN-4_AC-2 [conditional]: IF `--force` is not provided THEN the system SHALL handle the conflict via interactive prompt
- GEN-4_AC-3 [conditional]: IF `--force` is provided THEN the system SHALL overwrite without prompting

### GEN-5: Interactive Conflict Resolution [MUST]

AS A developer, I WANT to choose how to handle each conflict, SO THAT I have control over overwrites.

> Provides user agency over conflict handling.

ACCEPTANCE CRITERIA

- GEN-5_AC-1 [event]: WHEN conflicts are detected AND `--force` is not provided THEN the system SHALL prompt the user once with all conflicts
- GEN-5_AC-2 [ubiquitous]: The conflict prompt SHALL use a multi-select interface with checkboxes
- GEN-5_AC-3 [event]: WHEN user checks a file THEN the system SHALL overwrite that file
- GEN-5_AC-4 [event]: WHEN user unchecks a file THEN the system SHALL skip that file
- GEN-5_AC-5 [ubiquitous]: The prompt SHALL display all conflicting file paths
- GEN-5_AC-6 [ubiquitous]: All files SHALL be checked (selected for overwrite) by default
- GEN-5_AC-7 [event]: WHEN existing file content matches new content THEN the system SHALL skip the file without prompting

### GEN-6: Dry Run Mode [MUST]

AS A developer, I WANT to preview generation without changes, SO THAT I can verify the outcome before committing.

> Enables safe verification of generation plan.

ACCEPTANCE CRITERIA

- GEN-6_AC-1 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT write any files
- GEN-6_AC-2 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT create any directories
- GEN-6_AC-3 [conditional]: IF `--dry-run` is provided THEN the system SHALL NOT prompt for conflict resolution
- GEN-6_AC-4 [conditional]: IF `--dry-run` is provided THEN the system SHALL display what actions would be taken

### GEN-7: Dry Run Output [MUST]

AS A developer, I WANT clear dry-run output, SO THAT I understand what would happen.

> Provides actionable preview information.

ACCEPTANCE CRITERIA

- GEN-7_AC-1 [conditional]: IF `--dry-run` is provided THEN the system SHALL list files that would be created
- GEN-7_AC-2 [conditional]: IF `--dry-run` is provided THEN the system SHALL list files that would be skipped (empty output)
- GEN-7_AC-3 [conditional]: IF `--dry-run` is provided THEN the system SHALL list files that would conflict
- GEN-7_AC-4 [conditional]: IF `--dry-run` is provided THEN the system SHALL indicate the action that would be taken for each file

### GEN-8: Underscore Prefix Exclusion [MUST]

AS A developer, I WANT files starting with underscore excluded, SO THAT helper files don't appear in output.

> Enables template-internal files without output pollution.

ACCEPTANCE CRITERIA

- GEN-8_AC-1 [ubiquitous]: The system SHALL NOT output files whose names start with `_`
- GEN-8_AC-2 [ubiquitous]: The system SHALL NOT output directories whose names start with `_`
- GEN-8_AC-3 [ubiquitous]: The system SHALL NOT traverse into directories whose names start with `_`

### GEN-9: Generation Summary [SHOULD]

AS A developer, I WANT a summary after generation, SO THAT I know what was done.

> Provides confirmation and overview of actions taken.

ACCEPTANCE CRITERIA

- GEN-9_AC-1 [event]: WHEN generation completes THEN the system SHOULD display a summary
- GEN-9_AC-2 [ubiquitous]: The summary SHOULD include count of files created
- GEN-9_AC-3 [ubiquitous]: The summary SHOULD include count of files skipped
- GEN-9_AC-4 [ubiquitous]: The summary SHOULD include count of files overwritten
- GEN-9_AC-5 [conditional]: IF conflicts were skipped by user choice THEN the summary SHOULD include count of user-skipped files
- GEN-9_AC-6 [conditional]: IF no files were created or overwritten THEN the system SHOULD display a warning message indicating no files were written
- GEN-9_AC-7 [conditional]: IF files were deleted THEN the summary SHOULD include count of deleted files
- GEN-9_AC-8 [conditional]: IF files were skipped due to identical content THEN the summary SHOULD include count of equal-skipped files

### GEN-10: Exit Codes [MUST]

AS A CI system, I WANT meaningful exit codes, SO THAT I can detect success or failure.

> Enables automation and scripting.

ACCEPTANCE CRITERIA

- GEN-10_AC-1 [event]: WHEN generation completes successfully THEN the system SHALL exit with code 0
- GEN-10_AC-2 [event]: WHEN generation fails due to error THEN the system SHALL exit with a non-zero code
- GEN-10_AC-3 [event]: WHEN user cancels during prompt THEN the system SHALL exit with a non-zero code

### GEN-11: Error Handling [MUST]

AS A developer, I WANT clear error messages, SO THAT I can diagnose and fix problems.

> Enables effective troubleshooting.

ACCEPTANCE CRITERIA

- GEN-11_AC-1 [event]: WHEN file writing fails THEN the system SHALL display an error with the file path and reason
- GEN-11_AC-2 [event]: WHEN template rendering fails THEN the system SHALL display an error with the template path and reason
- GEN-11_AC-3 [event]: WHEN an error occurs THEN the system SHALL stop generation for remaining files
- GEN-11_AC-4 [ubiquitous]: Error messages SHALL be written to stderr

### GEN-12: Delete List Processing [MUST]

AS A developer, I WANT stale files from previous template versions cleaned up, SO THAT my project stays current with the template set.

> Enables safe removal of files that are no longer generated by the template.

ACCEPTANCE CRITERIA

- GEN-12_AC-1 [conditional]: IF `_delete.txt` exists in the template root THEN the system SHALL parse it for delete candidates
- GEN-12_AC-2 [conditional]: IF `--delete` is not provided THEN the system SHALL warn about eligible files without deleting them
- GEN-12_AC-3 [conditional]: IF `--delete` is provided THEN the system SHALL prompt the user to confirm deletions
- GEN-12_AC-4 [conditional]: IF `--delete` AND `--force` are provided THEN the system SHALL delete without prompting
- GEN-12_AC-5 [conditional]: IF `--delete` AND `--dry-run` are provided THEN the system SHALL log deletions without executing them
- GEN-12_AC-6 [conditional]: IF a delete list entry conflicts with a generated file THEN the system SHALL skip the deletion with a warning
- GEN-12_AC-7 [conditional]: IF a delete list entry does not exist in the output directory THEN the system SHALL silently skip it
- GEN-12_AC-8 [ubiquitous]: Delete list entries SHALL support feature-gated sections (`# @feature <name>`) where paths are deleted only when NONE of the listed features are active

DEPENDS ON: CLI-12

### GEN-13: Init Alias Registration [MUST]

AS A developer, I WANT to run `awa init` as an alternative to `awa template generate`, SO THAT the CLI uses familiar onboarding vocabulary.

> `init` is registered as a top-level command sharing the same handler as `template generate`.

ACCEPTANCE CRITERIA

- GEN-13_AC-1 [ubiquitous]: The system SHALL register `init` as a top-level command under `awa`

### GEN-14: Option Parity [MUST]

AS A developer, I WANT `awa init` to accept all options that `awa template generate` accepts, SO THAT I can use any option with either command name.

> Both commands share the same handler configuration, so option parity is structural.

ACCEPTANCE CRITERIA

- GEN-14_AC-1 [ubiquitous]: The `init` command SHALL accept all options defined on the `template generate` command

### GEN-15: Behavioural Identity [MUST]

AS A developer, I WANT `awa init <args>` to produce the same result as `awa template generate <args>`, SO THAT the choice of command name has no observable effect.

> Identical handler ensures identical behaviour.

ACCEPTANCE CRITERIA

- GEN-15_AC-1 [ubiquitous]: `awa init <args>` SHALL produce output identical to `awa template generate <args>` for the same arguments

### GEN-16: Help Visibility [MUST]

AS A developer, I WANT both `init` and `generate` to appear in help output, SO THAT I can discover both names.

> Commander automatically renders aliases in the command list.

ACCEPTANCE CRITERIA

- GEN-16_AC-1 [event]: WHEN the user invokes `awa --help` THEN the help output SHALL list `init` as a top-level command

### GEN-17: Config-Not-Found Hint [SHOULD]

AS A developer, I WANT an informational hint when no config file is found, SO THAT I know how to save my options for next time.

> Non-blocking info message surfaced only when no `.awa.toml` is present and no `--config` was provided.

ACCEPTANCE CRITERIA

- GEN-17_AC-1 [conditional]: IF no `.awa.toml` is found AND `--config` was not provided THEN the system SHALL log an info-level hint suggesting config file creation

## Assumptions

- File system supports UTF-8 filenames
- User has write permissions to output directory
- Sufficient disk space for generated files
- Users invoke the CLI from a terminal environment

## Constraints

- Interactive prompts limited to @clack/prompts for consistency with architecture
- No partial file writes (atomic write or skip)
- No backup of overwritten files
- No behaviour changes to `generate` beyond hint addition
- `generate` must remain fully functional and undeprecated

## Out of Scope

- Backup creation before overwrite
- Diff display for conflicts
- Merge conflict resolution
- Post-generation hooks or scripts
- File permission preservation from templates
- Making `init` the primary command and `generate` the alias
- Interactive config creation wizard
