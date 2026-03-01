# LSP / IDE Integration

STATUS: complete
DIRECTION: top-down

## Context

awa's traceability chain creates rich relationships between specs and code, but navigating them today requires CLI commands or manual grep. IDE integration through the Language Server Protocol would make these relationships instantly accessible: hover over `@awa-impl: DIFF-1_AC-1` to see the requirement text, ctrl-click to jump to the spec, see red squiggles for orphaned markers — all without leaving the editor.

This is the highest-effort feature but would have the most transformative impact on daily workflow.

Delivering LSP correctly requires the repository to be a proper npm workspace first. Currently, source lives in `src/` at the root alongside a `packages/` directory — a half-and-half structure. This plan begins with a full workspace restructuring before any LSP code is written.

## Scope

IN SCOPE (phased):
- Phase 0: Full workspace restructuring (prerequisite)
- Phase 1: Hover + Go-to-definition for `@awa-*` markers
- Phase 2: Diagnostics (orphaned markers, broken refs) + autocomplete for marker IDs
- Phase 3: Code lens (show linked tests/impls inline) + rename refactoring across chain
- VS Code extension as primary target
- Generic LSP server for other editors

OUT OF SCOPE:
- Template editing support (LSP focuses on spec/code traceability)
- Real-time `awa check` in LSP (would be too slow for keystroke-level)
- Custom editor UI (webviews, tree views — stick to standard LSP features)
- Spec file editing assistance beyond diagnostics (no AI-powered suggestions)

## Architecture

### Target Workspace Layout

```
/ (workspace root — coordinator only, no src/)
├── package.json           (workspaces: ["packages/*"], no source deps)
├── tsconfig.json          (base compiler options, no rootDir/outDir)
├── biome.json
├── vitest.config.ts       (points to packages/*/src/**/__tests__)
├── packages/
│   ├── awa-core/          (@ncoderz/awa-core)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   └── src/
│   │       ├── index.ts   (barrel — exports all public API)
│   │       ├── core/
│   │       │   ├── check/     (spec-parser, marker-scanner, schema-checker,
│   │       │   │               rule-loader, code-spec-checker, spec-spec-checker,
│   │       │   │               glob, types, errors — no logger dep)
│   │       │   ├── trace/     (all trace files)
│   │       │   ├── features/
│   │       │   │   └── scanner.ts
│   │       │   └── config.ts  (ConfigLoader — logger decoupled via onWarn callback)
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── utils/
│   │           └── fs.ts
│   │
│   ├── awa/               (@ncoderz/awa — the CLI)
│   │   ├── package.json   (deps: @ncoderz/awa-core, commander, @clack/prompts,
│   │   │                         degit, diff, isbinaryfile, chalk, eta)
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts (entry: src/cli/index.ts)
│   │   └── src/
│   │       ├── cli/
│   │       ├── commands/
│   │       ├── core/      (generator, batch-runner, differ, template, template-resolver,
│   │       │               resolver, overlay, delete-list, json-output, template-test,
│   │       │               features/reporter)
│   │       └── utils/     (logger, update-check, update-check-cache, debouncer,
│   │                        file-watcher)
│   │
│   ├── awa-language-server/  (@ncoderz/awa-language-server)
│   │   ├── package.json      (deps: @ncoderz/awa-core, vscode-languageserver,
│   │   │                             vscode-languageserver-textdocument)
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts    (entry: src/server.ts — CJS + ESM for VS Code compat)
│   │   └── src/
│   │       ├── server.ts
│   │       ├── entry.ts
│   │       ├── spec-index.ts
│   │       └── providers/
│   │
│   └── awa-vscode/           (@ncoderz/awa-vscode — VS Code extension)
│       ├── package.json      (vscode engine, vscode-languageclient)
│       ├── tsconfig.json
│       └── src/
│           └── extension.ts  (spawns awa-language-server)
```

### Dependency Graph

```
@ncoderz/awa-core
        ▲           ▲
        │           │
@ncoderz/awa   @ncoderz/awa-language-server
                        ▲
                        │
               @ncoderz/awa-vscode
```

### LSP Runtime Architecture

