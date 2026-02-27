# Implementation Tasks

FEATURE: Validate Command
SOURCE: PLAN-002-awa-check.md

## Phase 1: Specifications

- [x] T-CHK-001 Create feature context document → .awa/specs/FEAT-CHK-check.md
- [x] T-CHK-002 Create requirements specification → .awa/specs/REQ-CHK-check.md
- [x] T-CHK-003 Create design specification → .awa/specs/DESIGN-CHK-check.md

## Phase 2: Setup

- [x] T-CHK-004 Initialize validate module structure → src/core/check/
- [x] T-CHK-005 Add validate subcommand skeleton to CLI → src/cli/index.ts

## Phase 3: Foundation

- [x] T-CHK-006 Define validate config types (CheckConfig, marker names, globs) → src/types/index.ts
- [x] T-CHK-007 Define CheckError variants → src/core/check/errors.ts
- [x] T-CHK-008 Define validation result types (findings, severity, report) → src/core/check/types.ts

## Phase 4: Code-to-Spec Validation [MUST]

GOAL: Scan source files for traceability markers and match against spec IDs
TEST CRITERIA: Orphaned markers detected; uncovered ACs reported; exit code reflects results

- [x] T-CHK-010 [CHK-2] Implement spec parser — extract REQ IDs, AC IDs, property IDs, component names from spec files → src/core/check/spec-parser.ts
      IMPLEMENTS: CHK-2_AC-1
- [x] T-CHK-011 [CHK-1] Implement marker scanner — find @awa-impl, @awa-test, @awa-component in source files → src/core/check/marker-scanner.ts
      IMPLEMENTS: CHK-1_AC-1
- [x] T-CHK-012 [CHK-3] Implement code-to-spec checker — link markers to spec IDs, report orphaned markers → src/core/check/code-spec-checker.ts
      IMPLEMENTS: CHK-3_AC-1
- [x] T-CHK-013 [CHK-4] Report uncovered ACs (spec ACs with no @awa-test reference) → src/core/check/code-spec-checker.ts
      IMPLEMENTS: CHK-4_AC-1
- [x] T-CHK-014 [CHK-6] Validate ID format conventions against configurable regex → src/core/check/code-spec-checker.ts
      IMPLEMENTS: CHK-6_AC-1
- [x] T-CHK-015 [CHK-8] Set exit code 0 for clean, 1 for errors found → src/commands/check.ts
      IMPLEMENTS: CHK-8_AC-1
- [x] T-CHK-016 [P] [CHK-1] Test marker scanner extracts markers correctly → src/core/check/__tests__/marker-scanner.test.ts
      TESTS: CHK-1_AC-1
- [x] T-CHK-017 [P] [CHK-2] Test spec parser extracts all ID types → src/core/check/__tests__/spec-parser.test.ts
      TESTS: CHK-2_AC-1
- [x] T-CHK-018 [P] [CHK-3] Test orphaned marker and uncovered AC detection → src/core/check/__tests__/code-spec-checker.test.ts
      TESTS: CHK-3_AC-1, CHK-4_AC-1
- [x] T-CHK-019 [P] [CHK-6] Test ID format validation → src/core/check/__tests__/code-spec-checker.test.ts
      TESTS: CHK-6_AC-1

## Phase 5: Spec-to-Spec Validation [MUST]

GOAL: Validate cross-references between spec files
TEST CRITERIA: Broken DESIGN→REQ references detected; orphaned specs warned

- [x] T-CHK-020 [CHK-5] Implement spec-to-spec checker — validate IMPLEMENTS/VALIDATES references resolve to real REQ IDs → src/core/check/spec-spec-checker.ts
      IMPLEMENTS: CHK-5_AC-1
- [x] T-CHK-021 [CHK-7] Report orphaned spec files as warnings → src/core/check/spec-spec-checker.ts
      IMPLEMENTS: CHK-7_AC-1
