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
awa init . --delete                      # apply deletions from template
awa init . --json                        # JSON output (implies --dry-run)
awa init . --summary                     # compact one-line summary
awa init . --overlay ./my-overrides      # layer custom files over base template
awa init . --overlay ./ov1 --overlay ./ov2  # stack multiple overlays
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
| `--delete` | Enable deletion of files listed for deletion in the template |
| `-c, --config <path>` | Path to configuration file |
| `--refresh` | Force re-fetch of cached Git templates |
| `--all` | Process all named targets from config |
| `--target <name>` | Process a specific named target from config |
| `--overlay <path...>` | Overlay directory paths applied over base template (repeatable) |
| `--json` | Output results as JSON to stdout (implies `--dry-run`) |
| `--summary` | Output compact one-line counts summary |

### `awa diff [target]`

Compare generated template output against an existing target directory.

Exit code 0 = files match, 1 = differences found.

```bash
awa diff .                                # diff against current directory
awa diff ./my-project --template ./tpl    # diff specific target and template
awa diff . --list-unknown                 # include files not in template
awa diff . --watch                        # watch template and re-diff on change
awa diff . --overlay ./my-overrides       # diff against merged template view
awa diff . --json                         # JSON output for CI
awa diff . --summary                      # compact one-line summary
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
| `--all` | Process all named targets from config |
| `--target <name>` | Process a specific named target from config |
| `-w, --watch` | Watch template directory for changes and re-run diff |
| `--overlay <path...>` | Overlay directory paths applied over base template (repeatable) |
| `--json` | Output results as JSON to stdout |
| `--summary` | Output compact one-line counts summary |

### `awa check`

Check traceability chain integrity between code markers and spec files.

Exit code 0 = all markers resolve, 1 = errors found.

```bash
awa check                              # check with defaults
awa check --format json                # JSON output for CI
awa check --code-ignore "test/**"      # ignore specific code paths
awa check --config ./custom.toml       # custom config file
```

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to configuration file |
| `--spec-ignore <pattern...>` | Glob patterns to exclude from spec file scanning |
| `--code-ignore <pattern...>` | Glob patterns to exclude from code file scanning |
| `--format <format>` | Output format: `text` (default) or `json` |
| `--allow-warnings` | Allow warnings without failing (default: warnings are treated as errors) |
| `--spec-only` | Run only spec-level checks (schema and cross-refs); skip code-to-spec traceability |

The check command checks:
- **Orphaned markers** — `@awa-impl`, `@awa-test`, `@awa-component` referencing IDs that don't exist in specs
- **Uncovered ACs** — acceptance criteria in specs with no corresponding `@awa-test`
- **Broken cross-refs** — IMPLEMENTS/VALIDATES in design specs pointing to non-existent requirement IDs
- **Invalid ID format** — marker IDs not matching the configured ID pattern
- **Orphaned specs** — spec files with a feature code not referenced by any marker or cross-reference
- **Schema validation** — spec file structure checked against declarative `*.schema.yaml` schema rules (see [SCHEMA_RULES.md](SCHEMA_RULES.md))

By default, warnings are treated as errors (exit code 1). Use `--allow-warnings` to restore the previous behavior where warnings don't affect the exit code.

> **Note:** `schema-dir`, `schema-enabled`, `ignore-markers`, `allow-warnings`, and `spec-only` are also available as config keys in the `[check]` section of `.awa.toml`. `schema-dir` and `schema-enabled` are config-only (no CLI flags).

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

### `awa features`

Discover feature flags available in a template.

Exit code 0 = success, 1 = error.

```bash
awa features                              # discover flags in default template
awa features --template ./templates/awa   # specific template
awa features --json                       # JSON output
```

| Option | Description |
|--------|-------------|
| `-t, --template <source>` | Template source — local path or Git repo |
| `-c, --config <path>` | Path to configuration file |
| `--refresh` | Force re-fetch of cached Git templates |
| `--json` | Output results as JSON |

The features command:
- Scans all template files (including partials) for `it.features.includes('name')` references
- Lists each discovered feature flag and the files that reference it
- Includes preset definitions from `.awa.toml` if available

Example JSON output from `awa features --json`:

```json
{
  "features": [
    { "name": "copilot", "files": ["CLAUDE.md", "_partials/_header.md"] },
    { "name": "claude", "files": ["CLAUDE.md"] }
  ],
  "presets": {
    "full": ["copilot", "claude", "cursor"]
  },
  "filesScanned": 42
}
```

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
overlay = ["./overlays/company", "./overlays/project"]
refresh = false
delete = false

[targets.claude]
output = "."
features = ["claude", "architect", "code"]

[targets.copilot]
output = "."
features = ["copilot", "code", "vibe"]

[presets]
full = ["copilot", "claude", "cursor", "windsurf", "kilocode", "opencode", "gemini", "roo", "qwen", "codex", "agy", "agents-md"]
lite = ["copilot", "claude"]

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
spec-ignore = []                 # glob patterns to exclude from spec scanning
code-ignore = ["node_modules/**", "dist/**", "vendor/**", "target/**", "build/**", "out/**", ".awa/**"]
ignore-markers = []              # marker IDs to exclude from orphan checks
format = "text"
schema-dir = ".awa/.agent/schemas"
schema-enabled = true            # set to false to disable schema validation
allow-warnings = false           # set to true to allow warnings without failing
spec-only = false                # set to true to skip code-to-spec traceability
# id-pattern = custom regex for ID format validation
# cross-ref-patterns = ["IMPLEMENTS:", "VALIDATES:"]

[update-check]
enabled = true                   # set to false to disable update checks
interval = 86400                 # seconds between checks (default: 1 day)
```

