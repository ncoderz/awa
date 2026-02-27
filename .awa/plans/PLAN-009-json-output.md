# PLAN-009: `--json` Output — Structured Dry-Run and Diff Output

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — extends existing generate and diff commands

## Problem

`--dry-run` and `awa diff` output is human-readable only. No structured format for CI pipelines, automation, or tooling integration.

## Goal

Add `--json` flag to `generate` and `diff` commands for machine-readable JSON output. Add `--summary` for compact human output.

## Workflow Steps

### 1. FEAT

Create `FEAT-JSON-json-output.md` — CI integration, automation, tooling.

Key scenarios:
- `awa generate . --dry-run --json` — JSON output of planned actions
- `awa diff . --json` — JSON output of diff results
- `awa generate . --dry-run --summary` — compact one-line summary
- CI pipeline parses JSON to decide if PR should be blocked

### 2. REQUIREMENTS

Create `REQ-JSON-json-output.md`:

- JSON-1: Generate command supports `--json` flag for structured output
- JSON-2: Diff command supports `--json` flag for structured output
- JSON-3: Generate `--json` includes: actions array (type, path), counts (created, overwritten, skipped, deleted)
- JSON-4: Diff `--json` includes: diffs array (path, status, unified diff), counts (changed, new, matching, deleted)
- JSON-5: `--summary` flag shows compact counts-only output (one line)
- JSON-6: `--json` suppresses all non-JSON output (no spinners, no prompts)
- JSON-7: `--json` implies `--dry-run` for generate (never write + JSON)
- JSON-8: JSON output writes to stdout; errors to stderr

### 3. DESIGN

Create `DESIGN-JSON-json-output.md`:

- JSON-Serializer: Convert GenerationResult/DiffResult to JSON
- JSON-SummaryFormatter: One-line counts output
- Approach: existing result types already have all needed data; just add serialization
- `--json` flag sets a "silent" mode that disables interactive prompts and spinners
- JSON-7 decision: should `--json` imply `--dry-run`? Yes — writing files + spitting JSON is confusing

### 4. TASKS

- Add `--json` and `--summary` flags to generate and diff commands
- Create JSON serializer for GenerationResult
- Create JSON serializer for DiffResult
- Create summary formatter
- Suppress interactive output when `--json` is active: skip `@clack/prompts` `intro()`/`outro()` calls and set Logger to silent mode (both generate and diff commands use clack, which writes to stdout)
- Ensure `--json` implies `--dry-run` for generate
- Unit tests for serializers
- Integration tests for JSON output

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `--json` and `--summary` options
- New section in CLI.md: "CI Integration" with JSON output examples
- Update `README.md` features list
- Website: Update CLI reference, add CI integration guide
- Update ARCHITECTURE.md mentioning JSON output

## Cross-Plan Dependencies

- PLAN-010 (per-agent config): If both ship, `awa generate --all --json` and `awa diff --all --json` need a combined JSON structure wrapping per-target results. JSON serializers should be designed as composable (per-target result → array of results) from the start

## Risks

- JSON schema needs to be stable once published (semver contract)
- `--json` + interactive prompts = conflict (resolved by implying --dry-run)
- Diff unified diff in JSON: include as string field or structured hunks? (String is simpler, start there)

## Completion Criteria

- `awa diff . --json` produces valid JSON to stdout
- `awa generate . --dry-run --json` produces valid JSON to stdout
- `--summary` shows compact counts
- Documentation complete
