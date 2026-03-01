---
title: Configuration
description: Configure awa using .awa.toml or CLI flags.
---

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

# Overlay directory paths applied over base template
overlay = ["./overlays/company", "./overlays/project"]

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

# Update check configuration
[update-check]
enabled = true    # set to false to disable update checks
interval = 86400  # seconds between checks (default: 1 day)
```

## Options Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `output` | string | — | Output directory for generated files |
| `template` | string | bundled default | Template source — local path or Git repo |
| `features` | string[] | `[]` | Feature flags to enable |
| `overlay` | string[] | `[]` | Overlay directory paths applied over base template |
| `force` | boolean | `false` | Overwrite existing files without prompting |
| `dry-run` | boolean | `false` | Preview changes without writing files |
| `delete` | boolean | `false` | Apply deletions from `_delete.txt` |
| `refresh` | boolean | `false` | Force re-fetch of cached remote templates |
| `list-unknown` | boolean | `false` | Include target-only files in `awa template diff` output |

### `[check]` Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `spec-globs` | string[] | *(see example below)* | Glob patterns for spec, task, plan, and align files |
| `code-globs` | string[] | `["**/*.{ts,js,...,zig}"]` | Glob patterns for source files |
| `markers` | string[] | `["@awa-impl", "@awa-test", "@awa-component"]` | Marker names to scan for |
| `spec-ignore` | string[] | `[]` | Glob patterns to exclude from spec file scanning |
| `code-ignore` | string[] | `["node_modules/**", "dist/**", ...]` | Glob patterns to exclude from code file scanning |
| `ignore-markers` | string[] | `[]` | Marker IDs to exclude from orphan checks |
| `format` | string | `"text"` | Output format (`text` or `json`) |
| `id-pattern` | string | *(regex)* | Regex for valid traceability IDs |
| `cross-ref-patterns` | string[] | `["IMPLEMENTS:", "VALIDATES:"]` | Keywords for spec cross-references |
| `schema-dir` | string | `".awa/.agent/schemas"` | Directory containing `*.schema.yaml` schema rule files |
| `schema-enabled` | boolean | `true` | Enable/disable schema structural validation |
| `allow-warnings` | boolean | `false` | Allow warnings without failing (when `false`, warnings are promoted to errors) |
| `spec-only` | boolean | `false` | Run only spec-level checks; skip code-to-spec traceability |

### `[update-check]` Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable automatic update checks |
| `interval` | number | `86400` | Minimum seconds between checks (default: 1 day) |

awa periodically checks the npm registry for newer versions and prints a warning after command output. The check runs asynchronously and does not slow down CLI startup.

The warning is suppressed when `--json` or `--summary` flags are active, stdout is not a TTY, or the `NO_UPDATE_NOTIFIER=1` environment variable is set.

Results are cached in `~/.cache/awa/update-check.json`. Network failures are silent.

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

## Multi-Target Configuration

Define `[targets.<name>]` sections to generate different agent configurations in a single command:

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

Each target section can specify: `output`, `template`, `features`, `preset`, `remove-features`. Unspecified fields inherit from the root config. Target `features` replaces root `features` entirely (same as CLI override behavior).

```bash
awa generate --all                   # process all targets
awa generate --target claude         # process one target
awa diff --all                       # diff all targets
awa diff --target copilot            # diff one target
```

**Behavior notes:**

- `--all` and `--target` suppress interactive prompting (non-interactive batch mode)
- `--all` ignores the CLI positional `[output]` argument; `--target` allows CLI positional to override
- `--force`, `--dry-run`, and `--delete` apply globally to all targets when using `--all`
- Boolean flags (`force`, `dry-run`, `delete`, `refresh`) are NOT per-target — they apply globally from root/CLI

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

[check]
spec-globs = [
  ".awa/specs/ARCHITECTURE.md",
  ".awa/specs/FEAT-*.md",
  ".awa/specs/REQ-*.md",
  ".awa/specs/DESIGN-*.md",
  ".awa/specs/EXAMPLES-*.md",
  ".awa/specs/API-*.tsp",
  ".awa/tasks/TASK-*.md",
  ".awa/plans/PLAN-*.md",
  ".awa/align/ALIGN-*.md",
]
code-globs = ["**/*.{ts,js,tsx,jsx,mts,mjs,cjs,py,go,rs,java,kt,kts,cs,c,h,cpp,cc,cxx,hpp,hxx,swift,rb,php,scala,ex,exs,dart,lua,zig}"]
markers = ["@awa-impl", "@awa-test", "@awa-component"]
spec-ignore = []
code-ignore = ["node_modules/**", "dist/**", "vendor/**", "target/**", "build/**", "out/**", ".awa/**"]
ignore-markers = []
format = "text"
schema-dir = ".awa/.agent/schemas"
schema-enabled = true
allow-warnings = false
spec-only = false

[update-check]
enabled = true
interval = 86400
```

### With Overlays

```toml
output = ".github/agents"
template = "myorg/awa-templates"
overlay = ["./overlays/company", "./overlays/project"]
features = ["copilot", "claude"]
```

### With Multi-Target

```toml
template = "./templates/awa"
features = ["architect", "code"]

[targets.claude]
output = "."
features = ["claude", "architect", "code"]

[targets.copilot]
output = "."
features = ["copilot", "code", "vibe"]

[presets]
full = ["copilot", "claude", "cursor", "windsurf"]
```
