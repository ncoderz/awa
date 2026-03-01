# `awa trace` — Interactive Traceability Explorer

STATUS: in-progress
DIRECTION: top-down

## Context

awa's traceability chain links requirements → design → code → tests through explicit IDs and markers. Today, `awa check` validates these links exist but provides no way to *navigate* them. A developer looking at `DIFF-1_AC-1` must manually grep spec files, source code, and tests to trace the chain.

`awa trace` makes the chain queryable: given any ID, display every artifact that references or is referenced by it, in both directions.

## Scope

IN SCOPE:
- Query by any ID type: requirement (`DIFF-1`), sub-requirement (`DIFF-1.1`), AC (`DIFF-1_AC-1`), property (`DIFF_P-1`), component (`DIFF-DiffEngine`)
- Forward traversal: requirement → ACs → design components → code → tests
- Reverse traversal: test → code → design → requirement
- Output formats: human-readable tree (default), `--json`
- Depth control: `--depth <n>` to limit traversal depth
- Scope filtering: `--scope <CODE>` to limit to a feature code

OUT OF SCOPE:
- Interactive TUI / REPL mode (future enhancement)
- IDE integration (covered by PLAN-010)
- Modification of artifacts (read-only operation)

## Data Model: Traceability Index

The core data structure shared by trace, impact, graph, and context features. Built once from the same data `awa check` already collects.

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
awa trace <ID> [options]

Arguments:
  ID                    Any traceability ID (requirement, AC, property, component)

Options:
  --depth <n>           Maximum traversal depth (default: unlimited)
  --scope <CODE>        Limit results to a feature code
  --direction <dir>     Traversal direction: both (default), forward, reverse
  --json                Output as JSON
  -c, --config <path>   Path to configuration file
```

Exit codes: 0 = chain found, 1 = ID not found, 2 = internal error.

## Output Format

### Text (default)

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

### JSON

```json
{
  "id": "DIFF-1_AC-1",
  "type": "ac",
  "location": { "filePath": ".awa/specs/REQ-DIFF-diff.md", "line": 22 },
  "chain": {
    "requirements": [{ "id": "DIFF-1", "filePath": "...", "line": 18 }],
    "design": [{ "component": "DIFF-DiffEngine", "filePath": "...", "line": 24, "ref": "IMPLEMENTS" }],
    "implementations": [{ "filePath": "src/core/differ.ts", "line": 42 }],
    "tests": [{ "filePath": "src/core/__tests__/differ.test.ts", "line": 15 }]
  }
}
```

## Steps

### Phase 1: Traceability Index Builder

- [ ] Create `src/core/trace/types.ts` with `TraceIndex`, `CodeLocation`, `TraceResult` types
- [ ] Create `src/core/trace/index-builder.ts` that takes `SpecParseResult` + `MarkerScanResult` and builds a `TraceIndex`
- [ ] Build forward maps: parse spec files for requirement→AC relationships (from REQ files), AC→component relationships (from DESIGN IMPLEMENTS lines)
- [ ] Build forward maps from markers: AC→code locations (`@awa-impl`), AC→test locations (`@awa-test`), component→code locations (`@awa-component`)
- [ ] Build reverse maps by inverting the forward maps
- [ ] Build property→AC maps from DESIGN VALIDATES cross-references
- [ ] Unit test the index builder with fixture spec files and markers

### Phase 2: Trace Resolver

- [ ] Create `src/core/trace/resolver.ts` with `resolve(index: TraceIndex, id: string, options): TraceResult`
- [ ] Implement ID type detection: requirement, sub-requirement, AC, property, component
- [ ] Implement forward traversal: walk the chain from the given ID downstream
- [ ] Implement reverse traversal: walk the chain from the given ID upstream
- [ ] Implement `--depth` limiting: stop traversal at specified depth
- [ ] Implement `--scope` filtering: exclude results with different feature codes
- [ ] Unit test each traversal direction and edge cases (partial chains, multiple paths)

### Phase 3: Output Formatting

- [ ] Create `src/core/trace/formatter.ts` with text tree formatter
- [ ] Create JSON output formatter (reuse `json-output.ts` patterns)
- [ ] Unit test formatters with known TraceResult fixtures

### Phase 4: CLI Command

- [ ] Create `src/commands/trace.ts` command handler
- [ ] Register `trace` command in `src/cli/index.ts` with commander
- [ ] Wire up: load config → load check config → scan markers + parse specs → build index → resolve → format → output
- [ ] Reuse existing `checkCommand` pattern for config loading and error handling
- [ ] Integration test: run trace on this project's own specs

### Phase 5: Shared Index Extraction

- [ ] Extract `TraceIndex` building into a reusable module that `awa coverage`, `awa impact`, `awa graph`, and `awa context` can all import
- [ ] Ensure `checkCommand` can optionally return the intermediate scan results (markers + specs) rather than only findings, or refactor the scan step into a shared function

## Edge Cases

- ID not found in any spec or code → exit code 1 with "ID not found" message
- Partial chains (requirement exists but no design/code/tests) → show what exists, note gaps
- Multiple implementations of same AC → show all locations
- Comma-separated markers (`@awa-impl: A-1_AC-1, A-1_AC-2`) → each ID resolves independently
- Component referenced by `@awa-component` but no IMPLEMENTS in design → show code locations, note design gap
- Sub-requirements (`DIFF-1.1`) → show parent requirement and sibling sub-requirements in reverse direction

## Risks

- CHECK ENGINE COUPLING: index-builder depends on `SpecParseResult` and `MarkerScanResult` types. If Check Engine internals change, trace breaks. Mitigation: define a stable interface or shared types.
- PERFORMANCE: building the full index for a large project on every `awa trace` call. Mitigation: the index is in-memory and built from the same file scan check uses — should be sub-second for typical projects. Could add caching later if needed.
- INCOMPLETE SPEC PARSING: the spec-parser uses regex, not a full Markdown parser. Complex Markdown structures might be missed. Mitigation: leverage the existing battle-tested parser; improve it if specific gaps surface.

## Dependencies

- Check Engine: `marker-scanner.ts`, `spec-parser.ts`, `types.ts` (read-only dependency)
- Config loader: reuse `buildCheckConfig` pattern from `commands/check.ts`
- No new npm dependencies required

## Completion Criteria

- [ ] `awa trace DIFF-1_AC-1` shows the full chain (requirement → design → code → tests)
- [ ] `awa trace DIFF-1` shows all ACs and their chains
- [ ] `awa trace DIFF-DiffEngine` shows component → design → requirement chain
- [ ] `--json` outputs valid structured JSON
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
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
