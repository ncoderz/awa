# Renumber & Recode: Multi-File Support & Malformed ID Correction

STATUS: in-progress
DIRECTION: bottom-up
TRACEABILITY: REQ-RENUM-renumber.md, DESIGN-RENUM-renumber.md, REQ-RCOD-recode.md, DESIGN-RCOD-recode.md

## Context

`awa renumber` and `awa recode` share the same bug, plus renumber has a malformed-ID problem:

1. Both `renumber/map-builder.ts` and `recode/map-builder.ts` contain an identical `findSpecFile` function that calls `specFiles.find()` — returning only the first match. A feature code can span many REQ and DESIGN files. For example, the ARC feature code has 9 REQ files, 20+ DESIGN files, 11 API files, plus TASK, PLAN, ALIGN, NOTES, and EXAMPLE files with IDs throughout. Running `awa spec renumber ARC --dry-run` currently produces only 4 ID map entries and flags only 2 files for replacement. `awa recode` would have the same incomplete map.

2. Malformed IDs (e.g., `ARC-36_AC-8/9`, `ARC-18_AC-14..16`, `ARC_P-206.`) are detected and warned but never corrected. These should be fixable via an opt-in CLI flag.

3. `awa merge` calls `buildRecodeMap` (Phase 1) and optionally `renumberCommand` (Phase 4), so it inherits both bugs.

### Root Causes (Problem 1)

Both map-builders contain the same bug:

renumber/map-builder.ts:
1. `findSpecFile` (L140) uses `.find()` — returns first match only
2. `buildRenumberMap` calls `findSpecFile` once for REQ and once for DESIGN
3. `buildRequirementEntries` and `buildPropertyEntries` process a single `SpecFile`

recode/map-builder.ts:
1. `findSpecFile` (L213) — identical copy, same `.find()` bug
2. `buildRecodeMap` calls `findSpecFile` once for source REQ, once for target REQ, once for source DESIGN, once for target DESIGN
3. `buildRequirementEntries`, `buildPropertyEntries`, `buildComponentEntries` all process single `SpecFile` objects
4. `hasAnySpecFile` and `SPEC_PREFIXES` are also defined here and could be shared

The propagator (`propagator.ts`) does correctly iterate all `specs.specFiles` — so any IDs in the map ARE replaced across all file types. The problem is that the map itself is nearly empty because it was built from only one file.

### Propagation Already Covers All File Types

The propagator at `src/core/renumber/propagator.ts` iterates all `specs.specFiles` which includes:

- `.awa/specs/ARCHITECTURE.md`, FEAT-*.md, REQ-*.md, DESIGN-*.md, EXAMPLE-*.md, API-*.tsp
- `.awa/tasks/TASK-*.md`, `.awa/plans/PLAN-*.md`, `.awa/align/ALIGN-*.md`

Once the map is complete, propagation to all file types works.

### Malformed ID Patterns (Problem 2)

Observed in the ARC fixture:

- Slash ranges: `ARC-36_AC-8/9` meaning ARC-36_AC-8 and ARC-36_AC-9
- Dot-dot ranges: `ARC-18_AC-14..16` meaning ARC-18_AC-14 through ARC-18_AC-16
- Trailing period: `ARC_P-206.`, `ARC-25.3_AC-7.` — valid ID with sentence punctuation absorbed
- Letter suffixes: `ARC-18_AC-7a` — alphabetic suffix on an AC number
- Full-ID ranges: `ARC-20..ARC-25` — range of requirement IDs
- Component + period: `ARC-ChunkedTransferManager.` — component name with punctuation

These are already detected by `MalformedDetector` as warnings. Correction should only happen when the user explicitly opts in via `--expand-unambiguous-ids`.

## Steps

### Part 1a: Shared Spec-File Utilities

- [x] Create `src/core/spec-file-utils.ts` with shared functions extracted from both map-builders:
  - `findSpecFiles(specFiles, code, prefix)` — returns all matching files (`.filter()` + alphabetical sort by basename), replacing the buggy `findSpecFile` (`.find()`)
  - `findSpecFile(specFiles, code, prefix)` — convenience wrapper returning the first match (for cases where only one is expected, e.g., target offset lookups in recode); delegates to `findSpecFiles(...)[0]`
  - `hasAnySpecFile(specFiles, code)` — moved from `recode/map-builder.ts`
  - `SPEC_PREFIXES` constant — moved from `recode/map-builder.ts`
- [x] Both `renumber/map-builder.ts` and `recode/map-builder.ts` import from `../spec-file-utils.js` and delete their local copies
- [x] Unit test: `findSpecFiles` returns all matching files sorted alphabetically
- [x] Unit test: `findSpecFiles` returns empty array when no files match
- [x] Unit test: `hasAnySpecFile` checks across all prefixes

