# Requirements Specification

## Introduction

Requirements for the `awa renumber` command that reassigns numeric indices in traceability IDs so they match document order, then propagates changes across all referencing artifacts.

## Glossary

- RENUMBER MAP: A mapping from each old ID string to its new ID string, built by walking an authoritative document in order
- ID FAMILY: The set of all derived IDs sharing a root requirement number (subrequirements, ACs)
- AUTHORITATIVE SOURCE: The file whose document order determines the renumbering — the REQ file for requirements, subrequirements, and ACs; the DESIGN file for properties
- FEATURE CODE: The uppercase prefix shared by all IDs in a feature (e.g. CHK, TRC, DIFF)

## Stakeholders

- DEVELOPER: Normalizes ID numbering after document edits
- AI AGENT: Benefits from predictable sequential ID numbering
- CI SYSTEM: Consumes exit codes and JSON output for automation

## Requirements

### RENUM-1: Renumber Map Construction [MUST]

AS A developer, I WANT the renumber command to build a mapping from old IDs to new sequential IDs based on document order, SO THAT the renumbering is deterministic and predictable.

ACCEPTANCE CRITERIA

- RENUM-1_AC-1 [event]: WHEN a feature code is provided THEN the system SHALL walk the matching REQ file in document order and assign sequential requirement numbers starting from 1
- RENUM-1_AC-2 [event]: WHEN building the renumber map THEN the system SHALL include all derived IDs (subrequirements and acceptance criteria) in the mapping alongside their parent requirements
- RENUM-1_AC-3 [conditional]: IF the existing IDs are already sequential with no gaps and no reordering THEN the system SHALL report that no changes are needed

### RENUM-2: Subrequirement Renumbering [MUST]

AS A developer, I WANT subrequirement IDs renumbered within their parent, SO THAT dotted IDs are sequential after deletions.

ACCEPTANCE CRITERIA

- RENUM-2_AC-1 [event]: WHEN a parent requirement has subrequirements THEN the system SHALL renumber the subrequirement suffix sequentially starting from 1 based on document order within that parent
- RENUM-2_AC-2 [event]: WHEN a parent requirement's top-level number changes THEN the system SHALL update the parent prefix of all its subrequirements to match the new number

### RENUM-3: Acceptance Criterion Renumbering [MUST]

AS A developer, I WANT AC IDs renumbered within their parent requirement or subrequirement, SO THAT AC numbering is sequential.

ACCEPTANCE CRITERIA

- RENUM-3_AC-1 [event]: WHEN a requirement or subrequirement has acceptance criteria THEN the system SHALL renumber AC suffixes sequentially starting from 1 based on document order within that parent
- RENUM-3_AC-2 [event]: WHEN the parent requirement or subrequirement ID changes THEN the system SHALL update the parent prefix of all its ACs to match the new parent ID

### RENUM-4: Property Renumbering [MUST]

AS A developer, I WANT property IDs in DESIGN files renumbered sequentially, SO THAT property numbering has no gaps.

ACCEPTANCE CRITERIA

- RENUM-4_AC-1 [event]: WHEN a feature code is provided THEN the system SHALL walk the matching DESIGN file in document order and renumber property IDs sequentially starting from 1
- RENUM-4_AC-2 [conditional]: IF no DESIGN file exists for the feature code THEN the system SHALL skip property renumbering without error

### RENUM-5: Artifact Propagation [MUST]

AS A developer, I WANT all references to renumbered IDs updated across every artifact type, SO THAT the traceability chain remains intact.

ACCEPTANCE CRITERIA

- RENUM-5_AC-1 [ubiquitous]: The system SHALL apply the renumber map to REQ, DESIGN, FEAT, TASK, EXAMPLE, and PLAN files matching the feature code
- RENUM-5_AC-2 [ubiquitous]: The system SHALL apply the renumber map to source and test files containing `@awa-impl`, `@awa-test`, and `@awa-component` markers referencing the affected IDs
- RENUM-5_AC-3 [ubiquitous]: The system SHALL update DEPENDS ON, IMPLEMENTS, VALIDATES, and TESTS cross-reference lines that reference affected IDs

DEPENDS ON: RENUM-1

### RENUM-6: Replacement Safety [MUST]

AS A developer, I WANT renumbering to handle ID swaps correctly, SO THAT no IDs are lost or duplicated when two IDs exchange positions.

