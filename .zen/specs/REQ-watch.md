# Requirements Specification

## Introduction

This document defines requirements for the `zen watch` command, which monitors template source files for changes and automatically regenerates output files, enabling a rapid development feedback loop for template authors.

## Glossary

- WATCH MODE: A long-running process that monitors files for changes
- DEBOUNCE: A technique to delay action until changes stop occurring for a specified interval
- FILE WATCHER: The underlying mechanism that detects file system changes

## Stakeholders

- TEMPLATE AUTHOR: Engineers developing and testing template files
- DEVELOPER: Engineers customizing templates for their projects

## Requirements

### WATCH-1: Watch Command Entry Point [MUST]

AS A template author, I WANT a watch command, SO THAT I can see changes reflected immediately while developing templates.

> Enables rapid iteration without manual regeneration.

ACCEPTANCE CRITERIA

- AC-1.1 [event]: WHEN the user invokes `zen watch` THEN the system SHALL start file watching on the template source
- AC-1.2 [event]: WHEN the user invokes `zen watch --help` THEN the system SHALL display watch command usage
- AC-1.3 [ubiquitous]: The system SHALL display a message indicating watch mode is active and which directory is being watched

DEPENDS ON: CLI-1

### WATCH-2: Template Source Monitoring [MUST]

AS A template author, I WANT template files monitored for changes, SO THAT I don't have to restart the watcher.

> Watches the resolved template directory for file changes.

ACCEPTANCE CRITERIA

- AC-2.1 [ubiquitous]: The system SHALL monitor the template directory recursively for file changes
- AC-2.2 [event]: WHEN a template file is created THEN the system SHALL trigger regeneration
- AC-2.3 [event]: WHEN a template file is modified THEN the system SHALL trigger regeneration
- AC-2.4 [event]: WHEN a template file is deleted THEN the system SHALL trigger regeneration
- AC-2.5 [ubiquitous]: The system SHALL monitor files matching patterns: `*.md`, `*.json`, `*.yaml`, `*.yml`, `*.toml`, and all files in `_partials/`

### WATCH-3: Configuration File Monitoring [SHOULD]

AS A developer, I WANT the config file monitored, SO THAT config changes take effect immediately.

> Allows feature flag changes without restarting watch.

ACCEPTANCE CRITERIA

- AC-3.1 [event]: WHEN `.zen.toml` is modified THEN the system SHALL reload configuration
- AC-3.2 [event]: WHEN configuration is reloaded THEN the system SHALL trigger regeneration with new settings
- AC-3.3 [event]: WHEN configuration reload fails (invalid TOML) THEN the system SHALL display an error and continue watching

### WATCH-4: Debounced Regeneration [MUST]

AS A template author, I WANT changes debounced, SO THAT rapid saves don't cause excessive regenerations.

> Prevents regeneration storms during active editing.

ACCEPTANCE CRITERIA

- AC-4.1 [ubiquitous]: The system SHALL debounce file change events with a configurable interval
- AC-4.2 [state]: WHEN `--debounce` is not provided THEN the system SHALL use 300ms as the default debounce interval
- AC-4.3 [ubiquitous]: The system SHALL accept `--debounce <ms>` to configure the debounce interval
- AC-4.4 [event]: WHEN multiple changes occur within the debounce window THEN the system SHALL perform a single regeneration

### WATCH-5: Incremental Feedback [MUST]

AS A template author, I WANT to see what changed after regeneration, SO THAT I can verify my edits.

> Provides clear feedback on the result of each regeneration cycle.

ACCEPTANCE CRITERIA

- AC-5.1 [event]: WHEN regeneration completes THEN the system SHALL display a summary of files created, modified, or unchanged
- AC-5.2 [event]: WHEN regeneration completes THEN the system SHALL display a timestamp for the regeneration
- AC-5.3 [conditional]: IF `--diff` flag is provided THEN the system SHALL show unified diff output for modified files
- AC-5.4 [event]: WHEN regeneration fails THEN the system SHALL display the error and continue watching

### WATCH-6: Graceful Shutdown [MUST]

AS A template author, I WANT to stop watching gracefully, SO THAT resources are cleaned up properly.

> Standard CLI behavior for long-running processes.