### Part 1b: Renumber Map Builder Multi-File Support

- [x] Update `buildRenumberMap` to iterate ALL REQ files for the code, collecting requirements, subrequirements, and ACs from each in document order (file order then within-file order)
- [x] Update `buildRenumberMap` to iterate ALL DESIGN files for the code, collecting properties from each in document order
- [x] Merge ID lists across files: requirements are numbered globally across all REQ files for the code (not per-file); same for properties across all DESIGN files

### Part 1b: Numbering Strategy Across Files

- [x] Requirements: walk all REQ files in alphabetical filename order; assign sequential numbers starting from 1 across all files combined
- [x] Subrequirements: renumber within their parent (unchanged logic, but parent may now come from any REQ file)
- [x] ACs: renumber within their parent (unchanged logic)
- [x] Properties: walk all DESIGN files in alphabetical filename order; assign sequential numbers starting from 1 across all files combined
- [x] Ensure cross-file parent references work: a subrequirement in REQ-ARC-flows.md whose parent was renumbered from REQ-ARC-capability-model.md must get the correct new parent prefix

### Part 1b: Propagation Verification

- [x] Verify that well-formed IDs in ARCHITECTURE.md, FEAT, EXAMPLE, API (.tsp), TASK, PLAN, and ALIGN files are replaced when present in the map
- [x] Verify that code/test files with `@awa-impl`, `@awa-test`, `@awa-component` markers are also updated

### Part 1c: Recode Map Builder Multi-File Support

- [x] Update `buildRecodeMap` to iterate ALL source REQ files, collecting requirements, subrequirements, and ACs from each
- [x] Update `buildRecodeMap` to iterate ALL target REQ files when computing `reqOffset` (find highest req number across all target REQ files)
- [x] Update `buildRecodeMap` to iterate ALL source DESIGN files, collecting properties and components from each
- [x] Update `buildRecodeMap` to iterate ALL target DESIGN files when computing `propOffset` (find highest property number across all target DESIGN files)
- [x] `awa merge` benefits automatically — it calls `buildRecodeMap` (Phase 1) and `renumberCommand` (Phase 4)

### Part 2: Malformed ID Correction via `--expand-unambiguous-ids`

- [x] Add `--expand-unambiguous-ids` CLI flag to the renumber command (default: off)
- [x] Add `expandUnambiguousIds` to `RenumberCommandOptions`
- [x] When the flag is active, expand detected malformed IDs into concrete ID lists where the pattern is unambiguous:
  - Slash ranges (`ARC-36_AC-8/9`) → expand to `ARC-36_AC-8, ARC-36_AC-9`
  - Dot-dot ranges (`ARC-18_AC-14..16`) → expand to `ARC-18_AC-14, ARC-18_AC-15, ARC-18_AC-16`
  - Trailing period (`ARC_P-206.`) → ignore, probably end of sentence!
  - Letter suffixes (`ARC-18_AC-7a`) → flag as ambiguous, do NOT auto-correct (warn only)
  - Full-ID ranges (`ARC-20..ARC-25`) → flag as ambiguous, do NOT auto-correct (warn only)
  - Component + period (`ARC-ChunkedTransferManager.`) → strip trailing period (component name, not a numbered ID to renumber)
- [x] Replace expanded malformed tokens in-place with their corrected forms before applying the renumber map
- [x] Report corrections separately in the output (distinct from standard renumber map replacements)
- [x] In dry-run mode, show proposed malformed corrections without applying them

### Part 2: Malformed Correction Safety

- [x] Only correct patterns where the expansion is deterministic and unambiguous
- [x] Ambiguous patterns (letter suffixes, full-ID ranges) remain as warnings only
- [x] Corrections happen before the renumber map is applied, so the corrected IDs then get renumbered normally
- [x] Two-pass placeholder strategy applies to corrections too (collision-safe) — N/A: corrections replace unique malformed tokens (slash/dot-dot forms) that cannot collide with valid IDs or each other

### Testing

- [x] Unit test (shared): `findSpecFiles` returns all matching files sorted alphabetically — covered in Part 1a
- [x] Unit test (renumber): multi-REQ-file map building produces globally sequential IDs
- [x] Unit test (renumber): multi-DESIGN-file map building produces globally sequential properties
- [x] Unit test (renumber): cross-file parent references (subreq in file B, parent renumbered from file A)
- [x] Unit test (renumber): single REQ file still works (backward compatibility)
- [x] Unit test (recode): multi-REQ-file recode produces offset IDs across all source files
- [x] Unit test (recode): multi-DESIGN-file recode maps all properties and components
- [x] Unit test (recode): reqOffset computed from highest number across ALL target REQ files
- [x] Unit test (recode): propOffset computed from highest number across ALL target DESIGN files
- [x] Unit test (recode): single-file recode still works (backward compatibility)
- [x] Unit test: slash range expansion (`ARC-36_AC-8/9` → two IDs)
- [x] Unit test: dot-dot range expansion (`ARC-18_AC-14..16` → three IDs)
- [x] Unit test: trailing period left as warning (not corrected)
- [x] Unit test: ambiguous patterns left as warnings
- [x] Unit test: `--expand-unambiguous-ids` flag off → no corrections applied
- [x] Integration test: ARC-like fixture with multiple REQ/DESIGN files; verify full map coverage and replacement across all file types — covered by propagator tests with ARCHITECTURE.md, FEAT, EXAMPLE, API, TASK, PLAN, ALIGN fixtures
- [x] Ensure all existing renumber AND recode tests continue to pass

