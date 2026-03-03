# Memory Audit Report — awa CLI

**Date:** 4 March 2026
**Branch:** `feat/codes-recode-merge`
**Version:** 1.7.2
**Runtime:** Node.js v24.3.0

## Executive Summary

OOM crashes during `npm run dev -- check` are caused by **tsx** (the TypeScript Execute dev runtime), not the application code. The built binary (`node dist/index.js check`) completes at ~33 MB peak heap. tsx's esbuild compilation + IPC + caching of the full dependency graph exhausts heap before application code even runs at scale.

No unbounded memory growth was found anywhere in the codebase. All data structures are call-scoped and fully reclaimable by GC. Eight application-level findings (P1–P8) are documented below — none are critical.

## Root Cause

| Mode | Command | Peak Heap | Result |
|------|---------|-----------|--------|
| **Dev (tsx)** | `npm run dev -- check` | >4 GB | OOM crash |
| **Built** | `node dist/index.js check` | ~33 MB | Passes instantly |

tsx compiles every imported module through esbuild on-the-fly, caches compiled output in memory, and maintains an IPC channel to the parent. For a project with unified/remark/yaml/eta and 150+ transitive dependencies, this overhead alone exceeds 4 GB.

**Immediate workaround:** Use `node dist/index.js` directly, or set `NODE_OPTIONS='--max-old-space-size=8192'` in dev scripts.

## Profiling Results

Measured with `--expose-gc --max-old-space-size=512` against the built binary (67 spec files, 145 code files):

| Phase | Heap Used |
|-------|-----------|
| Start | 3.7 MB |
| After importing unified/remark | 9.8 MB |
| After parsing all 67 specs to mdast ASTs | 33.2 MB (peak) |
| After forced GC | 9.2 MB |
| Code file scan (145 files, 0.8 MB total) | +0.3 MB |

All memory is fully reclaimable — no leaks detected.

## Application-Level Findings

### P1: `matchSimpleGlob` latent bug on bare directory names

**File:** `src/core/check/glob.ts`
**Severity:** Low (masked by fallback)

`matchSimpleGlob("node_modules", "node_modules")` returns `false` because the function converts the pattern to a regex anchored with `$` that expects a trailing slash or path continuation. The `dirPrefixes.includes()` fallback in `collectFiles` saves it, but the function itself is incorrect for bare directory names.

**Fix:** Add `/?` or end-of-string alternate to the generated regex.

### P2: Schema checker re-reads files already parsed by spec-parser

**File:** `src/core/check/schema-checker.ts`
**Severity:** Medium (performance)

`schemaChecker.checkFiles()` calls `fs.readFile()` on every spec file to parse it into an mdast AST via unified/remark. These same files were already read and partially parsed by `specParser.parseFiles()` in the same check run. For 67 files this doubles I/O and doubles AST memory during the overlap window.

**Fix:** Add a `content` field to the `SpecFile` type returned by spec-parser, and pass it through to schema-checker to avoid re-reading.

### P3: Multiple fixers re-read the same files (3–4× per spec file)

**Files:** `src/core/check/matrix-fixer.ts`, `src/core/check/codes-fixer.ts`
**Severity:** Medium (performance)

Both fixers independently read DESIGN, TASK, and ARCHITECTURE files that were already loaded by the check pipeline. In a single `awa check --fix` run, the same spec file can be read 3–4 times across spec-parser → schema-checker → matrix-fixer → codes-fixer.

**Fix:** Pass already-loaded content maps through the pipeline instead of re-reading from disk.

### P4: content-assembler reads the same file N times when N IDs reference it

**File:** `src/core/trace/content-assembler.ts`
**Severity:** Low

When multiple trace IDs point to the same file, `assembleContent` reads that file once per ID rather than caching the content for the duration of the assembly call.

**Fix:** Add a `Map<string, string>` file cache scoped to the `assembleContent` invocation.

### P5: Renumber propagator holds 4× file content simultaneously

**File:** `src/core/renumber/propagator.ts`
**Severity:** Low

During replacement, the propagator holds: (1) original content, (2) content with forward-replaced IDs, (3) content with reverse-replaced IDs, (4) final merged content — all for the same file, simultaneously. For very large spec files this multiplies memory 4×.

