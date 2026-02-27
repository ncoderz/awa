# PLAN-010: Per-Agent Configuration — Multi-Target Generation

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — extends existing config system

## Problem

`.awa.toml` applies the same feature flags to all output. To give Claude different features than Copilot, users must run `awa generate` multiple times with different flags and output dirs. Tedious and error-prone.

## Goal

Config sections per agent target in `.awa.toml`, with `awa generate --all` processing each section in one command.

## Workflow Steps

### 1. FEAT

Create `FEAT-MULTI-multi-target.md` — multi-agent project configuration, single-command generation.

Key scenarios:
- User defines `[targets.claude]` and `[targets.copilot]` in `.awa.toml`
- `awa generate --all` processes each target section
- `awa generate --target claude` processes only one target
- `awa diff --all` diffs all targets
- Each target can specify: features, output, template, preset, remove-features

### 2. REQUIREMENTS

Create `REQ-MULTI-multi-target.md`:

- MULTI-1: Config file supports `[targets.<name>]` sections
- MULTI-2: Each target section specifies output, features, preset, remove-features, template (all optional; inherit from root)
- MULTI-3: Target sections inherit from root config (target values override root via nullish coalescing, matching existing CLI→file merge semantics)
- MULTI-4: Generate command supports `--all` flag to process all named targets (root-only config is NOT a target; `--all` requires at least one `[targets.*]` section)
- MULTI-5: Generate command supports `--target <name>` to process a specific target
- MULTI-6: Diff command supports `--all` and `--target` identically
- MULTI-7: Without `--all` or `--target`, existing behaviour is unchanged (backward compatible)
- MULTI-8: Results are reported per target with clear labels
- MULTI-9: If a target has no output (and root has no output), error with `MISSING_OUTPUT` for that target, naming the target in the message
- MULTI-10: `--all` and `--target` suppress interactive tool-feature prompting; if a target resolves to no tool features, generation proceeds without prompting (non-interactive batch mode)
- MULTI-11: CLI positional `[output]` is ignored when `--all` is set; when `--target` is set, CLI positional overrides the target's output (consistent with existing CLI-over-file precedence)
- MULTI-12: `diff --all` exit code is `1` if any target has differences, `0` if all identical, `2` on error (first error short-circuits)

### 3. DESIGN

Create `DESIGN-MULTI-multi-target.md`:

- MULTI-TargetResolver: Parse `[targets.*]` sections, merge with root config. Reuses `ConfigLoader.merge()` semantics — target fields replace root (nullish coalescing), never deep-merge arrays
- MULTI-BatchRunner: Iterate targets, invoke generate/diff for each. Skips interactive prompting (`multiselect` in generate command) — batch mode is non-interactive
- MULTI-Reporter: Aggregate and report results per target with `[target-name]` prefix on each log line
- Config example:
  ```toml
  template = "./templates/awa"
  features = ["architect", "code"]

  [targets.claude]
  output = "."
  features = ["claude", "architect", "code"]

  [targets.copilot]
  output = "."
  features = ["copilot", "code", "vibe"]
  ```
- Key decision: target `features` replaces root `features` (consistent with existing CLI override and `ConfigLoader.merge` at config.ts L273)
- Key decision: `[targets.*]` sections only include generation-related fields (output, features, preset, remove-features, template). Boolean flags (force, dry-run, delete, refresh) are NOT per-target — they apply globally from root/CLI
- New ConfigError codes needed: `UNKNOWN_TARGET` (for `--target foo` when `[targets.foo]` doesn't exist), `NO_TARGETS` (for `--all` when no `[targets.*]` sections defined)
- Template caching: if multiple targets share the same template source, resolve once and reuse the cached local path

### 4. TASKS

- Add `targets` to FileConfig type (map of name → partial FileConfig, excluding boolean flags)
- Add `UNKNOWN_TARGET` and `NO_TARGETS` to ConfigError codes union
- Add `--all` and `--target` CLI options to both generate and diff commands
- Create target resolver (merge target config with root, reusing existing merge semantics)
- Create batch runner (iterate targets, invoke existing generate/diff with `nonInteractive: true`)
- Add `nonInteractive` option to suppress multiselect prompt in generate command
- Create per-target reporter (prefix log lines with `[target-name]`)
- Restructure config loader to support nested TOML `[targets.*]` tables (current loader only handles flat keys — requires new nested-table parsing logic, not just adding `targets` to `knownKeys`; shared restructuring with PLAN-002's `[check]` section)
- Validate each target section (same type checks as root, minus boolean flags)
- Template deduplication: resolve shared templates once across targets
- Unit tests for target resolver, merge logic, unknown target error, no-targets error
- Unit tests for non-interactive generate (no prompt when tool features missing)
- Integration tests for multi-target generation
- Integration test for `diff --all` exit code aggregation
- Backward compatibility tests (no targets = existing behavior)

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `--all`, `--target` options and `[targets]` config
- New section in `docs/CLI.md`: "Multi-Target Configuration" with examples
- Update `README.md` features list
- Website: Update CLI reference, configuration guide, add multi-target example
- Update ARCHITECTURE.md with TargetResolver and BatchRunner components

## Prerequisites

- **Fix pre-existing CLI `|| []` bug**: CLI handlers in `src/cli/index.ts` (lines 94-98) use `features: options.features || []`, converting `undefined` to `[]`. In `ConfigLoader.merge()`, `[] ?? file?.features` evaluates to `[]` (empty array is not nullish), silently dropping `.awa.toml` features when `--features` isn't passed on CLI. Same bug exists for `preset` and `removeFeatures`. Fix: remove `|| []` from CLI handlers so `undefined` flows through to merge's nullish coalescing. This must be fixed before PLAN-010 or the target→root merge will inherit the same broken behavior
- Config loader restructuring to support nested TOML tables (shared prerequisite with PLAN-002)

## Cross-Plan Dependencies

- PLAN-009 (json output): If both ship, `--all --json` needs a combined JSON structure wrapping per-target results

## Dependencies

- None — overlays (PLAN-003) are NOT a target option in this plan. Overlay support can be added later as an additive change if PLAN-003 ships first

## Risks

- Config complexity: nested TOML sections add cognitive load
- `--force`/`--dry-run`/`--delete` apply to all targets when using `--all` — document this clearly
- Feature resolution per target: target features replace root features entirely (no merge), then presets expand, then remove-features subtract — order matters, same as existing FeatureResolver.resolve()
- Interactive prompt suppression: users accustomed to the multiselect prompt won't see it in `--all`/`--target` mode — document that batch mode is non-interactive

## Completion Criteria

- `awa generate --all` processes multiple targets from config (non-interactively)
- `awa generate --target claude` processes one target
- `awa diff --all` returns aggregated exit code (0/1/2)
- Each target can have different features and output
- `--all` with no `[targets.*]` errors with `NO_TARGETS`
- `--target foo` with unknown name errors with `UNKNOWN_TARGET`
- Interactive prompt is suppressed in batch mode
- Backward compatible when no targets defined and no `--all`/`--target` flags
- Documentation complete
