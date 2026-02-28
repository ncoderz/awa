# Implementation Tasks

FEATURE: JSON Output
SOURCE: PLAN-009-json-output.md

## Phase 1: Specifications

- [x] T-JSON-001 Create feature context document → .awa/specs/FEAT-JSON-json-output.md
- [x] T-JSON-002 Create requirements specification → .awa/specs/REQ-JSON-json-output.md
- [x] T-JSON-003 Create design specification → .awa/specs/DESIGN-JSON-json-output.md

## Phase 2: Setup

- [x] T-JSON-004 Add --json and --summary flags to generate command → src/cli/index.ts
- [x] T-JSON-005 [P] Add --json and --summary flags to diff command → src/cli/index.ts

## Phase 3: Foundation

- [x] T-JSON-006 Define JSON output types (GenerationJSON, DiffJSON, counts) → src/types/index.ts

## Phase 4: JSON Serialization [MUST]

GOAL: Convert GenerationResult and DiffResult to structured JSON output
TEST CRITERIA: Valid JSON to stdout; includes actions/diffs arrays and counts

- [x] T-JSON-010 [JSON-1] Implement JSON serializer for GenerationResult (actions array, counts) → src/core/json-output.ts
      IMPLEMENTS: JSON-1_AC-1, JSON-3_AC-1
- [x] T-JSON-011 [P] [JSON-2] Implement JSON serializer for DiffResult (diffs array, counts) → src/core/json-output.ts
      IMPLEMENTS: JSON-2_AC-1, JSON-4_AC-1
- [x] T-JSON-012 [P] [JSON-1] Test generate JSON output structure and validity → src/core/__tests__/json-output.test.ts
      TESTS: JSON-1_AC-1, JSON-3_AC-1
- [x] T-JSON-013 [P] [JSON-2] Test diff JSON output structure and validity → src/core/__tests__/json-output.test.ts
      TESTS: JSON-2_AC-1, JSON-4_AC-1

## Phase 5: Output Control [MUST]

GOAL: Suppress interactive output when --json active; --json implies --dry-run for generate
TEST CRITERIA: No spinners or prompts with --json; JSON to stdout, errors to stderr

- [x] T-JSON-020 [JSON-6] Suppress @clack/prompts intro/outro and set Logger to silent when --json in generate → src/commands/generate.ts
      IMPLEMENTS: JSON-6_AC-1
- [x] T-JSON-021 [P] [JSON-6] Suppress interactive output in diff command when --json → src/commands/diff.ts
      IMPLEMENTS: JSON-6_AC-1
- [x] T-JSON-022 [JSON-7] Enforce --json implies --dry-run for generate command → src/commands/generate.ts
      IMPLEMENTS: JSON-7_AC-1
- [x] T-JSON-023 [JSON-8] Write JSON to stdout; errors to stderr → src/core/json-output.ts
      IMPLEMENTS: JSON-8_AC-1
- [x] T-JSON-024 [P] [JSON-6] Test --json suppresses interactive output and implies --dry-run → src/commands/__tests__/generate.test.ts
      TESTS: JSON-6_AC-1, JSON-7_AC-1
- [x] T-JSON-025 [P] [JSON-8] Test stdout/stderr separation → src/commands/__tests__/generate.test.ts
      TESTS: JSON-8_AC-1

## Phase 6: Summary Mode [SHOULD]

GOAL: Compact one-line counts-only output
TEST CRITERIA: --summary shows counts only on single line

- [x] T-JSON-030 [JSON-5] Implement summary formatter for generate and diff commands → src/core/json-output.ts
      IMPLEMENTS: JSON-5_AC-1
- [x] T-JSON-031 [P] [JSON-5] Test summary output format → src/core/__tests__/json-output.test.ts
      TESTS: JSON-5_AC-1

## Phase 7: Documentation

- [x] T-JSON-040 Update CLI reference with --json and --summary options → docs/CLI.md
- [x] T-JSON-041 Add CI Integration section with JSON output examples → docs/CLI.md
- [x] T-JSON-042 Update README.md features list → README.md
- [x] T-JSON-043 Update ARCHITECTURE.md mentioning JSON output → .awa/specs/ARCHITECTURE.md

---

## Dependencies

JSON-1 → (none)
JSON-2 → (none)
JSON-3 → JSON-1 (structure details of generate JSON)
JSON-4 → JSON-2 (structure details of diff JSON)
JSON-5 → (none)
JSON-6 → (none)
JSON-7 → JSON-1 (implies --dry-run when serializing generate results)
JSON-8 → JSON-1, JSON-2 (output routing for both serializers)

## Parallel Opportunities

Phase 4: T-JSON-010, T-JSON-011 can run in parallel; T-JSON-012, T-JSON-013 can run in parallel
Phase 5: T-JSON-020, T-JSON-021 can run in parallel
Phase 6: Independent of Phase 5

## Cross-Plan Note

PLAN-010 (per-agent config): If both ship, --all --json needs a combined JSON structure wrapping per-target results. Design serializers as composable (per-target result to array of results) from the start.

## Trace Summary

| AC | Task | Test |
|----|------|------|
| JSON-1_AC-1 | T-JSON-010 | T-JSON-012 |
| JSON-2_AC-1 | T-JSON-011 | T-JSON-013 |
| JSON-3_AC-1 | T-JSON-010 | T-JSON-012 |
| JSON-4_AC-1 | T-JSON-011 | T-JSON-013 |
| JSON-5_AC-1 | T-JSON-030 | T-JSON-031 |
| JSON-6_AC-1 | T-JSON-020 | T-JSON-024 |
| JSON-7_AC-1 | T-JSON-022 | T-JSON-024 |
| JSON-8_AC-1 | T-JSON-023 | T-JSON-025 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
