# Implementation Tasks

FEATURE: Validate Command
SOURCE: PLAN-002-awa-validate.md

## Phase 1: Specifications

- [x] T-VAL-001 Create feature context document → .awa/specs/FEAT-VAL-validate.md
- [x] T-VAL-002 Create requirements specification → .awa/specs/REQ-VAL-validate.md
- [x] T-VAL-003 Create design specification → .awa/specs/DESIGN-VAL-validate.md

## Phase 2: Setup

- [x] T-VAL-004 Initialize validate module structure → src/core/validate/
- [x] T-VAL-005 Add validate subcommand skeleton to CLI → src/cli/index.ts

## Phase 3: Foundation

- [x] T-VAL-006 Define validate config types (ValidateConfig, marker names, globs) → src/types/index.ts
- [x] T-VAL-007 Define ValidateError variants → src/core/validate/errors.ts
- [x] T-VAL-008 Define validation result types (findings, severity, report) → src/core/validate/types.ts

## Phase 4: Code-to-Spec Validation [MUST]

GOAL: Scan source files for traceability markers and match against spec IDs
TEST CRITERIA: Orphaned markers detected; uncovered ACs reported; exit code reflects results

- [x] T-VAL-010 [VAL-2] Implement spec parser — extract REQ IDs, AC IDs, property IDs, component names from spec files → src/core/validate/spec-parser.ts
      IMPLEMENTS: VAL-2_AC-1
- [x] T-VAL-011 [VAL-1] Implement marker scanner — find @awa-impl, @awa-test, @awa-component in source files → src/core/validate/marker-scanner.ts
      IMPLEMENTS: VAL-1_AC-1
- [x] T-VAL-012 [VAL-3] Implement code-to-spec checker — link markers to spec IDs, report orphaned markers → src/core/validate/code-spec-checker.ts
      IMPLEMENTS: VAL-3_AC-1
- [x] T-VAL-013 [VAL-4] Report uncovered ACs (spec ACs with no @awa-test reference) → src/core/validate/code-spec-checker.ts
      IMPLEMENTS: VAL-4_AC-1
- [x] T-VAL-014 [VAL-6] Validate ID format conventions against configurable regex → src/core/validate/code-spec-checker.ts
      IMPLEMENTS: VAL-6_AC-1
- [x] T-VAL-015 [VAL-8] Set exit code 0 for clean, 1 for errors found → src/commands/validate.ts
      IMPLEMENTS: VAL-8_AC-1
- [x] T-VAL-016 [P] [VAL-1] Test marker scanner extracts markers correctly → src/core/validate/__tests__/marker-scanner.test.ts
      TESTS: VAL-1_AC-1
- [x] T-VAL-017 [P] [VAL-2] Test spec parser extracts all ID types → src/core/validate/__tests__/spec-parser.test.ts
      TESTS: VAL-2_AC-1
- [x] T-VAL-018 [P] [VAL-3] Test orphaned marker and uncovered AC detection → src/core/validate/__tests__/code-spec-checker.test.ts
      TESTS: VAL-3_AC-1, VAL-4_AC-1
- [x] T-VAL-019 [P] [VAL-6] Test ID format validation → src/core/validate/__tests__/code-spec-checker.test.ts
      TESTS: VAL-6_AC-1

## Phase 5: Spec-to-Spec Validation [MUST]

GOAL: Validate cross-references between spec files
TEST CRITERIA: Broken DESIGN→REQ references detected; orphaned specs warned

- [x] T-VAL-020 [VAL-5] Implement spec-to-spec checker — validate IMPLEMENTS/VALIDATES references resolve to real REQ IDs → src/core/validate/spec-spec-checker.ts
      IMPLEMENTS: VAL-5_AC-1
- [x] T-VAL-021 [VAL-7] Report orphaned spec files as warnings → src/core/validate/spec-spec-checker.ts
      IMPLEMENTS: VAL-7_AC-1
