# awa — Agent Workflow for AIs

## What awa Is

awa is a CLI tool and structured development workflow for AI-assisted coding. It generates agent configuration files from templates and defines a spec-driven development process with full traceability from requirements through code and tests.

Key concepts:

- **Templates**: Eta-based templates that produce agent config files (`.github/agents/`, `.claude/`, etc.) with conditional output via feature flags
- **Workflow**: A structured pipeline from architecture through implementation, where every artifact traces to its origin
- **Traceability**: Code markers (`@awa-impl`, `@awa-test`, `@awa-component`) link source code and tests back to requirements and design
- **Validation**: `awa check` verifies that all markers resolve to spec IDs and that spec files conform to YAML schemas

## The `.awa/` Directory

All spec artifacts live in `.awa/`:

    .awa/
    ├── .agent/
    │   ├── awa.core.md                    # Core system prompt (always read first)
    │   └── schemas/
    │       ├── ARCHITECTURE.schema.yaml
    │       ├── FEAT.schema.yaml
    │       ├── EXAMPLES.schema.yaml
    │       ├── REQ.schema.yaml
    │       ├── DESIGN.schema.yaml
    │       ├── API.schema.yaml
    │       ├── TASK.schema.yaml
    │       ├── PLAN.schema.yaml
    │       ├── README.schema.yaml
    │       └── ALIGN_REPORT.schema.yaml
    ├── specs/
    │   ├── ARCHITECTURE.md                # System overview
    │   ├── FEAT-{CODE}-*.md               # Feature context and motivation
    │   ├── EXAMPLES-{CODE}-*-{nnn}.md     # Usage examples per feature
    │   ├── REQ-{CODE}-*.md                # Requirements (EARS format)
    │   ├── DESIGN-{CODE}-*.md             # Design and components
    │   └── API-{CODE}-*.tsp               # TypeSpec API definitions
    ├── tasks/
    │   └── TASK-{CODE}-*-{nnn}.md         # Implementation steps
    ├── plans/
    │   └── PLAN-{nnn}-*.md                # Ad-hoc plans
    ├── align/
    │   └── ALIGN-{x}-WITH-{y}-{nnn}.md   # Alignment reports
    └── rules/
        └── *.md                           # Project-specific rules

## Workflow Stages

    ARCHITECTURE → FEAT → REQUIREMENTS → DESIGN → TASKS → CODE & TESTS → DOCUMENTATION

| Stage | Artifact | Purpose |
|-------|----------|---------|
| Architecture | `ARCHITECTURE.md` | System overview, components, constraints |
| Feature | `FEAT-{CODE}-*.md` | Context, motivation, scenarios |
| Requirements | `REQ-{CODE}-*.md` | What must be built (EARS/INCOSE format) |
| Design | `DESIGN-{CODE}-*.md` | How it gets built — components, interfaces, properties |
| Tasks | `TASK-{CODE}-*-{nnn}.md` | Step-by-step implementation work items |
| Code & Tests | Source files | Implementation with traceability markers |
| Documentation | `README.md`, `docs/` | User-facing docs |

Lateral artifacts (produced at any stage): EXAMPLES, PLAN, ALIGN reports.

The workflow is flexible. Start top-down (architecture → code), bottom-up (code → extract requirements), or lateral (docs, refactors, ad-hoc plans).

## Traceability Chain

IDs and markers create explicit links between artifacts:

    REQ-{CODE}-*.md
      └── {CODE}-{n}: Requirement title
            └── {CODE}-{n}_AC-{m}: Acceptance criterion
                    │
                    ▼
    DESIGN-{CODE}-*.md
      └── {CODE}-ComponentName
            ├── IMPLEMENTS: {CODE}-{n}_AC-{m}
            └── {CODE}_P-{n}: Correctness property
                    │
                    ▼
    Source code
      └── // @awa-component: {CODE}-ComponentName
          └── // @awa-impl: {CODE}-{n}_AC-{m}
                    │
                    ▼
    Tests
      ├── // @awa-test: {CODE}_P-{n}          ← verifies property
      └── // @awa-test: {CODE}-{n}_AC-{m}     ← verifies AC

