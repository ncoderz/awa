# Implementation Tasks

FEATURE: Renumber Traceability IDs
SOURCE: REQ-RENUM-renumber.md, DESIGN-RENUM-renumber.md

## Phase 1: Setup

- [ ] T-RENUM-001 Create renumber module directory structure → src/core/renumber/

## Phase 2: Foundation

- [ ] T-RENUM-002 Define core types: RenumberMap, AffectedFile, Replacement, RenumberResult, RenumberCommandOptions, MalformedWarning → src/core/renumber/types.ts
- [ ] T-RENUM-003 [P] Define RenumberError variants: CODE_NOT_FOUND, NO_ARGS, WRITE_FAILED → src/core/renumber/types.ts

## Phase 3: Map Building [MUST]

GOAL: Build renumber map from REQ and DESIGN document order assigning sequential IDs
TEST CRITERIA: Requirements renumbered sequentially, subreqs and ACs renumbered within parent, properties renumbered from DESIGN, no-change detected when already sequential

- [ ] T-RENUM-010 [RENUM-1] Implement buildRenumberMap: walk REQ file in document order, assign sequential requirement numbers starting from 1 → src/core/renumber/map-builder.ts
  IMPLEMENTS: RENUM-1_AC-1
- [ ] T-RENUM-011 [RENUM-1] Include derived IDs in map: renumber subrequirement suffixes per parent, renumber AC suffixes per parent, update parent prefixes when parent changes → src/core/renumber/map-builder.ts
  IMPLEMENTS: RENUM-1_AC-2, RENUM-2_AC-1, RENUM-2_AC-2, RENUM-3_AC-1, RENUM-3_AC-2
- [ ] T-RENUM-012 [RENUM-1] Detect no-change: return empty map when IDs are already sequential → src/core/renumber/map-builder.ts
  IMPLEMENTS: RENUM-1_AC-3
- [ ] T-RENUM-013 [RENUM-4] Walk DESIGN file in document order for property renumbering → src/core/renumber/map-builder.ts
  IMPLEMENTS: RENUM-4_AC-1
- [ ] T-RENUM-014 [RENUM-4] Skip property renumbering when no DESIGN file exists for the feature code → src/core/renumber/map-builder.ts
  IMPLEMENTS: RENUM-4_AC-2
- [ ] T-RENUM-015 [P] [RENUM-1] Property test: same REQ content always produces same renumber map → src/core/renumber/__tests__/map-builder.test.ts
  TESTS: RENUM_P-1
- [ ] T-RENUM-016 [P] [RENUM-1] Property test: every subrequirement and AC of a renumbered requirement appears in map with updated parent prefix → src/core/renumber/__tests__/map-builder.test.ts
  TESTS: RENUM_P-2
- [ ] T-RENUM-017 [P] [RENUM-1] Property test: already-sequential spec produces empty map → src/core/renumber/__tests__/map-builder.test.ts
  TESTS: RENUM_P-3

## Phase 4: Artifact Propagation [MUST]

GOAL: Apply renumber map across all artifact types with swap-safe replacement
TEST CRITERIA: Spec files updated, code markers updated, cross-refs updated, no swap collisions, only target prefix modified

- [ ] T-RENUM-030 [RENUM-5] Propagate map to spec files (REQ, DESIGN, FEAT, TASK, EXAMPLE, PLAN) and update cross-ref lines (DEPENDS ON, IMPLEMENTS, VALIDATES) → src/core/renumber/propagator.ts
  IMPLEMENTS: RENUM-5_AC-1, RENUM-5_AC-3
- [ ] T-RENUM-031 [RENUM-5] Propagate map to source and test files containing @awa-impl, @awa-test, @awa-component markers → src/core/renumber/propagator.ts
  IMPLEMENTS: RENUM-5_AC-2
- [ ] T-RENUM-032 [RENUM-6] Implement two-pass placeholder replacement: old IDs to placeholders, then placeholders to new IDs → src/core/renumber/propagator.ts
  IMPLEMENTS: RENUM-6_AC-1
- [ ] T-RENUM-033 [RENUM-6] Implement whole-ID boundary matching to avoid partial matches within unrelated tokens → src/core/renumber/propagator.ts
  IMPLEMENTS: RENUM-6_AC-2
- [ ] T-RENUM-034 [P] [RENUM-6] Property test: two-pass replacement never produces intermediate duplicate IDs → src/core/renumber/__tests__/propagator.test.ts
  TESTS: RENUM_P-4
