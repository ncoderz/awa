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

## Usage

```bash
# Basic validation with text output
awa check

# JSON output for CI pipelines
awa check --format json

# Ignore specific paths
awa check --ignore "test/fixtures/**" --ignore "examples/**"

# Custom config file
awa check --config ./custom.toml
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks pass (may have warnings) |
| 1 | One or more errors found |
| 2 | Internal error (file read failure, invalid config) |

## Configuration

All check settings can be specified in `.awa.toml` under the `[check]` section. CLI flags override config values.

```toml
[check]
spec-globs = [".awa/specs/**/*.md"]
code-globs = ["src/**/*.{ts,js,tsx,jsx,py,go,rs,java,cs}"]
markers = ["@awa-impl", "@awa-test", "@awa-component"]
ignore = ["node_modules/**", "dist/**"]
format = "text"
schema-dir = ".awa/.agent/schemas"
schema-enabled = true
id-pattern = '([A-Z][A-Z0-9]*-\d+(?:\.\d+)?(?:_AC-\d+)?|[A-Z][A-Z0-9]*_P-\d+)'
cross-ref-patterns = ["IMPLEMENTS:", "VALIDATES:"]
```

### Options

| Key | Default | Description |
|-----|---------|-------------|
| `spec-globs` | `[".awa/specs/**/*.md"]` | Glob patterns for spec files |
| `code-globs` | `["src/**/*.{ts,js,tsx,jsx,py,go,rs,java,cs}"]` | Glob patterns for source files |
| `markers` | `["@awa-impl", "@awa-test", "@awa-component"]` | Marker names to scan for |
| `ignore` | `["node_modules/**", "dist/**"]` | Glob patterns to exclude |
| `format` | `"text"` | Output format (`text` or `json`) |
| `id-pattern` | *(see above)* | Regex for valid traceability IDs |
| `cross-ref-patterns` | `["IMPLEMENTS:", "VALIDATES:"]` | Keywords for spec cross-references |
| `schema-dir` | `".awa/.agent/schemas"` | Directory containing `*.rules.yaml` schema rule files |
| `schema-enabled` | `true` | Enable/disable schema structural validation |

## Schema Validation

In addition to marker and cross-reference checks, `awa check` can enforce structural rules on spec files using declarative YAML rule files.

Rule files (`*.rules.yaml`) in the schema directory define expected heading structure, required content, and prohibited formatting. Each rule file targets specific spec files via a glob pattern.

### Schema Finding Codes

| Check | Severity | Description |
|-------|----------|-------------|
| Missing required section | error | Expected heading not found in spec file |
| Wrong heading level | warning | Section exists but at incorrect depth |
| Missing content | error | Required pattern, list items, table, or code block not found |
| Wrong table columns | error | Table columns don't match expected headers |
| Prohibited formatting | warning | Disallowed text pattern found outside code blocks |

Disable schema validation with `schema-enabled = false` in the `[check]` config section.

For the full rule file format, see [SCHEMA_RULES.md](SCHEMA_RULES.md).

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
