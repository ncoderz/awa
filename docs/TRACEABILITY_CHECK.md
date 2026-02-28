# Traceability Validation

The `awa check` command verifies the integrity of the traceability chain between code markers and spec files. It ensures that every `@awa-impl`, `@awa-test`, and `@awa-component` marker in source code corresponds to a real ID in the spec files, and that spec cross-references (IMPLEMENTS/VALIDATES) point to valid targets.

## What Gets Checked

### Code-to-Spec Validation

| Check | Severity | Description |
|-------|----------|-------------|
| Orphaned `@awa-impl` | error | Marker references an AC ID not found in any REQ spec |
| Orphaned `@awa-test` | error | Marker references an AC or property ID not in any spec |
| Orphaned `@awa-component` | error | Marker references a component name not in any DESIGN spec |
| Uncovered AC | warning | Acceptance criterion in a REQ spec has no `@awa-test` |
| Invalid ID format | warning | Marker ID doesn't match the configured ID pattern |

### Spec-to-Spec Validation

| Check | Severity | Description |
|-------|----------|-------------|
| Broken IMPLEMENTS | error | DESIGN component references an AC ID not in any REQ spec |
| Broken VALIDATES | error | DESIGN property references an AC or requirement ID not in any REQ spec |
| Orphaned spec | warning | Spec file's feature code isn't referenced by any marker or cross-reference |
| Marker trailing text | error | Marker contains trailing text after the ID(s) |

## Usage

