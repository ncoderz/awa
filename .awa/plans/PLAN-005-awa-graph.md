# `awa graph` — Traceability Graph Visualization

STATUS: in-progress
DIRECTION: top-down

## Context

The traceability chain is powerful but invisible. Developers work with flat spec files and grep-able markers — there is no visual overview of how everything connects. A visual graph would serve multiple purposes: onboarding (see the full system at a glance), gap detection (orphans and missing links are visually obvious), and marketing (people share diagrams).

`awa graph` generates a visual representation of the traceability chain in Mermaid, DOT, or SVG format.

## Scope

IN SCOPE:
- Generate graph from TraceIndex showing nodes (specs, components, code files, test files) and edges (IMPLEMENTS, @awa-impl, @awa-test, @awa-component)
- Output formats: Mermaid (default), DOT/Graphviz, JSON (node/edge lists)
- Filtering: `--scope <CODE>` per feature, `--depth <n>` from a specific ID
- Gap highlighting: `--show-gaps` marks missing links with dashed red edges
- Clustering by feature code for readability

OUT OF SCOPE:
- Interactive rendering (just output text, let Mermaid/Graphviz render)
- Real-time watching (generate once)
- SVG rendering in CLI (requires external Mermaid CLI; document how to pipe)

## Node Types

| Type | Shape (Mermaid) | Color | Label |
|------|----------------|-------|-------|
| Requirement | Rectangle | Blue | `DIFF-1: Title` |
| AC | Rounded rectangle | Light blue | `DIFF-1_AC-1` |
| Design Component | Hexagon | Green | `DIFF-DiffEngine` |
| Property | Diamond | Teal | `DIFF_P-1` |
| Code File | Parallelogram | Orange | `src/core/differ.ts` |
| Test File | Parallelogram | Purple | `src/__tests__/differ.test.ts` |

## Edge Types

| Type | Style | Label |
|------|-------|-------|
| Requirement → AC | Solid | (owns) |
| AC → Component (IMPLEMENTS) | Solid | IMPLEMENTS |
| Component → Code (@awa-component) | Solid | @awa-component |
| AC → Code (@awa-impl) | Solid | @awa-impl |
| AC → Test (@awa-test) | Solid | @awa-test |
| Property → Test (@awa-test) | Solid | @awa-test |
| Property → AC (VALIDATES) | Dashed | VALIDATES |
| Missing link (gap) | Dashed red | MISSING |

## CLI Interface

```
awa graph [options]

Options:
  --format <fmt>        Output format: mermaid (default), dot, json
  --scope <CODE>        Limit to a specific feature code
  --show-gaps           Highlight missing links (ACs without tests, etc.)
  --id <ID>             Center graph on a specific ID with --depth
  --depth <n>           Depth from --id (requires --id)
  --no-code             Exclude code/test file nodes (spec-only graph)
  --json                Alias for --format json
  -c, --config <path>   Path to configuration file
```

Exit codes: 0 = graph generated, 1 = no data found, 2 = internal error.

## Output Format

### Mermaid (default)

```mermaid
graph TD
    subgraph DIFF["DIFF (diff)"]
        REQ_DIFF_1["DIFF-1: Diff Generation"]
        AC_DIFF_1_1(["DIFF-1_AC-1"])
        AC_DIFF_1_2(["DIFF-1_AC-2"])
        COMP_DiffEngine{{"DIFF-DiffEngine"}}

        REQ_DIFF_1 --> AC_DIFF_1_1
        REQ_DIFF_1 --> AC_DIFF_1_2
        AC_DIFF_1_1 --> COMP_DiffEngine
    end

    CODE_differ[/"src/core/differ.ts"/]
    TEST_differ[/"src/__tests__/differ.test.ts"/]

    COMP_DiffEngine --> CODE_differ
    AC_DIFF_1_1 -.->|@awa-impl| CODE_differ
    AC_DIFF_1_1 -.->|@awa-test| TEST_differ
```

### DOT/Graphviz

Standard DOT format with named subgraphs per feature code, styled nodes, and directed edges.

### JSON

```json
{
  "nodes": [
    { "id": "DIFF-1", "type": "requirement", "label": "DIFF-1: Diff Generation", "feature": "DIFF" },
    { "id": "DIFF-1_AC-1", "type": "ac", "label": "DIFF-1_AC-1", "feature": "DIFF" }
  ],
  "edges": [
    { "from": "DIFF-1", "to": "DIFF-1_AC-1", "type": "owns" },
    { "from": "DIFF-1_AC-1", "to": "DIFF-DiffEngine", "type": "implements" }
  ],
  "gaps": [
    { "from": "CFG-3_AC-4", "type": "missing-test" }
  ]
}
```

