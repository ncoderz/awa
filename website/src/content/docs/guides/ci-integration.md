---
title: CI Integration
description: Use awa in CI pipelines to detect template drift, preview generation, and validate traceability.
---

All awa commands that produce output support `--json` and `--summary` flags for machine-readable output. JSON is written to stdout; errors to stderr.

## Spec & Traceability Validation

Use `awa check` to validate spec structure and code-to-spec traceability:

```bash
awa check --json > check-result.json
```

Example JSON output:

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

## Template Drift Detection

Use `awa template diff` to check whether generated agent files have drifted from the template:

```bash
# Exit code 1 means differences found
awa template diff . --json > diff-result.json
```

Example JSON output:

```json
{
  "diffs": [
    { "path": "file.md", "status": "modified", "diff": "--- a/file.md\n+++ b/file.md\n..." },
    { "path": "new-file.md", "status": "new" },
    { "path": "same.md", "status": "identical" }
  ],
  "counts": {
    "changed": 1,
    "new": 1,
    "matching": 1,
    "deleted": 0
  }
}
```
