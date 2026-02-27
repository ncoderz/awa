# Feature Presets [INFORMATIVE]

## Problem

Teams and developers often use the same combination of feature flags across runs — for example, always enabling `copilot`, `claude`, and a set of workflow features together. Typing these out on every invocation is tedious and error-prone. There is no way to name or bundle feature combinations.

Additionally, developers sometimes need to exclude a specific feature from an otherwise fixed set without redefining the entire list.

## Conceptual Model

Feature presets introduce two complementary mechanisms:

1. PRESETS — named bundles of features defined in the `[presets]` table of `.awa.toml`. Activating a preset adds all its features to the final set. Multiple presets can be activated simultaneously, and their features are merged via set union.

2. REMOVE-FEATURES — a subtraction mechanism that removes specific features from the final computed set, regardless of where they came from (base features, presets, or config).

The FEATURE RESOLUTION ORDER is:

```
final features = (base features ∪ preset features) \ remove-features
```

Where:
- Base features come from `--features` CLI option or `features` config key.
- Preset features come from expanding each activated preset name into its feature list.
- Remove-features come from `--remove-features` CLI option or `remove-features` config key.
- The result is deduplicated (no duplicates in the final set).

Key rules:
- Referencing a non-existent preset name is an error.
- Removing a feature that isn't in the set is silently ignored (no error).
- CLI arrays replace config arrays entirely (standard merge rule).
- Multiple presets are merged via set union.

## Scenarios

### Scenario 1: Defining and using a preset

A team defines presets in `.awa.toml`:
```toml
features = ["architect", "code"]

[presets]
tools = ["copilot", "claude", "cursor"]
full = ["copilot", "claude", "cursor", "windsurf", "gemini"]
```
Running `awa generate . --preset tools` resolves features to `["architect", "code", "copilot", "claude", "cursor"]`.

### Scenario 2: Multiple presets

Running `awa generate . --preset tools --preset full` merges both presets. Since `full` is a superset of `tools`, the result is the union: `["architect", "code", "copilot", "claude", "cursor", "windsurf", "gemini"]`.

### Scenario 3: Removing a feature

A developer normally uses the `full` preset but wants to exclude `windsurf` for this run:
```bash
awa generate . --preset full --remove-features windsurf
```
The final features include everything from `full` except `windsurf`.

### Scenario 4: Removing a non-existent feature

Running `--remove-features nonexistent` does not cause an error. The removal is silently ignored since `nonexistent` is not in the feature set.

### Scenario 5: Invalid preset reference

Running `awa generate . --preset typo` when `typo` is not defined in the `[presets]` table produces an error and exits. The developer sees which preset name was not found.

### Scenario 6: Deduplication

Base features and preset features overlap (both include `copilot`). The final feature set contains `copilot` exactly once.

### Scenario 7: Config-level presets

A team sets `preset = ["tools"]` in `.awa.toml` so that the `tools` preset is always active. Developers can override with `--preset full` on the CLI, which replaces (not appends to) the config's preset list.

## Change Log

- 1.0.0 (2026-02-24): Initial feature context derived from code and requirements
- 1.1.0 (2026-02-27): Schema upgrade — replaced bold formatting with CAPITALS
