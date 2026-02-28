---
title: Schema Rules
description: Define structural validation rules for Markdown spec files using declarative YAML.
---

Schema rules define the expected structure of Markdown spec files. The `awa check` command loads `*.schema.yaml` files from the schema directory and checks spec files against them.

## Rule File Location

Rule files are discovered by globbing `{schema-dir}/*.schema.yaml`. The default schema directory is `.awa/.agent/schemas`.

```
.awa/.agent/schemas/
├── REQ.schema.yaml
├── DESIGN.schema.yaml
├── TASK.schema.yaml
└── FEAT.schema.yaml
```

## Rule File Format

Each rule file is a YAML document with three top-level keys:

```yaml
target-files: ".awa/specs/REQ-*.md"   # Required: glob matching spec files
sections: [...]                         # Required: section structure rules
sections-prohibited: [...]              # Optional: formatting patterns to reject
```

### `target-files`

A glob pattern matched against spec file paths. Only files matching the glob are checked against this rule set.

```yaml
target-files: ".awa/specs/REQ-*.md"
target-files: ".awa/specs/DESIGN-*.md"
target-files: ".awa/tasks/TASK-*.md"
```

### `sections`

An array of section rules defining the expected heading structure. Each section rule specifies:

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `heading` | string | yes | Heading text or regex pattern to match |
| `level` | number (1–6) | yes | Expected heading level (`#` = 1, `##` = 2, etc.) |
| `required` | boolean | no | Whether the section must exist (default: `false`) |
| `repeatable` | boolean | no | Whether multiple matching sections are allowed (default: `false`) |
| `contains` | array | no | Content rules that must hold within the section |
| `children` | array | no | Nested section rules for sub-headings |

#### Heading patterns

Headings are matched as regex when they contain regex special characters, or as case-insensitive exact match otherwise.

```yaml
# Exact match (case-insensitive)
- heading: "Requirements"
  level: 1

# Regex match
- heading: "[A-Z]+-\\d+.*"
  level: 3
  repeatable: true
```

### `contains`

Content rules verify that a section contains specific content. Five rule types are supported:

#### Pattern

Match a regex anywhere in the section body.

```yaml
contains:
  - pattern: "ACCEPTANCE CRITERIA"
    label: "AC heading"      # Optional: human-readable label for error messages
    required: true            # Optional: default true
```

#### List

Require list items matching a pattern with an optional minimum count.

```yaml
contains:
  - list:
      pattern: "\\[[ x]\\].*_AC-"
      min: 1
      label: "acceptance criteria"
```

#### Table

Require a table with specific column headers and optional minimum row count.

```yaml
contains:
  - table:
      columns: ["AC", "Task", "Test"]
      heading: "Trace Summary"   # Optional: table context description
      min-rows: 1
```

#### Code block

Require at least one fenced code block in the section.

```yaml
contains:
  - code-block: true
    label: "code example"
```

#### Heading-or-text

Require a keyword to appear either as a child heading or in the body text.

```yaml
contains:
  - heading-or-text: "IMPLEMENTS"
    required: true
```

### `when` — Conditional Rules

Any contains rule can include a `when` clause that gates the rule based on the matched section's heading text. The condition is a regex test against the heading.

| Key | Description |
|-----|-------------|
| `heading-matches` | Rule applies only when heading matches this regex |
| `heading-not-matches` | Rule applies only when heading does NOT match this regex |

Both keys can be combined (both must pass).

```yaml
contains:
  # GOAL required only in phases with a priority marker
  - pattern: "^GOAL:"
    label: "GOAL statement"
    when:
      heading-matches: "\\[(MUST|SHOULD|COULD)\\]"

  # IMPLEMENTS forbidden in setup/polish phases (no priority marker)
  - pattern: "IMPLEMENTS:"
    prohibited: true
    label: "IMPLEMENTS trace line"
    when:
      heading-not-matches: "\\[(MUST|SHOULD|COULD)\\]"
```

### `prohibited` — Inverted Pattern Rules

Adding `prohibited: true` to a pattern rule inverts the check: the pattern must NOT appear in the section. If found, a `schema-prohibited` warning is reported.

This differs from `sections-prohibited` (which operates on the whole file). `prohibited` on a contains rule operates within a specific section and can be combined with `when` for conditional prohibition.

```yaml
contains:
  - pattern: "TODO:"
    prohibited: true
    label: "TODO markers"
```

### `children`

Nested section rules constrain headings that appear under a matched parent section. They follow the same format as top-level section rules.

```yaml
sections:
  - heading: "Component Details"
    level: 2
    required: true
    children:
      - heading: ".*"
        level: 3
        repeatable: true
        contains:
          - pattern: "RESPONSIBILITIES"
```

### `sections-prohibited`

An array of literal text patterns that should not appear anywhere in the file (outside code blocks). Findings are reported as warnings.

```yaml
sections-prohibited:
  - "**"      # Prohibit bold formatting
  - "~~"      # Prohibit strikethrough
```

Code blocks (fenced with `` ``` ``) are excluded from prohibited pattern scanning.

## Finding Codes

| Code | Severity | Description |
|------|----------|-------------|
| `schema-missing-section` | error | Required section heading not found |
| `schema-wrong-level` | warning | Section exists but at wrong heading level |
| `schema-missing-content` | error | Section missing required content (pattern/list/table/code-block) |
| `schema-table-columns` | error | Table columns don't match expected headers |
| `schema-prohibited` | warning | Prohibited formatting pattern found outside code blocks |
| `schema-no-rule` | — | Reserved for files with no matching rule set |

## Configuration

Schema validation is enabled by default. Configure in `.awa.toml`:

```toml
[check]
schema-dir = ".awa/.agent/schemas"   # Directory containing *.schema.yaml files
schema-enabled = true                 # Set to false to disable schema checking
```

See [Configuration](/reference/configuration/) for the full `[check]` options reference.

## Complete Example

```yaml
# REQ.schema.yaml — validates requirement spec files
target-files: ".awa/specs/REQ-*.md"

sections:
  - heading: ".*"
    level: 1
    required: true
  - heading: "[A-Z]+-\\d+.*"
    level: 3
    required: true
    repeatable: true
    contains:
      - pattern: "ACCEPTANCE CRITERIA"
        label: "AC section"
      - list:
          pattern: "\\[[ x]\\].*_AC-"
          min: 1
          label: "acceptance criteria items"

sections-prohibited:
  - "~~"
```

This rule set checks that every `REQ-*.md` file:
1. Has at least one H1 heading
2. Has at least one repeatable H3 heading matching the `{CODE}-{n}` pattern
3. Each H3 section contains the text "ACCEPTANCE CRITERIA"
4. Each H3 section contains at least one list item matching the AC format
5. The file does not use strikethrough formatting
