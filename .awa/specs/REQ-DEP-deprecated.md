# Requirements Specification

## Introduction

This document defines requirements for the awa requirement deprecation feature. Deprecation provides a tombstone mechanism for retiring requirements, acceptance criteria, properties, and components while preserving ID reservation and keeping deprecated content out of active spec files.

## Glossary

- TOMBSTONE: A minimal deprecation record containing only retired IDs
- DEPRECATED FILE: The file `.awa/specs/deprecated/DEPRECATED.md` cataloging all tombstone entries
- DEPRECATED ID: Any requirement, AC, property, or component ID listed in the deprecated file
- ID RESERVATION: The guarantee that deprecated IDs are never reused in active specs

## Stakeholders

- DEVELOPER: Engineers using awa to manage traceable specs and code
- AI AGENT: LLM-based coding assistants that read spec files into context
- CI PIPELINE: Automated build systems invoking `awa check`

## Requirements

### DEP-1: Deprecated File Parsing [MUST]

AS A developer, I WANT `awa check` to parse the deprecated file, SO THAT deprecated IDs are recognized during validation.

ACCEPTANCE CRITERIA

- DEP-1_AC-1 [event]: WHEN `.awa/specs/deprecated/DEPRECATED.md` exists THEN the system SHALL parse it to extract all deprecated IDs
- DEP-1_AC-2 [ubiquitous]: The system SHALL recognize requirement IDs, AC IDs, property IDs, and component names in the deprecated file
- DEP-1_AC-3 [state]: WHEN the deprecated file does not exist THEN the system SHALL treat the deprecated ID set as empty

### DEP-2: Deprecated File Format [MUST]

AS A developer, I WANT a minimal deprecated file format, SO THAT tombstone entries contain only IDs without text that would influence AI agents.

> Format uses H1 headings per feature code with comma-separated ID lists.

ACCEPTANCE CRITERIA

- DEP-2_AC-1 [ubiquitous]: The deprecated file SHALL use H1 headings (`# {CODE}`) to group entries by feature code
- DEP-2_AC-2 [ubiquitous]: Each line under a code heading SHALL contain a comma-separated list of deprecated IDs
- DEP-2_AC-3 [ubiquitous]: The deprecated file SHALL NOT contain requirement text, user stories, acceptance criteria descriptions, or design detail

### DEP-3: Coverage Suppression [MUST]

AS A developer, I WANT deprecated IDs excluded from coverage checks, SO THAT retiring a requirement does not produce false warnings.

ACCEPTANCE CRITERIA

- DEP-3_AC-1 [conditional]: IF an AC ID is listed in the deprecated file THEN the system SHALL NOT report it as uncovered-ac, unimplemented-ac, or unlinked-ac
- DEP-3_AC-2 [conditional]: IF a property ID is listed in the deprecated file THEN the system SHALL NOT report it as uncovered-property
- DEP-3_AC-3 [conditional]: IF a component name is listed in the deprecated file THEN the system SHALL NOT report it as uncovered-component
- DEP-3_AC-4 [conditional]: IF a requirement ID is listed in the deprecated file THEN the system SHALL NOT report any of its ACs (also deprecated) as unlinked

### DEP-4: ID Reservation [MUST]

AS A developer, I WANT deprecated IDs to be permanently reserved, SO THAT they cannot be accidentally reused in active specs.

ACCEPTANCE CRITERIA

- DEP-4_AC-1 [conditional]: IF an active spec file defines a requirement, AC, property, or component ID that also appears in the deprecated file THEN the system SHALL report it as an error
- DEP-4_AC-2 [ubiquitous]: The error message SHALL identify the conflicting ID and state that it is reserved by the deprecated file

### DEP-5: Silent Default Behavior [MUST]

AS A developer, I WANT references to deprecated IDs to be silent by default, SO THAT normal check runs are not cluttered with cleanup noise.

ACCEPTANCE CRITERIA

- DEP-5_AC-1 [conditional]: IF `--deprecated` is NOT specified THEN the system SHALL NOT report code markers referencing deprecated IDs as orphaned
- DEP-5_AC-2 [conditional]: IF `--deprecated` is NOT specified THEN the system SHALL NOT report cross-references to deprecated IDs as broken
- DEP-5_AC-3 [conditional]: IF `--deprecated` is NOT specified THEN the system SHALL NOT report IMPLEMENTS lines referencing deprecated ACs as errors

### DEP-6: Deprecated Flag [MUST]

AS A developer, I WANT a `--deprecated` flag on `awa check`, SO THAT I can discover stale references to deprecated IDs when I choose.

ACCEPTANCE CRITERIA

- DEP-6_AC-1 [ubiquitous]: The system SHALL accept `--deprecated` flag on the `check` command
- DEP-6_AC-2 [conditional]: IF `--deprecated` is specified AND a code marker references a deprecated ID THEN the system SHALL report it as a warning with code `deprecated-ref`
- DEP-6_AC-3 [conditional]: IF `--deprecated` is specified AND a DESIGN cross-reference targets a deprecated ID THEN the system SHALL report it as a warning with code `deprecated-ref`
- DEP-6_AC-4 [conditional]: IF `--deprecated` is specified THEN deprecated-ref warnings SHALL be promoted to errors by the default `allow-warnings: false` behavior

### DEP-7: Schema Validation [SHOULD]

AS A developer, I WANT the deprecated file validated against a schema, SO THAT formatting errors are caught early.

ACCEPTANCE CRITERIA

- DEP-7_AC-1 [conditional]: IF `DEPRECATED.schema.yaml` exists in the schema directory THEN the system SHALL validate the deprecated file against it
- DEP-7_AC-2 [conditional]: IF the deprecated file fails schema validation THEN the system SHALL report schema errors as with any other spec file

## Assumptions

- A single DEPRECATED.md file suffices for all feature codes
- Deprecated IDs are never un-deprecated (git revert handles that case)
- The deprecated file is small enough that a single file per project is practical

## Constraints

- The deprecated file must not contain natural language descriptions that could influence LLM behavior
- The file must live outside the main specs directory path (`deprecated/` subdirectory) to avoid accidental agent reads

## Out of Scope

- Automated `awa deprecate` command to move IDs
- Deprecation dates or reasons (git history covers provenance)
- Per-requirement deprecation metadata (superseded-by, reason fields)
- Un-deprecation workflow
