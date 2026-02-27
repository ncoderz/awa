# Implementation Tasks

FEATURE: Template Testing
SOURCE: PLAN-005-template-testing.md

## Phase 1: Specifications

- [ ] T-TTST-001 Create feature context document → .awa/specs/FEAT-TTST-template-test.md
- [ ] T-TTST-002 Create requirements specification → .awa/specs/REQ-TTST-template-test.md
- [ ] T-TTST-003 Create design specification → .awa/specs/DESIGN-TTST-template-test.md

## Phase 2: Setup

- [ ] T-TTST-004 Add test subcommand skeleton to CLI → src/cli/index.ts
- [ ] T-TTST-005 Initialize template-test module structure → src/core/template-test/

## Phase 3: Foundation

- [ ] T-TTST-006 Define fixture TOML format types (features, presets, remove-features, expected-files) → src/core/template-test/types.ts
- [ ] T-TTST-007 Define test result types (pass, fail, details per fixture) → src/core/template-test/types.ts

## Phase 4: Test Execution [MUST]

GOAL: Discover fixtures, render templates per fixture, verify expected files exist
TEST CRITERIA: Fixtures discovered; templates rendered; file existence asserted; pass/fail reported

- [ ] T-TTST-010 [TTST-1] Implement fixture loader — discover and parse _tests/*.toml files → src/core/template-test/fixture-loader.ts
      IMPLEMENTS: TTST-1_AC-1
- [ ] T-TTST-011 [TTST-2] Parse fixture TOML: features, presets, remove-features, expected-files → src/core/template-test/fixture-loader.ts
      IMPLEMENTS: TTST-2_AC-1
- [ ] T-TTST-012 [TTST-3] Implement test runner — render templates per fixture to temp dir using existing generator → src/core/template-test/runner.ts
      IMPLEMENTS: TTST-3_AC-1
- [ ] T-TTST-013 [TTST-4] Implement file existence assertion against expected-files list → src/core/template-test/runner.ts
      IMPLEMENTS: TTST-4_AC-1
- [ ] T-TTST-014 [TTST-6] Implement reporter — pass/fail summary per fixture with details → src/core/template-test/reporter.ts
      IMPLEMENTS: TTST-6_AC-1
- [ ] T-TTST-015 [TTST-7] Set exit code 0 for all pass, 1 for failures → src/commands/test.ts
      IMPLEMENTS: TTST-7_AC-1
- [ ] T-TTST-016 [TTST-8] Ensure _tests/ directory excluded from template output (underscore convention) → src/core/generator.ts
      IMPLEMENTS: TTST-8_AC-1
- [ ] T-TTST-017 [P] [TTST-1] Test fixture discovery from _tests/ directory → src/core/template-test/__tests__/fixture-loader.test.ts
      TESTS: TTST-1_AC-1, TTST-2_AC-1
- [ ] T-TTST-018 [P] [TTST-3] Test template rendering per fixture and file existence assertion → src/core/template-test/__tests__/runner.test.ts
      TESTS: TTST-3_AC-1, TTST-4_AC-1, TTST-8_AC-1
- [ ] T-TTST-019 [P] [TTST-7] Test exit code reflects pass/fail results → src/commands/__tests__/test.test.ts
      TESTS: TTST-6_AC-1, TTST-7_AC-1

## Phase 5: Snapshots [SHOULD]

GOAL: Support snapshot comparison with --update-snapshots
TEST CRITERIA: Rendered output compared to stored snapshots; --update-snapshots refreshes them

- [ ] T-TTST-020 [TTST-5] Implement snapshot manager — compare rendered output against _tests/{name}/ snapshot dirs → src/core/template-test/snapshot.ts
      IMPLEMENTS: TTST-5_AC-1
- [ ] T-TTST-021 [TTST-5] Add --update-snapshots flag to test command → src/cli/index.ts
      IMPLEMENTS: TTST-5_AC-1
- [ ] T-TTST-022 [P] [TTST-5] Test snapshot comparison and update → src/core/template-test/__tests__/snapshot.test.ts
      TESTS: TTST-5_AC-1

## Phase 6: Documentation

- [ ] T-TTST-030 Update CLI reference with test command → docs/CLI.md
- [ ] T-TTST-031 Create template testing guide → docs/TEMPLATE_TESTING.md
- [ ] T-TTST-032 Update TEMPLATE_ENGINE.md with _tests/ convention → docs/TEMPLATE_ENGINE.md
- [ ] T-TTST-033 Update README.md features list → README.md
- [ ] T-TTST-034 Update ARCHITECTURE.md with TestRunner component → .awa/specs/ARCHITECTURE.md
- [ ] T-TTST-035 Create sample fixtures for bundled awa template → templates/awa/_tests/

---

## Dependencies

TTST-1 → (none)
TTST-2 → TTST-1 (parsing depends on discovery)
TTST-3 → TTST-2 (rendering depends on parsed fixtures)
TTST-4 → TTST-3 (assertion depends on rendered output)
TTST-5 → TTST-3 (snapshots compare rendered output)
TTST-6 → TTST-4 (reporting depends on assertion results)
TTST-7 → TTST-6 (exit code depends on reports)
TTST-8 → (none)

## Parallel Opportunities

Phase 4: T-TTST-010, T-TTST-016 can run in parallel; T-TTST-017, T-TTST-018, T-TTST-019 can run parallel
Phase 5: T-TTST-020, T-TTST-021 can run in parallel

## Trace Summary

| AC | Task | Test |
|----|------|------|
| TTST-1_AC-1 | T-TTST-010 | T-TTST-017 |
| TTST-2_AC-1 | T-TTST-011 | T-TTST-017 |
| TTST-3_AC-1 | T-TTST-012 | T-TTST-018 |
| TTST-4_AC-1 | T-TTST-013 | T-TTST-018 |
| TTST-5_AC-1 | T-TTST-020 | T-TTST-022 |
| TTST-6_AC-1 | T-TTST-014 | T-TTST-019 |
| TTST-7_AC-1 | T-TTST-015 | T-TTST-019 |
| TTST-8_AC-1 | T-TTST-016 | T-TTST-018 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
