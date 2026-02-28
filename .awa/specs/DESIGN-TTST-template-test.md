# Design: Template Testing

## Components

### TTST-FixtureLoader

Discovers and parses `_tests/*.toml` fixture files from a template directory.

IMPLEMENTS: TTST-1_AC-1, TTST-2_AC-1

INTERFACE

- `discoverFixtures(templatePath: string): Promise<TestFixture[]>` — finds and parses all `_tests/*.toml` files

### TTST-TestRunner

Renders templates per fixture to a temporary directory and runs assertions (file existence, snapshot comparison).

IMPLEMENTS: TTST-3_AC-1, TTST-4_AC-1, TTST-5_AC-1

INTERFACE

- `runFixture(fixture: TestFixture, templatePath: string, options: TestRunOptions): Promise<FixtureResult>` — renders templates for a single fixture and checks assertions
- `runAll(fixtures: TestFixture[], templatePath: string, options: TestRunOptions): Promise<TestSuiteResult>` — runs all fixtures and aggregates results

### TTST-Reporter

Displays pass/fail summary per fixture with failure details.

IMPLEMENTS: TTST-6_AC-1

INTERFACE

- `report(result: TestSuiteResult): void` — prints pass/fail summary to console

### TTST-TestCommand

CLI command handler that orchestrates fixture loading, test execution, and reporting.

IMPLEMENTS: TTST-7_AC-1

INTERFACE

- `testCommand(options: RawTestOptions): Promise<number>` — returns exit code 0 (all pass) or 1 (failures)

## Fixture Format

```toml
features = ["copilot", "claude"]
preset = ["full"]
remove-features = ["vibe"]
expected-files = ["CLAUDE.md", ".github/agents/copilot.agent.md"]
```

Fixtures support `preset` and `remove-features` to test the full feature resolution pipeline.

## Snapshot Convention

Snapshot directories are stored at `_tests/{fixture-name}/` (same name as the fixture TOML file without extension). When `--update-snapshots` is passed, rendered output replaces the snapshot directory. When comparing, each file in the rendered output is compared against its snapshot counterpart.

## Correctness Properties

- TTST_P-1 [Fixture Discovery]: All `.toml` files in `_tests/` are discovered
  VALIDATES: TTST-1_AC-1, TTST-2_AC-1

- TTST_P-2 [Test Execution]: Templates render correctly per fixture and file existence is verified
  VALIDATES: TTST-3_AC-1, TTST-4_AC-1, TTST-8_AC-1

- TTST_P-3 [Exit Code]: Exit code reflects pass/fail results
  VALIDATES: TTST-6_AC-1, TTST-7_AC-1

- TTST_P-4 [Snapshot Comparison]: Snapshots are compared and updated correctly
  VALIDATES: TTST-5_AC-1
