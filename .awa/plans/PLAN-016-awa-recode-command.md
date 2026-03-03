# awa recode Command

STATUS: not-started
DIRECTION: top-down

## Context

When feature codes need to be merged, the first mechanical step is rewriting all IDs from one code prefix to another while assigning new sequential numbers in the target namespace. This plan covers a standalone `awa recode` command that performs only this ID rewriting — it does not move, merge, or delete spec files.

`awa recode CHK CLI` rewrites every CHK ID (requirements, subrequirements, ACs, properties, component names, markers) to CLI IDs with numbers starting after the highest existing CLI ID. The user then manually reorganizes spec files or uses `awa merge` (PLAN-017) for the full lifecycle.

This command heavily reuses RENUM infrastructure: the shared scanner, two-pass placeholder replacement, malformed ID detection, and the reporter. The key difference is that instead of reassigning numbers within the same prefix, it changes the prefix itself and offsets numbers into the target namespace.

## Steps

### Recode Map Builder

- [ ] Create `src/core/recode/map-builder.ts`
- [ ] Scan target code REQ file to find highest requirement number N
- [ ] Scan target code DESIGN file to find highest property number P
- [ ] Walk source code REQ file in document order; build map: `SRC-1` -> `TGT-(N+1)`, `SRC-2` -> `TGT-(N+2)`, etc.
- [ ] Map all derived IDs: subrequirements (`SRC-1.1` -> `TGT-(N+1).1`), ACs (`SRC-1_AC-1` -> `TGT-(N+1)_AC-1`)
- [ ] Walk source code DESIGN file; map properties: `SRC_P-1` -> `TGT_P-(P+1)`, etc.
- [ ] Map component name prefixes: `SRC-ComponentName` -> `TGT-ComponentName`
- [ ] Return a `RecodeMap` (compatible with `RenumberMap` shape for propagator reuse)

### Propagation (Reuse RENUM)

- [ ] Reuse RENUM's two-pass placeholder propagator directly
- [ ] Apply recode map across all spec files (.awa/specs/, .awa/tasks/, .awa/plans/)
- [ ] Apply recode map across source and test files (marker rewriting)
- [ ] Ensure whole-ID boundary matching (same as RENUM) to prevent partial replacements

### Command Orchestration

- [ ] Create `src/commands/recode.ts`
- [ ] Register `recode` under `awa spec` group: `awa spec recode <source-code> <target-code>`
- [ ] Validate both codes exist (source must have a REQ file; target must have a REQ file)
- [ ] Support `--dry-run` to preview the recode map and affected files without writing
- [ ] Support `--json` for machine-readable output
- [ ] Exit codes: 0 = no changes needed, 1 = changes applied/previewed, 2 = error

### Reporter

- [ ] Reuse or extend RENUM reporter for recode output
- [ ] Show recode map as source -> target table
- [ ] Show affected file list with replacement counts
- [ ] Dry-run banner when applicable

### Types

- [ ] Create `src/core/recode/types.ts`
- [ ] `RecodeMap`: extends or mirrors `RenumberMap` with source and target code fields
- [ ] Reuse `AffectedFile` and `Replacement` types from RENUM

### Testing

- [ ] Unit tests for recode map builder (correct offset calculation, derived ID mapping, component prefix mapping)
- [ ] Unit tests for propagation with mixed source/target IDs in same file
- [ ] Property tests: recode map is deterministic for same input; no collisions; prefix isolation
- [ ] Integration test: `awa spec recode SRC TGT --dry-run` shows correct map
- [ ] Edge case: source has no subrequirements or properties
- [ ] Edge case: target code has no existing requirements (offset starts at 0)

## Risks

- Component name rewriting (`CHK-MarkerScanner` -> `CLI-MarkerScanner`) may collide with existing target components of the same name
- After recoding, spec files still have the old filenames (e.g., `REQ-CHK-check.md` now contains CLI IDs) which creates inconsistency — users must rename or use `awa merge` to complete the process
- Cross-feature references (e.g., DEPENDS ON lines referencing other codes) must not be affected — prefix isolation is critical

## Dependencies

- RENUM infrastructure must be implemented first (propagator, two-pass replacement, shared scanner)
- PLAN-015 establishes the `awa spec` subcommand group; if PLAN-016 is implemented first, create the group here instead
- PLAN-015 (`awa codes`) is independent but complementary

## Completion Criteria

- [ ] `awa spec recode CHK CLI` rewrites all CHK IDs to CLI IDs with correct offset numbering
- [ ] `awa spec recode CHK CLI --dry-run` previews changes without writing
- [ ] `awa spec recode CHK CLI --json` outputs structured JSON
- [ ] Component name prefixes are recoded
- [ ] No IDs from other feature codes are modified
- [ ] All tests pass
- [ ] `awa check --spec-only` passes

## Open Questions

- [ ] Should recode also rename spec files (e.g., `REQ-CHK-check.md` -> `REQ-CLI-check.md`)? This plan says no, but it would reduce the manual step
- [ ] Should recode warn about component name collisions in the target namespace?
- [ ] Should recode automatically run `awa renumber TGT` after applying the map to normalize the combined numbering?
- [ ] Should property renumbering use a separate offset from requirements, or share the same counter?

## References

- FEAT: .awa/specs/FEAT-RENUM-renumber.md (shared infrastructure)
- REQ: .awa/specs/REQ-RENUM-renumber.md (propagation requirements)
- DESIGN: .awa/specs/DESIGN-RENUM-renumber.md (two-pass replacement design)
- PLAN: .awa/plans/PLAN-017-awa-merge-command.md (full merge lifecycle)
