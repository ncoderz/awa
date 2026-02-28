# Template Testing

CODE: TTST

## Problem

Template authors have no way to verify templates produce valid output across feature flag combinations. A typo in a conditional could produce broken output for specific flags. No CI story for template repos.

## Motivation

Templates are the core artifact in awa. They produce agent configuration files based on feature flags. Without automated testing, template authors rely on manual verification — generating output for each feature combination and visually inspecting results. This is error-prone and doesn't scale.

A testing command enables:
- Confidence that templates produce expected output for all feature flag combinations
- CI pipelines that catch template regressions automatically
- Snapshot-based comparison to detect unintended changes

## Key Scenarios

- Template author defines `_tests/full.toml` with `features = ["a", "b", "c"]`
- `awa test` renders for each fixture, checks expected files exist
- Snapshot mode: compare rendered output against stored snapshots
- CI usage: `awa test --template ./templates/awa` in GitHub Actions
