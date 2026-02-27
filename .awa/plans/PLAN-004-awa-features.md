# PLAN-004: `awa features` — Feature Flag Discovery

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — no existing specs

## Problem

When looking at a template set, it's not obvious what feature flags are available. Users must read through Eta conditionals in template source files to find `it.features.includes('something')`. No way to ask "what flags does this template support?"

## Goal

`awa features` scans templates and lists all available feature flags with the files they affect.

## Workflow Steps

### 1. FEAT

Create `FEAT-DISC-feature-discovery.md` — discoverability problem, target users (new adopters, template authors).

Key scenarios:
- `awa features` — scan default/configured template, list flags
- `awa features --template owner/repo` — scan remote template
- `awa features --template ./local` — scan local template
- Output shows flag name + which files use it

### 2. REQUIREMENTS

Create `REQ-DISC-feature-discovery.md`:

- DISC-1: Features command scans template files for feature flag references
- DISC-2: Features command extracts flag names from `it.features.includes('...')` patterns
- DISC-3: Features command displays each flag with the files that reference it
- DISC-4: Features command works with local and remote template sources
- DISC-5: Features command uses same template resolution as generate/diff
- DISC-6: Features command supports `--json` for machine-readable output
- DISC-7: Features command also lists presets from the user's local `.awa.toml` if available (user's project config, not the template being scanned)

### 3. DESIGN

Create `DESIGN-DISC-feature-discovery.md`:

- DISC-FeatureScanner: Regex scan of template files for `it.features.includes(...)` and `it.features.indexOf(...)` patterns
- DISC-PresetReader: Parse `.awa.toml` for preset definitions
- DISC-Reporter: Format output (table, JSON)
- Architecture: resolve template → scan files → extract flags → report

### 4. TASKS

- Create feature scanner (regex extraction from template files)
- Add `features` subcommand to CLI
- Support `--template` option (reuse template resolver)
- Support `--json` output
- Include preset definitions from config if available
- Unit tests for scanner
- Integration test for features command

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `awa features` command reference
- Update `README.md` features list
- Website: Add features command to CLI reference page
- Update ARCHITECTURE.md mentioning FeatureScanner component

## Risks

- Regex extraction is best-effort — complex Eta expressions might not be caught (acceptable trade-off)
- Template partials may reference flags that aren't reachable from any top-level template

## Completion Criteria

- `awa features` lists all flags found in the template set
- Works with local and remote templates
- JSON output mode works
- Documentation complete
