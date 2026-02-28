# Update README and Docs for Missing Features

STATUS: complete
DIRECTION: lateral

## Context

The README.md and docs/ files have fallen behind the actual CLI implementation. Several commands, options, and behaviors documented in the architecture and implemented in code are either absent from documentation or under-documented. This plan identifies every gap and provides actionable steps to close them.

## Audit Summary

### README.md Gaps

1. **`awa features` command completely absent** — The CLI has a full `features` subcommand for discovering feature flags in templates (`--json`, `--template`, `--config`, `--refresh` options). README never mentions it.
2. **`awa check` under-documented** — README mentions `awa check` in one bullet and a comparison table cell, but doesn't explain what it does, its options, or link to the dedicated doc page except in the Documentation table.
3. **`awa test` under-documented** — Same issue: one bullet mention, no explanation or examples.
4. **Schema validation not mentioned** — `awa check` validates spec file structure via declarative YAML schema rules. Not mentioned in README at all.
5. **`--allow-warnings` flag missing** — The check command's `--allow-warnings` behavior (warnings treated as errors by default) is not in README or any doc page.
6. **`ignore-markers` config option undocumented** — Code implements `ignoreMarkers` in check config but it's not documented in TRACEABILITY_CHECK.md or CLI.md.
7. **`--watch` flag for diff not prominent** — `awa diff --watch` is documented only in CLI.md's option table, but not in the README's Quick Start or feature list.
8. **`--overlay` only in feature bullet** — README mentions overlays as a feature bullet but the Quick Start section has no overlay example.
9. **Quick Start is generate-only** — No quick-start examples for `awa check`, `awa test`, `awa diff --watch`, or `awa features`.
10. **CI section missing from README** — CLI.md has a full CI Integration section with JSON/summary examples; README has nothing about CI usage.
11. **Exit codes not documented in README** — Each command has distinct exit codes (0/1/2); not summarized anywhere in README.
12. **No "Getting Started with the Workflow" section** — README explains the workflow concept but doesn't show a practical getting-started flow (e.g., "run `awa init .`, then create your first FEAT doc...").
13. **Development section is stale** — Missing `npm run check` (which runs `awa check`), and `npm run diff:awa:this` is listed as `diff:awa`.
14. **`delete` config option not in README examples** — `.awa.toml` example in CLI.md shows `delete = false` but README's Quick Start only shows `--delete` as a CLI flag.

### docs/CLI.md Gaps

15. **`awa features` command not documented** — Complete omission of the `features` subcommand.
16. **`--allow-warnings` for check not documented** — The flag exists in the CLI definition but CLI.md's check options table omits it.
17. **`allow-warnings` config key not documented** — Available in `[check]` TOML section, not in CLI.md config reference.
18. **`ignore-markers` config key not documented** — Available in `[check]` TOML section, not in CLI.md config reference.
19. **`schema-enabled` and `schema-dir` missing from check options table** — Both are in the config example but not in the check command's CLI options table (they're config-only, which should be noted).
20. **Feature Resolution Order section has no anchor** — Standalone heading exists but it's buried with no cross-link from README.

### docs/TRACEABILITY_CHECK.md Gaps

21. **`--allow-warnings` flag missing** — Not documented in usage examples or options table.
22. **`allow-warnings` config key missing** — Not in configuration options table.
23. **`ignore-markers` config key missing** — Not in configuration options table.
24. **Finding codes incomplete** — Code defines `marker-trailing-text`, `schema-no-rule`, `schema-line-limit` finding codes not listed in docs.
25. **Warnings-are-errors default behavior not documented** — The default behavior change (warnings = errors unless `--allow-warnings`) is not explained.

### docs/TEMPLATE_ENGINE.md Gaps

26. **No major gaps identified** — This doc is comprehensive and current.

### docs/TEMPLATE_TESTING.md Gaps

27. **No major gaps identified** — This doc is comprehensive and current.

### docs/SCHEMA_RULES.md Gaps

28. **`when` conditional rules are documented** — Good coverage.
29. **`line-limit` finding code not mentioned** — The `schema-line-limit` finding code isn't listed as a possible output.
30. **`schema-no-rule` finding code not mentioned** — Files matching no schema rule can produce this code; not listed.

### docs/WORKFLOW.md Gaps

