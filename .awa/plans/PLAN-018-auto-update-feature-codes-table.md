# Auto-update Feature Codes Table in ARCHITECTURE.md

STATUS: completed
DIRECTION: top-down

## Context

PLAN-015 added a Feature Codes table to ARCHITECTURE.md and the `awa spec codes` command. The table is manually maintained, which means it drifts as features are added or removed. `awa check` already auto-updates Requirements Traceability sections in DESIGN and TASK files via the matrix-fixer (CHK-23). The same pattern should apply to the Feature Codes table: `awa check` regenerates it entirely from spec data, keeping the authoritative table always current.

The Scope Boundary column is sourced from spec files via a fallback chain: FEAT `## Scope Boundary` section → FEAT first paragraph → REQ first paragraph → DESIGN first paragraph. The FEAT schema gains a new optional `## Scope Boundary` section for this purpose. When a code has no discoverable scope text, the fixer emits a warning.

## Steps

### Add Scope Boundary to FEAT schema

- [x] Add optional `## Scope Boundary` section to `.awa/.agent/schemas/FEAT.schema.yaml`
- [x] Add `## Scope Boundary` to all 16 existing FEAT files with text from the current ARCHITECTURE.md table
- [x] Add `## Feature Codes` section to ARCHITECTURE.schema.yaml (optional, auto-generated)

### Update scanCodes scope fallback chain

- [x] In `src/core/codes/scanner.ts`, update `extractScopeSummaries()` to try fallback chain: FEAT `## Scope Boundary` → FEAT first paragraph → REQ first paragraph → DESIGN first paragraph
- [x] Update scanner tests for the new fallback chain

### Create codes-fixer module

- [x] Create `src/core/check/codes-fixer.ts` — separate module following the matrix-fixer pattern
- [x] Locate ARCHITECTURE.md from spec files (find file matching the pattern)
- [x] Read its content and find the `## Feature Codes` section
- [x] Run `scanCodes()` to get the live inventory of codes with scope text
- [x] Generate the full table markdown (header + separator + sorted rows)
- [x] Replace the section content using the same `replaceSection` pattern as matrix-fixer
- [x] Return a `FixResult` indicating whether the file was modified
- [x] Warn when any code has an empty Scope Boundary

### Wire into check command

- [x] Import and call `fixCodesTable()` in `src/commands/check.ts` alongside `fixMatrices()`
- [x] Respect the same `--no-fix` flag (skip when fix is disabled)
- [x] Pass the already-parsed `specs` data to avoid re-scanning
- [x] Log "Fixed Feature Codes table in ARCHITECTURE.md" when modified
- [x] Run in both full and `--spec-only` modes (it only touches spec files)

### Handle edge cases

- [x] Missing `## Feature Codes` section: do nothing (don't create it; user must add the section header first)
- [x] Missing ARCHITECTURE.md: do nothing
- [x] Empty table (header only, no rows): populate from specs
- [x] No FEAT/REQ/DESIGN file for a code: empty scope (triggers warning)

### Testing

- [x] Unit test: codes-fixer generates table from spec data
- [x] Unit test: codes-fixer adds new code row
- [x] Unit test: codes-fixer removes stale code row
- [x] Unit test: codes-fixer with no Feature Codes section — no change
- [x] Unit test: codes-fixer populates empty table from specs
- [x] Unit test: scanner fallback chain (FEAT scope → FEAT paragraph → REQ → DESIGN)
- [x] Integration test: check command runs codes-fixer and logs fix message
- [x] Verify existing matrix-fixer tests still pass (no regressions)

### Traceability

- [x] Add CHK-25 requirement to REQ-CHK-check.md
- [x] Add CHK-CodesFixer component to DESIGN-CHK-check.md
- [x] Add traceability markers to codes-fixer.ts and tests

## Risks

- If the `## Feature Codes` heading changes (e.g., renamed to "Feature Registry"), the fixer silently does nothing — acceptable since it matches the matrix-fixer behavior
- Scope text truncation (120 chars) may lose meaning on long descriptions

## Dependencies

- PLAN-015 (completed): `awa spec codes` command and Feature Codes table in ARCHITECTURE.md
- Existing matrix-fixer infrastructure (CHK-23): pattern to follow
- `src/core/codes/scanner.ts`: reuse `scanCodes()` for live code discovery

## Completion Criteria

- [x] `awa check` auto-updates Feature Codes table when codes are added or removed
- [x] Scope Boundary sourced from FEAT `## Scope Boundary` → fallbacks
- [x] `--no-fix` skips the update
- [x] All new and existing tests pass
- [x] `npm run build && npm run test` passes

## Open Questions

(resolved)

## References

- PLAN-015: .awa/plans/PLAN-015-awa-codes-command.md
- Matrix fixer: src/core/check/matrix-fixer.ts (CHK-23)
- Check command: src/commands/check.ts
- Codes scanner: src/core/codes/scanner.ts
- ARCHITECTURE.md Feature Codes section: .awa/specs/ARCHITECTURE.md
- FEAT schema: .awa/.agent/schemas/FEAT.schema.yaml
