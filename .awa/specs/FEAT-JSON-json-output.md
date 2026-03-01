# JSON Output [INFORMATIVE]

## Problem

The generate and diff commands produce human-readable output only. CI pipelines, automation scripts, and tooling integrations cannot reliably parse colored terminal text. Teams need a machine-readable format to programmatically inspect what files would change or have drifted without scraping console output.

## Conceptual Model

The JSON output feature adds two flags to the generate and diff commands:

- JSON FLAG: Produces structured JSON to stdout. For generate, this implies dry-run mode (no files are written). All interactive prompts and spinners are suppressed. Errors go to stderr.
- SUMMARY FLAG: Produces a compact one-line counts-only output for quick human scanning in logs.

The JSON structure mirrors the existing result types. Generate output contains an actions array (type and path per file) and counts (created, overwritten, skipped, deleted). Diff output contains a diffs array (path, status, optional unified diff) and counts (changed, new, matching, deleted).

Stdout carries only the JSON payload; stderr carries error messages. This separation lets shell pipelines capture JSON cleanly.

## Scenarios

### Scenario 1: CI Drift Detection

A GitHub Actions workflow runs `awa template diff . --json`. The step captures stdout as JSON, parses the counts, and fails the build if any differences are found. The structured output lets the workflow post a detailed PR comment listing each changed file.

### Scenario 2: Dry-Run Preview in Automation

A developer's script runs `awa template generate . --json` to preview what files would be created or overwritten. The JSON flag implies dry-run, so no files are modified. The script parses the actions array to decide whether to proceed with actual generation.

### Scenario 3: Quick Summary in Logs

A CI step runs `awa template diff . --summary` for a concise one-line output like "changed: 2, new: 1, matching: 10, deleted: 0" that appears in build logs without clutter.

### Scenario 4: Error Handling in Pipelines

A pipeline runs `awa template generate . --json` with an invalid template path. The JSON flag suppresses all interactive output. The error message goes to stderr, and the process exits with a non-zero code. No partial JSON is written to stdout.

## Change Log

- 1.0.0 (2026-02-28): Initial feature context for JSON output
