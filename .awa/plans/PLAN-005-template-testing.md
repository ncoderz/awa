# PLAN-005: `awa test` — Template Testing

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — no existing specs

## Problem

Template authors have no way to verify templates produce valid output across feature flag combinations. A typo in a conditional could produce broken output for specific flags. No CI story for template repos.

## Goal

`awa test` renders templates against test fixtures (defined feature flag sets) and verifies expected output — file existence, optional snapshot matching.

## Workflow Steps

### 1. FEAT

Create `FEAT-TTST-template-test.md` — template quality assurance, CI for template repos.

Key scenarios:
- Template author defines `_tests/full.toml` with `features = ["a", "b", "c"]`
- `awa test` renders for each fixture, checks expected files exist
- Snapshot mode: compare rendered output against stored snapshots
- CI usage: `awa test --template ./templates/awa` in GitHub Actions

### 2. REQUIREMENTS

Create `REQ-TTST-template-test.md`:

- TTST-1: Test command discovers fixture files in template's `_tests/` directory
- TTST-2: Each fixture is a TOML file specifying features, presets, and expected outputs
- TTST-3: Test command renders templates for each fixture
- TTST-4: Test command verifies expected files exist in rendered output
- TTST-5: Test command supports snapshot comparison (`--update-snapshots` to refresh)
- TTST-6: Test command reports pass/fail per fixture with details
- TTST-7: Exit code 0 = all pass, 1 = failures
- TTST-8: `_tests/` directory excluded from template output (underscore convention)

### 3. DESIGN

Create `DESIGN-TTST-template-test.md`:

- TTST-FixtureLoader: Discover and parse `_tests/*.toml` files
- TTST-TestRunner: Render templates per fixture to temp dir, run assertions
- TTST-SnapshotManager: Compare rendered output against `_tests/{name}/` snapshot dirs
- TTST-Reporter: Pass/fail summary per fixture
- Fixture format:
  ```toml
  features = ["copilot", "claude"]
  preset = ["full"]
  remove-features = ["vibe"]
  expected-files = ["CLAUDE.md", ".github/agents/copilot.agent.md"]
  ```
- Fixtures support `preset` and `remove-features` to test the full feature resolution pipeline (presets expand, then remove-features subtract)

### 4. TASKS

- Define fixture TOML format
- Create fixture loader
- Create test runner (reuses existing generator in temp dir)
- Create file existence assertion
- Create snapshot comparison (optional)
- Add `test` subcommand to CLI
- Support `--template` to test specific template set
- Support `--update-snapshots` flag
- Unit tests for fixture loader, runner
- Create sample fixtures for bundled awa template

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `awa test` command reference
- New doc: `docs/TEMPLATE_TESTING.md` — fixture format, snapshot usage, CI setup
- Update `docs/TEMPLATE_ENGINE.md` with `_tests/` convention
- Update `README.md` features list
- Website: Add test command to CLI reference, new template testing guide
- Update ARCHITECTURE.md with TestRunner component

## Risks

- Snapshot diffs could be noisy for large templates
- Fixture format needs to be simple enough that template authors actually write them
- Temp directory cleanup on test failure

## Completion Criteria

- `awa test` runs fixtures and reports pass/fail
- Snapshot comparison works with `--update-snapshots`
- Sample fixtures for bundled awa template pass
- Documentation complete
