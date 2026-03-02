# Improve AWA Check — Close Traceability Gaps

STATUS: in-progress
DIRECTION: top-down
TRACEABILITY: REQ-CHK-check.md, DESIGN-CHK-check.md

## Context

Real-world use of `awa check` on a production project exposed five traceability gaps that the current checker does not catch. These gaps range from silent coverage inflation to completely unchecked dimensions of the traceability chain. All new checks are ON by default — no per-check config toggles. The existing `--spec-only` flag is the only control: it skips checks that require code markers (G1, G5), while spec-only checks (G3, G4) always run.

Severity follows the same rules as existing checks: spec-to-spec findings are always error; spec-to-code findings are warning (promoted to error unless `--allow-warnings` is set).

G2 (traceability matrix drift) is solved by generation, not checking. The matrices in DESIGN and TASK files are fully derivable from IMPLEMENTS/VALIDATES/TESTS lines in the same file. Rather than validating a redundant hand-written section, `awa check` regenerates them by default (skip with `--no-fix`). This also applies to TASK file matrices (AC -> Task, Property -> Test, UNCOVERED).

The five gaps (from real findings):

| # | Gap | Current behavior | Severity |
|---|-----|-----------------|----------|
| G1 | IMPLEMENTS ↔ @awa-impl consistency | Not checked — a component can have @awa-impl markers that don't appear in its IMPLEMENTS list | Medium |
| G2 | Traceability matrix drift | Not fixed — DESIGN/TASK matrices diverge from IMPLEMENTS/TESTS lines; solved by default generation (--no-fix to skip) | High |
| G3 | REQ AC → DESIGN IMPLEMENTS coverage | Not checked — whether every REQ AC is claimed by at least one DESIGN component | Low |
| G4 | DESIGN ↔ API @normative overlap | Not checked — behavioral ACs in DESIGN vs API files are two separate worlds | Medium |
| G5 | Property ↔ @awa-test coverage | Not checked — `uncovered-ac` only checks ACs, not `CODE_P-*` properties | Medium |

## Steps

### Phase 1 — Low-hanging fruit (no new checker, extend existing)

- [x] G5 — Uncovered property detection: extend `checkCodeAgainstSpec` in `code-spec-checker.ts` to check that every `CODE_P-*` property ID has at least one `@awa-test` marker. New finding code: `uncovered-property`. Severity: warning (spec ↔ code). Skipped when `--spec-only` (requires code markers)
- [x] G3 — REQ → DESIGN coverage: add a pass in `spec-spec-checker.ts` that, for every REQ AC, verifies at least one DESIGN component's IMPLEMENTS list references it. New finding code: `unlinked-ac` (no DESIGN component claims it). Severity: error (spec ↔ spec). Always runs (spec-only safe)

### Phase 2 — IMPLEMENTS ↔ @awa-impl consistency (G1)

This requires correlating @awa-component markers in code with the corresponding DESIGN component's IMPLEMENTS list, then comparing the set of @awa-impl IDs in the same file(s) against IMPLEMENTS.

- [x] Spec parser — extract component → IMPLEMENTS mapping: extend `SpecParseResult` (or `SpecFile`) to expose a `Map<componentName, Set<acId>>` derived from each component section's IMPLEMENTS line
- [x] Code-spec checker — add impl-vs-implements check: for each `@awa-component` marker, look up the DESIGN component's IMPLEMENTS set. Gather all `@awa-impl` IDs from the same file. Report:
  - `impl-not-in-implements`: @awa-impl ID present in code but not listed in IMPLEMENTS → warning (spec ↔ code — coverage inflation)
  - `implements-not-in-impl`: IMPLEMENTS ID listed in DESIGN but no @awa-impl in any file tagged with that component → warning (spec ↔ code — missing implementation claim)
- [x] Skipped when `--spec-only` (requires code markers). Always ON otherwise

### Phase 3 — Traceability matrix generation (G2)

The "Requirements Traceability" sections in DESIGN and TASK files are redundant with IMPLEMENTS/VALIDATES/TESTS lines. Instead of checking for drift, `awa check` regenerates them by default from the authoritative source data in each file. Use `--no-fix` to skip regeneration.

DESIGN matrix generation:
- [x] For each DESIGN file, invert component IMPLEMENTS lines to build AC -> Component mapping
- [x] For each property VALIDATES line, associate (Property) with the relevant ACs
- [x] Group entries by source REQ file (derived from AC code prefix)
- [x] Replace the "Requirements Traceability" section content with the generated entries

TASK matrix generation:
- [x] For each TASK file, invert task IMPLEMENTS lines to build AC -> Task mapping
- [x] For each task TESTS line, associate (Test) with the relevant ACs/properties
- [x] Compute UNCOVERED: list for ACs/properties with no IMPLEMENTS/TESTS coverage in the task file
- [x] Group entries by source REQ file, append UNCOVERED line
- [x] Replace the "Requirements Traceability" section content with the generated entries

