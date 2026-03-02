# CLI Parameter Consistency

STATUS: done
DIRECTION: lateral

## Context

An audit of all six CLI commands (`template generate`, `template diff`, `template features`, `template test`, `check`, `trace`) plus the `init` alias reveals several parameter inconsistencies in naming, availability, semantics, and description wording. These inconsistencies make the CLI harder to learn and use predictably.

## Findings

### F1: `check` uses `--format json` while all others use `--json` (HIGH)

`check` exposes `--format <format>` accepting `text|json`, while every other data-producing command uses a boolean `--json` flag. Users must remember different syntax for JSON output depending on the command.

Current state:

| Command | JSON output syntax |
|---|---|
| `template generate` | `--json` |
| `template diff` | `--json` |
| `template features` | `--json` |
| `trace` | `--json` |
| `check` | `--format json` |
| `template test` | _(none)_ |

### F2: `--all` has different semantics across commands (MEDIUM)

- `generate`/`diff`: "Process all named targets from config"
- `trace`: "Trace all known IDs in the project"

The same flag name means completely different things. Not a bug since they appear on different commands, but it impedes learnability.

### F3: `test` missing `--refresh` despite using template resolver (HIGH)

`features`, `generate`, and `diff` all expose `--refresh` to re-fetch cached Git templates. `test` also uses `templateResolver.resolve()` but hardcodes `refresh: false` — a user cannot force-refresh templates before running tests.

### F4: `--json` description wording inconsistent (LOW)

- generate/diff/features: "Output results as JSON"
- trace: "Output as JSON"
- check: (uses `--format`)

### F5: `test` has no `--json` output (MEDIUM)

All other data-producing commands offer JSON output. `test` does not, making it impossible to machine-parse test results.

### F6: `features` and `test` missing `--overlay` (MEDIUM)

`generate` and `diff` accept `--overlay <path...>` for template merging. `features` discovers flags from a template — if overlays add features, they won't be discovered. `test` renders templates — if overlays change output, tests can't include them.

### F7: ARCHITECTURE.md references outdated `--ignore` flag (LOW)

The architecture doc says "CLI `--ignore` patterns append to config ignore" but the implementation uses `--spec-ignore` and `--code-ignore` (split into two commands). The doc is stale.

### F8: `--summary` only available on `generate`/`diff` (LOW)

Other data-producing commands (`check`, `trace`, `features`, `test`) don't offer a summary mode. The `check` command in particular would benefit — CI pipelines often want a compact pass/fail line.

## Steps

### Phase 1: Add `--json` to `check` (align with other commands)