**Fix:** Use in-place sequential replacement with a single buffer where possible.

### P6: `matchSimpleGlob` creates RegExp objects on every call

**File:** `src/core/check/glob.ts`
**Severity:** Low (performance micro-optimization)

The `exclude` callback in `collectFiles` is invoked for every file/directory encountered during glob traversal. Each call to `matchSimpleGlob` constructs a new `RegExp` from the pattern string. In profiling, this was called 2,632 times across a typical check run.

**Fix:** Pre-compile ignore patterns to `RegExp` objects once in `collectFiles` before starting the glob, then pass the compiled regexes to the exclude callback.

### P7: index-builder copies `idLocations` Map unnecessarily

**File:** `src/core/trace/index-builder.ts`
**Severity:** Low

`buildIndex` creates a copy of the `idLocations` Map via `new Map(idLocations)` before returning. The original is never mutated after construction, so the copy is unnecessary overhead.

**Fix:** Return the original Map directly instead of copying.

### P8: `TemplateEngine.compiledCache` is unused dead code

**File:** `src/core/template.ts`
**Severity:** Informational

The singleton `TemplateEngine` instance has a `compiledCache` Map that is declared but never populated or queried. It is dead code.

**Fix:** Remove the unused `compiledCache` property.

## Module-by-Module Summary

| Module | Holds state across calls? | Unbounded growth? | Notes |
|--------|---------------------------|-------------------|-------|
| `commands/check.ts` | No | No | Orchestrator only |
| `check/spec-parser.ts` | No | No | Call-scoped arrays |
| `check/schema-checker.ts` | No | No | Re-reads files (P2) |
| `check/marker-scanner.ts` | No | No | Call-scoped |
| `check/code-spec-checker.ts` | No | No | Pure validation |
| `check/spec-spec-checker.ts` | No | No | Pure validation |
| `check/glob.ts` | No | No | Regex allocation (P6) |
| `check/rule-loader.ts` | No | No | Caches within call |
| `check/matrix-fixer.ts` | No | No | Re-reads files (P3) |
| `check/codes-fixer.ts` | No | No | Re-reads files (P3) |
| `core/config.ts` | No | No | Single TOML parse |
| `core/resolver.ts` | No | No | Pure functions |
| `core/generator.ts` | No | No | Streaming writes |
| `core/template.ts` | Singleton | No | Dead cache (P8) |
| `core/batch-runner.ts` | No | No | Sequential execution |
| `core/overlay.ts` | No | No | Call-scoped |
| `core/differ.ts` | No | No | Temp dir cleaned |
| `core/feature-resolver.ts` | No | No | Pure functions |
| `core/template-resolver.ts` | No | No | Call-scoped |
| `trace/index-builder.ts` | No | No | Unnecessary copy (P7) |
| `trace/content-assembler.ts` | No | No | Repeated reads (P4) |
| `trace/scanner.ts` | No | No | Call-scoped |
| `renumber/propagator.ts` | No | No | 4× memory (P5) |
| `recode/*` | No | No | Call-scoped maps |
| `merge/*` | No | No | Call-scoped |
| `codes/scanner.ts` | No | No | Call-scoped |
| `features/*` | No | No | Call-scoped |
| `utils/file-watcher.ts` | Watcher ref | No | Properly disposed |
| `utils/fs.ts` | No | No | Stateless utilities |
| `cli/index.ts` | No | No | Entry point only |

## Prioritised Recommendations

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| **1** | Use built binary for dev testing | None | Eliminates OOM |
| **2** | P2: Pass spec content to schema-checker | Small | −50% file I/O in check |
| **3** | P3: Share content maps across fixers | Small | −60% file I/O in fix mode |
| **4** | P6: Pre-compile glob exclude patterns | Trivial | 2,632 fewer RegExp allocations |
| **5** | P1: Fix `matchSimpleGlob` bare directory bug | Trivial | Correctness |
| **6** | P4: Cache files in content-assembler | Trivial | Fewer reads in trace |
| **7** | P7: Remove unnecessary Map copy | Trivial | Minor memory saving |
| **8** | P8: Remove dead `compiledCache` | Trivial | Code hygiene |
