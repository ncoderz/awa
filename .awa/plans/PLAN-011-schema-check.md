# PLAN-011: Schema Validation for `awa check`

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** Extends CHK (check) feature — PLAN-002, REQ-CHK, DESIGN-CHK

## Problem

`awa check` currently checks traceability chain integrity (markers ↔ spec IDs, cross-references). It does not check whether spec files themselves conform to their schemas. A DESIGN file missing a required `## Correctness Properties` section, a REQ file with a table that has wrong columns, or a TASK file missing its trace summary — all pass validation silently.

The schemas exist (`.awa/.agent/schemas/*.schema.md`) but are only consumed by the AI as authoring guides. Nothing enforces them programmatically.

## Goal

Extend `awa check` to check Markdown files against configurable declarative rule files. Report structural violations (missing required sections, malformed IDs, incorrect heading levels, wrong table columns, missing list patterns) alongside the existing marker/cross-ref findings.

**Out of scope:** Creating the rule files for the existing awa schemas. This plan covers the validation engine and rule format only.

## Approach

### Why Not Use Existing Tools?

| Tool | What it does | Why it doesn't fit |
|---|---|---|
| markdownlint | Style rules (line length, heading style) | No semantic structure — can't validate table columns or section content |
| remark plugins | AST-based Markdown validation via JS plugins | Rules are code, not declarative; we want a schema-like format |
| Vale | Prose quality rules | Writing style only — not document structure |
| JSON Schema | Validates JSON/YAML | Markdown isn't JSON |
| Spectral | Declarative rules for API specs | Designed for OpenAPI JSON, not Markdown |

**Chosen approach:**
1. **remark/unified** to parse Markdown into mdast (AST) — battle-tested, widely used, no custom parser
2. **Custom declarative rule files** (YAML) for structural expectations — simple, human-readable, easy for users to author
3. **AST walker** checks rules against the parsed tree

### Rule File Format

Each rule file declares structural expectations for a set of Markdown files. The format is YAML for readability and ease of authoring.

Example: `REQ.rules.yaml`
```yaml
target-files: ".awa/specs/REQ-*.md"

sections:
  - heading: "Requirements Specification"
    level: 1
    required: true

  - heading: "Introduction"
    level: 2
    required: true

  - heading: "Requirements"
    level: 2
    required: true
    children:
      - heading: "{CODE}-{n}: .+"    # regex pattern for requirement headings
        level: 3
        repeatable: true
        required: true
        contains:
          - pattern: "AS A .+, I WANT .+, SO THAT .+"
            label: "user story"
          - heading-or-text: "ACCEPTANCE CRITERIA"
            required: true
          - list:
              pattern: "- \\[[ x]\\] {CODE}-{n}(?:\\.\\d+)?_AC-\\d+ \\[\\w+\\]:"
              min: 1
              label: "acceptance criterion"

  - heading: "Assumptions"
    level: 2
    required: false

sections-prohibited:
  - "**"       # no bold (use CAPITALS)
  - "*"        # no italic
```

Example: `TASK.rules.yaml`
```yaml
target-files: ".awa/tasks/TASK-*.md"

sections:
  - heading: "Implementation Tasks"
    level: 1
    required: true

  - heading: ".+"   # Phase headings
    level: 2
    repeatable: true
    required: true
    contains:
      - list:
          pattern: "- \\[[ x]\\] T-[A-Z]+-\\d+"
          min: 1
          label: "task checkbox"

  - heading: "Dependencies"
    level: 2
    required: true

  - heading: "Trace Summary"
    level: 2
    required: true
    contains:
      - table:
          heading: "AC"
          columns: ["AC", "Task", "Test"]
          min-rows: 1
      - table:
          heading: "Property"
          columns: ["Property", "Test"]
```

Example: `DESIGN.rules.yaml`
```yaml
target-files: ".awa/specs/DESIGN-*.md"

sections:
  - heading: "Design Specification"
    level: 1
    required: true

  - heading: "Overview"
    level: 2
    required: true

  - heading: "Components and Interfaces"
    level: 2
    required: true
    children:
      - heading: "[A-Z]+-[A-Za-z]+"    # component name pattern
        level: 3
        repeatable: true
        contains:
          - pattern: "IMPLEMENTS:"
            required: false
          - code-block: true
            label: "interface definition"

  - heading: "Correctness Properties"
    level: 2
    required: true
    contains:
      - list:
          pattern: "- [A-Z]+_P-\\d+ \\[.+\\]:"
          min: 1
          label: "correctness property"
      - pattern: "VALIDATES:"
        required: true

  - heading: "Requirements Traceability"
    level: 2
    required: true
    contains:
      - pattern: "SOURCE:"
        required: true
      - list:
          pattern: "- [A-Z]+-\\d+(?:\\.\\d+)?_AC-\\d+ →"
          min: 1
          label: "traceability entry"

  - heading: "Change Log"
    level: 2
    required: true
```

### Rule Primitives

The rule format supports these primitives:

| Primitive | Description |
|---|---|
| `heading` | Expected heading text (string or regex) |
| `level` | Heading depth (1-6) |
| `required` | Whether section must exist (error if missing) |
| `repeatable` | Whether heading pattern can match multiple times |
| `children` | Nested section rules under this heading |
| `contains.pattern` | Regex that must appear in section body |
| `contains.list` | List items matching a pattern, with optional min count |
| `contains.table` | Table with expected column headers and optional min rows |
| `contains.code-block` | At least one fenced code block present |
| `sections-prohibited` | Formatting patterns that should not appear anywhere |