### Update Check

awa periodically checks the npm registry for newer versions and prints a warning after command output when an update is available. The check runs asynchronously and does not slow down CLI startup.

The warning is automatically suppressed when:
- `--json` or `--summary` flags are active
- stdout is not a TTY (e.g. piped output)
- `NO_UPDATE_NOTIFIER=1` environment variable is set

Configure the check interval or disable it entirely in `.awa.toml`:

```toml
[update-check]
enabled = true    # set to false to disable update checks
interval = 86400  # seconds between checks (default: 1 day)
```

The check hits the network at most once per configured interval. Results are cached in `~/.cache/awa/update-check.json`. Network failures are silent — the CLI works identically when offline.

### Using Presets

```bash
awa generate . --preset full
awa generate . --preset full --remove-features agy roo
```

Presets expand into feature flags. `--remove-features` subtracts from the combined set.

### Multi-Target Configuration

Define `[targets.<name>]` sections in `.awa.toml` to generate different agent configurations in a single command:

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

- `--all` and `--target` suppress interactive tool-feature prompting (non-interactive batch mode)
- `--all` ignores the CLI positional `[output]` argument; `--target` allows CLI positional to override the target's output
- `--force`, `--dry-run`, and `--delete` apply globally to all targets when using `--all`
- `--all` requires at least one `[targets.*]` section; errors with `NO_TARGETS` otherwise
- `--target <name>` errors with `UNKNOWN_TARGET` if the name isn't defined
- `diff --all` exit code: `0` if all targets match, `1` if any target has differences, `2` on error
- Boolean flags (`force`, `dry-run`, `delete`, `refresh`) are NOT per-target — they apply globally from root/CLI

### Feature Resolution Order

1. Start with `--features`
2. Expand `--preset` names (appended, deduplicated)
3. Remove `--remove-features`

## How It Works

1. **Load config** — read `.awa.toml` (if present), merge with CLI arguments
2. **Resolve template** — local path used directly; Git repos fetched via [degit](https://github.com/Rich-Harris/degit) and cached
3. **Apply overlays** — if `--overlay` paths are given, each is resolved and merged on top of the base template (last wins); the merged temp directory is passed to the engine instead of the base template
4. **Resolve features** — combine `--features`, expand `--preset`, subtract `--remove-features`
5. **Render** — walk template directory, render each file with Eta passing `{ features }` as context
6. **Write** — create output files, prompt on conflicts (or `--force`/`--dry-run`), process `_delete.txt`
7. **Delete** — apply delete list entries only when `--delete` (or `delete = true` in config) is set
8. **Diff** (for `awa diff`) — render to a temp directory, compare against target, report unified diffs
9. **Validate** (for `awa check`) — scan code for traceability markers, parse spec files, cross-check, report findings
10. **Test** (for `awa test`) — discover fixtures in `_tests/`, render per fixture, verify expected files, compare snapshots

## CI Integration

Use `--json` to get structured output for CI pipelines. JSON is written to stdout; errors to stderr.

### Diff in CI

```bash
# Check for template drift — exit code 1 means differences found
awa diff . --json > diff-result.json
```

Example JSON output from `awa diff . --json`:

```json
{
  "diffs": [
    { "path": "file.md", "status": "modified", "diff": "--- a/file.md\n+++ b/file.md\n..." },
    { "path": "new-file.md", "status": "new" },
    { "path": "same.md", "status": "identical" }
  ],
  "counts": {
    "changed": 1,
    "new": 1,
    "matching": 1,
    "deleted": 0
  }
}
```

### Generate Preview in CI

```bash
# Preview what would be generated — --json implies --dry-run
awa generate . --json > generate-result.json
```

Example JSON output from `awa generate . --json`:

```json
{
  "actions": [
    { "type": "create", "path": ".github/agents/copilot.agent.md" },
    { "type": "overwrite", "path": ".github/agents/shared.agent.md" },
    { "type": "skip-equal", "path": ".github/agents/rules.agent.md" }
  ],
  "counts": {
    "created": 1,
    "overwritten": 1,
    "skipped": 1,
    "deleted": 0
  }
}
```

### Summary Output

Use `--summary` for a compact one-line output in build logs:

```bash
awa diff . --summary
# Output: changed: 2, new: 1, matching: 10, deleted: 0

awa generate . --summary
# Output: created: 3, overwritten: 1, skipped: 2, deleted: 0
```
