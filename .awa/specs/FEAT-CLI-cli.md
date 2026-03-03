# CLI Interface [INFORMATIVE]

## Problem

AI coding agents need configuration files in each project. Developers need an ergonomic command-line interface to generate, preview, and manage these files — with enough options to control the process but sensible defaults so common cases require little input.

Without a clear CLI, developers resort to manually copying files, leading to divergence across projects and inconsistent agent behaviour.

Additionally, awa's traceability chain (`@awa-impl`, `@awa-test`, `@awa-component`) relies on AI agents following instructions correctly. Nothing verifies that the chain is complete or consistent without a dedicated validation command. Markers could reference non-existent IDs, acceptance criteria could lack test coverage, and cross-references between spec files could point to nothing — making the traceability system an honour system rather than an enforceable contract.

## Conceptual Model

awa provides two primary commands — `generate` and `diff` — with a shared set of options that control template selection, feature flags, and output behaviour.

The GENERATE command renders templates and writes output files. The DIFF command renders the same templates to a temporary directory and compares them against a target, showing what would change without modifying anything.

Options fall into several categories:

- WHAT TO GENERATE: `--template` (source), `--features` / `--preset` / `--remove-features` (conditional content)
- WHERE TO WRITE: positional output directory argument
- HOW TO HANDLE CONFLICTS: `--force` (auto-overwrite), `--dry-run` (preview only), `--delete` (enable deletions)
- CACHE CONTROL: `--refresh` (re-fetch remote templates)
- CONFIGURATION: `--config` (alternate config file path)

Options may come from CLI arguments, from an `.awa.toml` configuration file, or from both — with CLI always winning on conflicts.

`awa check` is a deterministic verification tool that checks two dimensions of the traceability chain:

1. CODE-TO-SPEC: Traceability markers in source files resolve to real spec IDs, and spec acceptance criteria have test coverage.
2. SPEC-TO-SPEC: Cross-references between spec files are valid (e.g., DESIGN references exist in REQ, ID formats are correct).

The tool is fully configurable — users with custom templates can define their own marker names, spec globs, and code globs. Defaults match the bundled awa workflow. Output can be text (human) or JSON (CI).

## Scope Boundary

Top-level CLI argument parsing, option definitions, help output. Traceability validation — spec schemas, marker scanning, AC coverage, cross-refs.

## Scenarios

### Scenario 1: First-time generation

A developer sets up a new project and runs `awa template generate .` with no other arguments. The CLI uses the bundled default template, generates files into the current directory, and shows a summary of created files. Since no files exist yet, there are no conflicts.

### Scenario 2: Feature-selective generation

A team uses Copilot and Claude. The developer runs `awa template generate . --features copilot claude`. Templates conditionally include content for those two agents while omitting configuration for other tools.

### Scenario 3: Previewing changes before committing

After upgrading awa, a developer runs `awa template diff .` to see what template changes would apply to their project. The diff output shows modified, new, and (optionally) extra files — without touching anything on disk.

### Scenario 4: CI pipeline validation

A CI job runs `awa template diff .` and checks the exit code. Exit 0 means the project's agent files match the templates; exit 1 means drift has occurred and the pipeline fails, prompting the developer to regenerate.

### Scenario 5: Forced regeneration

A developer wants to accept all template changes without reviewing each conflict. They run `awa template generate . --force`, which overwrites every existing file without prompting.

### Scenario 6: Dry-run preview

Before regenerating, a developer runs `awa template generate . --dry-run` to see which files would be created, skipped, or overwritten — without writing anything to disk.

### Scenario 7: Cleaning up stale files

A template update removes support for an agent. The developer runs `awa template generate . --delete` to generate new files and also remove obsolete files listed in the template's delete list, after confirming each deletion.

### Scenario 8: Clean project check

All markers resolve to real spec IDs, all ACs have test coverage. `awa check` exits with code 0 and prints a brief summary.

### Scenario 9: Orphaned marker

A source file contains `@awa-impl: FOO-1` followed by an acceptance criterion ID but that ID doesn't exist in any spec file. `awa check` reports an error and exits with code 1.

### Scenario 10: Missing test coverage

An AC exists in a REQ spec but no `@awa-test` references it anywhere. `awa check` reports a warning.

### Scenario 11: Broken cross-reference

A DESIGN file contains a cross-reference to a requirement ID that doesn't exist in any REQ file. `awa check` reports an error.

### Scenario 12: Custom workflow

A team uses `@trace-impl` instead of `@awa-impl` and keeps specs in `docs/specs/`. They configure this in `.awa.toml` and `awa check` works as expected.

### Scenario 13: CI gate

A GitHub Actions workflow runs `awa check --format json`. The JSON output is parsed by a downstream step. Exit code 1 fails the workflow.

### Scenario 14: Malformed ID

A spec file contains an ID with an underscore where a hyphen is expected (e.g., `FOO_1` instead of `FOO-1`). `awa check` reports an ID format error.

### Scenario 15: Duplicate references

Two different source files both reference the same acceptance criterion ID via `@awa-impl`. `awa check` reports a warning about the duplicate implementation reference, helping developers spot accidental copy-paste or unclear ownership of acceptance criteria.
