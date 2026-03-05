# Renumber Traceability IDs [INFORMATIVE]

## Problem

As awa projects evolve, traceability IDs accumulate organically. Requirements get inserted, deleted, or reordered during iterative development. Over time the numeric indices within a feature code become inconsistent with the document order: a REQ file might have IDs numbered 1, 3, 5, 8, 12 after several rounds of additions and removals. Subrequirement, acceptance criterion, and property IDs inherit these gaps.

This inconsistency creates friction:

- Reading spec documents is harder when IDs jump unpredictably.
- AI agents referencing IDs by number are more likely to hallucinate non-existent IDs when the sequence has gaps.
- Code reviews involving traceability markers are noisier when the numbering doesn't match the document's logical flow.

Currently the only remedy is a painful manual edit: find every occurrence of the old ID across REQ files, DESIGN files, TASK files, source code markers (`@awa-impl`, `@awa-test`, `@awa-component`), and test markers, then carefully replace them all. Missing a single reference breaks the traceability chain.

## Conceptual Model

`awa renumber` is a deterministic rewriting tool that reassigns numeric indices so they match document order, then propagates the changes to every referencing artifact.

Key abstractions:

- SCOPE: Renumbering can target a single feature code (e.g. `awa renumber DIFF`) or all feature codes at once (`awa renumber --all`). When targeting all, the tool discovers every feature code from the REQ files and renumbers each independently.
- RENUMBER MAP: A mapping from old IDs to new IDs, derived by walking the authoritative spec document (REQ file) in order and assigning sequential numbers starting from 1.
- ID FAMILY: All derived IDs that share a root requirement number. When `DIFF-5` becomes `DIFF-3`, the entire family moves: subrequirements like `DIFF-5.1` become `DIFF-3.1`, acceptance criteria are renumbered to match, and associated properties shift accordingly.
- PROPAGATION: The renumber map is applied across all artifact types — REQ, DESIGN, FEAT, TASK, EXAMPLE, and source/test files with traceability markers. Cross-references (e.g. DESIGN implementation links, dependency lines) are updated too.
- DRY RUN: Users can preview the renumber map and affected files before committing changes.

The tool works best when the REQ file is the single source of truth for ID ordering. DESIGN, TASK, and code files are consumers of those IDs, and the tool rewrites them to follow whatever the REQ file declares.

## Scope Boundary

Traceability ID renumbering, gap removal, propagation to specs and code.

## Scenarios

### Scenario 1: Closing Gaps After Deletions

A developer removed requirements DIFF-4 and DIFF-6 from the REQ file during a major refactor. The remaining requirements jump from DIFF-3 to DIFF-5 to DIFF-7. They run `awa renumber DIFF` and the tool reassigns DIFF-5 to DIFF-4, DIFF-7 to DIFF-5, and so on. All DESIGN references, code markers, and test markers are updated in lockstep.

### Scenario 2: Reordering After Insertion

A developer inserted a new requirement between DIFF-2 and DIFF-3, temporarily numbered DIFF-2a or manually assigned DIFF-25. After finalizing the spec, they run `awa renumber DIFF` to normalize the numbering. The new requirement gets the correct sequential position, and downstream artifacts follow.

### Scenario 3: Dry Run Preview

Before renumbering a large feature code like CLI (40+ requirements, many ACs, properties, and components), a developer runs `awa renumber CLI --dry-run` to see the proposed renumber map and a list of every file and line that would change. They review the plan, confirm it looks correct, then run without `--dry-run`.

### Scenario 4: Renumbering Subrequirements and ACs

A feature has subrequirements DIFF-3.1, DIFF-3.3, DIFF-3.5 (with DIFF-3.2 and DIFF-3.4 removed). Running `awa renumber DIFF` reassigns them to DIFF-3.1, DIFF-3.2, DIFF-3.3 and updates all corresponding acceptance criterion references to match the new parent numbers.

### Scenario 5: Property ID Renumbering

A DESIGN file defines correctness properties numbered 1, 3, and 7. After renumbering, they become 1, 2, and 3, and all corresponding test markers referencing those properties are updated accordingly.

### Scenario 6: Cross-Feature Safety

A developer accidentally runs `awa renumber DIFF` but the DESIGN file for DIFF references IDs from the TRC feature (e.g. in DEPENDS ON lines). The tool only remaps IDs with the DIFF prefix — TRC references pass through unchanged.

### Scenario 7: Renumbering All Feature Codes

After a large restructuring that touched many features, a developer runs `awa renumber --all` to normalize every feature code in the project. The tool discovers all REQ files, builds a renumber map per feature code, and applies them in a single pass. Each feature code is renumbered independently — DIFF IDs never interfere with TRC IDs — but all changes are written together.

## Background

This problem is common in any system that uses human-assigned sequential identifiers. Database migration tools (e.g. Rails migrations), test suites with numbered cases, and RFC-style documents all face similar drift. The typical solution is a "compact" or "renumber" operation that preserves semantics while normalizing ordering.

The awa traceability chain is particularly suited to automated renumbering because every reference follows a strict, parseable format (requirement IDs, subrequirement IDs, acceptance criterion IDs, property IDs) and every reference site is discoverable via the same scanning infrastructure that `awa check` already uses.

## Glossary

- RENUMBER MAP: A dictionary mapping each old ID string to its new ID string
- ID FAMILY: The set of all IDs derived from a root requirement (subrequirements, ACs, properties)
- PROPAGATION: Applying the renumber map across all files that contain the affected IDs
- FEATURE CODE: The uppercase prefix shared by all IDs in a feature (e.g., CLI, TRC, DIFF)
