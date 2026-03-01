# Template CLI Subcommand [INFORMATIVE]

## Problem

The awa CLI currently mixes template-related commands (generate, diff, features, test) with awa-specific commands (check, trace) at the same top level. This makes the CLI surface flat and unclear — users cannot tell at a glance which commands operate on templates versus which operate on awa specs and traceability.

As awa grows, the flat command structure becomes harder to navigate. Grouping template commands under a single parent makes the CLI self-documenting and leaves room for future awa-native commands without namespace collisions.

## Conceptual Model

Commands split into two groups based on what they operate on:

- TEMPLATE COMMANDS: Operate on template files — generating output, comparing output, discovering features, and testing fixtures. These become subcommands of `awa template`.
- AWA COMMANDS: Operate on awa specs and code traceability — checking integrity and exploring chains. These remain top-level.

The resulting CLI structure:

- `awa init [output]` (top-level convenience, equivalent to `awa template generate`)
- `awa template generate [output]`
- `awa template diff [target]`
- `awa template features`
- `awa template test`
- `awa check`
- `awa trace [ids...]`

All existing options for each command remain unchanged — only the command path changes.

## Scenarios

### Scenario 1: Generating agent files

A developer runs `awa template generate . --features copilot claude` to generate agent configuration files. The `template` prefix makes it clear this is a template operation.

### Scenario 2: Checking spec integrity

A developer runs `awa check --spec-only` to validate spec files. This command stays at the top level since it operates on awa specs, not templates.

### Scenario 3: Discovering available features

A developer runs `awa template features --json` to list available feature flags in the current template. The grouping under `template` immediately signals this is about template inspection.

### Scenario 4: Running template tests

A CI pipeline runs `awa template test` to verify template fixtures. The `template` prefix provides context in build logs.

### Scenario 5: Diffing against target

A developer runs `awa template diff .` to check for drift between templates and their project. The command now clearly belongs to template operations.

## Change Log

- 1.0.0 (2026-03-01): Initial feature context for CLI restructure

