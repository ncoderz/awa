# PLAN-007: `awa diff --watch` — Auto-Diff on Template Changes

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — extends existing diff command

## Problem

During template development, `awa diff` is re-run manually after every edit. No watch mode for fast feedback.

## Goal

`awa diff --watch` re-runs the diff automatically when template files change. No new subcommand — just a flag on the existing diff command (same pattern as `vitest --watch`, `tsc --watch`).

## Workflow Steps

### 1. FEAT

Create `FEAT-WATCH-diff-watch.md` — developer experience for template authors, fast iteration cycle.

Key scenarios:
- `awa diff . --watch` — watch configured template, re-diff on change
- `awa diff . --template ./templates/awa --watch` — watch specific template
- Edit a template file → diff output refreshes in terminal
- Debounced: rapid saves don't trigger multiple diffs

### 2. REQUIREMENTS

Create `REQ-WATCH-diff-watch.md`:

- WATCH-1: Diff command accepts `--watch` flag
- WATCH-2: When `--watch` is active, diff monitors template directory for file changes
- WATCH-3: On change, diff re-runs and displays updated results
- WATCH-4: Watch mode debounces rapid changes (configurable, default 300ms)
- WATCH-5: Watch mode displays clear separator between diff runs
- WATCH-6: Watch mode supports Ctrl+C graceful shutdown
- WATCH-7: Watch mode uses native fs.watch (no external dependencies)
- WATCH-8: Watch mode only supports local template sources (error on git templates)

### 3. DESIGN

Create `DESIGN-WATCH-diff-watch.md`:

- WATCH-FileWatcher: `fs.watch` recursive watcher on resolved template directory
- WATCH-Debouncer: Debounce rapid changes (setTimeout-based)
- WATCH-DiffRunner: Invoke existing diff logic on each trigger
- WATCH-Display: Clear screen, show timestamp, show diff output
- No new dependencies — Node.js `fs.watch` with recursive option (Node 19+)
- Integration: add `--watch` to existing diff command definition, wrap diff execution in watch loop

### 4. TASKS

- Add `--watch` flag to diff command CLI definition
- Refactor diff CLI action handler: currently calls `process.exit(exitCode)` after each run — watch mode must not exit. Extract diff execution into a reusable function that returns the exit code without calling `process.exit()`, and only call `process.exit()` in non-watch mode
- Create file watcher module (wraps `fs.watch` recursive)
- Create debouncer
- Wrap diff execution: run once, then enter watch loop if `--watch`
- Handle Ctrl+C gracefully
- Validate template source is local when `--watch` is used
- Unit test for debouncer
- Manual testing (watch mode is hard to unit test)

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `--watch` option on diff command
- Update `README.md` development section
- Website: Update diff command reference with `--watch`
- Update ARCHITECTURE.md mentioning FileWatcher component

## Risks

- `fs.watch` behavior varies across platforms (macOS FSEvents, Linux inotify, Windows ReadDirectoryChangesW) — test on target platforms
- `fs.watch` recursive option requires Node 19+ (awa already requires 24+, so fine)
- Git templates: watching a cached git template makes no sense — enforce local-only with clear error

## Completion Criteria

- `awa diff . --watch` detects template changes and re-runs diff
- Debouncing prevents excessive diff runs
- Ctrl+C exits cleanly
- Error on `--watch` with git template source
- Documentation complete
