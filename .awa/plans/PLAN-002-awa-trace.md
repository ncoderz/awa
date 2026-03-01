# `awa trace` — Traceability Explorer & Context Assembly

STATUS: in-progress
DIRECTION: top-down

## Context

awa's traceability chain links requirements → design → code → tests through explicit IDs and markers. Today, `awa check` validates these links exist but provides no way to *navigate* or *exploit* them. A developer looking at `DIFF-1_AC-1` must manually grep spec files, source code, and tests to trace the chain. An AI coding agent has no way to receive exactly the specs, code, and tests relevant to its current task.

`awa trace` makes the chain queryable and actionable. Given any ID, task, or source file, it can display the chain (locations) or assemble the actual content — optimized for feeding into AI context windows.

This plan merges the original PLAN-002 (trace) and PLAN-008 (context) — they share 70% of their implementation (index building, chain walking, ID resolution) and differ only in output format (locations vs. content).

## Scope

IN SCOPE:
- Query by any ID type: requirement (`DIFF-1`), sub-requirement (`DIFF-1.1`), AC (`DIFF-1_AC-1`), property (`DIFF_P-1`), component (`DIFF-DiffEngine`)
- Query by task file: `--task TASK-DIFF-diff-003` resolves to the IDs referenced in the task
- Query by source file: `--file src/core/differ.ts` resolves its `@awa-*` markers to IDs
- Forward traversal: requirement → ACs → design components → code → tests
- Reverse traversal: test → code → design → requirement
- Output modes: location tree (default), `--content` (actual file sections), `--list` (file paths only), `--json`
- Token budget: `--max-tokens <n>` to cap content output with priority-based truncation
- Context lines (with `--content`): `-A <n>` / `-B <n>` / `-C <n>` flags (grep-style) to control the number of lines returned around code markers (after / before / both)
- Depth control: `--depth <n>` to limit traversal depth
- Scope filtering: `--scope <CODE>` to limit to a feature code
- All IDs: `--all` to trace every known ID in the project (useful for full marker listing)

OUT OF SCOPE:
- MCP server mode (future enhancement — expose as tool for AI agents)
- Interactive TUI / REPL mode (future enhancement)
- IDE integration (covered by PLAN-010)
- Embedding-based similarity search (uses traceability links only)
- Chat history / conversation management
- Modification of artifacts (read-only operation)

## Data Model: Traceability Index

The core data structure shared by trace, coverage, impact, and graph features. Built once from the same data `awa check` already collects.

```typescript
interface TraceIndex {
  // Forward maps (spec → downstream)
  reqToACs: Map<string, string[]>;           // DIFF-1 → [DIFF-1_AC-1, DIFF-1_AC-2]
  acToDesignComponents: Map<string, string[]>; // DIFF-1_AC-1 → [DIFF-DiffEngine]
  acToCodeLocations: Map<string, CodeLocation[]>;  // DIFF-1_AC-1 → [{file, line}]
  acToTestLocations: Map<string, CodeLocation[]>;  // DIFF-1_AC-1 → [{file, line}]
  propertyToTestLocations: Map<string, CodeLocation[]>; // DIFF_P-1 → [{file, line}]
  componentToCodeLocations: Map<string, CodeLocation[]>; // DIFF-DiffEngine → [{file, line}]

  // Reverse maps (downstream → spec)
  acToReq: Map<string, string>;              // DIFF-1_AC-1 → DIFF-1
  componentToACs: Map<string, string[]>;     // DIFF-DiffEngine → [DIFF-1_AC-1, ...]
  propertyToACs: Map<string, string[]>;      // DIFF_P-1 → [DIFF-1_AC-1, ...] (via VALIDATES)

  // Metadata
  idLocations: Map<string, { filePath: string; line: number }>;
  specFiles: SpecFile[];
}

interface CodeLocation {
  filePath: string;
  line: number;
}
```

## CLI Interface

