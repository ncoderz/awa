# Implementation Tasks

FEATURE: Template Registry
SOURCE: PLAN-008-template-registry.md

## Phase 1: Specifications

- [ ] T-REG-001 Create feature context document → .awa/specs/FEAT-REG-template-registry.md
- [ ] T-REG-002 Create requirements specification → .awa/specs/REQ-REG-template-registry.md
- [ ] T-REG-003 Create design specification → .awa/specs/DESIGN-REG-template-registry.md

## Phase 2: Setup

- [ ] T-REG-004 Add templates subcommand group (list, search, info) to CLI → src/cli/index.ts
- [ ] T-REG-005 Initialize registry module structure → src/core/registry/

## Phase 3: Foundation

- [ ] T-REG-006 Define index format types (RegistryEntry, RegistryIndex) → src/core/registry/types.ts
- [ ] T-REG-007 Define registry error types (FetchError, CacheError) → src/core/registry/types.ts

## Phase 4: Index Fetching [MUST]

GOAL: Fetch and cache remote template index
TEST CRITERIA: Index fetched from URL; cached locally with TTL; --refresh forces re-fetch

- [ ] T-REG-010 [REG-2] Implement index fetcher — HTTP fetch of JSON index from known URL → src/core/registry/fetcher.ts
      IMPLEMENTS: REG-2_AC-1
- [ ] T-REG-011 [REG-6] Implement local cache with TTL (default 1 hour) at ~/.cache/awa/registry.json → src/core/registry/fetcher.ts
      IMPLEMENTS: REG-6_AC-1
- [ ] T-REG-012 [REG-7] Support --refresh flag to force re-fetch of index → src/core/registry/fetcher.ts
      IMPLEMENTS: REG-7_AC-1
- [ ] T-REG-013 [REG-8] Parse index entries including features field pre-populated → src/core/registry/fetcher.ts
      IMPLEMENTS: REG-8_AC-1
- [ ] T-REG-014 [P] [REG-2] Test index fetch and parse → src/core/registry/__tests__/fetcher.test.ts
      TESTS: REG-2_AC-1, REG-8_AC-1
- [ ] T-REG-015 [P] [REG-6] Test cache TTL behavior and refresh → src/core/registry/__tests__/fetcher.test.ts
      TESTS: REG-6_AC-1, REG-7_AC-1

## Phase 5: List and Search [MUST]

GOAL: List all entries and search by keyword
TEST CRITERIA: List shows all entries with name/description/source; search filters by keyword

- [ ] T-REG-020 [REG-1] Implement templates list command — display all entries → src/commands/templates.ts
      IMPLEMENTS: REG-1_AC-1
- [ ] T-REG-021 [REG-3] Display name, description, source for each entry → src/commands/templates.ts
      IMPLEMENTS: REG-3_AC-1
- [ ] T-REG-022 [REG-4] Implement search command — keyword match on name, description, tags → src/core/registry/search.ts
      IMPLEMENTS: REG-4_AC-1
- [ ] T-REG-023 [P] [REG-1] Test list command output → src/commands/__tests__/templates.test.ts
      TESTS: REG-1_AC-1, REG-3_AC-1
- [ ] T-REG-024 [P] [REG-4] Test search filtering by keyword → src/core/registry/__tests__/search.test.ts
      TESTS: REG-4_AC-1

## Phase 6: Info Command [SHOULD]

GOAL: Show detailed info for a single template entry from index data
TEST CRITERIA: Info displays features, description, tags, source from index

- [ ] T-REG-030 [REG-5] Implement templates info command — show details from index → src/commands/templates.ts
      IMPLEMENTS: REG-5_AC-1
- [ ] T-REG-031 [P] [REG-5] Test info command output → src/commands/__tests__/templates.test.ts
      TESTS: REG-5_AC-1

## Phase 7: Index Hosting

- [ ] T-REG-040 Create initial index JSON with bundled awa template and example → website/public/registry.json
- [ ] T-REG-041 [P] Configure index hosting on awa website at known public URL → website/

## Phase 8: Documentation

- [ ] T-REG-050 Update CLI reference with templates command → docs/CLI.md
- [ ] T-REG-051 Create template registry guide (submission process, index format) → docs/TEMPLATE_REGISTRY.md
- [ ] T-REG-052 Update README.md with template discovery section → README.md
- [ ] T-REG-053 Update ARCHITECTURE.md with Registry components → .awa/specs/ARCHITECTURE.md

---

## Dependencies

REG-1 → REG-2 (list needs fetched index)
REG-2 → (none)
REG-3 → REG-1 (display format for list entries)
REG-4 → REG-2 (search operates on fetched index)
REG-5 → REG-2 (info reads from index)
REG-6 → REG-2 (caching wraps fetcher)
REG-7 → REG-6 (refresh clears cache)
REG-8 → REG-2 (index format definition)

## Parallel Opportunities

Phase 4: T-REG-011, T-REG-012, T-REG-013 can run parallel after T-REG-010
Phase 5: T-REG-020, T-REG-022 can run parallel after Phase 4
Phase 7: Independent of Phase 6

## Trace Summary

| AC | Task | Test |
|----|------|------|
| REG-1_AC-1 | T-REG-020 | T-REG-023 |
| REG-2_AC-1 | T-REG-010 | T-REG-014 |
| REG-3_AC-1 | T-REG-021 | T-REG-023 |
| REG-4_AC-1 | T-REG-022 | T-REG-024 |
| REG-5_AC-1 | T-REG-030 | T-REG-031 |
| REG-6_AC-1 | T-REG-011 | T-REG-015 |
| REG-7_AC-1 | T-REG-012 | T-REG-015 |
| REG-8_AC-1 | T-REG-013 | T-REG-014 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
