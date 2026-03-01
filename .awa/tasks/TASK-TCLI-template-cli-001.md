# Implementation Tasks

FEATURE: Template CLI Subcommand
SOURCE: REQ-TCLI-template-cli.md, DESIGN-TCLI-template-cli.md

## Phase 1: Foundation

- [ ] T-TCLI-001 Refactor cli/index.ts to create template parent command and nest generate, diff, features, test under it → src/cli/index.ts
- [ ] T-TCLI-002 [P] Remove old top-level generate, diff, features, test commands from root program → src/cli/index.ts

## Phase 2: Template Command Group [MUST]

GOAL: Group template commands under `awa template` subcommand
TEST CRITERIA: `awa template generate`, `awa template diff`, `awa template features`, `awa template test` all work; old top-level commands absent

- [ ] T-TCLI-010 [TCLI-1] Verify template parent command exists with generate, diff, features, test subcommands → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-1_AC-1, TCLI-1_AC-2
- [ ] T-TCLI-011 [P] [TCLI-1] Verify generate subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-1_AC-4
- [ ] T-TCLI-012 [P] [TCLI-1] Verify diff subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-1_AC-5
- [ ] T-TCLI-013 [P] [TCLI-1] Verify features subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-1_AC-6
- [ ] T-TCLI-014 [P] [TCLI-1] Verify test subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-1_AC-7
- [ ] T-TCLI-015 [TCLI-2] Verify init alias works under template group → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-2_AC-1, TCLI-2_AC-2
- [ ] T-TCLI-016 [TCLI-1] Verify `awa template` without subcommand shows help → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-1_AC-3
  TESTS: TCLI_P-2

## Phase 3: Top-Level Commands and Discovery [MUST]

GOAL: Verify check and trace remain top-level and help shows new structure
TEST CRITERIA: `awa check` and `awa trace` work at root; `awa --help` lists template, check, trace

- [ ] T-TCLI-020 [TCLI-3] Verify check remains a top-level command → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-3_AC-1, TCLI-3_AC-3
  TESTS: TCLI_P-3
- [ ] T-TCLI-021 [P] [TCLI-3] Verify trace remains a top-level command → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-3_AC-2, TCLI-3_AC-4
  TESTS: TCLI_P-3
- [ ] T-TCLI-022 [TCLI-4] Verify root help lists template, check, trace → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-4_AC-1
- [ ] T-TCLI-023 [P] [TCLI-4] Verify template help lists subcommands → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-4_AC-2
- [ ] T-TCLI-024 [TCLI-5] Verify old top-level commands are removed → src/cli/__tests__/index.test.ts
  IMPLEMENTS: TCLI-5_AC-1, TCLI-5_AC-2, TCLI-5_AC-3, TCLI-5_AC-4
  TESTS: TCLI_P-1

## Phase 4: Polish

- [ ] T-TCLI-030 Update CLI documentation (docs/CLI.md) → docs/CLI.md
- [ ] T-TCLI-031 [P] Update package.json dev scripts for new command paths → package.json
- [ ] T-TCLI-032 [P] Update template skill files that reference CLI commands → templates/awa/

---

## Dependencies

TCLI-1 → (none)
TCLI-2 → TCLI-1 (alias on generate subcommand)
TCLI-3 → (none)
TCLI-4 → TCLI-1 (help shows template group)
TCLI-5 → TCLI-1 (old commands removed by restructure)

## Parallel Opportunities

Phase 2: T-TCLI-011, T-TCLI-012, T-TCLI-013, T-TCLI-014 can run parallel after T-TCLI-010
Phase 3: T-TCLI-020, T-TCLI-021 can run parallel; T-TCLI-022, T-TCLI-023, T-TCLI-024 can run parallel after
Phase 4: T-TCLI-030, T-TCLI-031, T-TCLI-032 can all run parallel

## Requirements Traceability

### REQ-TCLI-template-cli.md

- TCLI-1_AC-1 → T-TCLI-010 (T-TCLI-010)
- TCLI-1_AC-2 → T-TCLI-010 (T-TCLI-010)
- TCLI-1_AC-3 → T-TCLI-016 (T-TCLI-016)
- TCLI-1_AC-4 → T-TCLI-011 (T-TCLI-011)
- TCLI-1_AC-5 → T-TCLI-012 (T-TCLI-012)
- TCLI-1_AC-6 → T-TCLI-013 (T-TCLI-013)
- TCLI-1_AC-7 → T-TCLI-014 (T-TCLI-014)
- TCLI-2_AC-1 → T-TCLI-015 (T-TCLI-015)
- TCLI-2_AC-2 → T-TCLI-015 (T-TCLI-015)
- TCLI-3_AC-1 → T-TCLI-020 (T-TCLI-020)
- TCLI-3_AC-2 → T-TCLI-021 (T-TCLI-021)
- TCLI-3_AC-3 → T-TCLI-020 (T-TCLI-020)
- TCLI-3_AC-4 → T-TCLI-021 (T-TCLI-021)
- TCLI-4_AC-1 → T-TCLI-022 (T-TCLI-022)
- TCLI-4_AC-2 → T-TCLI-023 (T-TCLI-023)
- TCLI-5_AC-1 → T-TCLI-024 (T-TCLI-024)
- TCLI-5_AC-2 → T-TCLI-024 (T-TCLI-024)
- TCLI-5_AC-3 → T-TCLI-024 (T-TCLI-024)
- TCLI-5_AC-4 → T-TCLI-024 (T-TCLI-024)
- TCLI_P-1 → T-TCLI-024
- TCLI_P-2 → T-TCLI-016
- TCLI_P-3 → T-TCLI-020, T-TCLI-021

UNCOVERED: (none)