31. **`awa features` not mentioned in prompt examples** — Prompt examples section could include feature discovery examples.
32. **Examples (EXAMPLES-{CODE}-*.md) mentioned in directory but not in Stages table** — The Stages table lists 7 stages but Examples artifact isn't mentioned in any stage row.
33. **Plans/Align not in Stages table** — Plans and alignment reports are in the directory listing but not in the workflow stages table (arguably correct since they're lateral, but could be noted).

### Cross-Cutting Gaps

34. **No SCHEMA_RULES.md link in README Documentation table** — The table has 5 docs but SCHEMA_RULES.md is only linked from TRACEABILITY_CHECK.md.
35. **Website content not audited** — website/src/content/ may have its own gaps but is out of scope for this plan.

## Steps

### Phase 1: README.md Updates

- [x] Add `awa features` to the Features section with a brief description
- [x] Expand `awa check` coverage: brief explanation + example + link
- [x] Expand `awa test` coverage: brief explanation + example + link
- [x] Add Quick Start sections for `check`, `test`, `features`, and `diff --watch`
- [x] Add a CI Integration section (or "CI Usage" subsection) with `--json` and `--summary` examples
- [x] Add exit codes summary table covering all commands
- [x] Add SCHEMA_RULES.md to the Documentation table
- [x] Update Development Scripts table to match current `package.json` scripts
- [x] Add overlay example to Quick Start or expand the features bullet

### Phase 2: docs/CLI.md Updates

- [x] Add `awa features` command section with options table, examples, and JSON output format
- [x] Add `--allow-warnings` to the `awa check` options table
- [x] Add `allow-warnings`, `ignore-markers`, `schema-dir`, `schema-enabled` to the config reference with notes on config-only vs CLI-available
- [x] Note that `schema-dir` and `schema-enabled` are config-only (no CLI flags)

### Phase 3: docs/TRACEABILITY_CHECK.md Updates

- [x] Add `--allow-warnings` flag to usage examples and options
- [x] Add `allow-warnings` and `ignore-markers` to the configuration options table
- [x] Document the warnings-are-errors default behavior (and how to opt out)
- [x] Add missing finding codes: `marker-trailing-text`, `schema-no-rule`, `schema-line-limit`

### Phase 4: docs/SCHEMA_RULES.md Updates

- [x] Add `schema-no-rule` and `schema-line-limit` as possible finding codes in an output section (already present)

### Phase 5: docs/WORKFLOW.md Updates

- [x] Add `awa features` to prompt examples section
- [x] Add note about Examples artifact in Stages table or directory section

### Phase 6: Verify

- [x] Run `awa diff` to confirm generated templates still match (0 differences)
- [x] Cross-check README Documentation table links all work (6 docs linked)
- [x] Verify all CLI options from `awa --help` / `awa <cmd> --help` are documented

## Risks

- README may exceed reasonable length if all gaps are filled inline; may need to keep it concise with "see docs" links
- Docs changes may conflict with any in-flight feature branches
- `ignore-markers` may be an internal/undocumented-by-design option — verify intent before documenting

## Dependencies

- None — all features are already implemented

## Completion Criteria

- [x] Every CLI command (`init`/`generate`, `diff`, `check`, `test`, `features`) has at least a brief description and example in README.md
- [x] Every CLI option visible in `awa <cmd> --help` is documented in docs/CLI.md
- [x] Every config key used in code is documented in the relevant docs page
- [x] All finding codes from `FindingCode` type are listed in TRACEABILITY_CHECK.md or SCHEMA_RULES.md
- [x] README Documentation table links to all docs/ pages
- [x] Development Scripts table matches package.json

## Open Questions

- [ ] Should `ignore-markers` be documented publicly, or is it intended as an internal/advanced option? (It's in the `CheckConfig` type and has a default of `[]`.)
- [ ] Should the README Quick Start remain minimal (generate + diff only) or expand to cover all commands? I suggest adding brief sub-sections while keeping each one to 3-5 lines.
- [ ] Should CI Integration live in README.md, in docs/CLI.md, or both? Currently it's only in CLI.md. I suggest a brief README section linking to CLI.md for details.

## References

- ARCH: .awa/specs/ARCHITECTURE.md
- README: README.md
- CLI docs: docs/CLI.md
- Traceability docs: docs/TRACEABILITY_CHECK.md
- Schema docs: docs/SCHEMA_RULES.md
- Template Engine docs: docs/TEMPLATE_ENGINE.md
- Template Testing docs: docs/TEMPLATE_TESTING.md
- Workflow docs: docs/WORKFLOW.md
- CLI source: src/cli/index.ts
- Check types: src/core/check/types.ts
- Features command: src/commands/features.ts
- Features scanner: src/core/features/scanner.ts

## Change Log

- 001 (2026-02-28): Initial plan — thorough audit of README.md and all docs/ files against architecture and source code
- 002 (2026-02-28): Implementation complete — all phases executed, awa diff clean, build + 470 tests pass
