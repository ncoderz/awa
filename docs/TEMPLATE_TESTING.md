# Template Testing

`awa test` verifies templates produce expected output across feature flag combinations. It renders templates against test fixtures and checks file existence and optional snapshot matching.

## Fixture Format

Fixtures are TOML files placed in the template's `_tests/` directory. Each file defines a test case.

```toml
features = ["copilot", "claude"]
preset = ["full"]
remove-features = ["vibe"]
expected-files = ["CLAUDE.md", ".github/agents/copilot.agent.md"]
```

| Field | Type | Description |
|-------|------|-------------|
| `features` | `string[]` | Feature flags to enable |
| `preset` | `string[]` | Preset names to expand into features |
| `remove-features` | `string[]` | Features to remove after preset expansion |
| `expected-files` | `string[]` | Files that must exist in rendered output (relative paths) |

All fields are optional. Features are resolved using the same pipeline as `awa generate` (presets expand, then remove-features subtract).

## Running Tests

```bash
# Test the default bundled template
awa test

# Test a specific template
awa test --template ./templates/awa

# Test a Git-hosted template
awa test --template owner/repo
```

## Snapshot Comparison

Snapshots store the full rendered output of a fixture for comparison. Snapshot directories are stored at `_tests/{fixture-name}/` (same name as the TOML file without extension).

```bash
# Update snapshots with current output
awa test --update-snapshots

# Compare against stored snapshots (default)
awa test
```

When `--update-snapshots` is passed, the rendered output replaces the snapshot directory. Without the flag, each rendered file is compared against its snapshot counterpart. Mismatches, missing snapshots, and extra snapshot files are reported as failures.

## CI Usage

Run `awa test` in your CI pipeline to catch template regressions:

```yaml
# GitHub Actions example
- name: Test templates
  run: npx @ncoderz/awa test --template ./templates/awa
```

Exit code 0 means all fixtures pass. Exit code 1 means one or more fixtures failed.

## Directory Convention

The `_tests/` directory follows the underscore convention — directories and files starting with `_` are excluded from template output. This means test fixtures are never included in generated files.

```
templates/awa/
├── _tests/              # Test fixtures (excluded from output)
│   ├── copilot.toml     # Fixture: test with copilot feature
│   ├── claude.toml      # Fixture: test with claude feature
│   └── copilot/         # Optional: snapshot directory for copilot fixture
├── _partials/           # Shared template blocks (excluded from output)
├── CLAUDE.md            # Template file
└── ...
```