- [x] T-CHK-022 [P] [CHK-5] Test broken cross-reference detection → src/core/check/__tests__/spec-spec-checker.test.ts
      TESTS: CHK-5_AC-1
- [x] T-CHK-023 [P] [CHK-7] Test orphaned spec warning → src/core/check/__tests__/spec-spec-checker.test.ts
      TESTS: CHK-7_AC-1

## Phase 6: JSON Output [SHOULD]

GOAL: Support --format json for CI consumption
TEST CRITERIA: JSON output valid and parseable; text output is default

- [x] T-CHK-030 [CHK-9] Implement reporter with text and JSON output modes → src/core/check/reporter.ts
      IMPLEMENTS: CHK-9_AC-1
- [x] T-CHK-031 [CHK-9] Add --format option to validate CLI command → src/cli/index.ts
      IMPLEMENTS: CHK-9_AC-1
- [x] T-CHK-032 [P] [CHK-9] Test JSON output format → src/core/check/__tests__/reporter.test.ts
      TESTS: CHK-9_AC-1

## Phase 7: Configurability [SHOULD]

GOAL: All validate behavior configurable via .awa.toml [check] section
TEST CRITERIA: Custom markers, globs, patterns work; defaults match awa workflow

- [x] T-CHK-040 Restructure config loader to support nested TOML tables ([check] section) → src/core/config.ts
      IMPLEMENTS: CHK-11_AC-1, CHK-12_AC-1, CHK-13_AC-1, CHK-14_AC-1, CHK-15_AC-1, CHK-16_AC-1
- [x] T-CHK-041 [CHK-10] Add --ignore CLI option for path exclusion → src/cli/index.ts
      IMPLEMENTS: CHK-10_AC-1
- [x] T-CHK-042 [CHK-11] Support configurable marker names in scanner → src/core/check/marker-scanner.ts
      IMPLEMENTS: CHK-11_AC-1
- [x] T-CHK-043 [CHK-12] Support configurable spec file globs → src/core/check/spec-parser.ts
      IMPLEMENTS: CHK-12_AC-1
- [x] T-CHK-044 [CHK-13] Support configurable code file globs → src/core/check/marker-scanner.ts
      IMPLEMENTS: CHK-13_AC-1
- [x] T-CHK-045 [CHK-14] Support configurable ID pattern regex → src/core/check/code-spec-checker.ts
      IMPLEMENTS: CHK-14_AC-1
- [x] T-CHK-046 [CHK-15] Support configurable cross-reference patterns → src/core/check/spec-spec-checker.ts
      IMPLEMENTS: CHK-15_AC-1
- [x] T-CHK-047 [CHK-16] Ensure all config has defaults matching bundled awa workflow → src/core/check/types.ts
      IMPLEMENTS: CHK-16_AC-1
- [x] T-CHK-048 [P] [CHK-11] Test custom marker names → src/core/check/__tests__/marker-scanner.test.ts
      TESTS: CHK-11_AC-1
- [x] T-CHK-049 [P] [CHK-16] Test default config works out of box → src/commands/__tests__/check.test.ts
      TESTS: CHK-10_AC-1, CHK-12_AC-1, CHK-13_AC-1, CHK-14_AC-1, CHK-15_AC-1, CHK-16_AC-1

## Phase 8: Template Integration [COULD]

GOAL: Update awa workflow templates to run awa check after changes
TEST CRITERIA: Updated skill/prompt partials instruct validate usage

- [x] T-CHK-060 [CHK-1] Update awa-code skill/prompt to run validate after implementation → templates/awa/_partials/_cmd.awa-code.md
      IMPLEMENTS: CHK-1_AC-2
- [x] T-CHK-061 [P] [CHK-5] Update awa-requirements skill/prompt to validate ID format → templates/awa/_partials/_cmd.awa-requirements.md
      IMPLEMENTS: CHK-5_AC-2
