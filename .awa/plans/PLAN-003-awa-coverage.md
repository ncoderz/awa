# `awa coverage` — Spec Coverage Report

STATUS: in-progress
DIRECTION: top-down

## Context

`awa check` validates that traceability links are correct but does not measure completeness. Teams cannot answer "what percentage of our requirements have tests?" without manually counting. This makes spec-driven development feel like overhead rather than a measurable quality metric.

`awa coverage` aggregates traceability data into a coverage report across four dimensions, with optional badge generation for READMEs and CI dashboards.

## Scope

IN SCOPE:
- Coverage dimensions: REQ→DESIGN (ACs mapped to components), DESIGN→CODE (components with `@awa-component`), AC→TEST (ACs with `@awa-test`), AC→IMPL (ACs with `@awa-impl`)
- Aggregate metrics: percentage per dimension, overall chain coverage, per-feature-code breakdown
- Gap listing: uncovered ACs, unimplemented components, untested properties
- Output formats: text table (default), `--json`, `--badge` (shield.io-compatible SVG or URL)
- Per-feature breakdown: coverage by feature code (DIFF, CFG, etc.)

OUT OF SCOPE:
- Line-level code coverage (that is what Istanbul/c8 is for)
- Automated remediation (just reporting)
- Historical trends (no database; CI can track over time externally)

## Coverage Dimensions

| Dimension | Numerator | Denominator | Question Answered |
|-----------|-----------|-------------|-------------------|
| REQ→DESIGN | ACs referenced by IMPLEMENTS in any DESIGN | Total ACs in all REQ files | How many ACs have a design? |
| DESIGN→CODE | Components with at least one `@awa-component` marker | Total components in all DESIGN files | How many components are implemented? |
| AC→IMPL | ACs with at least one `@awa-impl` marker | Total ACs in all REQ files | How many ACs are implemented? |
| AC→TEST | ACs with at least one `@awa-test` marker | Total ACs in all REQ files | How many ACs are tested? |
| PROP→TEST | Properties with at least one `@awa-test` marker | Total properties in all DESIGN files | How many design properties are tested? |
| OVERALL | ACs that have design + impl + test | Total ACs | How many ACs are fully traced end-to-end? |

## CLI Interface

```
awa coverage [options]

Options:
  --scope <CODE>        Limit to a specific feature code
  --json                Output as JSON
  --badge [path]        Generate shield.io-compatible SVG badge (default: stdout)
  --badge-label <text>  Badge label text (default: "spec coverage")
  --min <percent>       Fail (exit 1) if overall coverage is below threshold
  -c, --config <path>   Path to configuration file
  --allow-warnings      Allow warnings without failing
  --spec-only           Skip code-to-spec coverage (only REQ→DESIGN dimension)
```

Exit codes: 0 = success (or above threshold), 1 = below threshold or gaps found, 2 = internal error.

## Output Format

### Text (default)

```
Spec Coverage Report
════════════════════

  Dimension       Coverage    Covered / Total
  ─────────       ────────    ───────────────
  REQ → DESIGN      92%        23 / 25
  DESIGN → CODE     88%        21 / 24
  AC → IMPL         84%        21 / 25
  AC → TEST         76%        19 / 25
  PROP → TEST       80%         4 /  5
  ─────────       ────────    ───────────────
  OVERALL            72%        18 / 25

By Feature:
  DIFF    100%  ████████████████████  (8/8 ACs)
  CFG      60%  ████████████░░░░░░░░  (6/10 ACs)
  OVL      86%  █████████████████░░░  (6/7 ACs)

Gaps (4 ACs without full chain):
  CFG-3_AC-4     missing: @awa-test
  CFG-5_AC-1     missing: @awa-impl, @awa-test
  CFG-5_AC-2     missing: @awa-impl, @awa-test
  OVL-2_AC-3     missing: @awa-test
```

### JSON

```json
{
  "dimensions": {
    "reqToDesign": { "covered": 23, "total": 25, "percent": 92.0 },
    "designToCode": { "covered": 21, "total": 24, "percent": 87.5 },
    "acToImpl": { "covered": 21, "total": 25, "percent": 84.0 },
    "acToTest": { "covered": 19, "total": 25, "percent": 76.0 },
    "propToTest": { "covered": 4, "total": 5, "percent": 80.0 },
    "overall": { "covered": 18, "total": 25, "percent": 72.0 }
  },
  "byFeature": {
    "DIFF": { "covered": 8, "total": 8, "percent": 100.0 },
    "CFG": { "covered": 6, "total": 10, "percent": 60.0 }
  },
  "gaps": [
    { "id": "CFG-3_AC-4", "missing": ["test"], "filePath": "...", "line": 42 }
  ]
}
```

