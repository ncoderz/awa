# Requirements: Template Testing

## TTST: Template Testing Requirements

### TTST-1: Fixture Discovery [MUST]

The `awa test` command SHALL discover fixture files in the template's `_tests/` directory.

ACCEPTANCE CRITERIA

- [x] TTST-1_AC-1 [event]: WHEN `awa test` is invoked with a template path THEN all `*.toml` files in the template's `_tests/` directory are discovered and loaded

### TTST-2: Fixture Format [MUST]

Each fixture SHALL be a TOML file specifying features, presets, remove-features, and expected output files.

ACCEPTANCE CRITERIA

- [x] TTST-2_AC-1 [event]: WHEN a fixture TOML file is parsed THEN features, presets, remove-features, and expected-files arrays are extracted

### TTST-3: Template Rendering [MUST]

The test command SHALL render templates for each fixture using the existing generator.

ACCEPTANCE CRITERIA

- [x] TTST-3_AC-1 [event]: WHEN a fixture specifies features THEN templates are rendered to a temporary directory with those features applied

### TTST-4: File Existence Assertion [MUST]

The test command SHALL verify that expected files exist in the rendered output.

ACCEPTANCE CRITERIA

- [x] TTST-4_AC-1 [event]: WHEN a fixture specifies expected-files THEN each file's existence in the rendered output is verified and missing files are reported as failures

### TTST-5: Snapshot Comparison [SHOULD]

The test command SHALL support snapshot comparison with `--update-snapshots` to refresh stored snapshots.

ACCEPTANCE CRITERIA

- [x] TTST-5_AC-1 [event]: WHEN `--update-snapshots` is passed THEN rendered output is saved as the new snapshot; WHEN comparing without the flag THEN rendered output is compared against stored snapshots in `_tests/{name}/` directories

### TTST-6: Test Reporting [MUST]

The test command SHALL report pass/fail per fixture with details.

ACCEPTANCE CRITERIA

- [x] TTST-6_AC-1 [event]: WHEN test execution completes THEN a summary is displayed showing pass/fail status per fixture with failure details

### TTST-7: Exit Code [MUST]

The test command SHALL exit with code 0 when all tests pass and code 1 when any test fails.

ACCEPTANCE CRITERIA

- [x] TTST-7_AC-1 [ubiquitous]: The test command SHALL return exit code 0 when all fixtures pass and exit code 1 when any fixture fails

### TTST-8: Test Directory Exclusion [MUST]

The `_tests/` directory SHALL be excluded from template output following the underscore convention.

ACCEPTANCE CRITERIA

- [x] TTST-8_AC-1 [ubiquitous]: The `_tests/` directory SHALL be excluded from generated output because directories starting with underscore are already excluded by the file walker
