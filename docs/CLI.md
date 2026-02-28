# awa CLI

## Commands

### `awa init [output]` / `awa generate [output]`

Generate configuration files from templates. `init` and `generate` are aliases — identical behaviour, both equally valid. Quick-start guides use `awa init`; existing `awa generate` scripts continue to work unchanged.

```bash
awa init .                               # current directory, default template
awa init ./my-project                    # specific output directory
awa init . --features copilot claude     # with feature flags
awa init . --preset full                 # with a preset
awa init . --dry-run                     # preview without writing
awa init . --delete                      # apply deletions from _delete.txt
awa generate .                           # works identically
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

### `awa check`

Check traceability chain integrity between code markers and spec files.

Exit code 0 = all markers resolve, 1 = errors found.

```bash
awa check                              # check with defaults
awa check --format json                # JSON output for CI
awa check --ignore "test/**"           # ignore specific paths
awa check --config ./custom.toml       # custom config file
```

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to configuration file |
| `--ignore <pattern...>` | Glob patterns to exclude (repeatable, appends to config) |
| `--format <format>` | Output format: `text` (default) or `json` |

The check command checks:
- **Orphaned markers** — `@awa-impl`, `@awa-test`, `@awa-component` referencing IDs that don't exist in specs
- **Uncovered ACs** — acceptance criteria in specs with no corresponding `@awa-test`
- **Broken cross-refs** — IMPLEMENTS/VALIDATES in design specs pointing to non-existent requirement IDs
- **Invalid ID format** — marker IDs not matching the configured ID pattern
- **Orphaned specs** — spec files with a feature code not referenced by any marker or cross-reference
- **Schema validation** — spec file structure checked against declarative `*.schema.yaml` schema rules (see [SCHEMA_RULES.md](SCHEMA_RULES.md))

### `awa test`

Run template test fixtures to verify expected output.

Exit code 0 = all pass, 1 = failures found.

```bash
awa test                                       # test default template
awa test --template ./templates/awa            # test specific template
awa test --update-snapshots                    # update stored snapshots
```

| Option | Description |
|--------|-------------|
| `-t, --template <source>` | Template source — local path or Git repo |
| `-c, --config <path>` | Path to configuration file |
| `--update-snapshots` | Update stored snapshots with current rendered output |

The test command:
- Discovers fixture files (`*.toml`) in the template's `_tests/` directory
- Renders templates for each fixture with specified features, presets, and remove-features
- Verifies expected files exist in the rendered output
- Compares rendered output against stored snapshots (if snapshot directories exist)
- Reports pass/fail per fixture with failure details

See [Template Testing](TEMPLATE_TESTING.md) for fixture format and CI setup.

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

[check]
spec-globs = [".awa/specs/**/*.md"]
code-globs = ["src/**/*.{ts,js,tsx,jsx}"]
markers = ["@awa-impl", "@awa-test", "@awa-component"]
ignore = ["node_modules/**", "dist/**"]
format = "text"
schema-dir = ".awa/.agent/schemas"
schema-enabled = true
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
8. **Validate** (for `awa check`) — scan code for traceability markers, parse spec files, cross-check, report findings
9. **Test** (for `awa test`) — discover fixtures in `_tests/`, render per fixture, verify expected files, compare snapshots
