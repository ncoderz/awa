# `awa impact` — Change Impact Analysis

STATUS: in-progress
DIRECTION: top-down

## Context

Before modifying a requirement, renaming an AC, or removing a design component, developers need to understand the blast radius: which code files, tests, and specs would be affected. Today this requires manual grep across the codebase.

`awa impact` uses the traceability index to answer "if I change X, what else is affected?" — providing confidence for spec refactoring and requirement evolution.

## Scope

IN SCOPE:
- Direct impact: artifacts that directly reference the given ID
- Transitive impact: artifacts reached by walking the chain (requirement → AC → design → code → test)
- `--if-removed` mode: simulate deletion and show what would become orphaned
- Output formats: tree view (default), `--json`, `--summary` (counts only)
- Any ID type: requirement, AC, property, component

OUT OF SCOPE:
- Actual modification of files (read-only analysis)
- Git blame / history (who changed it)
- Automated refactoring (rename across chain)

## CLI Interface

```
awa impact <ID> [options]

Arguments:
  ID                      Any traceability ID

Options:
  --if-removed            Simulate removal: show what would become orphaned
  --direction <dir>       Impact direction: downstream (default), upstream, both
  --depth <n>             Maximum traversal depth
  --json                  Output as JSON
  --summary               Output counts only
  -c, --config <path>     Path to configuration file
```

Exit codes: 0 = analysis complete, 1 = ID not found, 2 = internal error.

## Output Format

### Text (default)

```
Impact Analysis: DIFF-1
═══════════════════════

Direct Impact (12 artifacts):

  Acceptance Criteria (3):
    DIFF-1_AC-1  (.awa/specs/REQ-DIFF-diff.md:22)
    DIFF-1_AC-2  (.awa/specs/REQ-DIFF-diff.md:23)
    DIFF-1_AC-3  (.awa/specs/REQ-DIFF-diff.md:24)

  Design Components (1):
    DIFF-DiffEngine  (.awa/specs/DESIGN-DIFF-diff.md:24)
      IMPLEMENTS: DIFF-1_AC-1, DIFF-1_AC-2

  Implementation Files (2):
    src/core/differ.ts         (3 markers)
    src/commands/diff.ts       (1 marker)

  Test Files (2):
    src/core/__tests__/differ.test.ts  (3 markers)
    src/commands/__tests__/diff.test.ts (1 marker)

Summary: 3 ACs, 1 component, 4 code files, 7 markers total
```

### `--if-removed` mode

```
Removal Simulation: DIFF-1.3
════════════════════════════

If DIFF-1.3 were removed:

  Orphaned ACs (1):
    DIFF-1.3_AC-1  — no parent requirement

  Orphaned Code Markers (2):
    src/core/differ.ts:87    @awa-impl: DIFF-1.3_AC-1
    src/core/__tests__/differ.test.ts:42  @awa-test: DIFF-1.3_AC-1

  Orphaned Cross-References (1):
    .awa/specs/DESIGN-DIFF-diff.md:30  refs: DIFF-1.3_AC-1
```

### JSON

```json
{
  "id": "DIFF-1",
  "type": "requirement",
  "mode": "downstream",
  "impact": {
    "acceptanceCriteria": [{ "id": "DIFF-1_AC-1", "filePath": "...", "line": 22 }],
    "designComponents": [{ "name": "DIFF-DiffEngine", "filePath": "...", "refs": ["DIFF-1_AC-1"] }],
    "implementationFiles": [{ "filePath": "src/core/differ.ts", "markerCount": 3 }],
    "testFiles": [{ "filePath": "src/core/__tests__/differ.test.ts", "markerCount": 3 }]
  },
  "summary": { "acs": 3, "components": 1, "codeFiles": 2, "testFiles": 2, "markers": 7 }
}
```

## Steps

### Phase 1: Impact Analyzer Core

- [ ] Create `src/core/impact/types.ts` with `ImpactResult`, `ImpactSummary`, `OrphanSimulation` types
- [ ] Create `src/core/impact/analyzer.ts` that takes `TraceIndex` + ID and computes direct impact
- [ ] Implement requirement impact: find all ACs belonging to the requirement (by prefix matching)
- [ ] Implement AC impact: find design components (via IMPLEMENTS), code locations (via `@awa-impl`), test locations (via `@awa-test`)
- [ ] Implement component impact: find code files (via `@awa-component`), reverse to design cross-refs
- [ ] Implement property impact: find test locations (via `@awa-test`), reverse to design VALIDATES
- [ ] Implement transitive traversal: requirement → ACs → components → code → tests (aggregate at each level)
- [ ] Unit test with fixture data

### Phase 2: Removal Simulation

- [ ] Add `--if-removed` mode to analyzer
- [ ] Simulate: remove the ID from all sets, then re-run orphan detection
- [ ] Identify what would become orphaned: markers referencing removed IDs, cross-refs pointing to removed IDs, ACs under removed requirements
- [ ] Unit test removal simulation with fixtures

### Phase 3: Output Formatters

- [ ] Create `src/core/impact/formatter.ts` with tree text formatter
- [ ] Create JSON formatter
- [ ] Create summary formatter (counts only)
- [ ] Unit test formatters

### Phase 4: CLI Command

- [ ] Create `src/commands/impact.ts` command handler
- [ ] Register `impact` command in `src/cli/index.ts`
- [ ] Wire up: config → scan + parse → build TraceIndex → analyze → format
- [ ] Integration test

## Edge Cases

- ID has no downstream artifacts → report "No impact found" with exit 0
- Sub-requirement removal → show impact on its ACs but not sibling sub-requirements
- Component referenced by multiple ACs → de-duplicate in output, show all referencing ACs
- `--if-removed` on an ID that is the sole VALIDATES target for a property → property becomes untested

## Risks

- SHARED INDEX DEPENDENCY: relies on TraceIndex from PLAN-002. Must be designed first.
- TRANSITIVE ACCURACY: transitive traversal might produce misleadingly large blast radii for high-level requirements. Mitigation: `--depth` limits and clear separation of direct vs transitive.
- REMOVAL SIMULATION COMPLEXITY: simulating removal requires cloning and modifying index sets. Mitigation: keep it simple — just check which existing references would become dangling.

## Dependencies

- PLAN-002 (`awa trace`): TraceIndex data model and index-builder module
- Check Engine: marker-scanner, spec-parser (read-only)
- No new npm dependencies

## Completion Criteria

- [ ] `awa impact DIFF-1` shows all downstream ACs, components, code, and tests
- [ ] `awa impact DIFF-1_AC-1` shows focused impact for a single AC
- [ ] `awa impact --if-removed DIFF-1.3` shows what would become orphaned
- [ ] `--json` and `--summary` formats produce correct output
- [ ] All unit tests pass
- [ ] `awa check` passes

## References

- PLAN-002: .awa/plans/PLAN-002-awa-trace.md (TraceIndex model)
- Code-spec checker: src/core/check/code-spec-checker.ts (orphan detection patterns)
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