- [x] Add `--json` boolean flag to `check` command in CLI definition
- [x] Wire `--json` to set `format: 'json'` in `RawCheckOptions`
- [x] Keep `--format` working for backward compatibility but hide it from `--help` output (use commander's `.hideHelp()` on the option)
- [x] When both `--json` and `--format` are provided, `--json` wins
- [x] Update check command help description for `--json`: "Output results as JSON"

### Phase 2: Add `--refresh` to `test` command

- [x] Add `--refresh` option to `template test` in CLI definition
- [x] Add `refresh` field to `RawTestOptions` type
- [x] Pass `refresh` value to `templateResolver.resolve()` call in `test.ts` (currently hardcoded `false`)

### Phase 3: Add `--json` to `test` command

- [x] Add `--json` option to `template test` in CLI definition
- [x] Add `json` field to `RawTestOptions` type
- [x] Add JSON formatting to test reporter (output `TestSuiteResult` as JSON)
- [x] Suppress interactive output (`intro`/`outro`) when `--json` is active

### Phase 4: Add `--overlay` to `features` and `test` commands

- [x] Add `--overlay <path...>` to `template features` CLI definition
- [x] Wire overlay resolution in `features` command before template scanning
- [x] Add `--overlay <path...>` to `template test` CLI definition
- [x] Wire overlay resolution in `test` command before test execution

### Phase 5: Standardize `--json` descriptions

- [x] Standardize all `--json` descriptions to "Output results as JSON"
- [x] For `generate`, keep existing suffix: "Output results as JSON (implies --dry-run)"
- [x] Update `trace` from "Output as JSON" → "Output results as JSON"

### Phase 6: Fix stale ARCHITECTURE.md reference

- [x] Update ARCHITECTURE.md check engine constraints: replace `--ignore` with `--spec-ignore`/`--code-ignore`

### Phase 7: Rename `--all` to `--all-targets` on template commands (BREAKING)

- [x] Rename `--all` to `--all-targets` on `generate`, `init`, and `diff` commands
- [x] Update batch-runner and any code that reads `options.all` for template commands to use `options.allTargets`
- [x] Update `RawCliOptions` type: rename `all` to `allTargets`
- [x] Keep `trace --all` unchanged (its meaning is native to trace)
- [x] Update help descriptions, README, and spec docs to reflect the rename
- [x] Update `.awa.toml` examples if any reference `--all`

### Phase 8: Add `--summary` to `check`, `trace`, `features`, `test`

- [x] Add `--summary` flag to `check` command — output compact one-line pass/fail count
- [x] Add `--summary` flag to `trace` command — output compact one-line chain count
- [x] Add `--summary` flag to `template features` command — output compact one-line feature count
- [x] Add `--summary` flag to `template test` command — output compact one-line pass/fail count
- [x] Use consistent description: "Output compact one-line summary"

### Phase 9: Update specs and tests

- [x] Update REQ-CHK-check.md for `--json` and `--summary` flags
- [x] Update REQ-TTST-template-test.md for `--refresh`, `--json`, `--overlay`, `--summary`
- [x] Update REQ-DISC-feature-discovery.md for `--overlay`, `--summary`
- [x] Update REQ-CLI-cli.md / REQ-TCLI-template-cli.md for `--all-targets` rename
- [x] Update REQ-TRC-trace.md for `--summary`
- [x] Add/update unit tests for all new and changed options
- [x] Run `awa check` to validate traceability

### Phase 10: Update awa templates

The bundled templates document CLI usage and must stay in sync.

- [x] `templates/awa/_partials/awa.usage.md`: replace `--all` with `--all-targets` in generate/diff option tables and examples
- [x] `templates/awa/_partials/awa.usage.md`: replace `--format <format>` with `--json` in check option table
- [x] `templates/awa/_partials/awa.usage.md`: add `--summary` to check, trace, features, test option tables
- [x] `templates/awa/_partials/awa.usage.md`: add `--refresh`, `--overlay` to test option table
- [x] `templates/awa/_partials/awa.usage.md`: add `--overlay`, `--summary` to features option table
- [x] `templates/awa/_partials/awa.usage.md`: standardize `--json` descriptions across all tables
- [x] `templates/awa/_partials/awa.check.md`: replace `awa check --format json` with `awa check --json`
- [x] Run `awa template diff .` to verify templates are consistent with the project

## Risks

- `--format` still works but hidden from help — users reading old docs may wonder why it's not shown (mitigation: keep it working silently, no deprecation warning)
- Adding `--overlay` to `features` and `test` requires threading overlay resolution through those command paths, increasing complexity
- Renaming `--all` to `--all-targets` is a breaking change for template commands (mitigation: semver major or next minor with migration note)
- Adding `--summary` to four more commands requires implementing compact formatters in each reporter

## Dependencies

- Phase 7 (`--all` → `--all-targets`) is a breaking change; coordinate with a version bump

## Completion Criteria

- [x] All commands that produce structured output accept `--json`
- [x] All commands that produce structured output accept `--summary`
- [x] All commands that resolve templates accept `--refresh`
- [x] All commands that resolve templates accept `--overlay`
- [x] `--json` description is consistent across all commands ("Output results as JSON")
- [x] `--format` on `check` hidden from help but still functional
- [x] `--all` renamed to `--all-targets` on template commands; `trace --all` unchanged
- [x] ARCHITECTURE.md matches actual CLI flags
- [x] Bundled awa templates (`_partials/awa.usage.md`, `_partials/awa.check.md`) match actual CLI flags
- [x] All existing tests pass
- [x] `awa check` passes
- [x] `awa template diff .` shows no unintended drift

## Open Questions

- [x] Should `--format` on `check` be deprecated with a warning, or silently kept? — Keep working but hide from `--help` output
- [x] Should `--summary` be extended to `check`, `trace`, `features`, and `test`? — Yes, added as Phase 8
- [x] Is the `--all` semantic overload worth renaming (e.g. `--all-targets` for template commands), accepting a breaking change? — Yes, rename to `--all-targets` on template commands

## References

- CLI: [src/cli/index.ts](src/cli/index.ts)
- Types: [src/types/index.ts](src/types/index.ts)
- Check types: [src/core/check/types.ts](src/core/check/types.ts)
- Trace types: [src/core/trace/types.ts](src/core/trace/types.ts)
- Test types: [src/core/template-test/types.ts](src/core/template-test/types.ts)
- REQ: [.awa/specs/REQ-CLI-cli.md](.awa/specs/REQ-CLI-cli.md)
- REQ: [.awa/specs/REQ-TCLI-template-cli.md](.awa/specs/REQ-TCLI-template-cli.md)
- REQ: [.awa/specs/REQ-CHK-check.md](.awa/specs/REQ-CHK-check.md)
- REQ: [.awa/specs/REQ-TTST-template-test.md](.awa/specs/REQ-TTST-template-test.md)
- REQ: [.awa/specs/REQ-DISC-feature-discovery.md](.awa/specs/REQ-DISC-feature-discovery.md)
- Architecture: [.awa/specs/ARCHITECTURE.md](.awa/specs/ARCHITECTURE.md)
- Template: [templates/awa/_partials/awa.usage.md](templates/awa/_partials/awa.usage.md)
- Template: [templates/awa/_partials/awa.check.md](templates/awa/_partials/awa.check.md)

## Change Log

- 001 (2026-03-02): Initial plan from CLI parameter audit
- 002 (2026-03-02): Resolved open questions — hide `--format` from help, add `--summary` to all commands (Phase 8), rename `--all` to `--all-targets` on template commands (Phase 7)
- 003 (2026-03-02): Added Phase 10 for bundled awa template updates (`awa.usage.md`, `awa.check.md`)
