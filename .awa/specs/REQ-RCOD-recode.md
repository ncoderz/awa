# Requirements Specification

## Introduction

Requirements for the `awa spec recode` command that rewrites all traceability IDs from one feature code prefix to another, with numbers offset past the existing maximum in the target namespace. This is the first mechanical step in merging feature codes.

## Glossary

- RECODE MAP: A mapping from source IDs to target IDs with offset numbering
- SOURCE CODE: The feature code being rewritten (all IDs with this prefix change)
- TARGET CODE: The feature code receiving the rewritten IDs
- OFFSET: The highest existing number in the target namespace; new IDs start at offset + 1

## Stakeholders

- DEVELOPER: Merges or consolidates feature codes
- AI AGENT: Benefits from automated ID rewriting during feature consolidation
- CI SYSTEM: Consumes exit codes and JSON output for automation

## Requirements

### RCOD-1: Recode Map Construction [MUST]

AS A developer, I WANT the recode command to build a mapping from source IDs to target IDs with offset numbering, SO THAT the target namespace has no collisions.

ACCEPTANCE CRITERIA

- RCOD-1_AC-1 [event]: WHEN a source and target code are provided THEN the system SHALL find the highest requirement number N in the target REQ file and map each source requirement to a target requirement starting from N+1 in document order
- RCOD-1_AC-2 [event]: WHEN building the recode map THEN the system SHALL include subrequirements with updated parent prefix and offset
- RCOD-1_AC-3 [event]: WHEN building the recode map THEN the system SHALL include acceptance criteria with updated parent prefix and offset
- RCOD-1_AC-4 [event]: WHEN the source code has a DESIGN file THEN the system SHALL find the highest property number P in the target DESIGN file and map each source property starting from P+1
- RCOD-1_AC-5 [event]: WHEN the source code has component names THEN the system SHALL map each source component prefix to the target code prefix preserving the component suffix

### RCOD-2: Propagation [MUST]

AS A developer, I WANT the recode map applied across all referencing artifacts, SO THAT the traceability chain remains intact after recoding.

ACCEPTANCE CRITERIA

- RCOD-2_AC-1 [ubiquitous]: The system SHALL apply the recode map to spec files, task files, and plan files matching the source code
- RCOD-2_AC-2 [ubiquitous]: The system SHALL apply the recode map to source and test files containing markers referencing source code IDs

DEPENDS ON: RCOD-1

### RCOD-3: Input Validation [MUST]

AS A developer, I WANT the command to validate that both feature codes exist before recoding, SO THAT I don't accidentally recode into a non-existent namespace.

ACCEPTANCE CRITERIA

- RCOD-3_AC-1 [conditional]: IF the source code has no matching REQ file THEN the system SHALL report an error and exit
- RCOD-3_AC-2 [conditional]: IF the target code has no matching REQ file THEN the system SHALL report an error and exit

### RCOD-4: CLI Command [MUST]

AS A developer, I WANT a `recode` subcommand under `awa spec`, SO THAT I can invoke it from the command line.

ACCEPTANCE CRITERIA

- RCOD-4_AC-1 [event]: WHEN `awa spec recode <source> <target>` is invoked THEN the system SHALL recode all source IDs to target IDs
- RCOD-4_AC-2 [conditional]: IF `--dry-run` is specified THEN the system SHALL display the recode map and affected files without modifying any files
- RCOD-4_AC-3 [conditional]: IF `--json` is specified THEN the system SHALL output the recode map and affected files as valid JSON to stdout
- RCOD-4_AC-4 [ubiquitous]: The system SHALL exit with code 0 when no changes are needed, exit with code 1 when changes were applied or would be applied in dry run, and exit with code 2 on error

## Assumptions

- Both source and target REQ files follow awa schema conventions
- The RENUM propagator infrastructure is available for reuse
- Component names follow the CODE-PascalCase convention

## Constraints

- Must reuse the RENUM propagator and two-pass placeholder replacement
- Must not modify IDs belonging to other feature codes
- Must not rename spec files (filename changes are out of scope)

## Out of Scope

- Renaming spec files after recoding
- Automatically running renumber on the target code after recoding
- Merging spec file content (combine REQ sections, etc.)
- Interactive mode for selecting which IDs to recode