```bash
# Basic validation with text output
awa check

# JSON output for CI pipelines
awa check --format json

# Ignore specific code paths
awa check --code-ignore "test/fixtures/**" --code-ignore "examples/**"

# Allow warnings without failing (default: warnings are errors)
awa check --allow-warnings

# Run only spec-level checks (skip code-to-spec traceability)
awa check --spec-only

# Custom config file
awa check --config ./custom.toml
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks pass (no errors; warnings only if `--allow-warnings`) |
| 1 | One or more errors found (warnings count as errors unless `--allow-warnings`) |
| 2 | Internal error (file read failure, invalid config) |

By default, warnings are treated as errors and cause exit code 1. Use `--allow-warnings` or set `allow-warnings = true` in the `[check]` config to restore the previous behavior where only errors affect the exit code.

## Configuration

All check settings can be specified in `.awa.toml` under the `[check]` section. CLI flags override config values.

```toml
[check]
spec-globs = [
  ".awa/specs/ARCHITECTURE.md",
  ".awa/specs/FEAT-*.md",
  ".awa/specs/REQ-*.md",
  ".awa/specs/DESIGN-*.md",
  ".awa/specs/EXAMPLES-*.md",
  ".awa/specs/API-*.tsp",
  ".awa/tasks/TASK-*.md",
  ".awa/plans/PLAN-*.md",
  ".awa/align/ALIGN-*.md",
]
code-globs = ["**/*.{ts,js,tsx,jsx,mts,mjs,cjs,py,go,rs,java,kt,kts,cs,c,h,cpp,cc,cxx,hpp,hxx,swift,rb,php,scala,ex,exs,dart,lua,zig}"]
markers = ["@awa-impl", "@awa-test", "@awa-component"]
spec-ignore = []
code-ignore = ["node_modules/**", "dist/**", "vendor/**", "target/**", "build/**", "out/**", ".awa/**"]
format = "text"
schema-dir = ".awa/.agent/schemas"
schema-enabled = true
id-pattern = '([A-Z][A-Z0-9]*-\d+(?:\.\d+)?(?:_AC-\d+)?|[A-Z][A-Z0-9]*_P-\d+)'
cross-ref-patterns = ["IMPLEMENTS:", "VALIDATES:"]
```

### Options

| Key | Default | Description |
|-----|---------|-------------|
| `spec-globs` | *(see config example above)* | Glob patterns for spec, task, plan, and align files |
| `code-globs` | `["**/*.{ts,js,...,zig}"]` | Glob patterns for source files |
| `markers` | `["@awa-impl", "@awa-test", "@awa-component"]` | Marker names to scan for |
| `spec-ignore` | `[]` | Glob patterns to exclude from spec file scanning |
| `code-ignore` | `["node_modules/**", "dist/**", ...]` | Glob patterns to exclude from code file scanning |
| `ignore-markers` | `[]` | Marker IDs to exclude from orphan checks |
| `format` | `"text"` | Output format (`text` or `json`) |
| `id-pattern` | *(see above)* | Regex for valid traceability IDs |
| `cross-ref-patterns` | `["IMPLEMENTS:", "VALIDATES:"]` | Keywords for spec cross-references |
| `schema-dir` | `".awa/.agent/schemas"` | Directory containing `*.schema.yaml` schema rule files |
| `schema-enabled` | `true` | Enable/disable schema structural validation |
| `allow-warnings` | `false` | Allow warnings without failing (when `false`, warnings are promoted to errors) |
| `spec-only` | `false` | Run only spec-level checks; skip code-to-spec traceability |

## Schema Validation

In addition to marker and cross-reference checks, `awa check` can enforce structural rules on spec files using declarative YAML rule files.

Rule files (`*.schema.yaml`) in the schema directory define expected heading structure, required content, and prohibited formatting. Each rule file targets specific spec files via a glob pattern.

### Schema Finding Codes

| Code | Severity | Description |
|------|----------|-------------|
| `schema-missing-section` | error | Required section heading not found |
| `schema-wrong-level` | warning | Section exists but at wrong heading level |
| `schema-missing-content` | error | Section missing required content (pattern/list/table/code-block) |
| `schema-table-columns` | error | Table columns don't match expected headers |
| `schema-prohibited` | warning | Prohibited formatting pattern found outside code blocks |
| `schema-line-limit` | warning | File exceeds the line limit defined in the rule |
| `schema-no-rule` | — | File matches no schema rule set |

Disable schema validation with `schema-enabled = false` in the `[check]` config section.

For the full rule file format, see [SCHEMA_RULES.md](SCHEMA_RULES.md).

### Traceability Finding Codes

| Code | Severity | Description |
|------|----------|-------------|
| `orphaned-marker` | error | `@awa-impl`, `@awa-test`, or `@awa-component` references an ID not in specs |
| `uncovered-ac` | warning | Acceptance criterion has no corresponding `@awa-test` |
| `broken-cross-ref` | error | IMPLEMENTS/VALIDATES points to non-existent requirement ID |
| `invalid-id-format` | warning | Marker ID doesn't match the configured ID pattern |
| `marker-trailing-text` | error | Marker contains trailing text after the ID(s) |
| `orphaned-spec` | warning | Spec file's feature code not referenced by any marker or cross-ref |

## JSON Output Format

When `--format json` is used, output is a JSON object:

```json
{
  "valid": false,
  "errors": 3,
  "warnings": 2,
  "findings": [
    {
      "severity": "error",
      "code": "orphaned-marker",
      "message": "@awa-impl references unknown ID 'FOO-1_AC-1'",
      "filePath": "src/foo.ts",
      "line": 5,
      "id": "FOO-1_AC-1"
    },
    {
      "severity": "warning",
      "code": "uncovered-ac",
      "message": "AC 'BAR-2_AC-1' has no @awa-test",
      "id": "BAR-2_AC-1"
    }
  ]
}
```

## ID Patterns

The default ID pattern recognizes these formats:

| Pattern | Example | Used For |
|---------|---------|----------|
| `{CODE}-{n}` | `DIFF-1` | Requirement |
| `{CODE}-{n}.{p}` | `DIFF-1.2` | Sub-requirement |
| `{CODE}-{n}_AC-{m}` | `DIFF-1_AC-1` | Acceptance criterion |
| `{CODE}-{n}.{p}_AC-{m}` | `DIFF-1.2_AC-3` | Sub-requirement AC |
| `{CODE}_P-{n}` | `DIFF_P-1` | Correctness property |

Where `{CODE}` is 1+ uppercase letters/digits (e.g. `DIFF`, `VAL`), and `{n}`, `{p}`, `{m}` are integers.