```
┌─────────────────────────────────┐
│         VS Code Extension       │
│  ┌───────────────────────────┐  │
│  │    Extension Client       │  │
│  │  (activation, config,     │  │
│  │   status bar, commands)   │  │
│  └─────────┬─────────────────┘  │
└────────────┼────────────────────┘
             │ LSP protocol (stdio)
┌────────────┼────────────────────┐
│  ┌─────────▼─────────────────┐  │
│  │     LSP Server            │  │
│  │  ┌─────────────────────┐  │  │
│  │  │    Spec Index        │  │  │
│  │  │  (ID → location,    │  │  │
│  │  │   ID → text,        │  │  │
│  │  │   marker → ID)      │  │  │
│  │  └─────────────────────┘  │  │
│  │  ┌─────────────────────┐  │  │
│  │  │    File Watcher      │  │  │
│  │  │  (incremental        │  │  │
│  │  │   re-indexing)       │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│      awa-language-server        │
└─────────────────────────────────┘
```

## LSP Capabilities by Phase

### Phase 1: Hover + Go-to-Definition

HOVER: when cursor is on a `@awa-*` marker ID, show a hover popup with:
- ID type (requirement, AC, property, component)
- Requirement / AC text from the spec file
- File path and line number in the spec

GO-TO-DEFINITION: ctrl-click on a marker ID jumps to its definition in the spec file. For `@awa-impl: DIFF-1_AC-1`, jump to the line in `REQ-DIFF-diff.md` where `DIFF-1_AC-1` is defined.

### Phase 2: Diagnostics + Autocomplete

DIAGNOSTICS: publish diagnostics (squiggles) for:
- Orphaned markers (ID not in any spec file) — error severity
- Invalid ID format — error severity
- Markers with trailing text — error severity

AUTOCOMPLETE: when typing `@awa-impl: ` or `@awa-test: `, offer completion items from the spec index (all known AC IDs, property IDs). Group by feature code. Include description text in completion detail.

### Phase 3: Code Lens + Rename

CODE LENS: above each `@awa-impl` marker, show a code lens like:
- `DIFF-1_AC-1 — 2 tests | 1 design ref` (clickable to navigate)

Above each `@awa-test` marker, show:
- `DIFF-1_AC-1 — 3 implementations` (clickable)

RENAME: rename a requirement or AC ID across all specs and code files simultaneously. Rename `DIFF-1_AC-1` → `DIFF-1_AC-2` updates every marker and cross-reference.

## Data Model: Spec Index (for LSP)

Lives in `packages/awa-language-server/src/spec-index.ts`, built from `@ncoderz/awa-core`'s spec-parser and marker-scanner.

```typescript
interface LspSpecIndex {
  // ID metadata
  ids: Map<string, IdInfo>;

  // Markers (code → spec)
  markers: Map<string, MarkerInfo[]>;  // filePath → markers in that file

  // Reverse: spec ID → code locations
  implementations: Map<string, CodeLocation[]>;
  tests: Map<string, CodeLocation[]>;
  components: Map<string, CodeLocation[]>;
}

interface IdInfo {
  id: string;
  type: 'requirement' | 'ac' | 'property' | 'component';
  text: string;           // e.g. "Produces unified diff for modified files"
  filePath: string;
  line: number;
  featureCode: string;    // e.g. "DIFF"
}

interface MarkerInfo {
  type: 'impl' | 'test' | 'component';
  id: string;
  line: number;
  column: number;        // character offset for precise hover
}
```

## Steps

### Phase 0a: Scaffold `packages/awa-core`

Goal: create the package skeleton and move pure shared logic out of `src/` into it.

- [x] Create `packages/awa-core/package.json` (`@ncoderz/awa-core`, ESM, deps: `smol-toml`, `eta`, `yaml`, `unified`, `remark-parse`, `remark-gfm`, `chalk`)
- [x] Create `packages/awa-core/tsconfig.json` (extends root base options; `rootDir: ./src`, `outDir: ./dist`)
- [x] Create `packages/awa-core/tsup.config.ts` (entry: `src/index.ts`, ESM, dts, sourcemap)
- [x] Copy (not yet delete) the following into `packages/awa-core/src/` preserving relative structure:
  - `src/types/index.ts` → `packages/awa-core/src/types/index.ts`
  - `src/utils/fs.ts` → `packages/awa-core/src/utils/fs.ts`
  - `src/core/config.ts` → `packages/awa-core/src/core/config.ts` (decouple logger: replace `logger.warn(...)` calls with an `onWarn?: (msg: string) => void` constructor callback; default to no-op)
  - `src/core/check/glob.ts`, `types.ts`, `errors.ts`, `marker-scanner.ts`, `spec-parser.ts`, `code-spec-checker.ts`, `spec-spec-checker.ts`, `rule-loader.ts`, `schema-checker.ts`, `reporter.ts`
  - `src/core/trace/` (all files)
  - `src/core/features/scanner.ts`
