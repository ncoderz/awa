# LSP / IDE Integration

STATUS: in-progress
DIRECTION: top-down

## Context

awa's traceability chain creates rich relationships between specs and code, but navigating them today requires CLI commands or manual grep. IDE integration through the Language Server Protocol would make these relationships instantly accessible: hover over `@awa-impl: DIFF-1_AC-1` to see the requirement text, ctrl-click to jump to the spec, see red squiggles for orphaned markers — all without leaving the editor.

This is the highest-effort feature but would have the most transformative impact on daily workflow.

## Scope

IN SCOPE (phased):
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
│         awa LSP Server          │
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

### Phase 1: Spec Index for LSP

- [ ] Create `packages/awa-lsp/src/index.ts` (or `src/lsp/` within main package — decide packaging)
- [ ] Create `src/lsp/spec-index.ts` with `LspSpecIndex` that builds from spec-parser + marker-scanner
- [ ] Extend spec-parser to extract requirement/AC text (not just IDs) for hover content
- [ ] Build marker position index: for each source file, record exact character positions of marker IDs
- [ ] Implement incremental update: when a file changes, re-index only that file
- [ ] Unit test index building and incremental updates

### Phase 2: LSP Server Core

- [ ] Create `src/lsp/server.ts` using `vscode-languageserver/node` package
- [ ] Implement document open/change/close handlers that trigger re-indexing
- [ ] Implement workspace folder change handler
- [ ] Implement file watcher for `.awa/specs/` and code directories
- [ ] Create connection with stdio transport
- [ ] Unit test server lifecycle

### Phase 3: Hover Provider

- [ ] Implement `textDocument/hover` handler
- [ ] Detect if cursor position is within a `@awa-*` marker pattern
- [ ] Extract the ID at cursor position
- [ ] Look up ID in spec index, return formatted Markdown hover content
- [ ] Include: ID type, full requirement/AC text, source file path
- [ ] Unit test hover responses for various marker types

### Phase 4: Go-to-Definition Provider

- [ ] Implement `textDocument/definition` handler
- [ ] For `@awa-impl` / `@awa-test` markers: return spec file location where the ID is defined
- [ ] For `@awa-component` markers: return design file location of the component heading
- [ ] For spec IDs in IMPLEMENTS/VALIDATES: return requiring spec file location
- [ ] Unit test definition responses

### Phase 5: Diagnostics

- [ ] Implement diagnostics publisher (runs on document change, debounced)
- [ ] Check marker IDs against spec index (orphaned markers)
- [ ] Check ID format against configured pattern
- [ ] Check for trailing text after marker IDs
- [ ] Publish diagnostics per-document, clear on document close
- [ ] Unit test diagnostic generation

### Phase 6: Autocomplete

- [ ] Implement `textDocument/completion` handler
- [ ] Trigger on `@awa-impl: `, `@awa-test: `, `@awa-component: ` patterns
- [ ] Return completion items: all known IDs of the appropriate type
- [ ] Group by feature code, include description text
- [ ] Set completion item kind (Reference for IDs)
- [ ] Unit test completion responses

### Phase 7: VS Code Extension

- [ ] Create `packages/awa-vscode/` with extension manifest (`package.json`)
- [ ] Define extension activation events: `onLanguage:typescript`, `onLanguage:javascript`, `workspaceContains:.awa/`
- [ ] Define configuration: `awa.lsp.enable`, `awa.specDir`, `awa.codeGlobs`
- [ ] Create extension client that spawns LSP server as child process
- [ ] Add status bar item showing index status ("awa: 42 IDs indexed")
- [ ] Package and test VS Code extension locally

### Phase 8: Code Lens (Phase 3 feature)

- [ ] Implement `textDocument/codeLens` handler
- [ ] For each `@awa-impl` marker: show "N tests | M design refs" lens above the line
- [ ] For each `@awa-test` marker: show "N implementations" lens above the line
- [ ] Make lenses clickable (command to navigate to linked artifacts)
- [ ] Unit test code lens generation

### Phase 9: Rename Support (Phase 3 feature)

- [ ] Implement `textDocument/rename` handler
- [ ] When renaming a marker ID: find all occurrences in code + spec files
- [ ] Return workspace edit with all rename changes
- [ ] Implement `textDocument/prepareRename` to validate the rename location
- [ ] Unit test rename across files

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
- PACKAGING: deciding between monorepo package or separate npm package. Mitigation: start as `src/lsp/` within the main package, extract later if size warrants it.

## Dependencies

- `vscode-languageserver` + `vscode-languageserver-textdocument`: LSP server library (new npm dependency)
- `vscode-languageclient`: VS Code extension client library (new dev dependency for extension)
- Check Engine: marker-scanner, spec-parser (shared core modules)
- PLAN-002 (`awa trace`): TraceIndex model (reused for code lens counts)
- VS Code Extension API

## Completion Criteria

### Phase 1 (MVP)

- [ ] Hover on `@awa-impl: DIFF-1_AC-1` shows requirement text
- [ ] Ctrl-click on marker ID jumps to spec file
- [ ] VS Code extension activates on workspace with `.awa/` folder
- [ ] Status bar shows index status

### Phase 2

- [ ] Red squiggles on orphaned marker IDs
- [ ] Autocomplete after `@awa-impl: ` shows valid AC IDs

### Phase 3

- [ ] Code lens above markers shows linked artifact counts
- [ ] Rename ID across all files in workspace

### All Phases

- [ ] All unit tests pass
- [ ] LSP protocol tests pass
- [ ] Extension installs and activates correctly in VS Code
- [ ] `awa check` passes

## References

- LSP specification: https://microsoft.github.io/language-server-protocol/
- vscode-languageserver: https://github.com/microsoft/vscode-languageserver-node
- Check Engine: src/core/check/ (reusable modules)
- PLAN-002: .awa/plans/PLAN-002-awa-trace.md (TraceIndex)
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
