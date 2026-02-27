# Requirements Specification

## Introduction

Requirements for the `awa validate` command that verifies traceability chain integrity between code markers and spec files.

## Glossary

- MARKER: A code comment annotation like `@awa-impl`, `@awa-test`, or `@awa-component`
- SPEC ID: An identifier in spec files such as requirement IDs, AC IDs, property IDs, or component names
- ORPHANED MARKER: A code marker referencing a spec ID that does not exist
- UNCOVERED AC: An acceptance criterion in a spec with no corresponding `@awa-test` marker in code
- CROSS-REFERENCE: A reference from one spec file to an ID in another (e.g., DESIGN IMPLEMENTS → REQ AC)

## Requirements

### VAL-1: Marker Scanning [MUST]

AS A developer, I WANT the validate command to scan source files for traceability markers, SO THAT I know which markers exist in the codebase.

ACCEPTANCE CRITERIA

- [x] VAL-1_AC-1 [ubiquitous]: The system SHALL scan files matching configured code globs for `@awa-impl`, `@awa-test`, and `@awa-component` markers, extracting the marker type and referenced ID
- [x] VAL-1_AC-2 [optional]: IF awa-code skill is active THEN it SHOULD instruct running `awa validate` after implementation
- [x] VAL-1_AC-3 [optional]: IF awa-refactor skill is active THEN it SHOULD instruct running `awa validate` to confirm markers are preserved

### VAL-2: Spec Parsing [MUST]

AS A developer, I WANT the validate command to parse spec files for IDs, SO THAT markers can be matched against real specs.

ACCEPTANCE CRITERIA

- [x] VAL-2_AC-1 [ubiquitous]: The system SHALL parse files matching configured spec globs to extract requirement IDs, AC IDs, property IDs, and component names

### VAL-3: Orphaned Marker Detection [MUST]

AS A developer, I WANT orphaned markers reported as errors, SO THAT I can fix stale references.

ACCEPTANCE CRITERIA

- [x] VAL-3_AC-1 [conditional]: IF a code marker references an ID that does not exist in any parsed spec file THEN the system SHALL report it as an error

DEPENDS ON: VAL-1, VAL-2

### VAL-4: Uncovered AC Detection [MUST]

AS A developer, I WANT uncovered ACs reported, SO THAT I know which criteria lack test coverage.

ACCEPTANCE CRITERIA

- [x] VAL-4_AC-1 [conditional]: IF a spec AC has no `@awa-test` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: VAL-1, VAL-2

### VAL-5: Cross-Reference Validation [MUST]

AS A developer, I WANT broken cross-references between spec files reported, SO THAT spec integrity is maintained.

ACCEPTANCE CRITERIA

- [x] VAL-5_AC-1 [conditional]: IF a DESIGN file IMPLEMENTS or VALIDATES reference does not resolve to a real REQ ID or AC ID THEN the system SHALL report it as an error
- [x] VAL-5_AC-2 [optional]: IF awa-requirements skill is active THEN it SHOULD instruct running `awa validate` after updating requirements
- [x] VAL-5_AC-3 [optional]: IF awa-design skill is active THEN it SHOULD instruct running `awa validate` after updating design

DEPENDS ON: VAL-2

### VAL-6: ID Format Validation [MUST]

AS A developer, I WANT malformed IDs detected, SO THAT naming conventions are enforced.

ACCEPTANCE CRITERIA

- [x] VAL-6_AC-1 [conditional]: IF a marker references an ID that does not match the configured ID pattern regex THEN the system SHALL report it as an error

### VAL-7: Orphaned Spec Warning [MUST]

AS A developer, I WANT orphaned spec files flagged as warnings, SO THAT I am aware of unused specs without blocking my workflow.

ACCEPTANCE CRITERIA

- [x] VAL-7_AC-1 [conditional]: IF a spec file's CODE prefix is not referenced by any other spec file or code marker THEN the system SHALL report it as a warning

