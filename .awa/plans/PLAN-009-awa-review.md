# `awa review` — Spec-Aware Code Review

STATUS: in-progress
DIRECTION: top-down

## Context

`awa check` validates the full traceability chain post-hoc. But by the time you run it, the code is already committed. There is no pre-merge gate that catches traceability gaps in a diff — new code without `@awa-impl` markers, changed implementations that may need test updates, or behavioral changes without spec updates.

`awa review` analyzes a code diff against the traceability chain and reports gaps before merge, closing the feedback loop between implementation and specification.

## Scope

IN SCOPE:
- Analyze git staged changes (default), git diff between refs, or piped unified diff
- Detect new implementation code without `@awa-impl` markers
- Detect changed `@awa-impl`-marked code that may need corresponding test updates
- Detect removed markers (a marker that existed in the base but not in the diff)
- Output formats: text (default), `--json`, `--summary`
- Exit code: 0 = clean, 1 = review findings, 2 = internal error

OUT OF SCOPE:
- GitHub PR integration (future — would need auth, API client, comment posting)
- Automated fix application (just reporting)
- Review of spec files themselves (that is `awa check`'s job)
- Style or quality checks (that is linter territory)

## Analysis Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `new-code-no-marker` | warning | New function/block in a `@awa-component` file has no `@awa-impl` marker |
| `removed-marker` | error | An `@awa-impl` or `@awa-test` marker was deleted from the diff |
| `changed-impl-no-test-change` | warning | A `@awa-impl`-marked section was modified but no corresponding `@awa-test` file was changed in the same diff |
| `new-test-no-marker` | warning | New test function in a test file has no `@awa-test` marker |
| `marker-id-not-in-spec` | error | A marker ID added in the diff does not exist in any spec file |

## CLI Interface

```
awa review [options]

Options:
  --staged                Review git staged changes (default)
  --ref <ref>             Review changes between HEAD and <ref> (e.g. main, HEAD~3)
  --stdin                 Read unified diff from stdin
  --json                  Output as JSON
  --summary               Output counts only
  --strict                Treat warnings as errors
  -c, --config <path>     Path to configuration file
```

Exit codes: 0 = no findings, 1 = findings present, 2 = internal error.

## Output Format

### Text (default)

```
awa review — 3 findings in 2 files
═══════════════════════════════════

  src/core/differ.ts
    ⚠ new-code-no-marker (line 95)
      New function 'compareDirectories' in @awa-component file has no @awa-impl marker
    ✖ removed-marker (line 42)
      Removed: @awa-impl: DIFF-1_AC-1

  src/core/__tests__/differ.test.ts
    ⚠ new-test-no-marker (line 120)
      New test block has no @awa-test marker

Summary: 1 error, 2 warnings
```

### JSON

```json
{
  "findings": [
    {
      "severity": "warning",
      "code": "new-code-no-marker",
      "message": "New function in @awa-component file has no @awa-impl marker",
      "filePath": "src/core/differ.ts",
      "line": 95
    },
    {
      "severity": "error",
      "code": "removed-marker",
      "message": "Removed: @awa-impl: DIFF-1_AC-1",
      "filePath": "src/core/differ.ts",
      "line": 42
    }
  ],
  "counts": { "errors": 1, "warnings": 2 },
  "filesReviewed": 2
}
```

## Steps

### Phase 1: Diff Parser

- [ ] Create `src/core/review/types.ts` with `DiffHunk`, `DiffFile`, `ReviewFinding`, `ReviewResult` types
- [ ] Create `src/core/review/diff-parser.ts` that parses unified diff format into structured data
- [ ] Extract: file path, added lines (with line numbers), removed lines (with line numbers), context lines
- [ ] Handle rename detection (diff with `rename from` / `rename to`)
- [ ] Handle binary files (skip)
- [ ] Unit test with sample unified diffs

### Phase 2: Diff Source Adapters

- [ ] Create `src/core/review/git-adapter.ts` for git operations
- [ ] Implement staged diff: `git diff --cached --unified=3`
- [ ] Implement ref diff: `git diff <ref> --unified=3`
- [ ] Implement stdin adapter: read unified diff from process.stdin
- [ ] Handle git not installed or not a git repo → clear error message
- [ ] Unit test adapters with mock git output

### Phase 3: Review Analyzer

- [ ] Create `src/core/review/analyzer.ts` with the five analysis rules
- [ ] REMOVED-MARKER: scan removed lines for `@awa-impl`, `@awa-test`, `@awa-component` patterns
- [ ] NEW-CODE-NO-MARKER: for files that already have `@awa-component`, check if added blocks have `@awa-impl`
- [ ] CHANGED-IMPL-NO-TEST-CHANGE: for modified sections containing `@awa-impl` markers, check if any file under `__tests__/` or `*.test.*` was also modified in the diff
- [ ] NEW-TEST-NO-MARKER: for added lines in test files, check for `@awa-test` presence
- [ ] MARKER-ID-NOT-IN-SPEC: for newly added markers, validate IDs against SpecParseResult
- [ ] Accept `SpecParseResult` from Check Engine to validate marker IDs
- [ ] Unit test each rule independently with fixture diffs

### Phase 4: Output Formatters

- [ ] Create `src/core/review/reporter.ts` with text formatter (grouped by file)
- [ ] Create JSON formatter
- [ ] Create summary formatter (counts only)
- [ ] Unit test formatters

### Phase 5: CLI Command

- [ ] Create `src/commands/review.ts` command handler
- [ ] Register `review` command in `src/cli/index.ts`
- [ ] Wire up: resolve diff source → parse diff → load specs (for ID validation) → analyze → format
- [ ] Implement `--strict` (warnings become errors, affects exit code)
- [ ] Integration test: make a change, run `awa review --staged`

### Phase 6: Git Hook Integration

- [ ] Document pre-commit hook setup: `awa review --staged --strict`
- [ ] Document CI integration: `awa review --ref origin/main --json`
- [ ] Create example `.husky/pre-commit` hook

## Edge Cases

- Not a git repository (`--staged` or `--ref`) → error "Not a git repository" (exit 2)
- No staged changes → "No staged changes to review" (exit 0)
- Binary files in diff → skip silently
- Renamed files → track both old and new paths for marker comparison
- Empty diff (no changes to code files matching code-globs) → "No reviewable changes" (exit 0)
- Markers in comments that are not actual awa markers (e.g. documentation mentioning `@awa-impl`) → only detect markers in the standard marker format

## Risks

- FALSE POSITIVES: `new-code-no-marker` may fire on utility functions, constants, or boilerplate that does not implement any AC. Mitigation: only fire within files that already have `@awa-component` markers (opt-in per file). Add `@awa-ignore` support.
- GIT DEPENDENCY: requires git installed and a git repository. Mitigation: `--stdin` mode works without git. Document requirement clearly.
- DIFF PARSING FRAGILITY: unified diff format has edge cases (binary, mode changes, submodules). Mitigation: use the existing `diff` npm package for parsing if possible, or handle known edge cases.
- SCOPE CREEP: requests to add GitHub PR comments, status checks, etc. Mitigation: v1 is CLI-only. GitHub integration is a documented future phase.
- PERFORMANCE: running spec-parser on every `awa review` adds overhead. Mitigation: spec parsing is fast (~50ms for typical projects). Could cache if needed.

## Dependencies

- Check Engine: spec-parser (for marker ID validation)
- git CLI (for `--staged` and `--ref` modes)
- `diff` npm package: already a dependency, may help with diff parsing
- No new npm dependencies required

## Completion Criteria

- [ ] `awa review` (default staged mode) detects removed markers and new unmarked code
- [ ] `awa review --ref main` compares against main branch
- [ ] `awa review --stdin` accepts piped unified diff
- [ ] All 5 analysis rules fire correctly on test fixtures
- [ ] `--json` outputs structured findings
- [ ] `--strict` makes warnings fail with exit code 1
- [ ] Pre-commit hook documentation included
- [ ] All unit tests pass
- [ ] `awa check` passes

## References

- Check Engine spec-parser: src/core/check/spec-parser.ts
- Marker scanner: src/core/check/marker-scanner.ts (marker regex patterns)
- diff npm package: already in dependencies
- PLAN-003: .awa/plans/PLAN-003-awa-coverage.md (gap detection)
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
