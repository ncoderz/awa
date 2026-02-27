# Configuration System [INFORMATIVE]

## Problem

Developers using awa often invoke the same options on every run — the same output directory, the same template, the same features. Re-typing these arguments is tedious and error-prone, especially in team settings where everyone should use the same configuration.

Without a persistent configuration mechanism, every invocation requires the full set of flags, and there is no way to establish project-level defaults.

## Conceptual Model

awa loads configuration from a TOML file (`.awa.toml`) in the current working directory. Every CLI option has a corresponding config key using kebab-case naming. The configuration and CLI arguments are merged with a simple rule: CLI always wins.

The merge works as follows:

- Scalar values (strings, booleans): CLI value replaces config value entirely.
- Array values (features, preset, remove-features): CLI array replaces config array entirely — no merging or appending.
- Missing config file: not an error; the tool proceeds with CLI arguments and built-in defaults.
- Explicit config path (`--config`): points to a specific file; error if missing.

The supported config options mirror the CLI surface: `output`, `template`, `features`, `force`, `dry-run`, `delete`, `refresh`, `list-unknown`, `preset`, and `remove-features`. A `[presets]` table enables named feature bundles (covered in the feature presets feature).

## Scenarios

### Scenario 1: Project-level defaults

A developer creates `.awa.toml` in their project root with `output = "."` and `features = ["copilot", "claude"]`. From now on, running `awa generate` uses those defaults without any flags.

### Scenario 2: CLI overrides

The same developer occasionally needs extra features. Running `awa generate --features copilot claude cursor` replaces the config's features array entirely for that invocation — it does not append to it.

### Scenario 3: Team-shared configuration

A team commits `.awa.toml` to their repository with agreed-upon defaults. Every team member gets the same generation output. Individual developers can still override per-invocation via CLI flags.

### Scenario 4: Alternate config file

A monorepo has different agent configurations for different packages. A developer runs `awa generate ./pkg-a --config ./pkg-a/.awa.toml` to use the package-specific config.

### Scenario 5: No config file

A developer runs awa in a directory without `.awa.toml`. The tool proceeds normally — all options come from CLI arguments or built-in defaults. No error is raised.

### Scenario 6: Malformed config

A developer has a typo in `.awa.toml` (e.g., unclosed string). The tool displays a descriptive TOML parse error with the line number and exits.

## Change Log

- 1.0.0 (2026-02-24): Initial feature context derived from code and requirements
- 1.1.0 (2026-02-27): Schema upgrade — replaced bold formatting with plain text