```
awa trace <ID... | --all | --task <path> | --file <path>> [options]

Arguments:
  ID                      Traceability ID(s) (space-separated)

Options:
  --all                   Trace all known IDs in the project
  --task <path>           Resolve IDs from a task file
  --file <path>           Resolve IDs from a source file's markers
  --content               Output actual file sections instead of locations
  --list                  Output file paths only (no content or tree)
  --max-tokens <n>        Cap content output size (implies --content; default: unlimited)
  --depth <n>             Maximum traversal depth (default: unlimited)
  --scope <CODE>          Limit results to a feature code
  --direction <dir>       Traversal direction: both (default), forward, reverse
  --no-code               Exclude source code (spec-only context)
  --no-tests              Exclude test files
  --json                  Output as JSON
  -A <n>                  Lines of context after a code marker (--content only; default: 20)
  -B <n>                  Lines of context before a code marker (--content only; default: 5)
  -C <n>                  Lines of context before and after (--content only; overrides -A and -B)
  -c, --config <path>     Path to configuration file
```

Exit codes: 0 = chain found, 1 = ID not found or no context, 2 = internal error.

## Output Formats

### Location Tree (default)

```
DIFF-1_AC-1: Produces unified diff for modified files

  ▲ Requirement
  │  DIFF-1: Diff Generation (.awa/specs/REQ-DIFF-diff.md:18)

  ▼ Design
  │  DIFF-DiffEngine (.awa/specs/DESIGN-DIFF-diff.md:24)
  │    IMPLEMENTS: DIFF-1_AC-1

  ▼ Implementation
  │  src/core/differ.ts:42  (@awa-impl: DIFF-1_AC-1)
  │  src/core/differ.ts:87  (@awa-impl: DIFF-1_AC-1)

  ▼ Tests
  │  src/core/__tests__/differ.test.ts:15  (@awa-test: DIFF-1_AC-1)
```

### Content Mode (`--content`)

```markdown
# Context: DIFF-1

## Requirement

> From: .awa/specs/REQ-DIFF-diff.md

### DIFF-1: Diff Generation [MUST]

AS A developer, I WANT to compare generated output against existing files...

ACCEPTANCE CRITERIA
- DIFF-1_AC-1 [event]: WHEN diff is run...
- DIFF-1_AC-2 [conditional]: IF files are identical...

## Design

> From: .awa/specs/DESIGN-DIFF-diff.md

### DIFF-DiffEngine

IMPLEMENTS: DIFF-1_AC-1, DIFF-1_AC-2
...

## Implementation

> From: src/core/differ.ts (lines 35-87)

​```typescript
// @awa-impl: DIFF-1_AC-1
export async function diff(...): Promise<DiffResult> { ... }
​```

## Tests

> From: src/core/__tests__/differ.test.ts (lines 10-45)

​```typescript
// @awa-test: DIFF-1_AC-1
test('produces unified diff for modified files', () => { ... });
​```
```

### JSON (`--json`)

Works with both default and `--content` mode. Location mode returns chain structure; content mode returns sections with content.

```json
{
  "query": "DIFF-1_AC-1",
  "sections": [
    { "type": "requirement", "filePath": "...", "line": 18, "content": "..." },
    { "type": "design", "filePath": "...", "line": 24, "content": "..." },
    { "type": "implementation", "filePath": "...", "line": 42, "content": "..." },
    { "type": "test", "filePath": "...", "line": 15, "content": "..." }
  ],
  "estimatedTokens": 2400,
  "filesIncluded": 4
}
```

### List Mode (`--list`)

```
.awa/specs/REQ-DIFF-diff.md:18-28
.awa/specs/DESIGN-DIFF-diff.md:20-35
src/core/differ.ts:35-87
src/core/__tests__/differ.test.ts:10-45
```

## Content Relevance Priority

When `--content` is active, sections are included in this priority order (used for `--max-tokens` truncation):

| Priority | Artifact | What to include |
|----------|----------|-----------------|
| 1 (highest) | Task file | Full content (if querying by `--task`) |
| 2 | Requirement | The specific requirement section (H3 + ACs) |
| 3 | Design | The relevant component section from DESIGN file |
| 4 | Feature context | Relevant sections from FEAT file |
| 5 | Source code | Files with matching `@awa-impl` markers |
| 6 | Test code | Files with matching `@awa-test` markers |
| 7 | Architecture | Relevant component from ARCHITECTURE.md |
| 8 (lowest) | Examples | Relevant EXAMPLES file sections |

## Steps

### Phase 1: Traceability Index Builder

