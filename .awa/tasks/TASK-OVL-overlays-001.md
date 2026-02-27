# Implementation Tasks

FEATURE: Template Overlays
SOURCE: PLAN-003-template-overlays.md

## Phase 1: Specifications

- [ ] T-OVL-001 Create feature context document → .awa/specs/FEAT-OVL-overlays.md
- [ ] T-OVL-002 Create requirements specification → .awa/specs/REQ-OVL-overlays.md
- [ ] T-OVL-003 Create design specification → .awa/specs/DESIGN-OVL-overlays.md

## Phase 2: Setup

- [ ] T-OVL-004 Add --overlay CLI option (repeatable) to generate command → src/cli/index.ts
- [ ] T-OVL-005 [P] Add --overlay CLI option to diff command → src/cli/index.ts
- [ ] T-OVL-006 Add overlay to .awa.toml config and type definitions (RawCliOptions, FileConfig, ResolvedOptions) → src/types/index.ts

## Phase 3: Foundation

- [ ] T-OVL-007 Define overlay types (OverlaySource, MergedFileEntry) → src/types/index.ts

## Phase 4: Overlay Resolution [MUST]

GOAL: Resolve overlay sources to local directories using existing template resolver
TEST CRITERIA: Local and git overlay sources resolve to usable directories

- [ ] T-OVL-010 [OVL-1] Implement overlay resolver — resolve each overlay source via existing template resolver → src/core/overlay.ts
      IMPLEMENTS: OVL-1_AC-1, OVL-6_AC-1
- [ ] T-OVL-011 [P] [OVL-1] Test overlay resolution for local paths → src/core/__tests__/overlay.test.ts
      TESTS: OVL-1_AC-1
- [ ] T-OVL-012 [P] [OVL-6] Test overlay resolution for git sources → src/core/__tests__/overlay.test.ts
      TESTS: OVL-6_AC-1

## Phase 5: File Merging [MUST]

GOAL: Build merged file list from base + overlays where overlay files replace base files
TEST CRITERIA: Overlay files override base; base-only files pass through; overlay-only files added

- [ ] T-OVL-020 [OVL-2] Implement merged template view — build merged file list where overlay replaces base at same path → src/core/overlay.ts
      IMPLEMENTS: OVL-2_AC-1, OVL-3_AC-1, OVL-4_AC-1
- [ ] T-OVL-021 [OVL-2] Create merged directory lifecycle — copy base + overlay files to temp dir, pass to template engine, clean up → src/core/overlay.ts
      IMPLEMENTS: OVL-2_AC-1
- [ ] T-OVL-022 [OVL-2] Integrate merged view into generate command → src/commands/generate.ts
      IMPLEMENTS: OVL-2_AC-1
- [ ] T-OVL-023 [P] [OVL-2] Test overlay file replaces base file at same path → src/core/__tests__/overlay.test.ts
      TESTS: OVL-2_AC-1
- [ ] T-OVL-024 [P] [OVL-3] Test base-only files pass through unchanged → src/core/__tests__/overlay.test.ts
      TESTS: OVL-3_AC-1
- [ ] T-OVL-025 [P] [OVL-4] Test overlay-only files are added to output → src/core/__tests__/overlay.test.ts
      TESTS: OVL-4_AC-1

## Phase 6: Multiple Overlays [SHOULD]

GOAL: Support multiple --overlay options applied in order (last wins)
TEST CRITERIA: Three overlays applied in order; last overlay wins on conflict

- [ ] T-OVL-030 [OVL-5] Extend merged view to support multiple overlays in order → src/core/overlay.ts
      IMPLEMENTS: OVL-5_AC-1
- [ ] T-OVL-031 [P] [OVL-5] Test multiple overlay ordering (last wins) → src/core/__tests__/overlay.test.ts
      TESTS: OVL-5_AC-1

## Phase 7: Diff and Config Integration [MUST]

GOAL: Diff command supports overlays; overlay paths configurable in .awa.toml
TEST CRITERIA: awa diff with --overlay produces correct comparison; config overlay array works

- [ ] T-OVL-040 [OVL-7] Integrate overlay support into diff command → src/commands/diff.ts
      IMPLEMENTS: OVL-7_AC-1
- [ ] T-OVL-041 [OVL-8] Support overlay array in .awa.toml config loading → src/core/config.ts
      IMPLEMENTS: OVL-8_AC-1
- [ ] T-OVL-042 [P] [OVL-7] Test diff with overlay produces correct results → src/commands/__tests__/diff.test.ts
      TESTS: OVL-7_AC-1
- [ ] T-OVL-043 [P] [OVL-8] Test overlay config from .awa.toml → src/core/__tests__/config.test.ts
      TESTS: OVL-8_AC-1

## Phase 8: Documentation

- [ ] T-OVL-050 Update CLI reference with --overlay option → docs/CLI.md
- [ ] T-OVL-051 Update template engine docs with overlay section → docs/TEMPLATE_ENGINE.md
- [ ] T-OVL-052 Update README.md features list → README.md
- [ ] T-OVL-053 Update ARCHITECTURE.md with OverlayResolver component → .awa/specs/ARCHITECTURE.md

---

## Dependencies

OVL-1 → (none)
OVL-2 → OVL-1 (overlay must be resolved before merging)
OVL-3 → OVL-2 (merging logic handles base-only files)
OVL-4 → OVL-2 (merging logic handles overlay-only files)
OVL-5 → OVL-2 (extends single overlay to multiple)
OVL-6 → OVL-1 (extends resolver to git sources)
OVL-7 → OVL-2 (diff reuses same merge logic)
OVL-8 → OVL-1 (config provides overlay paths to resolver)

## Parallel Opportunities

Phase 4: T-OVL-011, T-OVL-012 can run parallel after T-OVL-010
Phase 5: T-OVL-023, T-OVL-024, T-OVL-025 can run parallel after T-OVL-020
Phase 7: T-OVL-040, T-OVL-041 can run parallel

## Trace Summary

| AC | Task | Test |
|----|------|------|
| OVL-1_AC-1 | T-OVL-010 | T-OVL-011 |
| OVL-2_AC-1 | T-OVL-020 | T-OVL-023 |
| OVL-3_AC-1 | T-OVL-020 | T-OVL-024 |
| OVL-4_AC-1 | T-OVL-020 | T-OVL-025 |
| OVL-5_AC-1 | T-OVL-030 | T-OVL-031 |
| OVL-6_AC-1 | T-OVL-010 | T-OVL-012 |
| OVL-7_AC-1 | T-OVL-040 | T-OVL-042 |
| OVL-8_AC-1 | T-OVL-041 | T-OVL-043 |

| Property | Test |
|----------|------|

UNCOVERED: (none)