## Steps

### Phase 1: Graph Builder

- [ ] Create `src/core/graph/types.ts` with `GraphNode`, `GraphEdge`, `Graph` types
- [ ] Create `src/core/graph/builder.ts` that takes `TraceIndex` and builds a `Graph`
- [ ] Create requirement nodes from spec-parser requirement IDs
- [ ] Create AC nodes from spec-parser AC IDs, with edges from parent requirement
- [ ] Create component nodes from spec-parser component names, with IMPLEMENTS edges from ACs (via design cross-refs)
- [ ] Create property nodes with VALIDATES edges
- [ ] Create code file nodes (deduplicate: one node per file, not per marker) with edges from ACs/components
- [ ] Create test file nodes with edges from ACs/properties
- [ ] Implement `--show-gaps`: add dashed-red gap edges for uncovered ACs, unimplemented components
- [ ] Implement `--scope` filtering: include only nodes/edges matching the feature code
- [ ] Implement `--id` + `--depth`: BFS from center node to depth limit
- [ ] Implement `--no-code`: exclude code/test file nodes
- [ ] Unit test graph builder with fixture data

### Phase 2: Serializers

- [ ] Create `src/core/graph/mermaid.ts` that serializes `Graph` to Mermaid syntax
- [ ] Handle node ID sanitization (Mermaid IDs cannot contain `-` or `.` directly — use underscores)
- [ ] Handle subgraph clustering by feature code
- [ ] Create `src/core/graph/dot.ts` that serializes `Graph` to DOT format
- [ ] Create `src/core/graph/json.ts` that serializes to JSON node/edge format
- [ ] Snapshot test each serializer with known graphs

### Phase 3: CLI Command

- [ ] Create `src/commands/graph.ts` command handler
- [ ] Register `graph` command in `src/cli/index.ts`
- [ ] Wire up: config → scan + parse → build TraceIndex → build graph → serialize → stdout
- [ ] Integration test

### Phase 4: Documentation

- [ ] Document Mermaid rendering: `awa graph > trace.md` then preview in VS Code / GitHub
- [ ] Document SVG generation: `awa graph | mmdc -i - -o trace.svg` (Mermaid CLI)
- [ ] Document DOT rendering: `awa graph --format dot | dot -Tsvg -o trace.svg`

## Edge Cases

- Very large projects (100+ ACs) → Mermaid may not render well. Mitigation: `--scope` filtering, `--no-code` to reduce nodes, document limit.
- Feature with no code yet (spec-only) → show spec subgraph with gap markers to code
- Mermaid ID conflicts → sanitize all IDs to alphanumeric + underscore, prefix by type
- Circular VALIDATES references → detect and break cycles, warn

## Risks

- READABILITY AT SCALE: Mermaid graphs become unreadable above ~50 nodes. Mitigation: encourage `--scope`, `--no-code`, and `--id --depth` for focused views. Document limits clearly.
- MERMAID SYNTAX EVOLUTION: Mermaid syntax may change between versions. Mitigation: target Mermaid v10+ syntax, test against mermaid-cli in CI.
- NO RENDERING IN CLI: the tool outputs text (Mermaid/DOT), not images. Users need external tools to render. Mitigation: clear docs, example commands, consider shipping `--open` that pipes to a temp HTML file and opens browser.

## Dependencies

- PLAN-002 (`awa trace`): TraceIndex data model and index-builder module
- Check Engine: marker-scanner, spec-parser (read-only)
- No new npm dependencies (Mermaid and DOT are text formats)

## Completion Criteria

- [ ] `awa graph` outputs valid Mermaid syntax for the full project
- [ ] `awa graph --scope DIFF` shows only DIFF feature subgraph
- [ ] `awa graph --show-gaps` highlights uncovered ACs with red dashed edges
- [ ] `awa graph --format dot` outputs valid DOT syntax
- [ ] `awa graph --format json` outputs node/edge JSON
- [ ] `--no-code` excludes code and test nodes
- [ ] Output renders correctly in Mermaid live editor
- [ ] All unit tests pass
- [ ] `awa check` passes

## References

- PLAN-002: .awa/plans/PLAN-002-awa-trace.md (TraceIndex model)
- Mermaid docs: https://mermaid.js.org/syntax/flowchart.html
- DOT language: https://graphviz.org/doc/info/lang.html
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
