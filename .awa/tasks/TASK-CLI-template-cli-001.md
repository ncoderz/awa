# Implementation Tasks

FEATURE: Template CLI Subcommand
SOURCE: REQ-CLI-cli.md, DESIGN-CLI-cli.md

## Phase 1: Foundation

- [ ] T-TCLI-001 Refactor cli/index.ts to create template parent command and nest generate, diff, features, test under it → src/cli/index.ts
- [ ] T-TCLI-002 [P] Remove old top-level generate, diff, features, test commands from root program → src/cli/index.ts

## Phase 2: Template Command Group [MUST]

GOAL: Group template commands under `awa template` subcommand
TEST CRITERIA: `awa template generate`, `awa template diff`, `awa template features`, `awa template test` all work; old top-level commands absent

- [ ] T-TCLI-010 [CLI-41] Verify template parent command exists with generate, diff, features, test subcommands → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-41_AC-1, CLI-41_AC-2
- [ ] T-TCLI-011 [P] [CLI-41] Verify generate subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-41_AC-4
- [ ] T-TCLI-012 [P] [CLI-41] Verify diff subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-41_AC-5
- [ ] T-TCLI-013 [P] [CLI-41] Verify features subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-41_AC-6
- [ ] T-TCLI-014 [P] [CLI-41] Verify test subcommand accepts same options as before → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-41_AC-7
- [ ] T-TCLI-015 [CLI-42] Verify init alias works under template group → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-42_AC-1, CLI-42_AC-2
- [ ] T-TCLI-016 [CLI-41] Verify `awa template` without subcommand shows help → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-41_AC-3
  TESTS: CLI_P-21

## Phase 3: Top-Level Commands and Discovery [MUST]

GOAL: Verify check and trace remain top-level and help shows new structure
TEST CRITERIA: `awa check` and `awa trace` work at root; `awa --help` lists template, check, trace

- [ ] T-TCLI-020 [CLI-43] Verify check remains a top-level command → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-43_AC-1, CLI-43_AC-3
  TESTS: CLI_P-22
- [ ] T-TCLI-021 [P] [CLI-43] Verify trace remains a top-level command → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-43_AC-2, CLI-43_AC-4
  TESTS: CLI_P-22
- [ ] T-TCLI-022 [CLI-44] Verify root help lists template, check, trace → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-44_AC-1
- [ ] T-TCLI-023 [P] [CLI-44] Verify template help lists subcommands → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-44_AC-2
- [ ] T-TCLI-024 [CLI-45] Verify old top-level commands are removed → src/cli/__tests__/index.test.ts
  IMPLEMENTS: CLI-45_AC-1, CLI-45_AC-2, CLI-45_AC-3, CLI-45_AC-4
  TESTS: CLI_P-20

## Phase 4: Polish

- [ ] T-TCLI-030 Update CLI documentation (docs/CLI.md) → docs/CLI.md
- [ ] T-TCLI-031 [P] Update package.json dev scripts for new command paths → package.json
- [ ] T-TCLI-032 [P] Update template skill files that reference CLI commands → templates/awa/

---

## Dependencies

CLI-41 → (none)
CLI-42 → CLI-41 (alias on generate subcommand)
CLI-43 → (none)
CLI-44 → CLI-41 (help shows template group)
CLI-45 → CLI-41 (old commands removed by restructure)

## Parallel Opportunities

Phase 2: T-TCLI-011, T-TCLI-012, T-TCLI-013, T-TCLI-014 can run parallel after T-TCLI-010
Phase 3: T-TCLI-020, T-TCLI-021 can run parallel; T-TCLI-022, T-TCLI-023, T-TCLI-024 can run parallel after
Phase 4: T-TCLI-030, T-TCLI-031, T-TCLI-032 can all run parallel

## Requirements Traceability

### REQ-CLI-cli.md

- CLI-41_AC-1 → T-TCLI-010
- CLI-41_AC-2 → T-TCLI-010
- CLI-41_AC-3 → T-TCLI-016
- CLI-41_AC-4 → T-TCLI-011
- CLI-41_AC-5 → T-TCLI-012
- CLI-41_AC-6 → T-TCLI-013
- CLI-41_AC-7 → T-TCLI-014
- CLI-42_AC-1 → T-TCLI-015
- CLI-42_AC-2 → T-TCLI-015
- CLI-43_AC-1 → T-TCLI-020
- CLI-43_AC-2 → T-TCLI-021
- CLI-43_AC-3 → T-TCLI-020
- CLI-43_AC-4 → T-TCLI-021
- CLI-44_AC-1 → T-TCLI-022
- CLI-44_AC-2 → T-TCLI-023
- CLI-45_AC-1 → T-TCLI-024
- CLI-45_AC-2 → T-TCLI-024
- CLI-45_AC-3 → T-TCLI-024
- CLI-45_AC-4 → T-TCLI-024
- CLI_P-20 → T-TCLI-024
- CLI_P-21 → T-TCLI-016
- CLI_P-22 → T-TCLI-020, T-TCLI-021
