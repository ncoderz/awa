# Requirements Specification

## Introduction

This document specifies requirements for the template overlays feature. Overlays
allow users to layer a directory of template files on top of a base template so
that only the changed files need to be maintained. The feature extends both the
generate and diff commands, adds CLI options and config support, and reuses
the existing template resolution infrastructure.

## Glossary

- BASE TEMPLATE: The primary template directory used as the starting point
- OVERLAY: A secondary template directory whose files take precedence over the base
- MERGED VIEW: The combined result of base plus one or more overlays
- OVERLAY SOURCE: A local path or Git repository reference for an overlay

## Stakeholders

- CLI USER: Runs awa commands with --overlay options
- PROJECT MAINTAINER: Configures overlays in .awa.toml for the project team

## Requirements

### OVL-1: Overlay CLI Option for Generate [MUST]

AS A CLI user, I WANT to supply one or more --overlay paths on the generate command, SO THAT I can layer custom files on top of a base template.

ACCEPTANCE CRITERIA

- OVL-1_AC-1 [event]: WHEN `--overlay <path>` is provided one or more times on the generate command THEN the system SHALL include each path as an overlay source applied over the base template

DEPENDS ON: (none)

### OVL-2: Overlay File Replacement [MUST]

AS A CLI user, I WANT an overlay file at the same relative path as a base file to replace that base file, SO THAT I can override specific base files without copying the entire template.

ACCEPTANCE CRITERIA

- OVL-2_AC-1 [ubiquitous]: The system SHALL replace a base template file with any overlay file that shares the same relative path in the merged view

DEPENDS ON: OVL-1

### OVL-3: Base File Passthrough [MUST]

AS A CLI user, I WANT base template files that have no overlay counterpart to appear unchanged in the generated output, SO THAT I only need to include the files I want to change in my overlay.

ACCEPTANCE CRITERIA

- OVL-3_AC-1 [ubiquitous]: The system SHALL include every base template file that is not present in any overlay unchanged in the merged view

DEPENDS ON: OVL-1

### OVL-4: Overlay-Only Files Added [MUST]

AS A CLI user, I WANT overlay files that do not exist in the base template to be added to the generated output, SO THAT overlays can introduce entirely new files alongside the base set.

ACCEPTANCE CRITERIA

- OVL-4_AC-1 [ubiquitous]: The system SHALL include every overlay file that has no corresponding base template file in the merged view

DEPENDS ON: OVL-1

### OVL-5: Multiple Overlay Ordering [SHOULD]

AS A CLI user, I WANT multiple overlays to be applied in the order I specify them with later overlays winning over earlier ones, SO THAT I can compose overlays with predictable precedence.

ACCEPTANCE CRITERIA

- OVL-5_AC-1 [ubiquitous]: The system SHALL apply multiple overlays in the order specified, with each subsequent overlay's files overriding any file from an earlier overlay at the same relative path

DEPENDS ON: OVL-1

### OVL-6: Local and Git Overlay Sources [MUST]

AS A CLI user, I WANT to specify overlays as either local directory paths or Git repository references, SO THAT I can share overlays across teams without committing them to every project repository.

ACCEPTANCE CRITERIA

- OVL-6_AC-1 [ubiquitous]: The system SHALL resolve overlay sources using the same local-path and Git-repository resolution logic used for the main template source

DEPENDS ON: OVL-1

### OVL-7: Diff Command Overlay Support [MUST]

AS A CLI user, I WANT the diff command to accept --overlay options identical to generate, SO THAT I can detect drift against the merged template view.

ACCEPTANCE CRITERIA

- OVL-7_AC-1 [event]: WHEN `--overlay <path>` is provided on the diff command THEN the system SHALL compare the merged template view against the target directory

DEPENDS ON: OVL-2

### OVL-8: Config File Overlay Array [MUST]

AS A project maintainer, I WANT to declare an `overlay` array in `.awa.toml`, SO THAT all team members use the same overlay stack without requiring CLI flags.

ACCEPTANCE CRITERIA

- OVL-8_AC-1 [event]: WHEN `overlay` is declared as an array of strings in `.awa.toml` THEN the system SHALL use those paths as overlay sources for generate and diff commands

DEPENDS ON: OVL-1

## Constraints

- Overlay merging happens at the file level (whole-file replacement, not line-level patching)
- Overlays are resolved before the template engine renders any file
- Cleanup of the temporary merged directory occurs whether or not generation succeeds

## Out of Scope

- File deletion via overlay (removing a base file by presence in overlay)
- Line-level patching or diff-style merging within a single file

## Change Log

- 1.0.0 (2025-01-01): Initial requirements