ACCEPTANCE CRITERIA

- RENUM-6_AC-1 [ubiquitous]: The system SHALL apply replacements in a way that prevents intermediate collisions when IDs swap positions
- RENUM-6_AC-2 [ubiquitous]: The system SHALL only replace whole IDs matching the target feature code prefix, not partial string matches within unrelated tokens

DEPENDS ON: RENUM-1, RENUM-5

### RENUM-7: Dry Run Preview [SHOULD]

AS A developer, I WANT a dry run mode that shows the planned changes without writing files, SO THAT I can review before committing.

ACCEPTANCE CRITERIA

- RENUM-7_AC-1 [conditional]: IF `--dry-run` is specified THEN the system SHALL display the renumber map and list of affected files without modifying any files

### RENUM-8: Batch Renumbering [SHOULD]

AS A developer, I WANT to renumber all feature codes at once, SO THAT I can normalize the entire project after a large restructuring.

ACCEPTANCE CRITERIA

- RENUM-8_AC-1 [conditional]: IF `--all` is specified THEN the system SHALL discover all feature codes from REQ files and renumber each independently
- RENUM-8_AC-2 [conditional]: IF `--all` is specified THEN the system SHALL ensure each feature code is renumbered in isolation so that one feature's IDs never interfere with another's

DEPENDS ON: RENUM-1

### RENUM-9: CLI Command [MUST]

AS A developer, I WANT a `renumber` subcommand with standard options, SO THAT I can invoke it from the command line.

ACCEPTANCE CRITERIA

- RENUM-9_AC-1 [event]: WHEN `awa renumber <CODE>` is invoked THEN the system SHALL renumber IDs for the specified feature code
- RENUM-9_AC-2 [event]: WHEN `awa renumber --all` is invoked THEN the system SHALL renumber IDs for all discovered feature codes
- RENUM-9_AC-3 [conditional]: IF neither a feature code nor `--all` is provided THEN the system SHALL display an error message and usage help
- RENUM-9_AC-4 [conditional]: IF the specified feature code has no matching REQ file THEN the system SHALL report an error and exit

### RENUM-10: Exit Codes [MUST]

AS A CI system, I WANT deterministic exit codes, SO THAT renumbering results can gate pipelines.

ACCEPTANCE CRITERIA

- RENUM-10_AC-1 [ubiquitous]: The system SHALL exit with code 0 when no changes are needed, exit with code 1 when changes were applied or would be applied in dry run, and exit with code 2 on internal error

### RENUM-11: JSON Output [SHOULD]

AS A CI engineer, I WANT JSON output, SO THAT renumbering results can be parsed programmatically.

ACCEPTANCE CRITERIA

- RENUM-11_AC-1 [conditional]: IF `--json` is specified THEN the system SHALL output the renumber map and list of affected files as valid JSON to stdout

### RENUM-12: Malformed ID Detection [SHOULD]

AS A developer, I WANT malformed IDs with the target feature code prefix detected and reported during renumbering, SO THAT typos and AI-hallucinated IDs are caught rather than silently left behind.

ACCEPTANCE CRITERIA

- RENUM-12_AC-1 [event]: WHEN scanning files for IDs to renumber THEN the system SHALL detect tokens that match the feature code prefix but do not conform to the standard ID format
- RENUM-12_AC-2 [event]: WHEN a malformed ID is detected THEN the system SHALL report it with file path, line number, and the invalid token
- RENUM-12_AC-3 [ubiquitous]: The system SHALL treat malformed IDs as warnings and continue renumbering valid IDs

## Assumptions

- REQ files follow the awa schema conventions with identifiable requirement, subrequirement, and AC IDs
- DESIGN files follow the awa schema conventions with identifiable property IDs
- Code files use `@awa-impl`, `@awa-test`, and `@awa-component` marker conventions

## Constraints

- Must reuse the existing check engine's scanner and parser infrastructure (no duplicate scanning logic)
- Must handle the full ID family (requirement, subrequirement, AC, property) atomically per feature code
- Must not modify IDs belonging to other feature codes

## Out of Scope

- Renumbering component names (these are descriptive names, not sequential numbers)
- Interactive mode for choosing which IDs to renumber
- Git integration (auto-commit, branch management)
- Undo or rollback support
