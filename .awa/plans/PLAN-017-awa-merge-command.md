# awa merge Command

STATUS: in-progress
DIRECTION: top-down

## Context

`awa merge` combines two existing feature codes into one. Unlike `awa recode` (which renames a code assuming no conflicts), merge handles the case where both source and target already have spec files of the same type (e.g. both have a FEAT, REQ, DESIGN). It recodes all source IDs into the target namespace, then merges file contents: appending requirements, combining design components, concatenating feature context.

`awa merge CHK CLI` means: take everything from CHK, recode its IDs into CLI's namespace, merge content from CHK's spec files into CLI's spec files, and delete the CHK files. After merge, CHK no longer exists and CLI contains all combined content.

For file types where the target has no corresponding file, the source file is simply renamed (same as recode). For file types where both exist, content is merged by appending sections.

## Steps

### Phase 1: Recode IDs (Delegate to Recode Pipeline)

- [x] Invoke recode pipeline: build recode map, propagate across all files
- [x] This phase is identical to `awa recode` ID rewriting — share the implementation

### Phase 2: Spec File Merging

#### Content Merge Strategy

- [ ] Create `src/core/merge/content-merger.ts`
- [ ] For each doc type (FEAT, REQ, DESIGN, EXAMPLE, TASK), define a merge strategy:
  - REQ: Append source requirements after target's last requirement section. Preserve H2 structure.
  - DESIGN: Append source components after target's last component section. Preserve H2 structure.
  - FEAT: Append source sections after target content. Add a horizontal rule separator.
  - EXAMPLE: Multiple files per code are normal; rename source files (no content merge needed)
  - TASK: Multiple files per code are normal; rename source files (no content merge needed)
- [ ] For single-instance file types (FEAT, REQ, DESIGN) where both codes have a file:
  - Read both files
  - Merge content per the type-specific strategy
  - Write merged content to the target file
  - Delete the source file
- [ ] For multi-instance file types (EXAMPLE, TASK) and types where only source has a file:
  - Rename source files to target code (same as recode behavior)

#### Heading and Metadata Updates

- [x] Update H1 headings in merged/renamed files to reflect the target code
- [ ] When appending content, preserve section heading levels and structure

### Phase 3: File Cleanup

- [ ] Delete source spec files that were merged into target files
- [ ] Rename source spec files that have no target counterpart
- [ ] For renamed files, update headings

### Phase 4: Stale Reference Detection

- [x] Scan remaining spec files for leftover source code references
- [x] Report stale references as errors (exit code 2)

### Phase 5: Optional Renumber

- [x] If `--renumber` flag is set, run `awa renumber <target-code>`

### Phase 6: ARCHITECTURE.md Update

- [x] Run `fixCodesTable()` to regenerate the Feature Codes table

### Command Orchestration

- [x] Create `src/commands/merge.ts`
- [x] Register `merge` under `awa spec` group: `awa spec merge <source-code> <target-code>`
- [x] Validate source and target codes exist
- [x] Support `--dry-run`: show recode map, list file merges/renames/deletions, do not write
- [x] Support `--json` for machine-readable output
- [x] Support `--renumber` to auto-renumber after merge
- [x] Exit codes: 0 = no changes, 1 = changes applied/previewed, 2 = error

### Reporter

- [x] Show ID remap table, file operations (merges, renames, deletions)
- [ ] Distinguish between "merged" (content combined) and "renamed" (file moved) in output
- [x] Dry-run shows planned actions without executing

### Testing

- [x] Unit tests for spec-mover: file rename logic, heading updates, edge cases
- [ ] Unit tests for content-merger: per-type merge strategies
- [ ] Test: merge when both codes have REQ files (content appended)
- [ ] Test: merge when only source has a DESIGN file (file renamed)
- [ ] Test: merge when both have FEAT files (content combined)
- [ ] Test: EXAMPLE and TASK files always renamed (multi-instance)
- [x] Test: merge with `--dry-run` shows all planned changes
- [x] Test: merge with `--renumber` produces clean sequential IDs
- [x] Edge case: target already has a file with the renamed filename (for EXAMPLE/TASK)
- [x] Edge case: merging a code into itself (error)

## Risks

- Content merging may produce files exceeding the 500-line limit; users need to split manually
- Merged REQ files may have non-sequential requirement numbers until renumber is run
- FEAT file merging may produce awkward combined narrative that needs manual editing
- Git history: combined content in a single file loses the git history of the appended source

## Dependencies

- PLAN-016 (`awa spec recode`) provides the ID rewriting phase
- RENUM infrastructure (propagator, scanner)
- PLAN-015 establishes the `awa spec` subcommand group

## Completion Criteria

- [ ] `awa spec merge CHK CLI` recodes IDs and merges spec file contents
- [ ] When both codes have a REQ file, content is combined into one file
- [ ] When only source has a file type, file is renamed to target code
- [ ] EXAMPLE and TASK files are always renamed (never content-merged)
- [x] `awa spec merge CHK CLI --dry-run` previews all changes
- [x] `awa spec merge CHK CLI --renumber` produces clean sequential target IDs
- [x] `awa spec merge CHK CLI --json` outputs structured JSON
- [ ] Source spec files are deleted after merge
- [ ] No stale source code references remain
- [ ] All tests pass
- [ ] `awa check --spec-only` passes

## Open Questions

- [x] When renaming files (EXAMPLE, TASK, or files with no target counterpart), should the feature-name part adopt the target's name? Resolved: Yes, use target's feature name.
- [x] Should merge prompt for confirmation? Resolved: No, rely on `--dry-run`.
- [x] Should merge update ARCHITECTURE.md? Resolved: Yes, via `fixCodesTable()`.
- [x] Should stale cross-feature references be errors or warnings? Resolved: Errors (exit code 2).
- [ ] When merging REQ content, should requirements be appended under a new H2 separator (e.g. `## Merged from CHK`) or seamlessly appended after the last requirement?
- [ ] When merging DESIGN content, should component sections be appended at the end or interleaved by category?

## References

- PLAN: .awa/plans/PLAN-016-awa-recode-command.md (ID rewriting, file renames when no conflicts)
- FEAT: .awa/specs/FEAT-RENUM-renumber.md (shared infrastructure context)
- DESIGN: .awa/specs/DESIGN-RENUM-renumber.md (propagator, map builder patterns)
- ARCH: .awa/specs/ARCHITECTURE.md (multi-file spec support, component details)
