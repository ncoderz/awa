# awa recode Command

STATUS: in-progress
DIRECTION: top-down

## Context

When a feature code needs to be renamed, `awa spec recode` performs the complete code rename: it rewrites all IDs from one code prefix to another, renames all spec files to use the new code, updates headings, refreshes the ARCHITECTURE.md Feature Codes table, and reports any stale references. After `awa recode CHK CLI`, the code CHK no longer exists anywhere in the project.

This command reuses RENUM infrastructure for the ID rewriting phase, and adds file-rename logic for the spec file restructuring phase.

The target code must not already have any spec files of the same type. If `REQ-CLI-cli.md` already exists and you try to recode CHK to CLI, that is a conflict (use `awa merge` instead for combining two existing codes).

## Steps

### Recode Map Builder

- [x] Create `src/core/recode/map-builder.ts`
- [x] Scan target code REQ file to find highest requirement number N
- [x] Scan target code DESIGN file to find highest property number P
- [x] Walk source code REQ file in document order; build map: `SRC-1` -> `TGT-(N+1)`, etc.
- [x] Map all derived IDs: subrequirements, ACs
- [x] Walk source code DESIGN file; map properties: `SRC_P-1` -> `TGT_P-(P+1)`, etc.
- [x] Map component name prefixes: `SRC-ComponentName` -> `TGT-ComponentName`
- [x] Return a `RecodeMap` (compatible with `RenumberMap` shape for propagator reuse)

### Propagation (Reuse RENUM)

- [x] Reuse RENUM's two-pass placeholder propagator directly
- [x] Apply recode map across all spec files (.awa/specs/, .awa/tasks/, .awa/plans/)
- [x] Apply recode map across source and test files (marker rewriting)
- [x] Ensure whole-ID boundary matching (same as RENUM) to prevent partial replacements

### Spec File Restructuring

- [ ] Move file-rename logic from `src/core/merge/spec-mover.ts` to a shared location (or into recode)
- [ ] After ID propagation, rename all source spec files to the target code:
  - `REQ-CHK-check.md` -> `REQ-CLI-check.md` (using target's feature name if available)
  - `DESIGN-CHK-check.md` -> `DESIGN-CLI-check.md`
  - `FEAT-CHK-check.md` -> `FEAT-CLI-check.md`
  - `TASK-CHK-check-001.md` -> `TASK-CLI-check-001.md`
  - `EXAMPLE-CHK-check-001.md` -> `EXAMPLE-CLI-check-001.md`
- [ ] Update H1 headings in renamed files to reflect the new code
- [ ] Detect rename conflicts (target filename already exists) and abort with error
- [ ] PLAN files are not code-specific; no renaming needed

### Stale Reference Detection

- [ ] After recode + rename, scan remaining spec files for any leftover source code references
- [ ] Report stale references as errors (exit code 2)

### ARCHITECTURE.md Update

- [ ] After successful recode, run `fixCodesTable()` to regenerate the Feature Codes table

### Command Orchestration

- [x] Create `src/commands/recode.ts`
- [x] Register `recode` under `awa spec` group: `awa spec recode <source-code> <target-code>`
- [x] Validate both codes exist (source must have a REQ file; target must have a REQ file)
- [x] Support `--dry-run` to preview the recode map and affected files without writing
- [x] Support `--json` for machine-readable output
- [ ] Add `--renumber` flag to auto-renumber target after recode
- [x] Exit codes: 0 = no changes needed, 1 = changes applied/previewed, 2 = error

### Reporter

- [x] Reuse or extend RENUM reporter for recode output
- [x] Show recode map as source -> target table
- [x] Show affected file list with replacement counts
- [ ] Show file renames section
- [x] Dry-run banner when applicable

### Types

- [x] Create `src/core/recode/types.ts`
- [x] `RecodeMap`: extends or mirrors `RenumberMap` with source and target code fields
- [x] Reuse `AffectedFile` and `Replacement` types from RENUM

### Testing

- [x] Unit tests for recode map builder
- [x] Unit tests for propagation with mixed source/target IDs
- [x] Property tests: recode map is deterministic, no collisions, prefix isolation
- [x] Integration test: `awa spec recode SRC TGT --dry-run` shows correct map
- [ ] Tests for file renaming (rename logic, heading updates, conflict detection)
- [ ] Tests for stale reference scanning
- [ ] Tests for fixCodesTable integration
- [x] Edge cases: no subrequirements, no properties, empty target

## Risks

- Component name rewriting may collide with existing target components of the same name
- Rename conflicts when target already has files of the same type (error and abort; use merge instead)

## Dependencies

- RENUM infrastructure must be implemented first
- PLAN-015 establishes the `awa spec` subcommand group

## Completion Criteria

- [x] `awa spec recode CHK CLI` rewrites all CHK IDs to CLI IDs with correct offset numbering
- [ ] `awa spec recode CHK CLI` renames all spec files from CHK to CLI
- [ ] `awa spec recode CHK CLI` updates ARCHITECTURE.md Feature Codes table
- [ ] `awa spec recode CHK CLI` reports stale references as errors
- [x] `awa spec recode CHK CLI --dry-run` previews changes without writing
- [x] `awa spec recode CHK CLI --json` outputs structured JSON
- [x] Component name prefixes are recoded
- [x] No IDs from other feature codes are modified
- [ ] All tests pass
- [ ] `awa check --spec-only` passes

## Open Questions

- [x] Should recode also rename spec files? Decision: Yes. Recode is the complete code-rename command.
- [x] Should recode warn about component name collisions? Decision: Deferred; not implemented in v1
- [x] Should recode automatically run `awa renumber TGT` after applying the map? Decision: Optional via `--renumber` flag
- [x] Should property renumbering use a separate offset from requirements? Decision: Separate offsets

## References

- FEAT: .awa/specs/FEAT-RENUM-renumber.md (shared infrastructure)
- REQ: .awa/specs/REQ-RENUM-renumber.md (propagation requirements)
- DESIGN: .awa/specs/DESIGN-RENUM-renumber.md (two-pass replacement design)
- PLAN: .awa/plans/PLAN-017-awa-merge-command.md (content merging for combining two codes)