- [ ] Create `src/core/trace/types.ts` with `TraceIndex`, `CodeLocation`, `TraceResult` types
- [ ] Create `src/core/trace/index-builder.ts` that takes `SpecParseResult` + `MarkerScanResult` and builds a `TraceIndex`
- [ ] Build forward maps: parse spec files for requirement→AC relationships (from REQ files), AC→component relationships (from DESIGN IMPLEMENTS lines)
- [ ] Build forward maps from markers: AC→code locations (`@awa-impl`), AC→test locations (`@awa-test`), component→code locations (`@awa-component`)
- [ ] Build reverse maps by inverting the forward maps
- [ ] Build property→AC maps from DESIGN VALIDATES cross-references
- [ ] Unit test the index builder with fixture spec files and markers

### Phase 2: Input Resolution

- [ ] Create `src/core/trace/input-resolver.ts` with input resolution logic
- [ ] Implement ID resolution: validate ID exists in TraceIndex, return as-is
- [ ] Implement task file resolution: parse TASK Markdown for TRACEABILITY line and referenced IDs
- [ ] Implement source file resolution: scan file for markers, extract referenced IDs
- [ ] Unit test each resolution mode

### Phase 3: Trace Resolver

- [ ] Create `src/core/trace/resolver.ts` with `resolve(index: TraceIndex, id: string, options): TraceResult`
- [ ] Implement ID type detection: requirement, sub-requirement, AC, property, component
- [ ] Implement forward traversal: walk the chain from the given ID downstream
- [ ] Implement reverse traversal: walk the chain from the given ID upstream
- [ ] Implement `--depth` limiting: stop traversal at specified depth
- [ ] Implement `--scope` filtering: exclude results with different feature codes
- [ ] Unit test each traversal direction and edge cases (partial chains, multiple paths)

### Phase 4: Output Formatting — Location Tree

- [ ] Create `src/core/trace/formatter.ts` with text tree formatter
- [ ] Create JSON output formatter (reuse `json-output.ts` patterns)
- [ ] Create `--list` formatter (file paths and line ranges only)
- [ ] Unit test formatters with known TraceResult fixtures

### Phase 5: Content Assembly

- [ ] Create `src/core/trace/content-assembler.ts`
- [ ] Implement content extraction: for spec files, extract the specific H3 section (not full file) using remark
- [ ] Implement content extraction: for code files, extract the function/block containing the marker
- [ ] Implement relevance scoring: distance from query ID determines priority
- [ ] Implement deduplication: same file section referenced from multiple IDs appears once
- [ ] Fallback: if AST extraction fails, include a window of lines around the marker (controlled by `-A`/`-B`/`-C` flags; defaults: 5 before, 20 after)
- [ ] Unit test content assembler with fixture data

### Phase 6: Token Budget

- [ ] Create `src/core/trace/token-estimator.ts` with simple token estimation (chars / 4 as baseline)
- [ ] Implement budget enforcement: sort sections by relevance, include until budget exhausted
- [ ] When truncating, add "... N more sections omitted (use --max-tokens to increase)" footer
- [ ] Unit test token estimation and truncation

### Phase 7: Content Formatters

- [ ] Create Markdown content formatter (section headers, file paths, code blocks)
- [ ] Create JSON content formatter (structured sections with content field)
- [ ] Unit test content formatters

### Phase 8: CLI Command

- [ ] Create `src/commands/trace.ts` command handler
- [ ] Register `trace` command in `src/cli/index.ts` with commander
- [ ] Wire up: config → scan + parse → build TraceIndex → resolve input → resolve chain → format → output
- [ ] Implement `-A`, `-B`, `-C` context line options (only effective with `--content`) to control the window of lines extracted around code markers
- [ ] Reuse existing `checkCommand` pattern for config loading and error handling
- [ ] Integration test: run trace on this project's own specs

### Phase 9: Shared Index Extraction

- [ ] Extract `TraceIndex` building into a reusable module that `awa coverage`, `awa impact`, and `awa graph` can all import
- [ ] Ensure `checkCommand` can optionally return the intermediate scan results (markers + specs) rather than only findings, or refactor the scan step into a shared function

## Edge Cases

