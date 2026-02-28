# Requirements Specification

## Introduction

Requirements for the `awa test` command that verifies template output across feature flag combinations by running fixture-based tests with file existence assertions and snapshot comparison.

## Requirements

### TTST-1: Fixture Discovery [MUST]

AS A template author, I WANT `awa test` to discover fixture files automatically, SO THAT I don't have to manually specify each test case.

The `awa test` command SHALL discover fixture files in the template's `_tests/` directory.

ACCEPTANCE CRITERIA

- [x] TTST-1_AC-1 [event]: WHEN `awa test` is invoked with a template path THEN all `*.toml` files in the template's `_tests/` directory are discovered and loaded

### TTST-2: Fixture Format [MUST]

AS A template author, I WANT fixtures to be TOML files with features and expected files, SO THAT test definitions are consistent with `.awa.toml` config format.

Each fixture SHALL be a TOML file specifying features, presets, remove-features, and expected output files.

ACCEPTANCE CRITERIA

- [x] TTST-2_AC-1 [event]: WHEN a fixture TOML file is parsed THEN features, presets, remove-features, and expected-files arrays are extracted

### TTST-3: Template Rendering [MUST]

AS A template author, I WANT templates rendered per fixture using the same generator as production, SO THAT test behavior matches real generation.

The test command SHALL render templates for each fixture using the existing generator.

ACCEPTANCE CRITERIA

- [x] TTST-3_AC-1 [event]: WHEN a fixture specifies features THEN templates are rendered to a temporary directory with those features applied

### TTST-4: File Existence Assertion [MUST]

AS A template author, I WANT to assert that specific files exist in the output, SO THAT I can verify feature flags produce the expected file set.

The test command SHALL verify that expected files exist in the rendered output.

ACCEPTANCE CRITERIA

- [x] TTST-4_AC-1 [event]: WHEN a fixture specifies expected-files THEN each file's existence in the rendered output is verified and missing files are reported as failures

### TTST-5: Snapshot Comparison [SHOULD]

AS A template author, I WANT to compare rendered output against stored snapshots, SO THAT I can detect unintended changes to template output.

The test command SHALL support snapshot comparison with `--update-snapshots` to refresh stored snapshots.

ACCEPTANCE CRITERIA

- [x] TTST-5_AC-1 [event]: WHEN `--update-snapshots` is passed THEN rendered output is saved as the new snapshot; WHEN comparing without the flag THEN rendered output is compared against stored snapshots in `_tests/{name}/` directories

### TTST-6: Test Reporting [MUST]

AS A template author, I WANT a pass/fail summary per fixture, SO THAT I can quickly identify which test cases failed and why.

The test command SHALL report pass/fail per fixture with details.

ACCEPTANCE CRITERIA

- [x] TTST-6_AC-1 [event]: WHEN test execution completes THEN a summary is displayed showing pass/fail status per fixture with failure details

### TTST-7: Exit Code [MUST]

AS A CI pipeline, I WANT a non-zero exit code on test failures, SO THAT template regressions fail the build.

The test command SHALL exit with code 0 when all tests pass and code 1 when any test fails.

ACCEPTANCE CRITERIA

- [x] TTST-7_AC-1 [ubiquitous]: The test command SHALL return exit code 0 when all fixtures pass and exit code 1 when any fixture fails

### TTST-8: Test Directory Exclusion [MUST]

AS A template author, I WANT the `_tests/` directory excluded from output, SO THAT test fixtures are not included in generated files.

The `_tests/` directory SHALL be excluded from template output following the underscore convention.

ACCEPTANCE CRITERIA

- [x] TTST-8_AC-1 [ubiquitous]: The `_tests/` directory SHALL be excluded from generated output because directories starting with underscore are already excluded by the file walker