- [x] Create `packages/awa-core/src/index.ts` — barrel that re-exports everything public
- [x] Update all internal imports within awa-core to use relative paths (they already will)
- [x] Add `packages/awa-core` to root `package.json` workspaces if not already present (`"workspaces": ["packages/*"]`)
- [x] Run `npm install` to link workspace
- [x] Build and test awa-core in isolation: `cd packages/awa-core && npm run build`

### Phase 0b: Scaffold `packages/awa` (move the CLI)

Goal: move all remaining `src/` code into `packages/awa/` so the root has no source.

- [x] Create `packages/awa/package.json` (`@ncoderz/awa`, ESM, bin: `awa`, deps: `@ncoderz/awa-core: workspace:*`, `commander`, `@clack/prompts`, `@clack/core`, `degit`, `diff`, `isbinaryfile`, `chalk`, `eta`; remove `smol-toml`, `yaml`, `unified`, `remark-*` — now in awa-core)
- [x] Create `packages/awa/tsconfig.json`
- [x] Create `packages/awa/tsup.config.ts` (entry: `src/cli/index.ts`, bin output)
- [x] Move (git mv) the following into `packages/awa/src/` preserving relative structure:
  - `src/cli/`
  - `src/commands/`
  - `src/core/generator.ts`, `batch-runner.ts`, `differ.ts`, `template.ts`, `template-resolver.ts`, `resolver.ts`, `overlay.ts`, `delete-list.ts`, `json-output.ts`, `template-test/`, `features/reporter.ts`
  - `src/utils/logger.ts`, `update-check.ts`, `update-check-cache.ts`, `debouncer.ts`, `file-watcher.ts`
  - `src/_generated/`
  - `scripts/` (init.ts, create_package_info.ts, clean.mjs)
- [x] Update all imports in `packages/awa/src/` that previously pointed to `../core/check/`, `../core/trace/`, `../types/`, `../utils/fs` to instead import from `@ncoderz/awa-core`
- [x] Wire `configLoader` singleton: pass `logger.warn.bind(logger)` as `onWarn` to `ConfigLoader` constructor
- [x] Update root `package.json`: remove all source-level deps (moved to `packages/awa`), remove `bin`, `main`, `exports`, `files` — root is now a coordinator only
- [x] Update root `tsconfig.json` to be a base (no `rootDir`/`outDir`); add `references` pointing to each package
- [x] Update root `vitest.config.ts` to discover tests in all package `__tests__` directories
- [x] Update `tsup.config.ts` at root — remove (each package has its own); or keep only for top-level convenience script
- [x] Remove `src/types/`, `src/utils/fs.ts`, `src/core/check/`, `src/core/trace/`, `src/core/features/scanner.ts` from root (now live in awa-core)
- [x] Remove now-empty `src/` from root entirely
- [x] Run `npm install && npm run build && npm test` from root

### Phase 0c: Scaffold `packages/awa-language-server`

Goal: create the LSP server package, pulling from any prior prototype code on the branch.

- [x] Create `packages/awa-language-server/package.json` (`@ncoderz/awa-language-server`, deps: `@ncoderz/awa-core: workspace:*`, `vscode-languageserver`, `vscode-languageserver-textdocument`)
- [x] Create `packages/awa-language-server/tsconfig.json`
- [x] Create `packages/awa-language-server/tsup.config.ts` (CJS + ESM, entry: `src/server.ts`)
- [x] Remove `vscode-languageserver` and `vscode-languageserver-textdocument` from root `package.json`
- [x] If any LSP prototype code exists (e.g. `src/lsp/`, `src/commands/lsp.ts`): move into `packages/awa-language-server/src/` and update imports to `@ncoderz/awa-core`
- [x] Verify `packages/awa-vscode/` extension points to `awa-language-server` package (not root)