- [ ] T-RENUM-035 [P] [RENUM-6] Property test: only IDs matching target prefix are modified, other prefixes unchanged → src/core/renumber/__tests__/propagator.test.ts
  TESTS: RENUM_P-5

## Phase 5: CLI Command [MUST]

GOAL: Wire renumber as a top-level CLI command with argument validation and exit codes
TEST CRITERIA: `awa renumber CHK` works, `awa renumber --all` works, missing args shows error, missing REQ shows error, exit codes correct

- [ ] T-RENUM-040 [RENUM-9] Implement renumberCommand: validate args, invoke scan, build map, propagate, report → src/commands/renumber.ts
  IMPLEMENTS: RENUM-9_AC-1, RENUM-9_AC-3, RENUM-9_AC-4
- [ ] T-RENUM-041 [RENUM-9] Register renumber command in CLI entry with CODE arg, --all, --dry-run, --json, --config options → src/cli/index.ts
  IMPLEMENTS: RENUM-9_AC-2
- [ ] T-RENUM-042 [RENUM-10] Implement exit codes: 0 when no changes needed, 1 when changes applied or previewed, 2 on error → src/commands/renumber.ts
  IMPLEMENTS: RENUM-10_AC-1
- [ ] T-RENUM-043 [P] [RENUM-10] Property test: exit code is 0/1/2 matching expected scenario → src/commands/__tests__/renumber.test.ts
  TESTS: RENUM_P-6
- [ ] T-RENUM-044 [P] [RENUM-9] Test CLI validation: error on no CODE/--all, error on missing REQ file → src/commands/__tests__/renumber.test.ts
  TESTS: RENUM-9_AC-3, RENUM-9_AC-4

## Phase 6: Output Modes [SHOULD]

GOAL: Support dry-run preview and JSON output for CI integration
TEST CRITERIA: --dry-run shows map and affected files without writing, --json outputs valid JSON

- [ ] T-RENUM-050 [RENUM-7] Implement dry-run text output: renumber map table, affected file list, no file writes → src/core/renumber/reporter.ts
  IMPLEMENTS: RENUM-7_AC-1
- [ ] T-RENUM-051 [P] [RENUM-11] Implement JSON output: structured renumber map and affected files to stdout → src/core/renumber/reporter.ts
  IMPLEMENTS: RENUM-11_AC-1
- [ ] T-RENUM-052 [P] [RENUM-7] Test dry-run and JSON formatting → src/core/renumber/__tests__/reporter.test.ts
  TESTS: RENUM-7_AC-1, RENUM-11_AC-1

## Phase 7: Batch Renumbering [SHOULD]

GOAL: Renumber all feature codes in one invocation via --all
TEST CRITERIA: --all discovers all codes from REQ files, each renumbered independently without cross-code interference

- [ ] T-RENUM-060 [RENUM-8] Discover all feature codes from REQ files for --all mode → src/commands/renumber.ts
  IMPLEMENTS: RENUM-8_AC-1
- [ ] T-RENUM-061 [RENUM-8] Ensure isolated per-code renumbering: each code gets its own map, no cross-code modifications → src/commands/renumber.ts
  IMPLEMENTS: RENUM-8_AC-2
- [ ] T-RENUM-062 [P] [RENUM-8] Test batch discovery and per-code isolation → src/commands/__tests__/renumber.test.ts
  TESTS: RENUM-8_AC-1, RENUM-8_AC-2

## Phase 8: Malformed ID Detection [SHOULD]

GOAL: Detect and warn about malformed ID tokens during renumbering
TEST CRITERIA: Malformed tokens with target prefix detected and reported with location, treated as non-blocking warnings

- [ ] T-RENUM-070 [RENUM-12] Detect tokens matching feature code prefix but not conforming to standard ID format → src/core/renumber/malformed-detector.ts
  IMPLEMENTS: RENUM-12_AC-1
- [ ] T-RENUM-071 [RENUM-12] Report malformed IDs with file path, line number, and invalid token → src/core/renumber/malformed-detector.ts
  IMPLEMENTS: RENUM-12_AC-2
- [ ] T-RENUM-072 [RENUM-12] Treat malformed IDs as warnings: continue renumbering valid IDs → src/core/renumber/malformed-detector.ts
  IMPLEMENTS: RENUM-12_AC-3
