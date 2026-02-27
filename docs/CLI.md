# awa CLI

## Commands

### `awa generate [output]`

Generate configuration files from templates.

```bash
awa generate .                            # current directory, default template
awa generate ./my-project                 # specific output directory
awa generate . --features copilot claude  # with feature flags
awa generate . --preset full              # with a preset
awa generate . --dry-run                  # preview without writing
awa generate . --delete                   # apply deletions from _delete.txt
```

| Option | Description |
|--------|-------------|
| `[output]` | Output directory (positional, optional if set in config) |
| `-t, --template <source>` | Template source — local path or Git repo |
| `-f, --features <flag...>` | Feature flags (repeatable) |
| `--preset <name...>` | Preset names to enable (repeatable) |
| `--remove-features <flag...>` | Feature flags to remove (repeatable) |
| `--force` | Overwrite existing files without prompting |
| `--dry-run` | Preview changes without modifying files |
| `--delete` | Enable deletion of files listed in `_delete.txt` |
| `-c, --config <path>` | Path to configuration file |
| `--refresh` | Force re-fetch of cached Git templates |

### `awa diff [target]`

Compare generated template output against an existing target directory.

Exit code 0 = files match, 1 = differences found.

```bash
awa diff .                                # diff against current directory
awa diff ./my-project --template ./tpl    # diff specific target and template
awa diff . --list-unknown                 # include files not in template
```

| Option | Description |
|--------|-------------|
| `[target]` | Target directory to compare (positional, optional if set in config) |
| `-t, --template <source>` | Template source — local path or Git repo |
| `-f, --features <flag...>` | Feature flags (repeatable) |
| `--preset <name...>` | Preset names to enable (repeatable) |
| `--remove-features <flag...>` | Feature flags to remove (repeatable) |
| `-c, --config <path>` | Path to configuration file |
| `--refresh` | Force re-fetch of cached Git templates |
| `--list-unknown` | Include files in target not present in templates |

### `awa validate`

Validate traceability chain integrity between code markers and spec files.

Exit code 0 = all markers resolve, 1 = errors found.

```bash
awa validate                              # validate with defaults
awa validate --format json                # JSON output for CI
awa validate --ignore "test/**"           # ignore specific paths
awa validate --config ./custom.toml       # custom config file
```

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to configuration file |
| `--ignore <pattern...>` | Glob patterns to exclude (repeatable, appends to config) |
| `--format <format>` | Output format: `text` (default) or `json` |

The validate command checks:
- **Orphaned markers** — `@awa-impl`, `@awa-test`, `@awa-component` referencing IDs that don't exist in specs
- **Uncovered ACs** — acceptance criteria in specs with no corresponding `@awa-test`
- **Broken cross-refs** — IMPLEMENTS/VALIDATES in design specs pointing to non-existent requirement IDs
- **Invalid ID format** — marker IDs not matching the configured ID pattern
- **Orphaned specs** — spec files with a feature code not referenced by any marker or cross-reference

### Global Options

| Option | Description |
|--------|-------------|
| `-v, --version` | Display version number |
| `-h, --help` | Display help information |

## Configuration

Create a `.awa.toml` in your project root. CLI arguments always override config values.

```toml
output = ".github/agents"
template = "owner/repo"
features = ["copilot", "claude"]
refresh = false
delete = false

[presets]
full = ["copilot", "claude", "cursor", "windsurf", "kilocode", "opencode", "gemini", "roo", "qwen", "codex", "agy", "agents-md"]
lite = ["copilot", "claude"]

[validate]
spec-globs = [".awa/specs/**/*.md"]
code-globs = ["src/**/*.{ts,js,tsx,jsx}"]
markers = ["@awa-impl", "@awa-test", "@awa-component"]
ignore = ["node_modules/**", "dist/**"]
format = "text"
# id-pattern = custom regex for ID format validation
# cross-ref-patterns = ["IMPLEMENTS:", "VALIDATES:"]
```

### Using Presets

```bash
awa generate . --preset full
awa generate . --preset full --remove-features agy roo
```

Presets expand into feature flags. `--remove-features` subtracts from the combined set.

### Feature Resolution Order

1. Start with `--features`
2. Expand `--preset` names (appended, deduplicated)
3. Remove `--remove-features`

## How It Works

1. **Load config** — read `.awa.toml` (if present), merge with CLI arguments
2. **Resolve template** — local path used directly; Git repos fetched via [degit](https://github.com/Rich-Harris/degit) and cached
3. **Resolve features** — combine `--features`, expand `--preset`, subtract `--remove-features`
4. **Render** — walk template directory, render each file with Eta passing `{ features }` as context
5. **Write** — create output files, prompt on conflicts (or `--force`/`--dry-run`), process `_delete.txt`
6. **Delete** — apply delete list entries only when `--delete` (or `delete = true` in config) is set
7. **Diff** (for `awa diff`) — render to a temp directory, compare against target, report unified diffs
8. **Validate** (for `awa validate`) — scan code for traceability markers, parse spec files, cross-check, report findings
