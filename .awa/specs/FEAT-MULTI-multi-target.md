# Multi-Target Configuration [INFORMATIVE]

## Problem

When using awa to generate configuration for multiple AI agents (Claude, GitHub Copilot, Cursor, etc.), each agent may need different features, presets, or output directories. Currently, users must run `awa generate` multiple times with different flags and output directories — tedious, error-prone, and impossible to automate in a single step.

## Conceptual Model

awa supports per-agent target sections in `.awa.toml`. Each `[targets.<name>]` section defines a named target with its own generation-related configuration. A single `awa generate --all` command processes every defined target in one invocation.

Target sections inherit from the root configuration using the same nullish coalescing semantics as the existing CLI→file merge: target values replace root values entirely (no deep merge of arrays). Boolean flags (`force`, `dry-run`, `delete`, `refresh`) are NOT per-target — they apply globally from root config or CLI flags.

In batch mode (`--all` or `--target`), interactive prompting is suppressed. If a target resolves to no tool features, generation proceeds without prompting.

## Scenarios

### Scenario 1: Multi-agent project

A team uses both Claude and GitHub Copilot. They create `.awa.toml` with two targets:

```toml
template = "./templates/awa"
features = ["architect", "code"]

[targets.claude]
output = "."
features = ["claude", "architect", "code"]

[targets.copilot]
output = "."
features = ["copilot", "code", "vibe"]
```

Running `awa generate --all` generates configuration for both agents in a single command.

### Scenario 2: Single target processing

A developer wants to regenerate only the Claude configuration. Running `awa generate --target claude` processes only that target section.

### Scenario 3: Diff all targets

Before committing, a developer runs `awa diff --all` to check if any target's output has drifted. The exit code is `1` if any target has differences, `0` if all match.

### Scenario 4: No targets defined

A developer runs `awa generate --all` but has no `[targets.*]` sections in their config. The tool errors with `NO_TARGETS`.

### Scenario 5: Unknown target

A developer runs `awa generate --target nonexistent`. The tool errors with `UNKNOWN_TARGET` listing available targets.

### Scenario 6: Backward compatibility

A developer's existing `.awa.toml` has no targets. Running `awa generate .` works exactly as before — no behavioral change.

## Change Log

- 1.0.0 (2026-02-28): Initial feature context for multi-target configuration