- [x] T-CHK-062 [P] [CHK-5] Update awa-design skill/prompt to validate cross-references → templates/awa/_partials/_cmd.awa-design.md
      IMPLEMENTS: CHK-5_AC-3
- [x] T-CHK-063 [P] [CHK-1] Update awa-refactor skill/prompt to validate markers preserved → templates/awa/_partials/_cmd.awa-refactor.md
      IMPLEMENTS: CHK-1_AC-3

## Phase 9: Documentation

- [x] T-CHK-070 Update CLI reference with check command → docs/CLI.md
- [x] T-CHK-071 Create traceability validation guide → docs/TRACEABILITY_VALIDATION.md
- [x] T-CHK-072 Update README.md features list → README.md
- [x] T-CHK-073 Update ARCHITECTURE.md with Validate components → .awa/specs/ARCHITECTURE.md

---

## Dependencies

CHK-1 → (none)
CHK-2 → (none)
CHK-3 → CHK-1, CHK-2 (needs markers and spec IDs to compare)
CHK-4 → CHK-1, CHK-2 (needs markers and spec IDs to find uncovered)
CHK-5 → CHK-2 (needs parsed spec IDs)
CHK-6 → (none)
CHK-7 → CHK-2 (needs parsed spec IDs)
CHK-8 → CHK-3 (needs checker results for exit code)
CHK-9 → CHK-3 (needs results to serialize)
CHK-10 → (none)
CHK-11 → CHK-1 (extends scanner with config)
CHK-12 → CHK-2 (extends parser with config)
CHK-13 → CHK-1 (extends scanner with config)
CHK-14 → CHK-6 (extends ID validation with config)
CHK-15 → CHK-5 (extends spec checker with config)
CHK-16 → CHK-11, CHK-12, CHK-13, CHK-14, CHK-15 (defaults for all config)

## Parallel Opportunities

Phase 4: T-CHK-010, T-CHK-011 can run in parallel; T-CHK-016, T-CHK-017 can run in parallel
Phase 5: T-CHK-020, T-CHK-021 can run in parallel after Phase 4
Phase 7: T-CHK-042, T-CHK-043, T-CHK-044, T-CHK-045, T-CHK-046 can run parallel after T-CHK-040
Phase 8: T-CHK-060, T-CHK-061, T-CHK-062, T-CHK-063 all parallelizable

## Trace Summary

| AC | Task | Test |
|----|------|------|
| CHK-1_AC-1 | T-CHK-011 | T-CHK-016 |
| CHK-1_AC-2 | T-CHK-060 | — |
| CHK-1_AC-3 | T-CHK-063 | — |
| CHK-2_AC-1 | T-CHK-010 | T-CHK-017 |
| CHK-3_AC-1 | T-CHK-012 | T-CHK-018 |
| CHK-4_AC-1 | T-CHK-013 | T-CHK-018 |
| CHK-5_AC-1 | T-CHK-020 | T-CHK-022 |
| CHK-5_AC-2 | T-CHK-061 | — |
| CHK-5_AC-3 | T-CHK-062 | — |
| CHK-6_AC-1 | T-CHK-014 | T-CHK-019 |
| CHK-7_AC-1 | T-CHK-021 | T-CHK-023 |
| CHK-8_AC-1 | T-CHK-015 | T-CHK-049 |
| CHK-9_AC-1 | T-CHK-030 | T-CHK-032 |
| CHK-10_AC-1 | T-CHK-041 | T-CHK-049 |
| CHK-11_AC-1 | T-CHK-042 | T-CHK-048 |
| CHK-12_AC-1 | T-CHK-043 | T-CHK-049 |
| CHK-13_AC-1 | T-CHK-044 | T-CHK-049 |
| CHK-14_AC-1 | T-CHK-045 | T-CHK-049 |
| CHK-15_AC-1 | T-CHK-046 | T-CHK-049 |
| CHK-16_AC-1 | T-CHK-047 | T-CHK-049 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
