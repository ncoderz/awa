# Implementation Tasks

FEATURE: Requirement Deprecation
SOURCE: REQ-DEP-deprecated.md, DESIGN-DEP-deprecated.md

## Phase 1: Setup

- [x] T-DEP-001 Create deprecated-parser module file → src/core/check/deprecated-parser.ts
- [x] T-DEP-002 [P] Create reservation-checker module file → src/core/check/reservation-checker.ts
- [x] T-DEP-003 [P] Create deprecated-parser test file → src/core/check/__tests__/deprecated-parser.test.ts
- [x] T-DEP-004 [P] Create reservation-checker test file → src/core/check/__tests__/reservation-checker.test.ts

## Phase 2: Foundation

- [x] T-DEP-005 Add DeprecatedResult type and deprecated flag to CheckConfig → src/core/check/types.ts
- [x] T-DEP-006 Add deprecated-ref and deprecated-id-conflict to FindingCode union → src/core/check/types.ts
- [x] T-DEP-007 Add deprecated field to DEFAULT_CHECK_CONFIG (default: false) → src/core/check/types.ts
- [x] T-DEP-008 Add deprecated field to RawCheckOptions → src/core/check/types.ts

## Phase 3: Deprecated File Parsing [MUST]

GOAL: Parse the tombstone file to extract all deprecated IDs grouped by feature code
TEST CRITERIA: Parser extracts IDs from valid file, returns empty set when file missing

- [x] T-DEP-010 [DEP-1] Implement parseDeprecated function — read file, split by H1 headings, extract comma-separated IDs → src/core/check/deprecated-parser.ts
  IMPLEMENTS: DEP-1_AC-1, DEP-1_AC-2, DEP-2_AC-1, DEP-2_AC-2
- [x] T-DEP-011 [DEP-1] Handle missing file — return empty set when DEPRECATED.md does not exist → src/core/check/deprecated-parser.ts
  IMPLEMENTS: DEP-1_AC-3
- [x] T-DEP-012 [P] [DEP-1] Test parsing valid deprecated file with multiple code sections → src/core/check/__tests__/deprecated-parser.test.ts
  TESTS: DEP-1_AC-1, DEP-1_AC-2, DEP-2_AC-1, DEP-2_AC-2
- [x] T-DEP-013 [P] [DEP-1] Test empty set when file does not exist → src/core/check/__tests__/deprecated-parser.test.ts
  TESTS: DEP_P-5
- [x] T-DEP-014 [P] [DEP-1] Test file contains no natural language (only IDs parsed, not prose) → src/core/check/__tests__/deprecated-parser.test.ts
  TESTS: DEP-2_AC-3

## Phase 4: ID Reservation [MUST]

GOAL: Detect and report conflicts between active spec IDs and deprecated IDs
TEST CRITERIA: Every ID present in both active specs and deprecated set produces an error

- [x] T-DEP-020 [DEP-4] Implement checkReservations — compare active IDs against deprecated set, emit deprecated-id-conflict errors → src/core/check/reservation-checker.ts
  IMPLEMENTS: DEP-4_AC-1, DEP-4_AC-2
- [x] T-DEP-021 [P] [DEP-4] Test conflict detection for requirement, AC, property, and component IDs → src/core/check/__tests__/reservation-checker.test.ts
  TESTS: DEP_P-3
- [x] T-DEP-022 [P] [DEP-4] Test no findings when no overlap between active and deprecated sets → src/core/check/__tests__/reservation-checker.test.ts
  TESTS: DEP-4_AC-1

## Phase 5: Coverage Suppression [MUST]

GOAL: Exclude deprecated IDs from all coverage and orphan checks by default
TEST CRITERIA: No coverage findings for deprecated IDs; no orphan findings without --deprecated

- [x] T-DEP-030 [DEP-3] Extend checkCodeAgainstSpec — add deprecatedIds parameter, skip deprecated IDs in uncovered-ac, unimplemented-ac, uncovered-property, uncovered-component checks → src/core/check/code-spec-checker.ts
  IMPLEMENTS: DEP-3_AC-1, DEP-3_AC-2, DEP-3_AC-3