ID formats:

- `{CODE}-{n}` — requirement (e.g. `DIFF-1`)
- `{CODE}-{n}.{p}` — subrequirement (e.g. `DIFF-1.1`)
- `{CODE}-{n}[.{p}]_AC-{m}` — acceptance criterion (e.g. `DIFF-1_AC-1`)
- `{CODE}_P-{n}` — correctness property (e.g. `DIFF_P-2`)

## CLI Commands

awa may be installed locally. Detect the package manager and use the appropriate exec command:

    npm/npx: npx awa <command>
    yarn:    yarn exec awa <command>
    pnpm:    pnpm exec awa <command>
    bun:     bunx awa <command>

### awa init [output] / awa template generate [output]

Generate configuration files from templates. `init` is a top-level convenience command equivalent to `awa template generate`.

| Option | Description |
|--------|-------------|
| `[output]` | Output directory (positional, optional if set in config) |
| `-t, --template <source>` | Template source — local path or Git repo |
| `-f, --features <flag...>` | Feature flags (repeatable) |
| `--preset <name...>` | Preset names to enable (repeatable) |
| `--remove-features <flag...>` | Feature flags to remove (repeatable) |
| `--force` | Overwrite existing files without prompting |
| `--dry-run` | Preview changes without modifying files |
| `--delete` | Enable deletion of files listed in template |
| `-c, --config <path>` | Path to configuration file |
| `--refresh` | Force re-fetch of cached Git templates |
| `--all` | Process all named targets from config |
| `--target <name>` | Process a specific named target |
| `--overlay <path...>` | Overlay directory paths (repeatable) |
| `--json` | JSON output to stdout (implies --dry-run) |
| `--summary` | Compact one-line counts summary |

### awa template diff [target]

Compare generated template output against an existing target directory. Exit code 0 = match, 1 = differences.

| Option | Description |
|--------|-------------|
| `[target]` | Target directory (positional, optional if set in config) |
| `-t, --template <source>` | Template source — local path or Git repo |
| `-f, --features <flag...>` | Feature flags (repeatable) |
| `--preset <name...>` | Preset names to enable (repeatable) |
| `--remove-features <flag...>` | Feature flags to remove (repeatable) |
| `-c, --config <path>` | Path to configuration file |
| `--refresh` | Force re-fetch of cached Git templates |
| `--list-unknown` | Include files in target not present in templates |
| `--all` | Process all named targets from config |
| `--target <name>` | Process a specific named target |
| `-w, --watch` | Watch template directory and re-diff on change |
| `--overlay <path...>` | Overlay directory paths (repeatable) |
| `--json` | JSON output to stdout |
| `--summary` | Compact one-line counts summary |

### awa check

Check traceability chain integrity and spec schema conformance. Exit code 0 = clean, 1 = errors.

| Option | Description |
|--------|-------------|
| `-c, --config <path>` | Path to configuration file |
| `--ignore <pattern...>` | Glob patterns to exclude (repeatable, appends to config) |
| `--format <format>` | Output format: `text` (default) or `json` |
| `--allow-warnings` | Allow warnings without failing |
| `--spec-only` | Run only spec-level checks; skip code-to-spec traceability |

Checks performed: orphaned markers, uncovered ACs, broken cross-refs, invalid ID format, orphaned specs, schema validation. Config-only options: `schema-dir`, `schema-enabled`, `ignore-markers`, `spec-only`.

### awa trace

Navigate the traceability chain and assemble context from specs, code, and tests. Use this to gather focused context before implementing, refactoring, or reviewing.

    awa trace [ids...] [options]