- ID not found in any spec or code → exit code 1 with "ID not found" message
- Partial chains (requirement exists but no design/code/tests) → show what exists, note gaps
- Multiple implementations of same AC → show all locations
- Comma-separated markers (`@awa-impl: A-1_AC-1, A-1_AC-2`) → each ID resolves independently
- Component referenced by `@awa-component` but no IMPLEMENTS in design → show code locations, note design gap
- Sub-requirements (`DIFF-1.1`) → show parent requirement and sibling sub-requirements in reverse direction
- Task file references IDs that do not exist in specs → assemble what is available, warn for missing
- Source file has no markers → "No traceability markers found in file" (exit 1)
- `--max-tokens 500` is too small for any section → include at least the requirement text, truncate rest
- Code file is binary → skip, include only spec context
- Multiple IDs given → union of all contexts, deduplicated

## Risks

- CHECK ENGINE COUPLING: index-builder depends on `SpecParseResult` and `MarkerScanResult` types. If Check Engine internals change, trace breaks. Mitigation: define a stable interface or shared types.
- PERFORMANCE: building the full index for a large project on every `awa trace` call. Mitigation: the index is in-memory and built from the same file scan check uses — should be sub-second for typical projects. Could add caching later if needed.
- INCOMPLETE SPEC PARSING: the spec-parser uses regex, not a full Markdown parser. Complex Markdown structures might be missed. Mitigation: leverage the existing battle-tested parser; improve it if specific gaps surface.
- TOKEN ESTIMATION ACCURACY: chars/4 is a rough estimate. Different tokenizers vary. Mitigation: document as "estimated," allow generous budgets, consider tiktoken integration later.
- SECTION EXTRACTION QUALITY: extracting the "right" section from a spec or code file is heuristic. Mitigation: start with full-section (H3) for specs and marker-line context for code. Improve incrementally.
- STALE CONTEXT: if specs and code are out of sync, assembled content may be misleading. Mitigation: run `awa check` before `awa trace --content` in CI, document this.

## Dependencies

- Check Engine: `marker-scanner.ts`, `spec-parser.ts`, `types.ts` (read-only dependency)
- Config loader: reuse `buildCheckConfig` pattern from `commands/check.ts`
- remark/unified: already a dependency for spec parsing in schema-checker
- No new npm dependencies required

## Completion Criteria

- [ ] `awa trace DIFF-1_AC-1` shows the full chain (requirement → design → code → tests)
- [ ] `awa trace DIFF-1` shows all ACs and their chains
- [ ] `awa trace DIFF-DiffEngine` shows component → design → requirement chain
- [ ] `awa trace --task .awa/tasks/TASK-DIFF-diff-001.md` resolves IDs from the task
- [ ] `awa trace --file src/core/differ.ts` resolves markers and traces related chain
- [ ] `--content` outputs actual file sections with Markdown formatting
- [ ] `--max-tokens 2000` truncates content by relevance priority
- [ ] `--list` outputs file paths without content
- [ ] `--json` outputs valid structured JSON
- [ ] `--content -C 10` limits code context to 10 lines before and after markers
- [ ] `--content -A 30 -B 3` controls asymmetric context window
- [ ] `-C 10` without `--content` is ignored (no error)
- [ ] `awa trace --all --list` lists all files containing traceability markers
- [ ] `awa trace --all --json` outputs JSON for every known ID
- [ ] `--depth 1` limits traversal to direct references only
- [ ] Exit code 1 when ID not found
- [ ] All unit tests pass
- [ ] `awa check` passes (new code has traceability markers)

## References

- Check Engine types: src/core/check/types.ts
- Marker scanner: src/core/check/marker-scanner.ts
- Spec parser: src/core/check/spec-parser.ts
- Code-spec checker: src/core/check/code-spec-checker.ts
- Check command: src/commands/check.ts
- Schema checker (remark usage): src/core/check/schema-checker.ts
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md
- Supersedes: PLAN-008 (.awa/plans/PLAN-008-awa-context.md)

## Change Log

- 001 (2026-03-01): Initial plan
- 002 (2026-03-01): Merged PLAN-008 (awa context) — added --content, --task, --file, --max-tokens, --list modes; added content assembly, token budget, and content formatter phases
- 003 (2026-03-01): Added -A/-B/-C context line flags (grep-style) for controlling lines around markers; dropped --clipboard (security risk)
- 004 (2026-03-01): Clarified -A/-B/-C only apply with --content; silently ignored otherwise
- 005 (2026-03-01): Added --all flag to trace every known ID in the project