- [x] T-DEP-031 [DEP-3] Extend checkSpecAgainstSpec — add deprecatedIds parameter, skip deprecated ACs in unlinked-ac check, skip ACs belonging to deprecated requirements → src/core/check/spec-spec-checker.ts
  IMPLEMENTS: DEP-3_AC-1, DEP-3_AC-4
- [x] T-DEP-032 [P] [DEP-3] Test coverage suppression completeness — no uncovered/unimplemented/unlinked findings for deprecated IDs → src/core/check/__tests__/code-spec-checker.test.ts
  TESTS: DEP_P-1
- [x] T-DEP-033 [P] [DEP-3] Test unlinked-ac suppression for deprecated requirements and their ACs → src/core/check/__tests__/spec-spec-checker.test.ts
  TESTS: DEP_P-1

## Phase 6: Silent Default and Deprecated Flag [MUST]

GOAL: Suppress deprecated-ref findings by default, surface them as warnings with --deprecated
TEST CRITERIA: Without flag, no orphan/cross-ref findings for deprecated IDs; with flag, deprecated-ref warnings emitted

- [x] T-DEP-040 [DEP-5] Extend checkCodeAgainstSpec — skip orphaned-marker for deprecated IDs when --deprecated is not active → src/core/check/code-spec-checker.ts
  IMPLEMENTS: DEP-5_AC-1
- [x] T-DEP-041 [DEP-5] Extend checkSpecAgainstSpec — skip broken-cross-ref and IMPLEMENTS errors for deprecated IDs when --deprecated is not active → src/core/check/spec-spec-checker.ts
  IMPLEMENTS: DEP-5_AC-2, DEP-5_AC-3
- [x] T-DEP-042 [DEP-6] Emit deprecated-ref warnings in code-spec-checker when --deprecated is active and marker references deprecated ID → src/core/check/code-spec-checker.ts
  IMPLEMENTS: DEP-6_AC-2
- [x] T-DEP-043 [DEP-6] Emit deprecated-ref warnings in spec-spec-checker when --deprecated is active and cross-ref targets deprecated ID → src/core/check/spec-spec-checker.ts
  IMPLEMENTS: DEP-6_AC-3
- [x] T-DEP-044 [DEP-6] Add --deprecated option to check command CLI definition → src/cli/index.ts
  IMPLEMENTS: DEP-6_AC-1
- [x] T-DEP-045 [DEP-6] Wire deprecated flag through CheckCommand — parse option, invoke DeprecatedParser, pass set to all checkers and ReservationChecker → src/commands/check.ts
  IMPLEMENTS: DEP-6_AC-1, DEP-6_AC-4
- [x] T-DEP-046 [P] [DEP-5] Test silent default — no findings for deprecated IDs without --deprecated → src/core/check/__tests__/code-spec-checker.test.ts
  TESTS: DEP_P-2
- [x] T-DEP-047 [P] [DEP-5] Test silent default for spec-spec-checker without --deprecated → src/core/check/__tests__/spec-spec-checker.test.ts
  TESTS: DEP_P-2
- [x] T-DEP-048 [P] [DEP-6] Test deprecated-ref warnings emitted with --deprecated flag → src/core/check/__tests__/code-spec-checker.test.ts
  TESTS: DEP_P-4
- [x] T-DEP-049 [P] [DEP-6] Test deprecated-ref warnings for cross-refs with --deprecated flag → src/core/check/__tests__/spec-spec-checker.test.ts
  TESTS: DEP_P-4

## Phase 7: Schema Validation [SHOULD]

GOAL: Validate the deprecated file against DEPRECATED.schema.yaml
TEST CRITERIA: Schema errors reported when file does not conform to expected structure

- [x] T-DEP-050 [DEP-7] Add DEPRECATED.schema.yaml to spec globs so SchemaChecker discovers it → src/core/check/types.ts
  IMPLEMENTS: DEP-7_AC-1, DEP-7_AC-2
