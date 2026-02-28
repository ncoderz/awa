# Template Testing [INFORMATIVE]

## Problem

Template authors have no way to verify templates produce valid output across feature flag combinations. A typo in a conditional could produce broken output for specific flags. No CI story for template repos.

Templates are the core artifact in awa. They produce agent configuration files based on feature flags. Without automated testing, template authors rely on manual verification — generating output for each feature combination and visually inspecting results. This is error-prone and doesn't scale.

A testing command enables:
- Confidence that templates produce expected output for all feature flag combinations
- CI pipelines that catch template regressions automatically
- Snapshot-based comparison to detect unintended changes

## Conceptual Model

A fixture is a TOML file that describes a single test scenario: which feature flags to enable, which presets to apply, and what output files to expect. The test command renders templates for each fixture independently, then checks the output against expectations.

Users think of fixtures as "if I ran `awa generate` with these flags, I expect these files." Snapshots extend this by storing the full rendered output so future runs can detect unintended changes.

The testing pipeline reuses the same generator and feature-resolver as `awa generate`, so test behavior matches production behavior exactly.

## Scenarios

### Scenario 1: Basic fixture

A template author defines `_tests/full.toml` with `features = ["a", "b", "c"]` and `expected-files = ["CLAUDE.md"]`. Running `awa test` renders the templates with those features and verifies `CLAUDE.md` exists in the output.

### Scenario 2: Snapshot comparison

After running `awa test --update-snapshots`, the rendered output is saved to `_tests/full/`. On subsequent runs, `awa test` compares the rendered output against the stored snapshot and reports any differences.

### Scenario 3: CI usage

A GitHub Actions workflow runs `awa test --template ./templates/awa`. Exit code 0 means all fixtures pass; exit code 1 fails the workflow, catching template regressions.

### Scenario 4: Feature preset testing

A fixture uses `preset = ["full"]` and `remove-features = ["vibe"]` to test that preset expansion and feature removal work correctly through the same pipeline as generation.

## Change Log

- 1.0.0 (2026-02-28): Initial feature context
- 2.0.0 (2026-02-28): Schema upgrade — added INFORMATIVE marker, Conceptual Model, Scenarios sections