DEPENDS ON: VAL-2

### VAL-8: Exit Code [MUST]

AS A CI system, I WANT deterministic exit codes, SO THAT validation results can gate pipelines.

ACCEPTANCE CRITERIA

- [x] VAL-8_AC-1 [ubiquitous]: The system SHALL exit with code 0 when no errors are found and code 1 when errors are found

DEPENDS ON: VAL-3

### VAL-9: JSON Output [SHOULD]

AS A CI engineer, I WANT JSON output, SO THAT validation results can be parsed programmatically.

ACCEPTANCE CRITERIA

- [x] VAL-9_AC-1 [conditional]: IF `--format json` is specified THEN the system SHALL output results as valid JSON to stdout

DEPENDS ON: VAL-3

### VAL-10: Path Exclusion [SHOULD]

AS A developer, I WANT to exclude paths from validation, SO THAT irrelevant files are skipped.

ACCEPTANCE CRITERIA

- [x] VAL-10_AC-1 [conditional]: IF `--ignore` patterns are provided THEN the system SHALL exclude matching paths from scanning

### VAL-11: Configurable Markers [SHOULD]

AS A template author, I WANT configurable marker names, SO THAT custom workflows are supported.

ACCEPTANCE CRITERIA

- [x] VAL-11_AC-1 [conditional]: IF `[validate].markers` is set in config THEN the system SHALL use those marker names instead of defaults

DEPENDS ON: VAL-1

### VAL-12: Configurable Spec Globs [SHOULD]

AS A template author, I WANT configurable spec file globs, SO THAT custom project layouts are supported.

ACCEPTANCE CRITERIA

- [x] VAL-12_AC-1 [conditional]: IF `[validate].spec-globs` is set in config THEN the system SHALL use those globs instead of defaults

DEPENDS ON: VAL-2

### VAL-13: Configurable Code Globs [SHOULD]

AS A template author, I WANT configurable code file globs, SO THAT custom project layouts are supported.

ACCEPTANCE CRITERIA

- [x] VAL-13_AC-1 [conditional]: IF `[validate].code-globs` is set in config THEN the system SHALL use those globs instead of defaults

DEPENDS ON: VAL-1

### VAL-14: Configurable ID Pattern [SHOULD]

AS A template author, I WANT a configurable ID pattern regex, SO THAT custom naming conventions are supported.

ACCEPTANCE CRITERIA

- [x] VAL-14_AC-1 [conditional]: IF `[validate].id-pattern` is set in config THEN the system SHALL use that regex for ID format validation instead of the default

DEPENDS ON: VAL-6

### VAL-15: Configurable Cross-Reference Patterns [SHOULD]

AS A template author, I WANT configurable cross-reference keywords, SO THAT custom spec formats are supported.

ACCEPTANCE CRITERIA

- [x] VAL-15_AC-1 [conditional]: IF `[validate].cross-ref-patterns` is set in config THEN the system SHALL use those patterns instead of defaults

DEPENDS ON: VAL-5

### VAL-16: Sensible Defaults [SHOULD]

AS A developer using the bundled awa workflow, I WANT all configuration to have sensible defaults, SO THAT `awa validate` works out of the box with zero config.

ACCEPTANCE CRITERIA

- [x] VAL-16_AC-1 [ubiquitous]: The system SHALL provide default values for all validate configuration that match the bundled awa template workflow

DEPENDS ON: VAL-11, VAL-12, VAL-13, VAL-14, VAL-15

## Assumptions

- Spec files are Markdown with identifiable patterns for IDs
- Code files contain markers in comments

## Constraints

- Must run in CI environments (no interactive prompts)
- Must handle large codebases efficiently (respect ignore patterns)
- Warnings do not affect exit code; only errors do

## Out of Scope

- Automatic marker insertion or repair
- Git integration (blame, history)
- Runtime validation of marker correctness

## Change Log

- 1.0.0 (2026-02-27): Initial requirements
