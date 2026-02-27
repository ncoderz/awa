# CLI Interface [INFORMATIVE]

## Problem

AI coding agents need configuration files in each project. Developers need an ergonomic command-line interface to generate, preview, and manage these files — with enough options to control the process but sensible defaults so common cases require little input.

Without a clear CLI, developers resort to manually copying files, leading to divergence across projects and inconsistent agent behaviour.

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

## Scenarios

### Scenario 1: First-time generation

A developer sets up a new project and runs `awa generate .` with no other arguments. The CLI uses the bundled default template, generates files into the current directory, and shows a summary of created files. Since no files exist yet, there are no conflicts.

### Scenario 2: Feature-selective generation

A team uses Copilot and Claude. The developer runs `awa generate . --features copilot claude`. Templates conditionally include content for those two agents while omitting configuration for other tools.

### Scenario 3: Previewing changes before committing

After upgrading awa, a developer runs `awa diff .` to see what template changes would apply to their project. The diff output shows modified, new, and (optionally) extra files — without touching anything on disk.

### Scenario 4: CI pipeline validation

A CI job runs `awa diff .` and checks the exit code. Exit 0 means the project's agent files match the templates; exit 1 means drift has occurred and the pipeline fails, prompting the developer to regenerate.

### Scenario 5: Forced regeneration

A developer wants to accept all template changes without reviewing each conflict. They run `awa generate . --force`, which overwrites every existing file without prompting.

### Scenario 6: Dry-run preview

Before regenerating, a developer runs `awa generate . --dry-run` to see which files would be created, skipped, or overwritten — without writing anything to disk.

### Scenario 7: Cleaning up stale files

A template update removes support for an agent. The developer runs `awa generate . --delete` to generate new files and also remove obsolete files listed in the template's delete list, after confirming each deletion.

## Change Log

- 1.0.0 (2026-02-24): Initial feature context derived from code and requirements
- 1.1.0 (2026-02-27): Schema upgrade — replaced bold formatting with CAPITALS
