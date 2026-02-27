# Implementation Tasks

FEATURE: Multi-Target Generation
SOURCE: PLAN-010-per-agent-config.md

## Phase 1: Specifications

- [ ] T-MULTI-001 Create feature context document → .awa/specs/FEAT-MULTI-multi-target.md
- [ ] T-MULTI-002 Create requirements specification → .awa/specs/REQ-MULTI-multi-target.md
- [ ] T-MULTI-003 Create design specification → .awa/specs/DESIGN-MULTI-multi-target.md

## Phase 2: Prerequisites

- [ ] T-MULTI-004 Fix pre-existing CLI || [] bug — remove || [] from CLI handlers so undefined flows to ConfigLoader.merge nullish coalescing → src/cli/index.ts
- [ ] T-MULTI-005 Add regression tests for || [] fix — verify .awa.toml features used when --features not passed → src/core/__tests__/config.test.ts
- [ ] T-MULTI-006 Restructure config loader to support nested TOML tables ([targets.*] sections) → src/core/config.ts

## Phase 3: Setup

- [ ] T-MULTI-007 Add --all and --target CLI options to generate command → src/cli/index.ts
- [ ] T-MULTI-008 [P] Add --all and --target CLI options to diff command → src/cli/index.ts

## Phase 4: Foundation

- [ ] T-MULTI-009 Define TargetConfig type (partial FileConfig excluding boolean flags) → src/types/index.ts
- [ ] T-MULTI-010 [P] Add targets map to FileConfig type → src/types/index.ts
- [ ] T-MULTI-011 Add UNKNOWN_TARGET and NO_TARGETS to ConfigError codes → src/core/config.ts

## Phase 5: Target Resolution [MUST]

GOAL: Parse [targets.*] sections and merge with root config
TEST CRITERIA: Target inherits from root via nullish coalescing; target features replace root

- [ ] T-MULTI-020 [MULTI-1] Parse [targets.*] sections from config into TargetConfig map → src/core/config.ts
      IMPLEMENTS: MULTI-1_AC-1
- [ ] T-MULTI-021 [MULTI-2] Implement target field parsing (output, features, preset, remove-features, template) → src/core/config.ts
      IMPLEMENTS: MULTI-2_AC-1
- [ ] T-MULTI-022 [MULTI-3] Implement target-to-root merge using existing nullish coalescing semantics → src/core/config.ts
      IMPLEMENTS: MULTI-3_AC-1
- [ ] T-MULTI-023 [P] [MULTI-1] Test target section parsing → src/core/__tests__/config.test.ts
      TESTS: MULTI-1_AC-1
- [ ] T-MULTI-024 [P] [MULTI-3] Test target-to-root merge (target replaces root for arrays) → src/core/__tests__/config.test.ts
      TESTS: MULTI-2_AC-1, MULTI-3_AC-1

## Phase 6: Batch Generation [MUST]

GOAL: Process all or specific targets with non-interactive mode
TEST CRITERIA: --all processes all targets; --target processes one; no interactive prompts

- [ ] T-MULTI-030 [MULTI-4] Implement batch runner — iterate targets, invoke generate for each, deduplicate shared template resolution → src/core/batch-runner.ts
      IMPLEMENTS: MULTI-4_AC-1
- [ ] T-MULTI-031 [MULTI-5] Support --target to process a specific target → src/commands/generate.ts
      IMPLEMENTS: MULTI-5_AC-1
- [ ] T-MULTI-032 [MULTI-10] Add nonInteractive option — suppress multiselect prompt in generate command for batch mode → src/commands/generate.ts
      IMPLEMENTS: MULTI-10_AC-1
- [ ] T-MULTI-033 [MULTI-11] Ignore CLI positional [output] when --all; override target output when --target → src/commands/generate.ts
      IMPLEMENTS: MULTI-11_AC-1
- [ ] T-MULTI-034 [MULTI-4] Error with NO_TARGETS when --all used with no [targets.*] sections → src/core/batch-runner.ts
      IMPLEMENTS: MULTI-4_AC-2
- [ ] T-MULTI-035 [MULTI-5] Error with UNKNOWN_TARGET when --target name not found → src/commands/generate.ts
      IMPLEMENTS: MULTI-5_AC-2
- [ ] T-MULTI-036 [P] [MULTI-4] Test batch generation processes all targets → src/core/__tests__/batch-runner.test.ts
      TESTS: MULTI-4_AC-1, MULTI-4_AC-2
- [ ] T-MULTI-037 [P] [MULTI-5] Test single target processing and unknown target error → src/commands/__tests__/generate.test.ts
      TESTS: MULTI-5_AC-1, MULTI-5_AC-2
- [ ] T-MULTI-038 [P] [MULTI-10] Test non-interactive mode suppresses prompts → src/commands/__tests__/generate.test.ts
      TESTS: MULTI-10_AC-1

## Phase 7: Batch Diff [MUST]

GOAL: Diff command supports --all and --target with aggregated exit codes
TEST CRITERIA: diff --all returns 0 if all match, 1 if any differ, 2 on error

- [ ] T-MULTI-040 [MULTI-6] Integrate batch runner with diff command for --all and --target → src/commands/diff.ts
      IMPLEMENTS: MULTI-6_AC-1
