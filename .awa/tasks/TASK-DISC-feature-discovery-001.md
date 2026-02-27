# Implementation Tasks

FEATURE: Feature Flag Discovery
SOURCE: PLAN-004-awa-features.md

## Phase 1: Specifications

- [ ] T-DISC-001 Create feature context document → .awa/specs/FEAT-DISC-feature-discovery.md
- [ ] T-DISC-002 Create requirements specification → .awa/specs/REQ-DISC-feature-discovery.md
- [ ] T-DISC-003 Create design specification → .awa/specs/DESIGN-DISC-feature-discovery.md

## Phase 2: Setup

- [ ] T-DISC-004 Add features subcommand skeleton to CLI → src/cli/index.ts
- [ ] T-DISC-005 Initialize features module structure → src/core/features/

## Phase 3: Feature Scanning [MUST]

GOAL: Scan template files and extract feature flag references
TEST CRITERIA: All it.features.includes('...') patterns found; flags listed with files

- [ ] T-DISC-010 [DISC-1] Implement feature scanner — regex scan of template files for feature flag references → src/core/features/scanner.ts
      IMPLEMENTS: DISC-1_AC-1
- [ ] T-DISC-011 [DISC-2] Extract flag names from it.features.includes(...) and it.features.indexOf(...) patterns → src/core/features/scanner.ts
      IMPLEMENTS: DISC-2_AC-1
- [ ] T-DISC-012 [DISC-3] Aggregate results — each flag with list of files that reference it → src/core/features/scanner.ts
      IMPLEMENTS: DISC-3_AC-1
- [ ] T-DISC-013 [P] [DISC-1] Test scanner finds feature flags in template files → src/core/features/__tests__/scanner.test.ts
      TESTS: DISC-1_AC-1, DISC-2_AC-1
- [ ] T-DISC-014 [P] [DISC-3] Test aggregation of flags to files → src/core/features/__tests__/scanner.test.ts
      TESTS: DISC-3_AC-1

## Phase 4: Template Source Support [MUST]

GOAL: Features command works with local and remote template sources
TEST CRITERIA: --template ./local and --template owner/repo both resolve and scan

- [ ] T-DISC-020 [DISC-4] Integrate template resolver for features command — reuse existing resolver → src/commands/features.ts
      IMPLEMENTS: DISC-4_AC-1, DISC-5_AC-1
- [ ] T-DISC-021 [P] [DISC-4] Test features command with local template source → src/commands/__tests__/features.test.ts
      TESTS: DISC-4_AC-1, DISC-5_AC-1

## Phase 5: JSON and Presets [SHOULD]

GOAL: Support --json output and include preset definitions from config
TEST CRITERIA: JSON output valid; presets from .awa.toml shown alongside discovered flags

- [ ] T-DISC-030 [DISC-6] Implement JSON output mode for features reporter → src/core/features/reporter.ts
      IMPLEMENTS: DISC-6_AC-1
- [ ] T-DISC-031 [DISC-7] Read preset definitions from .awa.toml if available → src/core/features/reporter.ts
      IMPLEMENTS: DISC-7_AC-1
- [ ] T-DISC-032 [P] [DISC-6] Test JSON output format → src/core/features/__tests__/reporter.test.ts
      TESTS: DISC-6_AC-1
- [ ] T-DISC-033 [P] [DISC-7] Test preset inclusion from config → src/core/features/__tests__/reporter.test.ts
      TESTS: DISC-7_AC-1

## Phase 6: Documentation

- [ ] T-DISC-040 Update CLI reference with features command → docs/CLI.md
- [ ] T-DISC-041 Update README.md features list → README.md
- [ ] T-DISC-042 Update ARCHITECTURE.md with FeatureScanner component → .awa/specs/ARCHITECTURE.md

---

## Dependencies

DISC-1 → (none)
DISC-2 → DISC-1 (extraction depends on scanning)
DISC-3 → DISC-2 (display depends on extraction)
DISC-4 → DISC-1 (scanning logic needed before template source integration)
DISC-5 → DISC-4 (same resolution logic)
DISC-6 → DISC-3 (JSON serializes same results)
DISC-7 → (none) (reads config independently)

## Parallel Opportunities

Phase 3: T-DISC-013, T-DISC-014 can run parallel after T-DISC-010, T-DISC-011, T-DISC-012
Phase 5: T-DISC-030, T-DISC-031 can run parallel; T-DISC-032, T-DISC-033 can run parallel

## Trace Summary

| AC | Task | Test |
|----|------|------|
| DISC-1_AC-1 | T-DISC-010 | T-DISC-013 |
| DISC-2_AC-1 | T-DISC-011 | T-DISC-013 |
| DISC-3_AC-1 | T-DISC-012 | T-DISC-014 |
| DISC-4_AC-1 | T-DISC-020 | T-DISC-021 |
| DISC-5_AC-1 | T-DISC-020 | T-DISC-021 |
| DISC-6_AC-1 | T-DISC-030 | T-DISC-032 |
| DISC-7_AC-1 | T-DISC-031 | T-DISC-033 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