### Phase 1: Spec Index for LSP

- [x] Create `packages/awa-language-server/src/spec-index.ts` with `LspSpecIndex` building from `@ncoderz/awa-core` spec-parser + marker-scanner
- [x] Extend spec-parser (in awa-core) to extract requirement/AC text (not just IDs) for hover content
- [x] Build marker position index: for each source file, record exact character positions of marker IDs
- [x] Implement incremental update: when a file changes, re-index only that file
- [x] Unit test index building and incremental updates

### Phase 2: LSP Server Core

- [x] Create `packages/awa-language-server/src/server.ts` using `vscode-languageserver/node`
- [x] Implement document open/change/close handlers that trigger re-indexing
- [x] Implement workspace folder change handler
- [x] Implement file watcher for `.awa/specs/` and code directories
- [x] Create connection with stdio transport
- [x] Unit test server lifecycle

### Phase 3: Hover Provider

- [x] Implement `textDocument/hover` handler in `packages/awa-language-server/src/providers/hover.ts`
- [x] Detect if cursor position is within a `@awa-*` marker pattern
- [x] Extract the ID at cursor position
- [x] Look up ID in spec index, return formatted Markdown hover content
- [x] Include: ID type, full requirement/AC text, source file path
- [x] Unit test hover responses for various marker types

### Phase 4: Go-to-Definition Provider

- [x] Implement `textDocument/definition` handler in `packages/awa-language-server/src/providers/definition.ts`
- [x] For `@awa-impl` / `@awa-test` markers: return spec file location where the ID is defined
- [x] For `@awa-component` markers: return design file location of the component heading
- [x] For spec IDs in IMPLEMENTS/VALIDATES: return requiring spec file location
- [x] Unit test definition responses

### Phase 5: Diagnostics

- [x] Implement diagnostics publisher (runs on document change, debounced) in `packages/awa-language-server/src/providers/diagnostics.ts`
- [x] Check marker IDs against spec index (orphaned markers)
- [x] Check ID format against configured pattern
- [x] Check for trailing text after marker IDs
- [x] Publish diagnostics per-document, clear on document close
- [x] Unit test diagnostic generation

### Phase 6: Autocomplete

- [x] Implement `textDocument/completion` handler in `packages/awa-language-server/src/providers/completion.ts`
- [x] Trigger on `@awa-impl: `, `@awa-test: `, `@awa-component: ` patterns
- [x] Return completion items: all known IDs of the appropriate type
- [x] Group by feature code, include description text
- [x] Set completion item kind (Reference for IDs)
- [x] Unit test completion responses

### Phase 7: VS Code Extension

- [x] Update `packages/awa-vscode/package.json` activation events: `onLanguage:typescript`, `onLanguage:javascript`, `workspaceContains:.awa/`
- [x] Define configuration: `awa.lsp.enable`, `awa.specDir`, `awa.codeGlobs`
- [x] Extension client spawns `packages/awa-language-server` as child process
- [x] Add status bar item showing index status ("awa: 42 IDs indexed")
- [x] Package and test VS Code extension locally (vsce package)

### Phase 8: Code Lens

- [x] Implement `textDocument/codeLens` handler in `packages/awa-language-server/src/providers/code-lens.ts`
- [x] For each `@awa-impl` marker: show "N tests | M design refs" lens above the line
- [x] For each `@awa-test` marker: show "N implementations" lens above the line
- [x] Make lenses clickable (command to navigate to linked artifacts)
- [x] Unit test code lens generation

### Phase 9: Rename Support

- [x] Implement `textDocument/rename` handler in `packages/awa-language-server/src/providers/rename.ts`
- [x] When renaming a marker ID: find all occurrences in code + spec files
- [x] Return workspace edit with all rename changes
- [x] Implement `textDocument/prepareRename` to validate the rename location
- [x] Unit test rename across files

## Edge Cases

