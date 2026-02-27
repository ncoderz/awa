# PLAN-002: `awa validate` — Traceability Chain Verification

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — no existing specs

## Problem

awa's traceability chain (`@awa-impl`, `@awa-test`, `@awa-component`) relies on the AI following instructions. Nothing verifies the chain is complete or consistent. Markers could reference non-existent IDs. ACs could lack test coverage. Cross-references between spec files (DESIGN IMPLEMENTS → REQ IDs) are also unchecked.

## Goal

`awa validate` deterministically checks two dimensions:
1. **Code ↔ Spec**: traceability markers in source resolve to real spec IDs, and spec ACs have test coverage
2. **Spec ↔ Spec**: cross-references between spec files are valid (e.g., DESIGN IMPLEMENTS references exist in REQ, ID formats are correct)

Fully configurable — users with custom templates can define their own marker names, spec globs, and code globs. Defaults match the bundled awa workflow. Runnable in CI.



## Workflow Steps

### 1. FEAT

Create `FEAT-VAL-validate.md` — problem: traceability is honour-system; validate makes it enforceable.

Key scenarios:
- Clean project: all markers resolve, all ACs covered → exit 0
- Orphaned marker: `@awa-impl: FOO-1_AC-1` but FOO-1_AC-1 doesn't exist in specs → error
- Missing coverage: AC exists in spec but no `@awa-test` references it → warning
- Cross-reference: DESIGN references REQ IDs that don't exist → error
- Custom workflow: user uses `@trace-impl` instead of `@awa-impl`, configures in `.awa.toml`
- Custom spec location: user keeps specs in `docs/specs/` instead of `.awa/specs/`

### 2. REQUIREMENTS

Create `REQ-VAL-validate.md`:

- VAL-1: Validate command scans source files for traceability markers
- VAL-2: Validate command parses spec files for requirement IDs, AC IDs, property IDs, component names
- VAL-3: Validate command reports orphaned markers (code → non-existent spec)
- VAL-4: Validate command reports uncovered ACs (spec → no test)
- VAL-5: Validate command reports broken cross-references (DESIGN IMPLEMENTS → non-existent REQ ID)
- VAL-6: Validate command validates ID format conventions (configurable regex, default: `{CODE}-{n}`, `{CODE}-{n}.{p}`, `{CODE}-{n}_AC-{m}`, `{CODE}_P-{n}`)
- VAL-7: Validate command reports orphaned spec files (spec with CODE not referenced by any other spec or code) — WARNING level only, not error; specs for planned-but-not-yet-implemented features are expected
- VAL-8: Exit code 0 = clean, 1 = errors found
- VAL-9: Support `--format json` for CI consumption
- VAL-10: Support `--ignore` patterns for excluding paths
- VAL-11: Marker names are configurable via `.awa.toml` (default: `@awa-impl`, `@awa-test`, `@awa-component`)
- VAL-12: Spec file globs are configurable via `.awa.toml` (default: `.awa/specs/**/*.md`)
- VAL-13: Code file globs are configurable via `.awa.toml` (default: `src/**/*.{ts,js,tsx,jsx,py,go,rs,java,cs}`)
- VAL-14: ID pattern regex is configurable via `.awa.toml` (default: matches `{CODE}-{n}`, `{CODE}-{n}.{p}`, `{CODE}-{n}_AC-{m}`, `{CODE}_P-{n}`)
- VAL-15: Cross-reference patterns are configurable (default: `IMPLEMENTS:` and `VALIDATES:` in DESIGN files)
- VAL-16: All configuration has sensible defaults matching the bundled awa template workflow

### 3. DESIGN

Create `DESIGN-VAL-validate.md`:

- VAL-ConfigLoader: Read validate config from `[validate]` section of `.awa.toml`
- VAL-SpecParser: Parse spec files matching configured globs to extract IDs (regex-based)
- VAL-MarkerScanner: Scan code files matching configured globs for configured marker names
- VAL-CodeSpecChecker: Match code markers against spec IDs, report orphaned markers and uncovered ACs
- VAL-SpecSpecChecker: Match cross-references between spec files (DESIGN IMPLEMENTS → REQ), validate ID format
- VAL-Reporter: Output results (text, JSON)
- Architecture: config → scanner → parser → [code↔spec checker, spec↔spec checker] → reporter pipeline