- [x] T-VAL-022 [P] [VAL-5] Test broken cross-reference detection → src/core/validate/__tests__/spec-spec-checker.test.ts
      TESTS: VAL-5_AC-1
- [x] T-VAL-023 [P] [VAL-7] Test orphaned spec warning → src/core/validate/__tests__/spec-spec-checker.test.ts
      TESTS: VAL-7_AC-1

## Phase 6: JSON Output [SHOULD]

GOAL: Support --format json for CI consumption
TEST CRITERIA: JSON output valid and parseable; text output is default

- [x] T-VAL-030 [VAL-9] Implement reporter with text and JSON output modes → src/core/validate/reporter.ts
      IMPLEMENTS: VAL-9_AC-1
- [x] T-VAL-031 [VAL-9] Add --format option to validate CLI command → src/cli/index.ts
      IMPLEMENTS: VAL-9_AC-1
- [x] T-VAL-032 [P] [VAL-9] Test JSON output format → src/core/validate/__tests__/reporter.test.ts
      TESTS: VAL-9_AC-1

## Phase 7: Configurability [SHOULD]

GOAL: All validate behavior configurable via .awa.toml [validate] section
TEST CRITERIA: Custom markers, globs, patterns work; defaults match awa workflow

- [x] T-VAL-040 Restructure config loader to support nested TOML tables ([validate] section) → src/core/config.ts
      IMPLEMENTS: VAL-11_AC-1, VAL-12_AC-1, VAL-13_AC-1, VAL-14_AC-1, VAL-15_AC-1, VAL-16_AC-1
- [x] T-VAL-041 [VAL-10] Add --ignore CLI option for path exclusion → src/cli/index.ts
      IMPLEMENTS: VAL-10_AC-1
- [x] T-VAL-042 [VAL-11] Support configurable marker names in scanner → src/core/validate/marker-scanner.ts
      IMPLEMENTS: VAL-11_AC-1
- [x] T-VAL-043 [VAL-12] Support configurable spec file globs → src/core/validate/spec-parser.ts
      IMPLEMENTS: VAL-12_AC-1
- [x] T-VAL-044 [VAL-13] Support configurable code file globs → src/core/validate/marker-scanner.ts
      IMPLEMENTS: VAL-13_AC-1
- [x] T-VAL-045 [VAL-14] Support configurable ID pattern regex → src/core/validate/code-spec-checker.ts
      IMPLEMENTS: VAL-14_AC-1
- [x] T-VAL-046 [VAL-15] Support configurable cross-reference patterns → src/core/validate/spec-spec-checker.ts
      IMPLEMENTS: VAL-15_AC-1
- [x] T-VAL-047 [VAL-16] Ensure all config has defaults matching bundled awa workflow → src/core/validate/types.ts
      IMPLEMENTS: VAL-16_AC-1
- [x] T-VAL-048 [P] [VAL-11] Test custom marker names → src/core/validate/__tests__/marker-scanner.test.ts
      TESTS: VAL-11_AC-1
- [x] T-VAL-049 [P] [VAL-16] Test default config works out of box → src/commands/__tests__/validate.test.ts
      TESTS: VAL-10_AC-1, VAL-12_AC-1, VAL-13_AC-1, VAL-14_AC-1, VAL-15_AC-1, VAL-16_AC-1

## Phase 8: Template Integration [COULD]

GOAL: Update awa workflow templates to run awa validate after changes
TEST CRITERIA: Updated skill/prompt partials instruct validate usage

- [x] T-VAL-060 [VAL-1] Update awa-code skill/prompt to run validate after implementation → templates/awa/_partials/_cmd.awa-code.md
      IMPLEMENTS: VAL-1_AC-2
- [x] T-VAL-061 [P] [VAL-5] Update awa-requirements skill/prompt to validate ID format → templates/awa/_partials/_cmd.awa-requirements.md
      IMPLEMENTS: VAL-5_AC-2