- [x] T-DEP-051 [P] [DEP-7] Test schema validation catches malformed deprecated file → src/core/check/__tests__/deprecated-parser.test.ts
  TESTS: DEP-7_AC-1, DEP-7_AC-2

## Phase 8: Polish

- [x] T-DEP-060 Integration test: check with deprecated file present, no --deprecated flag → src/commands/__tests__/check.test.ts
- [x] T-DEP-061 [P] Integration test: check with --deprecated flag surfaces warnings → src/commands/__tests__/check.test.ts
- [x] T-DEP-062 [P] Integration test: check without deprecated file behaves identically to before → src/commands/__tests__/check.test.ts

## Phase 9: Documentation

- [x] T-DEP-070 Update README with deprecated file and --deprecated flag documentation → README.md
- [x] T-DEP-071 [P] Update awa.core.md template with deprecated file in file descriptions (already done in specs phase) → templates/awa/_partials/awa.core.md

---

## Dependencies

DEP-1 → (none)
DEP-2 → (none)
DEP-3 → DEP-1 (needs deprecated set from parser)
DEP-4 → DEP-1 (needs deprecated set from parser)
DEP-5 → DEP-1, DEP-3 (extends coverage suppression logic)
DEP-6 → DEP-5 (flag toggles the silent behavior)
DEP-7 → (none, uses existing schema infrastructure)

## Parallel Opportunities

Phase 1: T-DEP-002, T-DEP-003, T-DEP-004 can run parallel after T-DEP-001
Phase 2: T-DEP-006, T-DEP-007, T-DEP-008 can run parallel after T-DEP-005
Phase 3: T-DEP-012, T-DEP-013, T-DEP-014 can run parallel after T-DEP-010, T-DEP-011
Phase 4: T-DEP-021, T-DEP-022 can run parallel after T-DEP-020
Phase 5: T-DEP-032, T-DEP-033 can run parallel after T-DEP-030, T-DEP-031
Phase 6: T-DEP-046, T-DEP-047, T-DEP-048, T-DEP-049 can run parallel after T-DEP-040 through T-DEP-045
Phase 8: T-DEP-061, T-DEP-062 can run parallel after T-DEP-060

## Requirements Traceability

### REQ-DEP-deprecated.md

- DEP-1_AC-1 → T-DEP-010 (T-DEP-012)
- DEP-1_AC-2 → T-DEP-010 (T-DEP-012)
- DEP-1_AC-3 → T-DEP-011
- DEP-2_AC-1 → T-DEP-010 (T-DEP-012)
- DEP-2_AC-2 → T-DEP-010 (T-DEP-012)
- DEP-2_AC-3 → (none) (T-DEP-014)
- DEP-3_AC-1 → T-DEP-030, T-DEP-031
- DEP-3_AC-2 → T-DEP-030
- DEP-3_AC-3 → T-DEP-030
- DEP-3_AC-4 → T-DEP-031
- DEP-4_AC-1 → T-DEP-020 (T-DEP-022)
- DEP-4_AC-2 → T-DEP-020
- DEP-5_AC-1 → T-DEP-040
- DEP-5_AC-2 → T-DEP-041
- DEP-5_AC-3 → T-DEP-041
- DEP-6_AC-1 → T-DEP-044, T-DEP-045
- DEP-6_AC-2 → T-DEP-042
- DEP-6_AC-3 → T-DEP-043
- DEP-6_AC-4 → T-DEP-045
- DEP-7_AC-1 → T-DEP-050 (T-DEP-051)
- DEP-7_AC-2 → T-DEP-050 (T-DEP-051)
- DEP_P-1 → T-DEP-032, T-DEP-033
- DEP_P-2 → T-DEP-046, T-DEP-047
- DEP_P-3 → T-DEP-021
- DEP_P-4 → T-DEP-048, T-DEP-049
- DEP_P-5 → T-DEP-013
