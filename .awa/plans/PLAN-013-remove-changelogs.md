# Remove Change Log Sections from Specs

STATUS: completed
DIRECTION: lateral

## Context

Change Log sections exist in nearly all spec, plan, and architecture files (56 files total). They are redundant with version control (git history) and clutter the documents. This plan removes them from schemas, templates, spec files, plan files, and test fixtures/assertions.

## Steps

### Phase 1: Schema Updates

Remove the Change Log section definition from all schemas that define it, in both `.awa/.agent/schemas/` and `templates/awa/.awa/.agent/schemas/`:

- [x] Remove Change Log section from ARCHITECTURE.schema.yaml (both locations)
- [x] Remove Change Log section from DESIGN.schema.yaml (both locations)
- [x] Remove Change Log section from REQ.schema.yaml (both locations)
- [x] Remove Change Log section from FEAT.schema.yaml (both locations)
- [x] Remove Change Log section from EXAMPLE.schema.yaml (both locations)
- [x] Remove Change Log section from PLAN.schema.yaml (both locations)
- [x] Remove Change Log from `example:` blocks within those schemas

### Phase 2: Template Partial Update

- [x] Remove the changelog maintenance rule from `templates/awa/_partials/awa.upgrade.md`

### Phase 3: Spec & Plan File Cleanup

Remove `## Change Log` sections (heading + all content until next H2 or EOF) from all 56 files:

- [x] Remove from `.awa/specs/ARCHITECTURE.md`
- [x] Remove from all `.awa/specs/FEAT-*.md` files (13 files)
- [x] Remove from all `.awa/specs/REQ-*.md` files (13 files)
- [x] Remove from all `.awa/specs/DESIGN-*.md` files (12 files)
- [x] Remove from all `.awa/plans/PLAN-*.md` files (12 files)

### Phase 4: Test Fixture & Assertion Updates

- [x] Remove Change Log from conforming fixtures in `src/core/check/__tests__/fixtures/conforming/`
- [x] Remove Change Log from non-conforming fixtures in `src/core/check/__tests__/fixtures/non-conforming/`
- [x] Remove Change Log from validate fixtures in `src/core/validate/__tests__/fixtures/conforming/`
- [x] Update `src/core/check/__tests__/matrix-fixer.test.ts` — remove Change Log from test fixtures and assertions
- [x] Update `src/core/check/__tests__/schema-checker.test.ts` — remove Change Log from test schema/fixture data
- [x] Update `src/commands/__tests__/check.test.ts` — remove Change Log from test fixtures and assertions

### Phase 5: Validation

- [x] Run `awa check --spec-only` to verify schema conformance
- [x] Run `npm run build && npm run test` to verify nothing breaks

## Risks

- Some tests explicitly assert Change Log presence (matrix-fixer, schema-checker, check command tests); these must be updated or assertions removed
- Schema `example:` blocks include Change Log entries that also need removal
- The upgrade template partial instructs agents to maintain changelogs — must be updated

## Completion Criteria

- [x] No `## Change Log` sections remain in any `.awa/` file
- [x] No schema defines a Change Log section
- [x] No template references changelog maintenance
- [x] All tests pass (598/598)
- [x] `awa check --spec-only` passes

## Open Questions

- [x] Should TASK, ALIGN_REPORT, README, API schemas be checked? — They don't have Change Log sections, no action needed.
