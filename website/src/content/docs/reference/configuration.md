---
title: Configuration
description: Configure awa using .awa.toml or CLI flags.
---

# Configuration

awa can be configured via a `.awa.toml` file, CLI flags, or both. **CLI arguments always override config file values.**

## `.awa.toml` Reference

Place `.awa.toml` in your project root (or specify a path with `--config`).

```toml
# Output directory for generated files
output = ".github/agents"

# Template source (local path or Git repo)
template = "owner/repo"

# Feature flags to enable
features = ["copilot", "claude"]

# Overwrite existing files without prompting
force = false

# Preview changes without writing
dry-run = false

# Apply deletions from _delete.txt
delete = false

# Re-fetch cached remote templates
refresh = false

# Include target-only files in diff output
list-unknown = false

# Named preset definitions
[presets]
full = ["copilot", "claude", "cursor", "windsurf", "kilocode", "opencode", "gemini", "roo", "qwen", "codex", "agy", "agents-md"]
lite = ["copilot", "claude"]
```

## Options Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `output` | string | — | Output directory for generated files |
| `template` | string | bundled default | Template source — local path or Git repo |
| `features` | string[] | `[]` | Feature flags to enable |
| `force` | boolean | `false` | Overwrite existing files without prompting |
| `dry-run` | boolean | `false` | Preview changes without writing files |
| `delete` | boolean | `false` | Apply deletions from `_delete.txt` |
| `refresh` | boolean | `false` | Force re-fetch of cached remote templates |
| `list-unknown` | boolean | `false` | Include target-only files in `awa diff` output |

## Presets

Define named bundles of feature flags in `[presets]`:

```toml
[presets]
full = ["copilot", "claude", "cursor", "windsurf"]
lite = ["copilot", "claude"]
```

Use presets from the CLI:

```bash
awa generate . --preset full
awa generate . --preset full --remove-features windsurf
```

## Override with CLI

CLI arguments take precedence over config file values:

```bash
# Even if .awa.toml has force = false, this will force overwrite
awa generate . --force

# Even if .awa.toml has features = ["copilot"], this replaces it
awa generate . --features claude cursor
```

## Config File Location

```bash
# Default: .awa.toml in current directory
awa generate .

# Custom path
awa generate . --config ./configs/my-project.toml
```

## Example Configurations

### Minimal

```toml
output = ".github/agents"
features = ["copilot"]
```

### With Remote Template

```toml
output = ".github/agents"
template = "myorg/awa-templates"
features = ["copilot", "claude", "cursor"]
```

### With Presets and Deletion

```toml
output = ".github/agents"
template = "myorg/awa-templates"
delete = true

[presets]
full = ["copilot", "claude", "cursor", "windsurf"]
```
