# `awa context` — Intelligent Context Assembly

STATUS: in-progress
DIRECTION: top-down

## Context

AI coding assistants are only as good as the context they receive. Context window management is the #1 practical challenge in AI-assisted development: too little context means the AI misses constraints; too much means important details get lost in noise.

awa's traceability chain is already a context index — every `@awa-impl` marker says "this code relates to that spec." `awa context` exploits this to assemble an optimized context payload: given a task, ID, or file, output exactly the specs, code, and tests the AI needs.

## Scope

IN SCOPE:
- Query modes: by ID (`awa context DIFF-1`), by task file (`--task TASK-DIFF-diff-003`), by source file (`--file src/core/differ.ts`)
- Context assembly: follow traceability links to include referenced specs, designs, code, and tests
- Output formats: concatenated Markdown (default), `--json` (structured sections), `--clipboard` (copy to clipboard)
- Token budget: `--max-tokens <n>` to cap output size with priority-based truncation
- Relevance ranking: direct references first, transitive second

OUT OF SCOPE:
- MCP server mode (future enhancement — expose as tool for AI agents)
- Automatic context injection into specific AI tools (just output to stdout/clipboard)
- Embedding-based similarity search (uses traceability links, not semantic search)
- Chat history / conversation management

## Context Assembly Algorithm

Given an input (ID, task, or file), the assembler follows these steps:

1. RESOLVE INPUT: determine which spec IDs are relevant
   - ID: use directly
   - Task file: parse TASK file for referenced spec IDs (TRACEABILITY line, checkbox items mentioning IDs)
   - Source file: scan for `@awa-impl`, `@awa-test`, `@awa-component` markers and collect their IDs
2. EXPAND: use TraceIndex to walk the chain in both directions from each resolved ID
3. COLLECT: gather unique file paths and their relevant sections
4. RANK: assign relevance score (direct=1.0, one-hop=0.8, two-hop=0.6, etc.)
5. BUDGET: if `--max-tokens` is set, include highest-relevance content first until budget exhausted
6. FORMAT: output as concatenated Markdown with section headers, or as structured JSON

## What Gets Included

For each resolved ID, include (in priority order):

| Priority | Artifact | What to include |
|----------|----------|-----------------|
| 1 (highest) | Task file | Full content (if querying by task) |
| 2 | Requirement | The specific requirement section (H3 + ACs), not the full REQ file |
| 3 | Design | The relevant component section from DESIGN file |
| 4 | Feature context | Relevant sections from FEAT file |
| 5 | Source code | Files with `@awa-impl` markers for the IDs, focused on the marked functions/sections |
| 6 | Test code | Files with `@awa-test` markers for the IDs |
| 7 | Architecture | Relevant component from ARCHITECTURE.md (if referenced) |
| 8 (lowest) | Examples | Relevant EXAMPLES file sections |

## CLI Interface

```
awa context <ID | --task <path> | --file <path>> [options]

Arguments:
  ID                      Traceability ID(s) (space-separated)

Options:
  --task <path>           Assemble context for a task file
  --file <path>           Assemble context for a source file (reads its markers)
  --max-tokens <n>        Maximum estimated token count (default: unlimited)
  --depth <n>             Traversal depth limit (default: 3)
  --no-code               Exclude source code (spec-only context)
  --no-tests              Exclude test files
  --json                  Output as structured JSON
  --clipboard             Copy to clipboard instead of stdout
  --list                  List files that would be included (no content)
  -c, --config <path>     Path to configuration file
```

Exit codes: 0 = context assembled, 1 = no relevant context found, 2 = internal error.

## Output Format

### Markdown (default)

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

```typescript
// @awa-impl: DIFF-1_AC-1
export async function diff(tempDir: string, targetDir: string): Promise<DiffResult> {
  ...
}
```

## Tests

> From: src/core/__tests__/differ.test.ts (lines 10-45)

