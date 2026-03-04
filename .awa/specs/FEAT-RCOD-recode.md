# Recode Traceability IDs [INFORMATIVE]

## Problem

When feature codes need to be merged or consolidated, the first mechanical step is rewriting all IDs from one code prefix to another. For example, merging a feature like DIFF into GEN requires every DIFF ID (requirements, subrequirements, acceptance criteria, properties, component names, markers) to become a GEN ID with numbers that don't collide with existing GEN IDs.

Today this must be done manually: find every occurrence of the source code prefix across requirements, subrequirements, acceptance criteria, properties, and component names in all spec files, source code, and test files, then carefully replace each with the target prefix while ensuring no numbering collisions. This is tedious, error-prone, and blocks the broader merge workflow.

## Conceptual Model

`awa spec recode` is a prefix-rewriting tool. It takes a source feature code and a target feature code, then builds a mapping from every source ID to a target ID whose numeric offset starts after the highest existing target ID. The mapping is then applied using the same two-pass placeholder replacement that `awa renumber` uses.

Key abstractions:

- SOURCE CODE: The feature code being rewritten (e.g. DIFF). All IDs with this prefix will change.
- TARGET CODE: The feature code to rewrite into (e.g. GEN). New IDs will use this prefix with numbers offset past the existing maximum.
- OFFSET: Requirements start after the highest existing target requirement number. Properties start after the highest existing target property number. These are separate counters.
- RECODE MAP: A mapping from old source IDs to new target IDs. Compatible with the renumber map shape so the RENUM propagator can be reused directly.
- COMPONENT PREFIX REWRITING: Component names like DIFF-Parser become GEN-Parser. The descriptive suffix is preserved; only the code prefix changes.

After recoding, the affected spec files still have their original filenames (e.g. REQ-DIFF-diff.md now contains GEN IDs). The user must rename files manually or use a merge command to complete the consolidation.

## Scope Boundary

Prefix rewriting of traceability IDs from one feature code to another with offset numbering.

## Scenarios

### Scenario 1: Basic Recode

A developer decides to merge the DIFF feature into GEN. They run `awa spec recode DIFF GEN`. The tool finds the highest GEN requirement number (e.g. 10) and the highest GEN property number (e.g. 4), then rewrites every DIFF ID: DIFF-1 becomes GEN-11, its first acceptance criterion becomes GEN-11's first criterion, the first DIFF property becomes GEN's fifth property, and DIFF-Parser becomes GEN-Parser. All spec files, source code, and test markers are updated in place.

### Scenario 2: Dry Run Preview

Before committing to a recode, a developer runs `awa spec recode DIFF GEN --dry-run` to see the full recode map and the list of affected files without modifying anything. This lets them verify the offset numbering looks correct and no unexpected files would be touched.

### Scenario 3: Target Has No Existing Requirements

A developer recodes DIFF into a brand-new feature code NEW that has a REQ file but no existing requirements. The offset starts at 0, so DIFF-1 becomes NEW-1, DIFF-2 becomes NEW-2, and so on. Properties also start from 1.

### Scenario 4: Component Name Preservation

A developer recodes DIFF into GEN. The component DIFF-Parser becomes GEN-Parser, DIFF-Formatter becomes GEN-Formatter. The descriptive suffixes are preserved, only the prefix changes.

## Glossary

- RECODE MAP: A dictionary mapping each old source ID string to its new target ID string
- OFFSET: The starting number for target IDs, derived from the highest existing target ID
- SOURCE CODE: The feature code being rewritten away from
- TARGET CODE: The feature code being rewritten into
