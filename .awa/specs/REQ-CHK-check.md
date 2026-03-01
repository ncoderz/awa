# Requirements Specification

## Introduction

Requirements for the `awa check` command that verifies traceability chain integrity between code markers and spec files.

## Glossary

- MARKER: A code comment annotation like `@awa-impl`, `@awa-test`, or `@awa-component`
- SPEC ID: An identifier in spec files such as requirement IDs, AC IDs, property IDs, or component names
- ORPHANED MARKER: A code marker referencing a spec ID that does not exist
- UNCOVERED AC: An acceptance criterion in a spec with no corresponding `@awa-test` marker in code
- CROSS-REFERENCE: A reference from one spec file to an ID in another (e.g., DESIGN IMPLEMENTS → REQ AC)

## Requirements

### CHK-1: Marker Scanning [MUST]

AS A developer, I WANT the check command to scan source files for traceability markers, SO THAT I know which markers exist in the codebase.

ACCEPTANCE CRITERIA

- CHK-1_AC-1 [ubiquitous]: The system SHALL scan files matching configured code globs for `@awa-impl`, `@awa-test`, and `@awa-component` markers, extracting the marker type and referenced ID
- CHK-1_AC-2 [optional]: IF awa-code skill is active THEN it SHOULD instruct running `awa check` after implementation
- CHK-1_AC-3 [optional]: IF awa-refactor skill is active THEN it SHOULD instruct running `awa check` to confirm markers are preserved

### CHK-2: Spec Parsing [MUST]

AS A developer, I WANT the check command to parse spec files for IDs, SO THAT markers can be matched against real specs.

ACCEPTANCE CRITERIA

- CHK-2_AC-1 [ubiquitous]: The system SHALL parse files matching configured spec globs to extract requirement IDs, AC IDs, property IDs, and component names

### CHK-3: Orphaned Marker Detection [MUST]

AS A developer, I WANT orphaned markers reported as errors, SO THAT I can fix stale references.

ACCEPTANCE CRITERIA

- CHK-3_AC-1 [conditional]: IF a code marker references an ID that does not exist in any parsed spec file THEN the system SHALL report it as an error

DEPENDS ON: CHK-1, CHK-2

### CHK-4: Uncovered AC Detection [MUST]

AS A developer, I WANT uncovered ACs reported, SO THAT I know which criteria lack test coverage.

ACCEPTANCE CRITERIA

- CHK-4_AC-1 [conditional]: IF a spec AC has no `@awa-test` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: CHK-1, CHK-2

### CHK-5: Cross-Reference Validation [MUST]

AS A developer, I WANT broken cross-references between spec files reported, SO THAT spec integrity is maintained.

ACCEPTANCE CRITERIA

- CHK-5_AC-1 [conditional]: IF a DESIGN file IMPLEMENTS or VALIDATES reference does not resolve to a real REQ ID or AC ID THEN the system SHALL report it as an error
- CHK-5_AC-2 [optional]: IF awa-requirements skill is active THEN it SHOULD instruct running `awa check` after updating requirements
- CHK-5_AC-3 [optional]: IF awa-design skill is active THEN it SHOULD instruct running `awa check` after updating design

DEPENDS ON: CHK-2

### CHK-6: ID Format Validation [MUST]

AS A developer, I WANT malformed IDs detected, SO THAT naming conventions are enforced.

ACCEPTANCE CRITERIA

- CHK-6_AC-1 [conditional]: IF a marker references an ID that does not match the configured ID pattern regex THEN the system SHALL report it as an error

### CHK-7: Orphaned Spec Warning [MUST]

AS A developer, I WANT orphaned spec files flagged as warnings, SO THAT I am aware of unused specs without blocking my workflow.

ACCEPTANCE CRITERIA

- CHK-7_AC-1 [conditional]: IF a spec file's CODE prefix is not referenced by any other spec file or code marker THEN the system SHALL report it as a warning

DEPENDS ON: CHK-2

### CHK-8: Exit Code [MUST]

AS A CI system, I WANT deterministic exit codes, SO THAT validation results can gate pipelines.

ACCEPTANCE CRITERIA

- CHK-8_AC-1 [ubiquitous]: The system SHALL exit with code 0 when no errors or warnings are found, exit with code 1 when errors or warnings are found, unless `--allow-warnings` is active

DEPENDS ON: CHK-3, CHK-17

### CHK-9: JSON Output [SHOULD]

AS A CI engineer, I WANT JSON output, SO THAT validation results can be parsed programmatically.

ACCEPTANCE CRITERIA

- CHK-9_AC-1 [conditional]: IF `--format json` is specified THEN the system SHALL output results as valid JSON to stdout

DEPENDS ON: CHK-3

### CHK-10: Path Exclusion [SHOULD]