```typescript
// @awa-test: DIFF-1_AC-1
test('produces unified diff for modified files', () => {
  ...
});
```
```

### JSON

```json
{
  "query": "DIFF-1",
  "sections": [
    { "type": "requirement", "filePath": "...", "startLine": 18, "endLine": 28, "content": "..." },
    { "type": "design", "filePath": "...", "startLine": 20, "endLine": 35, "content": "..." },
    { "type": "implementation", "filePath": "...", "startLine": 35, "endLine": 87, "content": "..." },
    { "type": "test", "filePath": "...", "startLine": 10, "endLine": 45, "content": "..." }
  ],
  "estimatedTokens": 2400,
  "filesIncluded": 4
}
```

## Steps

### Phase 1: Input Resolution

- [ ] Create `src/core/context/types.ts` with `ContextQuery`, `ContextSection`, `ContextResult` types
- [ ] Create `src/core/context/resolver.ts` with input resolution logic
- [ ] Implement ID resolution: validate ID exists in TraceIndex, return as-is
- [ ] Implement task file resolution: parse TASK Markdown for TRACEABILITY line and referenced IDs
- [ ] Implement source file resolution: scan file for markers, extract referenced IDs
- [ ] Unit test each resolution mode

### Phase 2: Context Assembler

- [ ] Create `src/core/context/assembler.ts`
- [ ] Implement chain expansion: from resolved IDs, walk TraceIndex to collect related artifacts
- [ ] Implement content extraction: for spec files, extract the specific H3 section (not full file)
- [ ] Implement content extraction: for code files, extract the function/block containing the marker
- [ ] Implement relevance scoring: distance from query ID determines priority
- [ ] Implement deduplication: same file section referenced from multiple IDs appears once
- [ ] Unit test assembler with fixture data

### Phase 3: Token Budget

- [ ] Create `src/core/context/token-estimator.ts` with simple token estimation (chars / 4 as baseline)
- [ ] Implement budget enforcement: sort sections by relevance, include until budget exhausted
- [ ] When truncating, add "... N more sections omitted (use --max-tokens to increase)" footer
- [ ] Unit test token estimation and truncation

### Phase 4: Output Formatters

- [ ] Create `src/core/context/formatter.ts` with Markdown formatter (section headers, file paths, code blocks)
- [ ] Create JSON formatter
- [ ] Create `--list` formatter (file paths and line ranges only, no content)
- [ ] Unit test formatters

### Phase 5: CLI Command

- [ ] Create `src/commands/context.ts` command handler
- [ ] Register `context` command in `src/cli/index.ts`
- [ ] Wire up: config → scan + parse → build TraceIndex → resolve input → assemble → format
- [ ] Implement `--clipboard` via Node.js child_process (`pbcopy` on macOS, `xclip` on Linux, `clip` on Windows)
- [ ] Integration test: run on this project

### Phase 6: Smart Section Extraction

- [ ] For spec files: use remark to parse Markdown AST, extract the H3 subtree for the target requirement/component
- [ ] For code files: use line scanning to find the enclosing function/class around a marker line
- [ ] Fallback: if AST extraction fails, include a window of lines around the marker (e.g. +/- 20 lines)

## Edge Cases

- ID not found → exit 1 with "ID not found in specs or code" message
- Task file references IDs that do not exist in specs → assemble what is available, warn for missing
- Source file has no markers → "No traceability markers found in file" (exit 1)
- `--max-tokens 500` is too small for any section → include at least the requirement text, truncate rest
- Code file is binary → skip, include only spec context
- Multiple IDs given → union of all contexts, deduplicated

## Risks

- TOKEN ESTIMATION ACCURACY: chars/4 is a rough estimate. Different tokenizers vary. Mitigation: document as "estimated," allow generous budgets, consider tiktoken integration later.
- SECTION EXTRACTION QUALITY: extracting the "right" section from a spec or code file is heuristic. Mitigation: start with full-section (H3) for specs and marker-line context for code. Improve incrementally.
- SCOPE CREEP INTO MCP: temptation to build a full MCP server. Mitigation: v1 is CLI-only stdout/clipboard. MCP is a documented future direction in design.
- STALE CONTEXT: if specs and code are out of sync, assembled context may be misleading. Mitigation: run `awa check` before `awa context` in CI, document this.

## Dependencies

- PLAN-002 (`awa trace`): TraceIndex data model and index-builder
- Check Engine: marker-scanner, spec-parser
- remark/unified: already a dependency for spec parsing in schema-checker
- No new npm dependencies required

## Completion Criteria

- [ ] `awa context DIFF-1` outputs requirement, design, code, and test sections
- [ ] `awa context --task .awa/tasks/TASK-DIFF-diff-001.md` assembles context for all IDs in the task
- [ ] `awa context --file src/core/differ.ts` resolves markers and assembles related context
- [ ] `--max-tokens 2000` truncates by relevance priority
- [ ] `--json` outputs structured sections
- [ ] `--list` outputs file paths without content
- [ ] `--clipboard` copies to system clipboard
- [ ] All unit tests pass
- [ ] `awa check` passes

## References

- PLAN-002: .awa/plans/PLAN-002-awa-trace.md (TraceIndex model)
- Task schema: .awa/.agent/schemas/TASK.schema.yaml
- Schema checker (remark usage): src/core/check/schema-checker.ts
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