Config schema in `.awa.toml`:
```toml
[validate]
spec-globs = [".awa/specs/**/*.md"]
code-globs = ["src/**/*.{ts,js,tsx,jsx}"]
ignore = ["node_modules/**", "dist/**"]
markers = ["@awa-impl", "@awa-test", "@awa-component"]
id-pattern = "([A-Z]+-\\d+(?:\\.\\d+)?(?:_AC-\\d+)?|[A-Z]+_P-\\d+)"
```

All fields optional — defaults match the bundled awa workflow.

### 4. TASKS

- Define `[validate]` config schema in type definitions
- Restructure config loader to support nested TOML tables (`[validate]` is a table, not a flat key — current loader only handles flat keys; requires new nested-table parsing logic, not just adding to `knownKeys`)
- Create spec parser (extract IDs from files matching spec-globs)
- Create marker scanner (find configured markers in files matching code-globs)
- Create code↔spec checker (link markers to IDs, report orphans and uncovered ACs)
- Create spec↔spec checker (validate DESIGN IMPLEMENTS/VALIDATES references exist in REQ, validate ID format)
- Create reporter (text + JSON output)
- Add `validate` subcommand to CLI
- Support `--ignore` CLI override
- Unit tests for parser, scanner, both checkers with default and custom configs
- Integration test for validate command with default awa markers
- Integration test with custom marker names
- Integration test for spec↔spec cross-reference validation

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `awa validate` reference
- New doc: `docs/TRACEABILITY_VALIDATION.md` — what it checks, configuration options, how to customize for non-awa workflows
- Update `README.md` features list
- Website: Add validate to CLI reference, new guide page on traceability validation
- Update ARCHITECTURE.md with Validate component

### 7. TEMPLATE INTEGRATION

Update awa workflow templates (skills and prompts) to run `awa validate` as a consistency check after changes:

- Update `awa-code` skill/prompt: after implementing code and tests, run `awa validate` and fix any orphaned markers or uncovered ACs before considering the task complete
- Update `awa-requirements` skill/prompt: after writing/updating REQ specs, run `awa validate --format json` to check ID format and cross-references
- Update `awa-design` skill/prompt: after writing/updating DESIGN specs, run `awa validate` to verify IMPLEMENTS/VALIDATES references resolve to real REQ IDs
- Update `awa-refactor` skill/prompt: after refactoring, run `awa validate` to ensure traceability markers weren't lost or broken
- Add validate as a gate: skills should instruct the LLM to treat validation errors as blocking (fix before completing the task)
- Template files affected: `_partials/_cmd.awa-code.md`, `_cmd.awa-design.md`, `_cmd.awa-requirements.md`, `_cmd.awa-refactor.md` and corresponding `_skill.*` partials

## Phasing

This is the largest plan (16 requirements, 6 design components, template integration). Recommended phases:
1. **Phase 1**: Code↔spec validation (VAL-1 through VAL-4, VAL-6, VAL-8) — core value
2. **Phase 2**: Spec↔spec validation (VAL-5, VAL-7) and JSON output (VAL-9)
3. **Phase 3**: Configurability (VAL-10 through VAL-16) and template integration (Section 7)

## Prerequisites

- Config loader restructuring to support nested TOML tables (shared with PLAN-010)

## Risks

- Spec file parsing is fragile if file formats vary — configurable ID pattern mitigates this
- Performance on large codebases — respect `.gitignore` and `--ignore` patterns
- Distinguishing warnings vs errors (missing coverage vs broken reference)
- Config complexity: too many knobs can overwhelm users — defaults must "just work" for awa users

## Completion Criteria

- `awa validate` works out of the box with zero config for default awa workflow
- Code↔spec validation: orphaned markers and uncovered ACs detected
- Spec↔spec validation: broken cross-references and malformed IDs detected
- Custom marker names, spec globs, code globs all configurable via `.awa.toml`
- JSON output mode works for CI
- False positive rate is acceptably low
- Documentation complete including customization guide