- Workspace has no `.awa/` directory → LSP starts but shows "No awa specs found" in status bar; no features active
- Spec file has syntax errors → index what can be parsed, skip malformed sections
- Very large workspace (1000+ source files) → incremental indexing only re-scans changed files, full scan on startup with progress reporting
- Multiple workspace folders → each folder gets its own spec index
- Marker ID spans multiple lines (unlikely but possible) → detect line continuation
- File renamed externally → file watcher picks up delete + create events, re-index

## Risks

- VERY HIGH EFFORT: LSP + VS Code extension is the largest feature. Mitigation: phase strictly — ship Phase 1 (hover + goto) as an MVP; each subsequent phase is independently valuable.
- LSP COMPLEXITY: the LSP protocol has many capabilities and edge cases. Mitigation: use `vscode-languageserver` library which abstracts most of it. Start with a minimal capability set.
- MULTI-EDITOR MAINTENANCE: supporting VS Code, Neovim, Emacs, etc. Mitigation: the LSP server is editor-agnostic. Only the VS Code extension is custom. Other editors use their native LSP client.
- PERFORMANCE: full workspace scan on startup could be slow. Mitigation: incremental indexing, debounced file watching, progress reporting.
- VERSIONING: LSP server and CLI may diverge. Mitigation: share core modules (spec-parser, marker-scanner) between CLI and LSP. Version together.
- PACKAGING: monorepo package

## Dependencies

### New Packages
- `packages/awa-core` (`@ncoderz/awa-core`): shared pure logic — spec-parser, marker-scanner, config, trace, types, fs utils
- `packages/awa` (`@ncoderz/awa`): CLI package, extracted from root `src/`
- `packages/awa-language-server` (`@ncoderz/awa-language-server`): LSP server
- `packages/awa-vscode` (`@ncoderz/awa-vscode`): VS Code extension client (already scaffolded)

### New npm Dependencies
- `vscode-languageserver` + `vscode-languageserver-textdocument`: in `awa-language-server` only (not root)
- `vscode-languageclient`: devDep in `awa-vscode`

### Moved npm Dependencies
- `smol-toml`, `yaml`, `unified`, `remark-parse`, `remark-gfm`, `chalk`, `eta`: move from root to `awa-core`
- `commander`, `@clack/prompts`, `@clack/core`, `degit`, `diff`, `isbinaryfile`: move from root to `awa`
- Root `package.json` retains only workspace-coordinator scripts and devDeps (tsup, vitest, biome, typescript)

### Internal References
- PLAN-002 (`awa trace`): TraceIndex model reused for code lens counts
- VS Code Extension API

## Completion Criteria

### Phase 0 (Workspace Restructure)

- [x] Root `src/` directory no longer exists
- [x] `packages/awa-core/` builds independently (`npm run build` from package dir)
- [x] `packages/awa/` builds and all existing CLI tests pass
- [x] `packages/awa-language-server/` builds independently
- [x] `npm run build && npm test` from workspace root passes
- [x] `awa check` still passes (no broken traceability)
- [x] `vscode-languageserver` not present in root `package.json`

### Phase 1 (LSP MVP)

- [x] Hover on `@awa-impl: DIFF-1_AC-1` shows requirement text
- [x] Ctrl-click on marker ID jumps to spec file
- [x] VS Code extension activates on workspace with `.awa/` folder
- [x] Status bar shows index status

### Phase 2

- [x] Red squiggles on orphaned marker IDs
- [x] Autocomplete after `@awa-impl: ` shows valid AC IDs

### Phase 3

- [x] Code lens above markers shows linked artifact counts
- [x] Rename ID across all files in workspace

### All Phases

- [x] All unit tests pass
- [ ] LSP protocol tests pass
- [ ] Extension installs and activates correctly in VS Code
- [x] `awa check` passes

## References

- LSP specification: https://microsoft.github.io/language-server-protocol/
- vscode-languageserver: https://github.com/microsoft/vscode-languageserver-node
- Check Engine: `packages/awa-core/src/core/check/` (reusable modules)
- PLAN-002: .awa/plans/PLAN-002-awa-trace.md (TraceIndex)
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
- 002 (2026-03-01): Revised to true workspace architecture — add Phase 0 (move `src/` to `packages/awa/`, extract `packages/awa-core/`, scaffold `packages/awa-language-server/`); update all step and architecture references accordingly