### Badge

Generate a shields.io-compatible SVG. Badge color scales: red (<50%), orange (50–74%), yellow (75–89%), green (90–100%).

## Steps

### Phase 1: Coverage Aggregator

- [ ] Create `src/core/coverage/types.ts` with `CoverageResult`, `DimensionCoverage`, `GapEntry` types
- [ ] Create `src/core/coverage/aggregator.ts` that takes `TraceIndex` (from PLAN-002) and computes all coverage dimensions
- [ ] Compute REQ→DESIGN: for each AC, check if any design component IMPLEMENTS it
- [ ] Compute DESIGN→CODE: for each component, check if `@awa-component` marker exists
- [ ] Compute AC→IMPL: for each AC, check if `@awa-impl` marker exists
- [ ] Compute AC→TEST: for each AC, check if `@awa-test` marker exists
- [ ] Compute PROP→TEST: for each property, check if `@awa-test` marker exists
- [ ] Compute OVERALL: AC has design + impl + test
- [ ] Compute per-feature-code breakdown by grouping ACs by their CODE prefix
- [ ] Collect gap entries: for each uncovered AC, list what is missing
- [ ] Unit test with fixture data (known coverage counts)

### Phase 2: Output Formatters

- [ ] Create `src/core/coverage/formatter.ts` with text table formatter (unicode box-drawing, progress bars)
- [ ] Create JSON formatter
- [ ] Create badge SVG generator (inline SVG template, no external dependency)
- [ ] Support `--badge-label` customization
- [ ] Badge color logic: compute from overall percentage
- [ ] Unit test formatters

### Phase 3: CLI Command

- [ ] Create `src/commands/coverage.ts` command handler
- [ ] Register `coverage` command in `src/cli/index.ts`
- [ ] Wire up: config → check config → scan + parse → build TraceIndex → aggregate → format
- [ ] Implement `--min <percent>` threshold check (exit 1 if below)
- [ ] Implement `--scope <CODE>` filtering
- [ ] Implement `--spec-only` mode (only REQ→DESIGN dimension, no code scanning)
- [ ] Integration test: run on this project

### Phase 4: Badge File Output

- [ ] Implement `--badge <path>` to write SVG to a file
- [ ] Implement `--badge` without path to write SVG to stdout (for pipe to file)
- [ ] Document badge usage in README: `awa coverage --badge > .github/badges/spec-coverage.svg`

## Edge Cases

- Feature with REQ but no DESIGN → REQ→DESIGN coverage is 0% for that feature, not an error
- Feature with no ACs → excluded from denominator (0/0 = N/A, not 0%)
- Properties with no AC validation link → counted separately in PROP→TEST dimension
- `--spec-only` mode → only REQ→DESIGN dimension shown, code dimensions show "N/A"
- Empty project (no specs) → report "No spec files found" and exit 0

## Risks

- DEPENDS ON PLAN-002: the TraceIndex data model must be finalized before coverage can aggregate. Mitigation: design TraceIndex to expose the maps coverage needs (AC sets, marker sets).
- GAMIFICATION PRESSURE: teams may game coverage by writing trivial tests. Mitigation: coverage measures traceability, not test quality — clarify this in docs.
- BADGE MAINTENANCE: inline SVG generation is simple but fragile. Mitigation: use shields.io URL format as alternative (`https://img.shields.io/badge/spec_coverage-72%25-yellow`).

## Dependencies

- PLAN-002 (`awa trace`): TraceIndex data model and index-builder module
- Check Engine: marker-scanner, spec-parser (read-only)
- No new npm dependencies (SVG generated from template string)

## Completion Criteria

- [ ] `awa coverage` produces a readable text table with all 6 dimensions
- [ ] Per-feature breakdown shows coverage per CODE prefix
- [ ] Gaps section lists every uncovered AC with what is missing
- [ ] `--json` outputs structured JSON matching the format above
- [ ] `--badge` generates a valid SVG badge with correct color
- [ ] `--min 80` exits with code 1 if overall < 80%
- [ ] All unit tests pass
- [ ] `awa check` passes (new code has traceability markers)

## References

- PLAN-002: .awa/plans/PLAN-002-awa-trace.md (TraceIndex model)
- Check Engine types: src/core/check/types.ts
- Code-spec checker: src/core/check/code-spec-checker.ts (existing uncovered-ac logic)
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
