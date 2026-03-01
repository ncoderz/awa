# Feature Discovery [INFORMATIVE]

## Problem

When looking at a template set, it is not obvious what feature flags are available. Users must read through Eta conditionals in template source files to find `it.features.includes('something')` patterns. There is no way to ask "what flags does this template support?" without manually inspecting every file.

New adopters and template authors both need a quick way to enumerate the available flags and understand which files each flag affects.

## Conceptual Model

`awa template features` is a discovery command that scans a resolved template directory for feature flag references. It walks all template files, extracts `it.features.includes(...)` and `it.features.indexOf(...)` patterns, and produces a deduplicated, sorted list of flags with the files that reference them.

Key abstractions:
- FEATURE FLAG: A string identifier found inside `it.features.includes('name')` or `it.features.indexOf('name')` in template files
- SCAN RESULT: The aggregated output containing discovered flags, their referencing files, and total files scanned
- PRESET: A named bundle of feature flags defined in the user's `.awa.toml` config

The command reuses the same template resolution as `generate` and `diff`, so it works with local paths, remote Git repositories, and configured defaults.

## Scenarios

### Scenario 1: Discovering flags in the default template

A new user has configured `.awa.toml` with a template path. They run `awa template features` and see a table of all available flags, each with a list of template files that reference it.

### Scenario 2: Inspecting a remote template

A developer evaluates a third-party template before adopting it. They run `awa template features --template owner/repo` to see what flags the template supports, without cloning or generating any files.

### Scenario 3: Machine-readable output

A CI script needs to verify that all expected flags exist in a template. It runs `awa template features --json` and parses the JSON output to validate completeness.

### Scenario 4: Viewing presets alongside flags

A developer has presets defined in `.awa.toml`. Running `awa template features` shows both the discovered flags and the configured presets, making it easy to see which flags each preset activates.

## Glossary

- FEATURE FLAG: A string identifier that enables conditional template content
- PRESET: A named group of feature flags defined in `.awa.toml`
- TEMPLATE RESOLUTION: The process of locating and caching a template from a local path or Git URL

## Change Log

- 1.0.0 (2026-02-28): Initial feature context