### Markdown Parsing

Use **remark** (unified ecosystem) to parse Markdown into mdast:

```
dependencies:
  remark-parse     — Markdown → mdast parser
  unified          — processor pipeline
```

mdast provides typed nodes for headings, lists, tables, code blocks, etc. — no regex-based Markdown parsing needed.

## Design Sketch

### Configuration

```toml
[check]
# existing fields unchanged...

# New: schema validation
schema-dir = ".awa/.agent/schemas"    # where to find rule files
schema-enabled = true                  # enable/disable schema checking
```

Rule files are discovered by globbing `{schema-dir}/*.rules.yaml`. Each file's `target-files` field determines which Markdown files it applies to.

Optional overrides not needed initially — the `target-files` in each rule file handles mapping.

### New Components

```
CHK-RuleLoader      — reads *.rules.yaml files, parses into typed rule definitions
CHK-SchemaChecker   — parses Markdown via remark, walks AST checking rules
```

### Finding Codes

New codes added to existing `FindingCode` type:

| Code | Severity | Description |
|---|---|---|
| `schema-missing-section` | error | Required section heading not found |
| `schema-wrong-level` | warning | Heading at wrong depth |
| `schema-missing-content` | error | Required `contains` pattern/table/list not found in section |
| `schema-table-columns` | error | Table exists but column headers don't match |
| `schema-prohibited` | warning | Prohibited formatting found |
| `schema-no-rule` | info | File matches no rule file (optional, off by default) |

### Pipeline Extension

Current: `scanMarkers → parseSpecs → [codeSpecChecker, specSpecChecker] → report`

Extended: `scanMarkers → parseSpecs → loadRules → [codeSpecChecker, specSpecChecker, schemaChecker] → report`

`schemaChecker` runs in parallel with existing checkers since it's independent.

## Steps

### Phase 1: Rule Loader

1. Define TypeScript types for the YAML rule format (`RuleFile`, `SectionRule`, `ContainsRule`, etc.)
2. Create `CHK-RuleLoader` component (`src/core/check/rule-loader.ts`)
3. Glob `{schema-dir}/*.rules.yaml` files
4. Parse YAML into typed rule definitions (use a YAML parser — check existing deps or add one)
5. Resolve `target-files` patterns to determine which Markdown files each rule set applies to
6. Unit tests: parse sample `.rules.yaml`, verify typed output

### Phase 2: Schema Checker

1. Add `remark-parse` + `unified` dependencies
2. Create `CHK-SchemaChecker` component (`src/core/check/schema-checker.ts`)
3. Parse Markdown files into mdast via remark
4. Walk AST to build heading tree with section content ranges
5. For each matched file, check:
   - Required sections present at correct level
   - `contains.pattern` found within section content
   - `contains.list` items match and meet min count
   - `contains.table` has expected columns and min rows
   - `contains.code-block` present where required
   - `sections-prohibited` patterns absent
6. Return findings with appropriate codes
7. Unit tests with minimal Markdown fixtures for each rule primitive

### Phase 3: Integration

1. Add `schemaDir`, `schemaEnabled` to `CheckConfig` type and defaults
2. Add `[check]` TOML parsing for new fields in config builder
3. Wire rule loading + schema checking into check command pipeline
4. Add new finding codes to `FindingCode` type and reporter (both text and JSON)
5. Integration test: create sample `.rules.yaml` + matching/non-matching Markdown files

### Phase 4: Documentation

1. Create `docs/SCHEMA_RULES.md` — rule file format reference
2. Update `docs/CLI.md` and `docs/TRACEABILITY_CHECK.md`
3. Update website docs (CLI, configuration, traceability guide)
4. Update ARCHITECTURE.md with new components

## Dependencies

| Package | Purpose | Size |
|---|---|---|
| `unified` | Processor pipeline | ~5KB |
| `remark-parse` | Markdown → mdast | ~30KB |
| YAML parser (TBD) | Parse `.rules.yaml` | research needed — prefer lightweight, e.g. `smol-yaml` or `yaml` |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Rule format too limited for real schemas | Medium | High | Primitives cover headings, lists, tables, patterns, code blocks — most Markdown structures |
| remark AST complexity | Low | Medium | mdast is well-documented; heading-tree extraction is straightforward |
| YAML parser adds bundled size | Low | Low | Choose lightweight parser; validate schemas are small files |
| Rule authoring is manual and error-prone | Medium | Medium | Provide clear docs, examples, and validate the rule files themselves |
| False positives from flexible Markdown | Medium | Medium | `required: false` defaults; users control strictness |

## Completion Criteria

- Rule file format defined and documented
- `awa check` loads `*.rules.yaml` from configured schema directory
- Reports structural violations (missing sections, bad tables, missing patterns)
- Schema checking is configurable (`schema-enabled = false` to disable)
- Defaults match bundled awa workflow directory (`.awa/.agent/schemas/`)
- Existing marker/cross-ref validation unaffected
- All existing tests pass; new tests cover rule loading and schema checking

## Open Questions

1. **YAML parser choice** — `yaml` (npm) is comprehensive but 200KB+. `smol-yaml`? Or is there a lighter option? Need to research.
2. **Info-level findings** — should `schema-no-rule` (file matches no rule) be reported at all? Recommendation: off by default, opt-in via config.
3. **Rule file validation** — should the loader validate rule files themselves (e.g. detect invalid regex in `pattern`)? Recommendation: yes, fail fast with clear errors.