AS A developer, I WANT to exclude paths from validation, SO THAT irrelevant files are skipped.

ACCEPTANCE CRITERIA

- CHK-10_AC-1 [conditional]: IF `--ignore` patterns are provided THEN the system SHALL exclude matching paths from scanning

### CHK-11: Configurable Markers [SHOULD]

AS A template author, I WANT configurable marker names, SO THAT custom workflows are supported.

ACCEPTANCE CRITERIA

- CHK-11_AC-1 [conditional]: IF `[check].markers` is set in config THEN the system SHALL use those marker names instead of defaults

DEPENDS ON: CHK-1

### CHK-12: Configurable Spec Globs [SHOULD]

AS A template author, I WANT configurable spec file globs, SO THAT custom project layouts are supported.

ACCEPTANCE CRITERIA

- CHK-12_AC-1 [conditional]: IF `[check].spec-globs` is set in config THEN the system SHALL use those globs instead of defaults

DEPENDS ON: CHK-2

### CHK-13: Configurable Code Globs [SHOULD]

AS A template author, I WANT configurable code file globs, SO THAT custom project layouts are supported.

ACCEPTANCE CRITERIA

- CHK-13_AC-1 [conditional]: IF `[check].code-globs` is set in config THEN the system SHALL use those globs instead of defaults

DEPENDS ON: CHK-1

### CHK-14: Configurable ID Pattern [SHOULD]

AS A template author, I WANT a configurable ID pattern regex, SO THAT custom naming conventions are supported.

ACCEPTANCE CRITERIA

- CHK-14_AC-1 [conditional]: IF `[check].id-pattern` is set in config THEN the system SHALL use that regex for ID format validation instead of the default

DEPENDS ON: CHK-6

### CHK-15: Configurable Cross-Reference Patterns [SHOULD]

AS A template author, I WANT configurable cross-reference keywords, SO THAT custom spec formats are supported.

ACCEPTANCE CRITERIA

- CHK-15_AC-1 [conditional]: IF `[check].cross-ref-patterns` is set in config THEN the system SHALL use those patterns instead of defaults

DEPENDS ON: CHK-5

### CHK-16: Sensible Defaults [SHOULD]

AS A developer using the bundled awa workflow, I WANT all configuration to have sensible defaults, SO THAT `awa check` works out of the box with zero config.

ACCEPTANCE CRITERIA

- CHK-16_AC-1 [ubiquitous]: The system SHALL provide default values for all check configuration that match the bundled awa template workflow

DEPENDS ON: CHK-11, CHK-12, CHK-13, CHK-14, CHK-15

### CHK-17: Allow Warnings Flag [SHOULD]

AS A developer, I WANT an `--allow-warnings` flag, SO THAT I can opt into the previous behavior where warnings do not affect the exit code.

ACCEPTANCE CRITERIA

- CHK-17_AC-1 [conditional]: IF `--allow-warnings` is specified THEN the system SHALL exit with code 0 when only warnings are found
- CHK-17_AC-2 [conditional]: IF `[check].allow-warnings` is set to `true` in config THEN the system SHALL treat it the same as `--allow-warnings`
- CHK-17_AC-3 [ubiquitous]: The system SHALL default `allow-warnings` to `false` (warnings are errors by default)

DEPENDS ON: CHK-8

### CHK-18: Uncovered Component Detection [SHOULD]

AS A developer, I WANT uncovered DESIGN components reported, SO THAT I know which components lack a corresponding `@awa-component` marker in code.

ACCEPTANCE CRITERIA

- CHK-18_AC-1 [conditional]: IF a DESIGN component has no `@awa-component` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: CHK-1, CHK-2

### CHK-19: Unimplemented AC Detection [SHOULD]

AS A developer, I WANT unimplemented ACs reported, SO THAT I know which acceptance criteria lack an `@awa-impl` marker in code.

ACCEPTANCE CRITERIA

- CHK-19_AC-1 [conditional]: IF a spec AC has no `@awa-impl` marker referencing it in any code file THEN the system SHALL report it as a warning

DEPENDS ON: CHK-1, CHK-2

## Assumptions

- Spec files are Markdown with identifiable patterns for IDs
- Code files contain markers in comments

## Constraints

- Must run in CI environments (no interactive prompts)
- Must handle large codebases efficiently (respect ignore patterns)
- Warnings affect exit code by default; use `--allow-warnings` to suppress

## Out of Scope

- Automatic marker insertion or repair
- Git integration (blame, history)
- Runtime validation of marker correctness

## Change Log

- 1.0.0 (2026-02-27): Initial requirements
- 1.1.0 (2026-02-28): CHK-8 updated — warnings are now errors by default; added CHK-17 `--allow-warnings` flag
- 1.2.0 (2026-03-01): Added CHK-18 (uncovered component detection) and CHK-19 (unimplemented AC detection)