ACCEPTANCE CRITERIA

- AC-6.1 [event]: WHEN the user presses Ctrl+C THEN the system SHALL stop watching and exit cleanly
- AC-6.2 [event]: WHEN the user sends SIGTERM THEN the system SHALL stop watching and exit cleanly
- AC-6.3 [event]: WHEN shutting down THEN the system SHALL display a "Watch stopped" message
- AC-6.4 [ubiquitous]: The system SHALL release all file system watchers on shutdown

### WATCH-7: Initial Generation [MUST]

AS A template author, I WANT an initial generation on watch start, SO THAT the output is up-to-date before I begin editing.

> Ensures starting state is synchronized.

ACCEPTANCE CRITERIA

- AC-7.1 [event]: WHEN watch mode starts THEN the system SHALL perform an initial generation
- AC-7.2 [conditional]: IF initial generation fails THEN the system SHALL display the error and continue watching
- AC-7.3 [conditional]: IF `--no-initial` flag is provided THEN the system SHALL skip initial generation

### WATCH-8: Clear Screen Option [COULD]

AS A template author, I WANT the terminal cleared between regenerations, SO THAT I have a clean view of the latest output.

> Reduces noise from previous runs.

ACCEPTANCE CRITERIA

- AC-8.1 [conditional]: IF `--clear` flag is provided THEN the system SHALL clear the terminal before each regeneration
- AC-8.2 [state]: WHEN `--clear` is not provided THEN the system SHALL NOT clear the terminal

### WATCH-9: Shared CLI Options [MUST]

AS A template author, I WANT watch to accept the same options as generate, SO THAT I can control the output.

> Consistent option interface across commands.

ACCEPTANCE CRITERIA

- AC-9.1 [ubiquitous]: The system SHALL accept `--output <path>` for output directory
- AC-9.2 [ubiquitous]: The system SHALL accept `--template <source>` for template source
- AC-9.3 [ubiquitous]: The system SHALL accept `--features <flag>...` for feature flags
- AC-9.4 [ubiquitous]: The system SHALL accept `--force` to overwrite without prompts
- AC-9.5 [ubiquitous]: The system SHALL accept `--config <path>` for configuration file

DEPENDS ON: CLI-2, CLI-3, CLI-4, CLI-5, CLI-7

### WATCH-10: Git Template Handling [MUST]

AS A developer, I WANT to watch Git-sourced templates, SO THAT I can develop against remote templates locally.

> Git templates must be resolved before watching.

ACCEPTANCE CRITERIA

- AC-10.1 [conditional]: IF template source is a Git repository THEN the system SHALL resolve it to local cache before watching
- AC-10.2 [conditional]: IF template source is a Git repository THEN the system SHALL watch the cached local copy
- AC-10.3 [event]: WHEN `--refresh` is provided with a Git template THEN the system SHALL re-fetch before starting watch
- AC-10.4 [ubiquitous]: The system SHALL display a warning that Git template changes require manual `--refresh`

DEPENDS ON: TPL-2, TPL-3

### WATCH-11: Error Recovery [MUST]

AS A template author, I WANT watch to recover from errors, SO THAT I don't have to restart after fixing a mistake.

> Maintains watch process despite temporary failures.

ACCEPTANCE CRITERIA

- AC-11.1 [event]: WHEN template rendering fails THEN the system SHALL display the error with file and line information
- AC-11.2 [event]: WHEN a file write fails THEN the system SHALL display the error and continue watching
- AC-11.3 [event]: WHEN an error occurs THEN the system SHALL wait for the next file change to retry
- AC-11.4 [ubiquitous]: The system SHALL NOT exit on recoverable errors

## Assumptions

- Node.js provides native file watching capabilities via `fs.watch` or `chokidar`
- Template errors produce informative error messages with location information
- The development environment supports standard terminal control sequences

## Constraints

- File watching is limited to local file systems (network mounts may have delayed notifications)
- The debounce interval MUST be at least 100ms to prevent excessive CPU usage
- Maximum of 10,000 watched files to prevent resource exhaustion

## Out of Scope

- Browser-based live reload or hot module replacement
- Remote file system watching
- Watching multiple template sources simultaneously