Infrastructure:
- [x] Add `--no-fix` flag to CheckConfig and CLI argument parsing (fix is default)
- [x] Matrix generation runs by default after checks complete (skip with `--no-fix`)
- [x] Update awa.core.md validation instructions — `awa check` regenerates matrices by default
- [x] Update DESIGN.schema.yaml — remove [{status}] and {notes} from matrix format (no longer relevant; section is auto-generated)
- [x] Update TASK.schema.yaml — note matrix section is auto-generated by `awa check`

### Phase 4 — DESIGN ↔ API overlap (G4)

API files (.tsp TypeSpec) can define normative interfaces. Behavioral ACs referenced in DESIGN should be consistently referenced in the corresponding API file.

- [ ] Investigate API file format — determine what markers/annotations exist in .tsp files and how ACs are referenced (e.g., `@doc` annotations, comments, etc.)
- [ ] Spec parser — extract API AC references: parse API files for AC references (likely via comment patterns)
- [ ] Cross-checker — add DESIGN ↔ API consistency: for ACs that appear in both a DESIGN IMPLEMENTS and an API annotation, validate bidirectional consistency:
  - `api-missing-ac`: AC in DESIGN IMPLEMENTS but not in any API file → error (spec ↔ spec)
  - `api-extra-ac`: AC in API file but not in any DESIGN IMPLEMENTS → error (spec ↔ spec)
- [ ] Always runs when API files exist (spec-only safe). Silently skipped when no API files are found

### Phase 5 — Config, types, tests

- [x] Extend FindingCode union — add new codes: `uncovered-property`, `unlinked-ac`, `impl-not-in-implements`, `implements-not-in-impl`, `api-missing-ac`, `api-extra-ac`
- [x] Unit tests — property tests for each new check (completeness invariants)
- [x] Integration tests — end-to-end with fixture projects exercising each gap
- [x] Update REQ-CHK-check.md — add new requirements for each gap
- [x] Update DESIGN-CHK-check.md — add component changes, new properties, traceability rows
- [x] Run `awa check` — verify the new checks pass on this project itself

## Risks

- G2 matrix generation — section replacement: The generator must locate and replace only the content under the "Requirements Traceability" H2 (and its H3 children) without disturbing the rest of the file. Mitigate by using the same Markdown section detection as the schema checker.
- G1 file-level @awa-impl: Some files have @awa-impl markers at the top without a corresponding @awa-component. These are "file level" implementations. The check should handle files with no @awa-component gracefully (skip the consistency check for those files).
- G4 API format unknowns: TypeSpec (.tsp) files may not have a consistent way to reference ACs. This phase is exploratory and may be deferred.
- Noise in existing projects: New checks will surface real gaps in projects that weren't designed with full traceability. Spec ↔ spec findings are errors (always fail). Spec ↔ code findings are warnings (fail unless `--allow-warnings`), consistent with existing check behavior.

## Dependencies

- Existing spec-parser infrastructure for parsing DESIGN file structure
- Existing CheckConfig/Finding types for extension
- No external dependencies needed

## Completion Criteria

- [ ] G1, G3, G4, G5 have corresponding check rules implemented
- [ ] G2 solved via default matrix generation for DESIGN and TASK files
- [ ] All checks ON by default; no per-check config toggles
- [ ] `--spec-only` correctly skips code-dependent checks (G1, G5) while running spec-only checks (G3, G4)
- [ ] Matrix generation runs by default; `--no-fix` to skip
- [ ] awa.core.md updated — `awa check` regenerates matrices by default
- [ ] DESIGN.schema.yaml and TASK.schema.yaml updated for generated matrix format
- [ ] All existing tests pass (`npm run build && npm run test`)
- [ ] `awa check` passes on this project with new checks enabled
- [ ] REQ-CHK and DESIGN-CHK updated with new requirements and components

## Open Questions

- [x] Should G1 (`impl-not-in-implements`) be an error or warning? — Warning. Spec ↔ code checks are always warning, promoted to error unless `--allow-warnings`.
- [x] For G2, should the matrix be checked or generated? — Generated. Matrices in DESIGN and TASK files are fully derivable and should not be hand-maintained.
- [ ] For G4, is TypeSpec the only API format to support, or should we also handle OpenAPI YAML/JSON?

## References

- REQ: .awa/specs/REQ-CHK-check.md
- DESIGN: .awa/specs/DESIGN-CHK-check.md
- Code: src/core/check/code-spec-checker.ts, src/core/check/spec-spec-checker.ts, src/core/check/spec-parser.ts, src/core/check/types.ts
- Config: src/core/check/types.ts (DEFAULT_CHECK_CONFIG)
