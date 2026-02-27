# PLAN-001: `awa init` — Alias for Generate + First-Run UX

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — extends existing generate command

## Problem

`awa generate` is the correct verb for template authors, but new users expect `awa init` as the entry point. The word "generate" implies creating something new; "init" implies setting up, which is what most users are doing.

## Goal

Add `init` as an alias for `generate`. Same command, same options, same behavior. Optionally improve first-run UX when no `.awa.toml` exists.

## Workflow Steps

### 1. FEAT

Create `FEAT-INIT-init-alias.md` — user-friendly entry point, idiomatic CLI naming.

Key scenarios:
- `awa init .` — same as `awa generate .`
- `awa init . --features copilot claude` — same options
- Both `init` and `generate` appear in help output
- First-run: if no `.awa.toml` exists, suggest creating one (non-blocking message)

### 2. REQUIREMENTS

Create `REQ-INIT-init-alias.md`:

- INIT-1: CLI registers `init` as an alias for the `generate` command
- INIT-2: `init` accepts all options that `generate` accepts
- INIT-3: `init` and `generate` produce identical behavior
- INIT-4: Help output shows both commands
- INIT-5: When no `.awa.toml` is found and not using `--config`, display a hint suggesting config creation (non-blocking, info-level)

### 3. DESIGN

Create `DESIGN-INIT-init-alias.md`:

- INIT-AliasRegistration: Commander `.alias('init')` on the generate command
- INIT-ConfigHint: After config loading, if no config file found, log info hint
- Minimal code change — alias is one line; config hint is a few lines in config loader or command handler

### 4. TASKS

- Add `.alias('init')` to generate command in CLI definition
- Add config-not-found info hint (non-blocking)
- Update help text to mention both commands
- Test: `awa init .` produces same output as `awa generate .`
- Test: help shows both commands

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` — document `init` as alias, update Quick Start examples to use `awa init`
- Update `README.md` Quick Start to prefer `awa init .` as primary example
- Website: Update quick-start guide and CLI reference
- Update ARCHITECTURE.md CLI Layer section to mention alias

## Risks

- Minimal — alias is purely additive, no breaking change
- Decision: should `init` be the primary documented command and `generate` the alias? Or both equally visible?

## Completion Criteria

- `awa init .` works identically to `awa generate .`
- Help output shows both commands
- Documentation updated to use `awa init` as the recommended entry point
- `awa generate` still works (not deprecated)
