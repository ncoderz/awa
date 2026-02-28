# Design Specification

## Overview

This design implements the `init` alias for the `generate` command. The change is purely additive: one `.alias('init')` call on the generate commander definition, plus a non-blocking config hint in the generate command handler.

## Architecture

AFFECTED LAYERS: CLI Layer

### High-Level Architecture

`init` is registered as a commander alias on the existing `generate` command. No new handler, no new pipeline.

```mermaid
flowchart LR
    Init["awa init"] --> Generate["awa generate handler"]
    Generate --> ConfigLoader
    ConfigLoader -->|null| Hint["Config hint (info)"]
    ConfigLoader -->|FileConfig| Merge
    Hint --> Merge
    Merge --> Run["generateCommand"]
```

### Module Organization

```
src/
├── cli/
│   └── index.ts         # Add .alias('init') to generate command
└── commands/
    └── generate.ts      # Add config-not-found hint after config load
```

### Architectural Decisions

- ALIAS OVER DUPLICATE: Commander `.alias()` shares the exact handler. No code duplication, no risk of divergence. Alternatives: separate command definition (duplication risk), shell wrapper (fragile)
- HINT IN HANDLER NOT LOADER: The config hint belongs in `generateCommand`, not the config loader. The loader's responsibility is loading; surfacing UX hints is the handler's concern. Alternatives: loader emits hint (mixed concerns)

## Components and Interfaces

### INIT-AliasRegistration

Registers `init` as an alias for the `generate` command using commander's `.alias()` API. No additional handler is needed — the existing generate handler is reused automatically.

IMPLEMENTS: INIT-1_AC-1, INIT-2_AC-1, INIT-3_AC-1, INIT-4_AC-1

```typescript
program
  .command('generate')
  .alias('init')
  // ... existing options and action unchanged
```

### INIT-ConfigHint

After config loading in `generateCommand`, if no config file was found (loader returned `null`) and no `--config` path was provided, logs a non-blocking info-level hint.

IMPLEMENTS: INIT-5_AC-1

```typescript
if (!cliOptions.config && fileConfig === null) {
  logger.info('Tip: create .awa.toml to save your options for next time.');
}
```

## Data Models

### Core Types

No new types. Uses existing types from `src/types/index.ts`.

- RAW_CLI_OPTIONS: Existing type — `config?: string` field used to detect explicit `--config` flag
- FILE_CONFIG: Existing type — `null` return from `configLoader.load()` signals no config file found

## Correctness Properties

- INIT_P-1 [Alias Transparency]: `awa init <args>` and `awa generate <args>` invoke the same handler with identical resolved options
  VALIDATES: INIT-3_AC-1

- INIT_P-2 [Hint Non-Blocking]: Config hint is logged at info level only; it never throws or calls `process.exit`
  VALIDATES: INIT-5_AC-1

## Error Handling

### Strategy

No new error cases introduced. Alias registration and hint logging are non-throwing operations.

PRINCIPLES:

- Alias registration uses commander built-in — no custom error paths needed
- Hint is fire-and-forget info log — any logger failure is silent and non-blocking

## Testing Strategy

### Property-Based Testing

- FRAMEWORK: vitest (no fast-check; alias identity is deterministic, not property-based)
- MINIMUM_ITERATIONS: N/A
- TAG_FORMAT: @awa-test: INIT_P-{n}

### Unit Testing

Tests cover: alias invokes the same handler as generate; hint appears when config is null and `--config` absent; hint absent when `--config` provided; hint absent when config file found.

- AREAS: INIT-AliasRegistration handler invocation, INIT-ConfigHint conditional logging

## Requirements Traceability

### REQ-INIT-init-alias.md

- INIT-1_AC-1 → INIT-AliasRegistration (INIT_P-1)
- INIT-2_AC-1 → INIT-AliasRegistration (INIT_P-1)
- INIT-3_AC-1 → INIT-AliasRegistration (INIT_P-1)
- INIT-4_AC-1 → INIT-AliasRegistration
- INIT-5_AC-1 → INIT-ConfigHint (INIT_P-2)

## Change Log

- 1.0.0 (2026-02-28): Initial design for PLAN-001