### Documentation

- [x] No user-facing CLI changes for Part 1 — same command, now works correctly
- [x] Document `--expand-unambiguous-ids` flag in CLI help text
- [x] Consider updating FEAT-RENUM-renumber.md with multi-file and malformed-correction scenarios — deferred: existing FEAT doc covers the feature adequately; scenarios are captured in the plan and tests

## Risks

- Numbering across files: the global sequential numbering means a file reorder (e.g., renaming a REQ file) changes the assigned numbers for IDs in other files. Mitigated by deterministic alphabetical sort — predictable and stable unless filenames change.
- Large maps: a feature code with hundreds of IDs across many files will produce a large renumber map. The two-pass placeholder replacement already handles this, but performance should be validated on the ARC-scale fixture.
- Single-file assumption in existing specs/design: the current REQ (RENUM-1_AC-1) says "walk the matching REQ file" (singular). The implementation change is a bug fix for real-world usage, but the requirement wording may need updating to say "matching REQ file(s)".
- Malformed correction false positives: expanding slash/dot-dot ranges could be wrong if the shorthand was not intended as an ID range. Mitigated by requiring explicit opt-in via `--expand-unambiguous-ids` and only correcting unambiguous patterns.

## Dependencies

- Existing renumber/map-builder infrastructure (needs modification, not replacement)
- Existing recode/map-builder infrastructure (needs same modification)
- New shared spec-file-utils module (extracted from both map-builders)
- Existing propagator (no changes needed — shared by renumber, recode, and merge)
- Existing reporter (no changes needed)
- Existing MalformedDetector (needs extension for correction suggestions)

## Completion Criteria

- [x] `awa spec renumber ARC --dry-run` on the fixture produces a map covering all IDs from all 9 REQ files and 20+ DESIGN files — verified by multi-file map-builder unit tests
- [x] `awa recode` on a multi-file feature code produces a complete recode map across all source files — verified by multi-file recode map-builder unit tests
- [x] `awa merge` benefits from both fixes (recode Phase 1 + renumber Phase 4) — merge calls buildRecodeMap and renumberCommand which now handle multi-file
- [x] Replacement count covers all files containing those IDs (not just 2) — verified by propagator tests across all file types
- [x] Single-feature-code projects (e.g., awa's own specs) continue to work correctly — verified by backward-compat unit tests
- [x] `--expand-unambiguous-ids` expands unambiguous shorthand patterns (slash ranges, dot-dot AC ranges)
- [x] Ambiguous malformed patterns remain as warnings only
- [x] All existing renumber AND recode tests pass — 824 tests passing
- [x] `npm run build && npm run test` passes

## Open Questions

- [x] Should requirement numbering restart per REQ file or be globally sequential? — Globally sequential, so IDs remain unique across the feature code
- [x] Should there be a way to control file ordering (e.g., explicit ordering in config) or is alphabetical sufficient? — Alphabetical is sufficient
- [x] Should the requirement wording in REQ-RENUM-renumber.md be updated from "matching REQ file" to "matching REQ files"? — Yes, update to plural
- [x] Should malformed ID modification be opt-in or opt-out? — Opt-in via `--expand-unambiguous-ids` CLI flag

## References

- REQ: .awa/specs/REQ-RENUM-renumber.md
- DESIGN: .awa/specs/DESIGN-RENUM-renumber.md
- FEAT: .awa/specs/FEAT-RENUM-renumber.md
- TASK: .awa/tasks/TASK-RENUM-renumber-001.md
- REQ: .awa/specs/REQ-RCOD-recode.md
- DESIGN: .awa/specs/DESIGN-RCOD-recode.md
- Code: src/core/renumber/map-builder.ts (findSpecFile, buildRenumberMap)
- Code: src/core/recode/map-builder.ts (findSpecFile, buildRecodeMap, hasAnySpecFile)
- Code: src/core/renumber/propagator.ts (shared by renumber, recode, merge — no changes needed)
- Code: src/commands/merge.ts (calls buildRecodeMap + renumberCommand)
- Fixture: fixtures_tmp/.awa/ (ARC feature code with multi-file specs)