- [ ] T-RENUM-073 [P] [RENUM-12] Test malformed token detection, reporting, and warning behavior → src/core/renumber/__tests__/malformed-detector.test.ts
  TESTS: RENUM-12_AC-1, RENUM-12_AC-2, RENUM-12_AC-3

## Phase 9: Polish

- [ ] T-RENUM-080 Integration test: end-to-end single-code renumber with gap closing → src/commands/__tests__/renumber.test.ts
- [ ] T-RENUM-081 [P] Integration test: batch renumber and output modes (--dry-run, --json) → src/commands/__tests__/renumber.test.ts

## Phase 10: Documentation

- [ ] T-RENUM-090 No doc changes — internal CLI addition, no existing user-facing docs to update → README.md

---

## Dependencies

RENUM-1 → (none)
RENUM-2 → RENUM-1 (subreqs derive from parent requirements)
RENUM-3 → RENUM-1 (ACs derive from parent requirements)
RENUM-4 → RENUM-1 (property map uses same builder pattern)
RENUM-5 → RENUM-1 (propagation consumes renumber map)
RENUM-6 → RENUM-1, RENUM-5 (replacement safety applies during propagation)
RENUM-7 → RENUM-5 (dry-run displays propagation results)
RENUM-8 → RENUM-1 (batch runs map builder per code)
RENUM-9 → RENUM-1, RENUM-5 (CLI orchestrates pipeline)
RENUM-10 → RENUM-9 (exit codes returned by command)
RENUM-11 → RENUM-5 (JSON formats propagation results)
RENUM-12 → (none)

## Parallel Opportunities

Phase 2: T-RENUM-002, T-RENUM-003 can run parallel
Phase 3: T-RENUM-015, T-RENUM-016, T-RENUM-017 can run parallel after T-RENUM-014
Phase 4: T-RENUM-034, T-RENUM-035 can run parallel after T-RENUM-033
Phase 5: T-RENUM-043, T-RENUM-044 can run parallel after T-RENUM-042
Phase 6: T-RENUM-051, T-RENUM-052 can run parallel after T-RENUM-050
Phase 7: T-RENUM-062 can run parallel after T-RENUM-061
Phase 8: T-RENUM-073 can run parallel after T-RENUM-072
Phase 9: T-RENUM-080, T-RENUM-081 can run parallel

## Requirements Traceability

### REQ-RENUM-renumber.md

- RENUM-1_AC-1 → T-RENUM-010
- RENUM-1_AC-2 → T-RENUM-011
- RENUM-1_AC-3 → T-RENUM-012
- RENUM-2_AC-1 → T-RENUM-011
- RENUM-2_AC-2 → T-RENUM-011
- RENUM-3_AC-1 → T-RENUM-011
- RENUM-3_AC-2 → T-RENUM-011
- RENUM-4_AC-1 → T-RENUM-013
- RENUM-4_AC-2 → T-RENUM-014
- RENUM-5_AC-1 → T-RENUM-030
- RENUM-5_AC-2 → T-RENUM-031
- RENUM-5_AC-3 → T-RENUM-030
- RENUM-6_AC-1 → T-RENUM-032
- RENUM-6_AC-2 → T-RENUM-033
- RENUM-7_AC-1 → T-RENUM-050 (T-RENUM-052)
- RENUM-8_AC-1 → T-RENUM-060 (T-RENUM-062)
- RENUM-8_AC-2 → T-RENUM-061 (T-RENUM-062)
- RENUM-9_AC-1 → T-RENUM-040
- RENUM-9_AC-2 → T-RENUM-041
- RENUM-9_AC-3 → T-RENUM-040 (T-RENUM-044)
- RENUM-9_AC-4 → T-RENUM-040 (T-RENUM-044)
- RENUM-10_AC-1 → T-RENUM-042
- RENUM-11_AC-1 → T-RENUM-051 (T-RENUM-052)
- RENUM-12_AC-1 → T-RENUM-070 (T-RENUM-073)
- RENUM-12_AC-2 → T-RENUM-071 (T-RENUM-073)
- RENUM-12_AC-3 → T-RENUM-072 (T-RENUM-073)
- RENUM_P-1 → T-RENUM-015
- RENUM_P-2 → T-RENUM-016
- RENUM_P-3 → T-RENUM-017
- RENUM_P-4 → T-RENUM-034
- RENUM_P-5 → T-RENUM-035
- RENUM_P-6 → T-RENUM-043
