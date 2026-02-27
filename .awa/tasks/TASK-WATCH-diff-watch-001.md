# Implementation Tasks

FEATURE: Diff Watch Mode
SOURCE: PLAN-007-awa-watch.md

## Phase 1: Specifications

- [ ] T-WATCH-001 Create feature context document → .awa/specs/FEAT-WATCH-diff-watch.md
- [ ] T-WATCH-002 Create requirements specification → .awa/specs/REQ-WATCH-diff-watch.md
- [ ] T-WATCH-003 Create design specification → .awa/specs/DESIGN-WATCH-diff-watch.md

## Phase 2: Setup

- [ ] T-WATCH-004 Add --watch flag to diff command CLI definition → src/cli/index.ts

## Phase 3: Foundation

- [ ] T-WATCH-005 Refactor diff command handler — extract diff execution into reusable function that returns exit code without calling process.exit() → src/commands/diff.ts

## Phase 4: File Watching [MUST]

GOAL: Monitor template directory for file changes using native fs.watch
TEST CRITERIA: File changes in template directory trigger callback; debouncing prevents rapid triggers

- [ ] T-WATCH-010 [WATCH-2] Create file watcher module wrapping fs.watch with recursive option → src/core/watcher.ts
      IMPLEMENTS: WATCH-2_AC-1, WATCH-7_AC-1
- [ ] T-WATCH-011 [WATCH-4] Create debouncer — setTimeout-based, configurable delay (default 300ms) → src/core/watcher.ts
      IMPLEMENTS: WATCH-4_AC-1
- [ ] T-WATCH-012 [P] [WATCH-4] Test debouncer throttles rapid changes → src/core/__tests__/watcher.test.ts
      TESTS: WATCH-4_AC-1, WATCH-7_AC-1

## Phase 5: Watch Loop [MUST]

GOAL: Re-run diff on template changes with clear output between runs
TEST CRITERIA: Diff re-runs on change; separator shown between runs; Ctrl+C exits cleanly

- [ ] T-WATCH-020 [WATCH-1] Implement watch loop — run diff once, then enter watch on change → src/commands/diff.ts
      IMPLEMENTS: WATCH-1_AC-1
- [ ] T-WATCH-021 [WATCH-3] Re-run diff and display updated results on each change → src/commands/diff.ts
      IMPLEMENTS: WATCH-3_AC-1
- [ ] T-WATCH-022 [WATCH-5] Display clear separator with timestamp between diff runs → src/commands/diff.ts
      IMPLEMENTS: WATCH-5_AC-1
- [ ] T-WATCH-023 [WATCH-6] Handle Ctrl+C graceful shutdown — close watcher, clean up temp dirs → src/commands/diff.ts
      IMPLEMENTS: WATCH-6_AC-1
- [ ] T-WATCH-024 [P] [WATCH-3] Test watch loop re-runs diff on file change → src/commands/__tests__/diff.test.ts
      TESTS: WATCH-1_AC-1, WATCH-2_AC-1, WATCH-3_AC-1, WATCH-5_AC-1
- [ ] T-WATCH-025 [P] [WATCH-6] Test graceful shutdown on SIGINT → src/commands/__tests__/diff.test.ts
      TESTS: WATCH-6_AC-1

## Phase 6: Local-Only Guard [MUST]

GOAL: Error when --watch used with git template source
TEST CRITERIA: Clear error message when --watch combined with git source

- [ ] T-WATCH-030 [WATCH-8] Validate template source is local when --watch active; error on git templates → src/commands/diff.ts
      IMPLEMENTS: WATCH-8_AC-1
- [ ] T-WATCH-031 [P] [WATCH-8] Test error on --watch with git template → src/commands/__tests__/diff.test.ts
      TESTS: WATCH-8_AC-1

## Phase 7: Documentation

- [ ] T-WATCH-040 Update CLI reference with --watch option on diff command → docs/CLI.md
- [ ] T-WATCH-041 Update README.md development section → README.md
- [ ] T-WATCH-042 Update ARCHITECTURE.md with FileWatcher component → .awa/specs/ARCHITECTURE.md

---

## Dependencies

WATCH-1 → (none)
WATCH-2 → (none)
WATCH-3 → WATCH-1, WATCH-2 (needs watch loop and watcher)
WATCH-4 → WATCH-2 (debouncer wraps watcher)
WATCH-5 → WATCH-3 (display between re-runs)
WATCH-6 → WATCH-2 (shutdown closes watcher)
WATCH-7 → WATCH-2 (implementation detail of watcher)
WATCH-8 → WATCH-1 (guard before entering watch mode)

## Parallel Opportunities

Phase 4: T-WATCH-010, T-WATCH-011 can run in parallel
Phase 5: T-WATCH-022, T-WATCH-023 can run parallel after T-WATCH-020, T-WATCH-021
Phase 6: Independent of Phase 5

## Trace Summary

| AC | Task | Test |
|----|------|------|
| WATCH-1_AC-1 | T-WATCH-020 | T-WATCH-024 |
| WATCH-2_AC-1 | T-WATCH-010 | T-WATCH-024 |
| WATCH-3_AC-1 | T-WATCH-021 | T-WATCH-024 |
| WATCH-4_AC-1 | T-WATCH-011 | T-WATCH-012 |
| WATCH-5_AC-1 | T-WATCH-022 | T-WATCH-024 |
| WATCH-6_AC-1 | T-WATCH-023 | T-WATCH-025 |
| WATCH-7_AC-1 | T-WATCH-010 | T-WATCH-012 |
| WATCH-8_AC-1 | T-WATCH-030 | T-WATCH-031 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
