# Validate Command [INFORMATIVE]

## Problem

awa's traceability chain (`@awa-impl`, `@awa-test`, `@awa-component`) relies on AI agents following instructions correctly. Nothing currently verifies that the chain is complete or consistent. Markers could reference non-existent IDs. Acceptance criteria could lack test coverage. Cross-references between spec files (DESIGN IMPLEMENTS → REQ IDs) could point to nothing.

This makes the traceability system an honour system — useful for humans reading code, but not enforceable.

## Conceptual Model

`awa check` is a **deterministic verification tool** that checks two dimensions of the traceability chain:

1. **Code ↔ Spec**: Traceability markers in source files resolve to real spec IDs, and spec acceptance criteria have test coverage.
2. **Spec ↔ Spec**: Cross-references between spec files are valid (e.g., DESIGN IMPLEMENTS references exist in REQ, ID formats are correct).

The tool is fully configurable — users with custom templates can define their own marker names, spec globs, and code globs. Defaults match the bundled awa workflow. Output can be text (human) or JSON (CI).

## Scenarios

### Scenario 1: Clean project

All markers resolve to real spec IDs, all ACs have test coverage. `awa check` exits with code 0 and prints a brief summary.

### Scenario 2: Orphaned marker

A source file contains `@awa-impl: FOO-1_AC-1` but `FOO-1_AC-1` doesn't exist in any spec file. `awa check` reports an error and exits with code 1.

### Scenario 3: Missing test coverage

An AC exists in a REQ spec but no `@awa-test` references it anywhere. `awa check` reports a warning.

### Scenario 4: Broken cross-reference

A DESIGN file says `IMPLEMENTS: CFG-99_AC-1` but `CFG-99_AC-1` doesn't exist in any REQ file. `awa check` reports an error.

### Scenario 5: Custom workflow

A team uses `@trace-impl` instead of `@awa-impl` and keeps specs in `docs/specs/`. They configure this in `.awa.toml` and `awa check` works as expected.

### Scenario 6: CI gate

A GitHub Actions workflow runs `awa check --format json`. The JSON output is parsed by a downstream step. Exit code 1 fails the workflow.

### Scenario 7: Malformed ID

A spec file contains `FOO_1_AC-1` (underscore instead of hyphen). `awa check` reports an ID format error.

### Scenario 8: Duplicate references

Two different source files both contain `@awa-impl: CFG-1_AC-1`. `awa check` reports a warning about the duplicate implementation reference, helping developers spot accidental copy-paste or unclear ownership of acceptance criteria.

## Change Log

- 1.0.0 (2026-02-27): Initial feature context