- [ ] T-MULTI-041 [MULTI-12] Implement exit code aggregation — 0 all match, 1 any differ, 2 on error → src/commands/diff.ts
      IMPLEMENTS: MULTI-12_AC-1
- [ ] T-MULTI-042 [P] [MULTI-6] Test diff --all processes all targets → src/commands/__tests__/diff.test.ts
      TESTS: MULTI-6_AC-1
- [ ] T-MULTI-043 [P] [MULTI-12] Test diff --all exit code aggregation → src/commands/__tests__/diff.test.ts
      TESTS: MULTI-12_AC-1

## Phase 8: Reporting and Guards [MUST]

GOAL: Per-target reporting with clear labels; backward compatibility; error on missing output
TEST CRITERIA: Log lines prefixed with [target-name]; existing behavior unchanged without flags

- [ ] T-MULTI-050 [MULTI-8] Implement per-target reporter — prefix log lines with [target-name] → src/core/batch-runner.ts
      IMPLEMENTS: MULTI-8_AC-1
- [ ] T-MULTI-051 [MULTI-9] Error with MISSING_OUTPUT naming the target when output unresolvable → src/core/batch-runner.ts
      IMPLEMENTS: MULTI-9_AC-1
- [ ] T-MULTI-052 [MULTI-7] Without --all or --target, existing behavior unchanged (backward compatible) → src/commands/generate.ts
      IMPLEMENTS: MULTI-7_AC-1
- [ ] T-MULTI-053 [P] [MULTI-8] Test per-target log prefixing → src/core/__tests__/batch-runner.test.ts
      TESTS: MULTI-8_AC-1
- [ ] T-MULTI-054 [P] [MULTI-9] Test MISSING_OUTPUT error names target → src/core/__tests__/batch-runner.test.ts
      TESTS: MULTI-9_AC-1
- [ ] T-MULTI-055 [P] [MULTI-7] Test backward compatibility without targets → src/commands/__tests__/generate.test.ts
      TESTS: MULTI-7_AC-1, MULTI-11_AC-1

## Phase 9: Documentation

- [ ] T-MULTI-060 Update CLI reference with --all, --target options → docs/CLI.md
- [ ] T-MULTI-061 Add Multi-Target Configuration section with [targets] examples → docs/CLI.md
- [ ] T-MULTI-062 Update README.md features list → README.md
- [ ] T-MULTI-063 Update ARCHITECTURE.md with TargetResolver and BatchRunner → .awa/specs/ARCHITECTURE.md

---

## Dependencies

MULTI-1 → (none) (config parsing)
MULTI-2 → MULTI-1 (field parsing within targets)
MULTI-3 → MULTI-1 (merge requires parsed targets)
MULTI-4 → MULTI-3 (batch needs resolved targets)
MULTI-5 → MULTI-3 (single target needs resolved target)
MULTI-6 → MULTI-4 (diff batch reuses batch runner)
MULTI-7 → (none) (backward compat is default path)
MULTI-8 → MULTI-4 (reporting wraps batch runner)
MULTI-9 → MULTI-3 (output validation during resolution)
MULTI-10 → MULTI-4 (non-interactive is batch mode behavior)
MULTI-11 → MULTI-4, MULTI-5 (output override logic)
MULTI-12 → MULTI-6 (exit code aggregation for diff batch)

## Parallel Opportunities

Phase 5: T-MULTI-020, T-MULTI-021 can run parallel; T-MULTI-023, T-MULTI-024 can run parallel
Phase 6: T-MULTI-031, T-MULTI-032, T-MULTI-033 can run parallel after T-MULTI-030
Phase 7: Can start after Phase 6 completes
Phase 8: T-MULTI-050, T-MULTI-051, T-MULTI-052 can run parallel

## Cross-Plan Notes

- PLAN-002 (validate): Shares config loader restructuring for nested TOML tables (Phase 2)
- PLAN-009 (json output): --all --json needs combined JSON wrapping per-target results

## Trace Summary

| AC | Task | Test |
|----|------|------|
| MULTI-1_AC-1 | T-MULTI-020 | T-MULTI-023 |
| MULTI-2_AC-1 | T-MULTI-021 | T-MULTI-024 |
| MULTI-3_AC-1 | T-MULTI-022 | T-MULTI-024 |
| MULTI-4_AC-1 | T-MULTI-030 | T-MULTI-036 |
| MULTI-4_AC-2 | T-MULTI-034 | T-MULTI-036 |
| MULTI-5_AC-1 | T-MULTI-031 | T-MULTI-037 |
| MULTI-5_AC-2 | T-MULTI-035 | T-MULTI-037 |
| MULTI-6_AC-1 | T-MULTI-040 | T-MULTI-042 |
| MULTI-7_AC-1 | T-MULTI-052 | T-MULTI-055 |
| MULTI-8_AC-1 | T-MULTI-050 | T-MULTI-053 |
| MULTI-9_AC-1 | T-MULTI-051 | T-MULTI-054 |
| MULTI-10_AC-1 | T-MULTI-032 | T-MULTI-038 |
| MULTI-11_AC-1 | T-MULTI-033 | T-MULTI-055 |
| MULTI-12_AC-1 | T-MULTI-041 | T-MULTI-043 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