- [x] T-VAL-062 [P] [VAL-5] Update awa-design skill/prompt to validate cross-references → templates/awa/_partials/_cmd.awa-design.md
      IMPLEMENTS: VAL-5_AC-3
- [x] T-VAL-063 [P] [VAL-1] Update awa-refactor skill/prompt to validate markers preserved → templates/awa/_partials/_cmd.awa-refactor.md
      IMPLEMENTS: VAL-1_AC-3

## Phase 9: Documentation

- [x] T-VAL-070 Update CLI reference with validate command → docs/CLI.md
- [x] T-VAL-071 Create traceability validation guide → docs/TRACEABILITY_VALIDATION.md
- [x] T-VAL-072 Update README.md features list → README.md
- [x] T-VAL-073 Update ARCHITECTURE.md with Validate components → .awa/specs/ARCHITECTURE.md

---

## Dependencies

VAL-1 → (none)
VAL-2 → (none)
VAL-3 → VAL-1, VAL-2 (needs markers and spec IDs to compare)
VAL-4 → VAL-1, VAL-2 (needs markers and spec IDs to find uncovered)
VAL-5 → VAL-2 (needs parsed spec IDs)
VAL-6 → (none)
VAL-7 → VAL-2 (needs parsed spec IDs)
VAL-8 → VAL-3 (needs checker results for exit code)
VAL-9 → VAL-3 (needs results to serialize)
VAL-10 → (none)
VAL-11 → VAL-1 (extends scanner with config)
VAL-12 → VAL-2 (extends parser with config)
VAL-13 → VAL-1 (extends scanner with config)
VAL-14 → VAL-6 (extends ID validation with config)
VAL-15 → VAL-5 (extends spec checker with config)
VAL-16 → VAL-11, VAL-12, VAL-13, VAL-14, VAL-15 (defaults for all config)

## Parallel Opportunities

Phase 4: T-VAL-010, T-VAL-011 can run in parallel; T-VAL-016, T-VAL-017 can run in parallel
Phase 5: T-VAL-020, T-VAL-021 can run in parallel after Phase 4
Phase 7: T-VAL-042, T-VAL-043, T-VAL-044, T-VAL-045, T-VAL-046 can run parallel after T-VAL-040
Phase 8: T-VAL-060, T-VAL-061, T-VAL-062, T-VAL-063 all parallelizable

## Trace Summary

| AC | Task | Test |
|----|------|------|
| VAL-1_AC-1 | T-VAL-011 | T-VAL-016 |
| VAL-1_AC-2 | T-VAL-060 | — |
| VAL-1_AC-3 | T-VAL-063 | — |
| VAL-2_AC-1 | T-VAL-010 | T-VAL-017 |
| VAL-3_AC-1 | T-VAL-012 | T-VAL-018 |
| VAL-4_AC-1 | T-VAL-013 | T-VAL-018 |
| VAL-5_AC-1 | T-VAL-020 | T-VAL-022 |
| VAL-5_AC-2 | T-VAL-061 | — |
| VAL-5_AC-3 | T-VAL-062 | — |
| VAL-6_AC-1 | T-VAL-014 | T-VAL-019 |
| VAL-7_AC-1 | T-VAL-021 | T-VAL-023 |
| VAL-8_AC-1 | T-VAL-015 | T-VAL-049 |
| VAL-9_AC-1 | T-VAL-030 | T-VAL-032 |
| VAL-10_AC-1 | T-VAL-041 | T-VAL-049 |
| VAL-11_AC-1 | T-VAL-042 | T-VAL-048 |
| VAL-12_AC-1 | T-VAL-043 | T-VAL-049 |
| VAL-13_AC-1 | T-VAL-044 | T-VAL-049 |
| VAL-14_AC-1 | T-VAL-045 | T-VAL-049 |
| VAL-15_AC-1 | T-VAL-046 | T-VAL-049 |
| VAL-16_AC-1 | T-VAL-047 | T-VAL-049 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
