# Detect Duplicate Spec IDs in awa check

STATUS: in-progress
DIRECTION: bottom-up
TRACEABILITY: REQ-CLI-check.md, DESIGN-CLI-check.md

## Context

The spec parser (`spec-parser.ts`) collects requirement IDs, AC IDs, property IDs, and component names from spec files into arrays, then merges them into `Set<string>` at the aggregate level. Duplicates within or across spec files are silently collapsed. This masks real errors — a REQ file with the same AC defined twice, or two DESIGN files defining the same component, are authoring mistakes that should be caught by `awa check` by default.

Code markers (`@awa-impl`, `@awa-test`, `@awa-component`) are intentionally exempt — the same AC can legitimately be implemented or tested in multiple files.

## Scope of Duplicate Detection

### Spec files — duplicates ARE errors

| ID Type | Where defined | Duplicate meaning | Severity |
|---------|--------------|-------------------|----------|
| Requirement ID (`CODE-N`, `CODE-N.P`) | REQ `### CODE-N: Title` headings | Same requirement defined twice | error |
| AC ID (`CODE-N_AC-M`) | REQ `- CODE-N_AC-M` lines | Same acceptance criterion defined twice | error |
| Property ID (`CODE_P-N`) | DESIGN `- CODE_P-N` lines | Same property defined twice | error |
| Component name (`CODE-CompName`) | DESIGN `### CODE-CompName` headings | Same component defined twice | error |

Duplicates can occur:
- Within a single file: e.g., copy-paste error producing `CLI-5_AC-1` twice in the same REQ doc
- Across files: e.g., `CLI-5_AC-1` defined in both `REQ-CLI-check.md` and `REQ-CLI-cli.md` (possible after merges or refactors)

Both cases should be reported. The finding should reference the second occurrence and note the location of the first.

### Code markers — duplicates are VALID

| Marker | Duplicate meaning | Detection? |
|--------|-------------------|------------|
| `@awa-impl: CODE-N_AC-M` | Multiple files implement the same AC | No — intentionally valid |
| `@awa-test: CODE-N_AC-M` | Multiple test files cover the same AC | No — intentionally valid |
| `@awa-component: CODE-Comp` | Multiple files host the same component | No — valid (partial implementations) |

### Cross-references — duplicates within a single IMPLEMENTS/VALIDATES line

Duplicate IDs within a single `IMPLEMENTS:` or `VALIDATES:` line in a DESIGN file (e.g., `IMPLEMENTS: CLI-1_AC-1, CLI-1_AC-1`) are a copy-paste mistake. These should be caught as warnings (hoisted to errors by default).

## Steps

### Phase 1 — Spec parser: collect locations for all IDs

- [ ] Extend `parseSpecFile` to track every occurrence of each ID (not just the first) using a `Map<string, Array<{ filePath: string; line: number }>>` per file
- [ ] At the aggregate level in `parseSpecs`, build a global `Map<string, Array<{ filePath: string; line: number }>>` that accumulates all locations for each ID across all files

### Phase 2 — New checker: detect duplicates

- [ ] Add a new function `checkDuplicateIds` in `spec-spec-checker.ts` (or a new `duplicate-checker.ts` if cleaner)
- [ ] For each ID in the global locations map with more than one entry, emit a finding:
  - Finding code: `duplicate-spec-id`
  - Severity: `error`
  - Message: `Spec ID '{id}' is defined multiple times: {file1}:{line1}, {file2}:{line2}`
  - `filePath` / `line`: point to the second occurrence
  - `id`: the duplicate ID
- [ ] Integrate into `checkCommand` — call after `parseSpecs`, before other checkers
- [ ] This check always runs (it is spec-only safe, no code markers needed)

### Phase 3 — Duplicate cross-reference IDs within a single line

- [ ] In `parseSpecFile`, when extracting cross-reference IDs from an IMPLEMENTS or VALIDATES line, detect if the same ID appears more than once in that single line
- [ ] Emit a finding:
  - Finding code: `duplicate-cross-ref`
  - Severity: `warning`
  - Message: `Duplicate ID '{id}' in {type} line`
  - `filePath` / `line`: the cross-reference line

### Phase 4 — Types, tests, validation

- [ ] Extend `FindingCode` union type with `duplicate-spec-id` and `duplicate-cross-ref`
- [ ] Unit tests: create fixture spec files with duplicate IDs (within-file and cross-file) and verify the checker catches them
- [ ] Unit test: verify code markers with duplicate IDs do NOT produce findings
- [ ] Unit test: verify duplicate cross-ref IDs within a single IMPLEMENTS line are caught
- [ ] Run `npm run build && npm run test` — all pass
- [ ] Run `awa check` on this project — no false positives from real specs

## Risks

- Noise on existing projects: Projects with genuine duplicate IDs may see new errors. This is desirable — it catches real bugs. Since severity is `error`, it will fail CI immediately, which is the right behavior for duplicate definitions.
- Performance: Building a multi-occurrence map adds marginal overhead to spec parsing. Negligible given the typical number of spec files.

## Completion Criteria

- [ ] `awa check` reports duplicate requirement IDs, AC IDs, property IDs, and component names in spec files
- [ ] `awa check` reports duplicate IDs within a single IMPLEMENTS/VALIDATES line
- [ ] Code marker duplicates are NOT flagged
- [ ] All existing tests pass
- [ ] New unit tests cover within-file, cross-file, and cross-reference duplicates
- [ ] `awa check` passes clean on this project

## Open Questions

- [x] Should duplicate detection be a separate checker module or extend `spec-spec-checker.ts`? — Either works; prefer a new `duplicate-checker.ts` for separation of concerns, but keep in `spec-spec-checker.ts` if the logic is small (< 50 lines)
- [x] Should duplicate component names across different DESIGN files for different feature codes be allowed? (e.g., `CLI-Parser` in both `DESIGN-CLI-cli.md` and `DESIGN-CLI-check.md`) — No, this is an error. Same component name must be unique regardless of which DESIGN file defines it.