| Option | Description |
|--------|-------------|
| `[ids...]` | Traceability ID(s) to trace (e.g. `FEAT-1`, `FEAT-1_AC-2`, `FEAT_P-3`) |
| `--all` | Trace all known IDs in the project |
| `--scope <code>` | Limit results to a feature code (e.g. `--scope FEAT`) |
| `--file <path>` | Resolve IDs from a source file's markers — useful to understand a file's spec connections before changing it |
| `--task <path>` | Resolve IDs from a task file |
| `--content` | Output actual file sections instead of locations |
| `--list` | Output file paths only |
| `--direction <dir>` | Traversal direction: `both` (default), `forward`, `reverse` |
| `--depth <n>` | Maximum traversal depth |
| `--no-code` | Exclude source code (spec-only context) |
| `--no-tests` | Exclude test files |
| `--json` | JSON output |
| `-A/-B/-C <n>` | Lines of context after/before/both around a code marker (`--content` only) |

### awa template test

Run template test fixtures. Exit code 0 = all pass, 1 = failures.

| Option | Description |
|--------|-------------|
| `-t, --template <source>` | Template source — local path or Git repo |
| `-c, --config <path>` | Path to configuration file |
| `--update-snapshots` | Update stored snapshots with current output |

Discovers `*.toml` fixtures in `_tests/`, renders per fixture, verifies expected files, compares against snapshots.

### awa template features

Discover feature flags available in a template.

| Option | Description |
|--------|-------------|
| `-t, --template <source>` | Template source — local path or Git repo |
| `-c, --config <path>` | Path to configuration file |
| `--refresh` | Force re-fetch of cached Git templates |
| `--json` | JSON output |

### Global Options

`-v, --version` — display version. `-h, --help` — display help.

## Configuration — `.awa.toml`

Create `.awa.toml` in the project root. CLI arguments always override config values.

    # Root options
    output = ".github/agents"
    template = "owner/repo"
    features = ["copilot", "claude"]
    overlay = ["./overlays/company", "./overlays/project"]
    refresh = false
    delete = false

    # Named presets — expand into feature flags
    [presets]
    full = ["copilot", "claude", "cursor", "windsurf", "kilocode", "opencode", "gemini", "roo", "qwen", "codex", "agy", "agents-md"]
    lite = ["copilot", "claude"]

    # Per-agent targets — generate different configs in one command
    [targets.claude]
    output = "."
    features = ["claude", "architect", "code"]

    [targets.copilot]
    output = "."
    features = ["copilot", "code", "vibe"]

    # Traceability check configuration
    [check]
    spec-globs = [".awa/specs/**/*.md"]
    code-globs = ["src/**/*.{ts,js,tsx,jsx}"]
    markers = ["@awa-impl", "@awa-test", "@awa-component"]
    ignore = ["node_modules/**", "dist/**"]
    ignore-markers = []
    format = "text"
    schema-dir = ".awa/.agent/schemas"
    schema-enabled = true
    allow-warnings = false
    spec-only = false

    # Update check configuration
    [update-check]
    enabled = true        # set to false to disable update checks
    interval = 86400      # seconds between checks (default: 1 day)

Target fields: `output`, `template`, `features`, `preset`, `remove-features`. Boolean flags (`force`, `dry-run`, `delete`, `refresh`) apply globally. Target features replace root features entirely.

Feature resolution order: start with `--features`, expand `--preset` (append, deduplicate), remove `--remove-features`.

Multi-target usage:

    awa template generate --all                  # process all targets
    awa template generate --target claude        # process one target
    awa template diff --all                      # diff all targets

## Template Sources

Templates can be a local path or a Git repository:

- Local path: `./templates/awa`
- GitHub shorthand: `owner/repo`
- Full URL: `https://github.com/owner/repo`
- SSH: `git@github.com:owner/repo`
- With subdirectory: `owner/repo/path/to/templates`
- With ref: `owner/repo#branch`, `owner/repo#v1.0.0`

Git templates are cached in `~/.cache/awa/templates/`. Use `--refresh` to re-fetch.

## Exit Codes

| Command | 0 | 1 | 2 |
|---------|---|---|---|
| `awa init` / `awa template generate` | Success | — | Internal error |
| `awa template diff` | All files match | Differences found | Internal error |
| `awa check` | All checks pass | Errors found | Internal error |
| `awa template test` | All fixtures pass | Failures found | Internal error |
| `awa template features` | Success | Error | — |
