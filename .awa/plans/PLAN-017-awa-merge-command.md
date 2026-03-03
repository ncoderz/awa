# awa merge Command

STATUS: not-started
DIRECTION: top-down

## Context

After `awa recode` (PLAN-016) handles the mechanical ID rewriting, the project is left with spec files under the old filenames containing the new code's IDs. `awa merge` completes the lifecycle: it recodes IDs, moves spec file content under the target code's file structure, and cleans up source files.

`awa merge CHK CLI` is the full-lifecycle command that subsumes recode. It performs: (1) recode all source IDs into the target namespace, (2) create new spec files under the target code or append content, (3) delete source spec files, (4) optionally renumber the target to normalize. The result is a project where the source code no longer exists and all its content lives under the target code.

The multi-file strategy keeps merged content readable: rather than appending 200 lines to an already-large REQ file, merge creates `REQ-CLI-check.md` alongside `REQ-CLI-cli.md` — both using CLI IDs. The awa schema already supports multiple REQ files per code (glob-based scanning).

## Steps

### Phase 1: Recode (Delegate to PLAN-016)

- [ ] Invoke recode pipeline: build recode map, propagate across all files
- [ ] This phase is identical to `awa recode` — share the implementation entirely

### Phase 2: Spec File Restructuring

#### REQ File Handling

- [ ] Create `src/core/merge/spec-mover.ts`
- [ ] Rename source REQ file to target code pattern: `REQ-CHK-check.md` -> `REQ-CLI-check.md`
- [ ] Update the file's H1 heading if it contains the old code name
- [ ] Verify the renamed file passes schema validation (heading structure, ID formats)

#### DESIGN File Handling

- [ ] Rename source DESIGN file: `DESIGN-CHK-check.md` -> `DESIGN-CLI-check.md`
- [ ] Update internal headings and references to reflect the new code
- [ ] Handle component name prefixes already recoded in Phase 1

#### FEAT File Handling

- [ ] Rename source FEAT file: `FEAT-CHK-check.md` -> `FEAT-CLI-check.md`
- [ ] FEAT files are informative and contain no traceability IDs, so only the filename and heading need updating

#### TASK File Handling

- [ ] Rename source TASK files: `TASK-CHK-check-001.md` -> `TASK-CLI-check-001.md`
- [ ] TASK file content already recoded in Phase 1; only filename needs changing

#### EXAMPLES File Handling

- [ ] Rename source EXAMPLES files: `EXAMPLES-CHK-check-001.md` -> `EXAMPLES-CLI-check-001.md`

#### PLAN File Handling

- [ ] PLAN files are not code-specific (named by number); no renaming needed
- [ ] Content references already recoded in Phase 1

### Phase 3: Cleanup

- [ ] Delete original source spec files after successful rename
- [ ] Verify no remaining references to the source code prefix exist (run a grep-like scan)
- [ ] Report any stale references as warnings

### Phase 4: Optional Renumber

- [ ] If `--renumber` flag is set, run `awa renumber <target-code>` to normalize the combined ID sequence
- [ ] Without `--renumber`, IDs retain their offset positions (e.g., CLI-15 through CLI-38)

### Command Orchestration

- [ ] Create `src/commands/merge.ts`
- [ ] Register `merge` under `awa spec` group: `awa spec merge <source-code> <target-code>`
- [ ] Validate source code exists (has REQ file); validate target code exists (has REQ file)
- [ ] Support `--dry-run`: show recode map, list file renames and deletions, do not write
- [ ] Support `--json` for machine-readable output
- [ ] Support `--renumber` to auto-renumber after merge
- [ ] Exit codes: 0 = success, 1 = changes applied/previewed, 2 = error

### Reporter

- [ ] Extend recode reporter with file-rename and deletion reporting
- [ ] Show three sections: ID remap table, file renames, file deletions
- [ ] Dry-run shows planned actions without executing

### Testing

- [ ] Unit tests for spec-mover: file rename logic, heading updates, edge cases
- [ ] Integration test: full merge of two codes end-to-end
- [ ] Integration test: merge with `--dry-run` shows all planned changes
- [ ] Integration test: merge with `--renumber` produces clean sequential IDs
- [ ] Edge case: source has no DESIGN file (skip DESIGN rename)
- [ ] Edge case: source has multiple TASK files
- [ ] Edge case: target already has a file with the renamed filename (conflict detection)
- [ ] Edge case: merging a code into itself (should error)

## Risks

- File rename conflicts: if `REQ-CLI-check.md` already exists, the merge cannot blindly overwrite. Need a conflict strategy (error, suffix, or prompt)
- Git history: renaming files via the tool does not create git mv semantics. Users should commit before merging so git can detect the rename
- Large merges might produce spec files that exceed the 500-line limit after content is combined. The multi-file strategy mitigates this, but heading/intro content may still need manual consolidation
- Cross-feature DEPENDS ON references pointing to the old source code will be recoded in Phase 1, but references from other unrelated features will not (they still point to the old code). This is correct behavior but may confuse users

## Dependencies

- PLAN-016 (`awa spec recode`) must be implemented first — merge delegates Phase 1 entirely to recode
- RENUM infrastructure (propagator, scanner) must be complete
- PLAN-015 establishes the `awa spec` subcommand group; merge registers under it
- PLAN-015 (`awa codes`) is independent but complementary for discovery pre-merge

## Completion Criteria

- [ ] `awa spec merge CHK CLI` rewrites all IDs and renames all spec files
- [ ] `awa spec merge CHK CLI --dry-run` previews all changes
- [ ] `awa spec merge CHK CLI --renumber` produces clean sequential target IDs
- [ ] `awa spec merge CHK CLI --json` outputs structured JSON
- [ ] Source spec files are deleted after merge
- [ ] No stale source code references remain
- [ ] Multiple REQ/DESIGN files per code work correctly with `awa check`
- [ ] All tests pass
- [ ] `awa check --spec-only` passes

## Open Questions

- [ ] When renaming `REQ-CHK-check.md` to `REQ-CLI-check.md`, should the feature-name part of the filename be preserved or changed? (Plan says preserve, to maintain semantic meaning)
- [ ] Should merge prompt for confirmation before executing destructive operations (file deletes), or rely on `--dry-run` for preview and direct execution otherwise?
- [ ] Should merge update ARCHITECTURE.md automatically (remove source from Feature Codes table, update target description)?
- [ ] How should file rename conflicts be handled? Options: error and abort, add numeric suffix, prompt user
- [ ] Should stale cross-feature references (other codes pointing to the now-gone source) be reported as errors or warnings?

## References

- PLAN: .awa/plans/PLAN-016-awa-recode-command.md (Phase 1 delegation)
- FEAT: .awa/specs/FEAT-RENUM-renumber.md (shared infrastructure context)
- DESIGN: .awa/specs/DESIGN-RENUM-renumber.md (propagator, map builder patterns)
- ARCH: .awa/specs/ARCHITECTURE.md (multi-file spec support, component details)
