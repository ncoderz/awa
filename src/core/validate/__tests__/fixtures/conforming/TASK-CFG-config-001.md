# Implementation Tasks

FEATURE: Configuration System
SOURCE: REQ-CFG-config.md, DESIGN-CFG-config.md

## Phase 1: Setup

- [ ] T-CFG-001 Initialize module structure → src/config/
- [ ] T-CFG-002 [P] Add dependencies (smol-toml) → package.json

## Phase 2: Foundation

- [ ] T-CFG-003 Define Config and RawConfig types → src/config/types.ts
- [ ] T-CFG-004 [P] Define ConfigError variants → src/config/errors.ts

## Phase 3: Config Loading [MUST]

GOAL: Load and merge configuration from file with defaults
TEST CRITERIA: Can load valid TOML, missing keys get defaults

- [ ] T-CFG-010 [CFG-1] Implement load function → src/config/loader.ts
  IMPLEMENTS: CFG-1_AC-1
- [ ] T-CFG-011 [CFG-1] Implement merge function → src/config/loader.ts
  IMPLEMENTS: CFG-1_AC-2
- [ ] T-CFG-012 [P] [CFG-1] Property test for default preservation → tests/config/loader.test.ts
  TESTS: CFG_P-1
- [ ] T-CFG-013 [P] [CFG-1] Test load from valid path → tests/config/loader.test.ts
  TESTS: CFG-1_AC-1

## Phase 4: Config Validation [SHOULD]

GOAL: Validate loaded config against schema
TEST CRITERIA: Invalid config rejected with clear error

- [ ] T-CFG-020 [CFG-2] Implement validate function → src/config/validator.ts
  IMPLEMENTS: CFG-2_AC-1
- [ ] T-CFG-021 [P] [CFG-2] Test schema validation → tests/config/validator.test.ts
  TESTS: CFG-2_AC-1

## Phase 5: Polish

- [ ] T-CFG-030 Integration test: load → validate → use → tests/config/integration.test.ts

---

## Dependencies

CFG-1 → (none)
CFG-2 → CFG-1 (validates loaded config)

## Parallel Opportunities

Phase 3: T-CFG-012, T-CFG-013 can run parallel after T-CFG-011
Phase 4: T-CFG-021 can run parallel with T-CFG-020

## Requirements Traceability

### REQ-CFG-config.md

- CFG-1_AC-1 → T-CFG-010 (T-CFG-013)
- CFG-1_AC-2 → T-CFG-011 (T-CFG-012)
- CFG-2_AC-1 → T-CFG-020 (T-CFG-021)
- CFG_P-1 → T-CFG-012

UNCOVERED: (none)
