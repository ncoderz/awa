# Implementation Tasks

FEATURE: Init Command Alias
SOURCE: PLAN-001-awa-init.md

## Phase 1: Specifications

- [x] T-INIT-001 Create feature context document → .awa/specs/FEAT-INIT-init-alias.md
- [x] T-INIT-002 Create requirements specification → .awa/specs/REQ-INIT-init-alias.md
- [x] T-INIT-003 Create design specification → .awa/specs/DESIGN-INIT-init-alias.md

## Phase 2: Alias Registration [MUST]

GOAL: Register init as an alias for the generate command with identical behavior
TEST CRITERIA: `awa init .` produces identical output to `awa generate .`; help shows both

- [x] T-INIT-010 [INIT-1] Add `.alias('init')` to generate command definition → src/cli/index.ts
      IMPLEMENTS: INIT-1_AC-1, INIT-2_AC-1, INIT-3_AC-1
- [x] T-INIT-011 [INIT-4] Verify help output lists both init and generate commands → src/cli/index.ts
      IMPLEMENTS: INIT-4_AC-1
- [x] T-INIT-012 [P] [INIT-1] Test init alias produces identical behavior to generate → src/commands/__tests__/generate.test.ts
      TESTS: INIT-1_AC-1, INIT-2_AC-1, INIT-3_AC-1
- [x] T-INIT-013 [P] [INIT-4] Test help output shows both commands → src/commands/__tests__/generate.test.ts
      TESTS: INIT-4_AC-1

## Phase 3: Config Hint [SHOULD]

GOAL: Display a hint when no .awa.toml is found and not using --config
TEST CRITERIA: Info-level message logged when config file absent

- [x] T-INIT-020 [INIT-5] Add config-not-found info hint in command handler → src/commands/generate.ts
      IMPLEMENTS: INIT-5_AC-1
- [x] T-INIT-021 [P] [INIT-5] Test config hint displays when no config file → src/commands/__tests__/generate.test.ts
      TESTS: INIT-5_AC-1

## Phase 4: Documentation

- [x] T-INIT-030 Update CLI reference with init alias documentation → docs/CLI.md
- [x] T-INIT-031 Update Quick Start to use `awa init` as primary example → README.md
- [x] T-INIT-032 Update CLI Layer section to mention init alias → .awa/specs/ARCHITECTURE.md

---

## Dependencies

INIT-1 → (none)
INIT-2 → INIT-1 (alias must exist to accept options)
INIT-3 → INIT-1 (alias must exist to behave identically)
INIT-4 → INIT-1 (alias must exist to appear in help)
INIT-5 → (none)

## Parallel Opportunities

Phase 2: T-INIT-012, T-INIT-013 can run parallel after T-INIT-010, T-INIT-011
Phase 3: Independent of Phase 2

## Trace Summary

| AC | Task | Test |
|----|------|------|
| INIT-1_AC-1 | T-INIT-010 | T-INIT-012 |
| INIT-2_AC-1 | T-INIT-010 | T-INIT-012 |
| INIT-3_AC-1 | T-INIT-010 | T-INIT-012 |
| INIT-4_AC-1 | T-INIT-011 | T-INIT-013 |
| INIT-5_AC-1 | T-INIT-020 | T-INIT-021 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
