# Requirements Specification

## Introduction

This document defines requirements for structured JSON output from the awa CLI generate and diff commands. The JSON output enables CI pipelines and automation tooling to parse results programmatically instead of relying on human-readable terminal text.

## Glossary

- JSON OUTPUT: Structured machine-readable output written to stdout
- SUMMARY OUTPUT: Compact one-line counts-only output for quick scanning

## Stakeholders

- CI SYSTEM: Automated pipelines parsing command output for drift detection
- DEVELOPER: Engineers integrating awa into automation scripts

## Requirements

### JSON-1: Generate JSON Output [MUST]

AS A CI system, I WANT the generate command to support a --json flag, SO THAT I can parse structured output programmatically.

ACCEPTANCE CRITERIA

- JSON-1_AC-1 [event]: WHEN the --json flag is provided to the generate command THEN the system SHALL output a valid JSON object to stdout containing the generation result

### JSON-2: Diff JSON Output [MUST]

AS A CI system, I WANT the diff command to support a --json flag, SO THAT I can parse structured diff results programmatically.

ACCEPTANCE CRITERIA

- JSON-2_AC-1 [event]: WHEN the --json flag is provided to the diff command THEN the system SHALL output a valid JSON object to stdout containing the diff result

### JSON-3: Generate JSON Structure [MUST]

AS A CI system, I WANT the generate JSON output to include actions and counts, SO THAT I can determine what files would be affected.

ACCEPTANCE CRITERIA

- JSON-3_AC-1 [conditional]: IF --json is provided to generate THEN the JSON output SHALL contain an actions array with type and path per entry, and a counts object with created, overwritten, skipped, and deleted fields

### JSON-4: Diff JSON Structure [MUST]

AS A CI system, I WANT the diff JSON output to include diffs and counts, SO THAT I can determine what files have drifted.

ACCEPTANCE CRITERIA

- JSON-4_AC-1 [conditional]: IF --json is provided to diff THEN the JSON output SHALL contain a diffs array with path, status, and optional diff per entry, and a counts object with changed, new, matching, and deleted fields

### JSON-5: Summary Output [SHOULD]

AS A developer, I WANT a --summary flag for compact output, SO THAT I can see counts at a glance in build logs.

ACCEPTANCE CRITERIA

- JSON-5_AC-1 [event]: WHEN the --summary flag is provided THEN the system SHALL output a single line with counts only

### JSON-6: Suppress Interactive Output [MUST]

AS A CI system, I WANT --json to suppress all non-JSON output, SO THAT stdout contains only valid JSON.

ACCEPTANCE CRITERIA

- JSON-6_AC-1 [conditional]: IF --json is active THEN the system SHALL suppress all interactive prompts, spinners, intro and outro messages, and logger output to stdout

### JSON-7: JSON Implies Dry-Run [MUST]

AS A CI system, I WANT --json to imply --dry-run for generate, SO THAT JSON output never causes file modifications.

ACCEPTANCE CRITERIA

- JSON-7_AC-1 [conditional]: IF --json is provided to the generate command THEN the system SHALL enforce dry-run mode regardless of the --dry-run flag value

### JSON-8: Output Routing [MUST]

AS A CI system, I WANT JSON on stdout and errors on stderr, SO THAT I can capture JSON cleanly in pipelines.

ACCEPTANCE CRITERIA

- JSON-8_AC-1 [ubiquitous]: The system SHALL write JSON output to stdout and error messages to stderr when --json is active

## Assumptions

- Consumers can parse standard JSON
- Stdout and stderr are separate streams in the execution environment

## Constraints

- JSON schema must remain stable once published (semver contract)
- No external JSON libraries required (uses built-in JSON.stringify)

## Out of Scope

- JSON Schema validation file distribution
- Streaming JSON output for large result sets
- JSON output for the check command

## Change Log

- 1.0.0 (2026-02-28): Initial requirements for JSON output
