# Design Specification

## Overview

This design implements the `init` top-level convenience command that delegates to the same handler as `template generate`. The change is purely additive: a separate `init` command on the root program configured with the same options via a shared helper, plus a non-blocking config hint in the generate command handler.

## Architecture

AFFECTED LAYERS: CLI Layer

### High-Level Architecture

`init` is registered as a top-level command on the root program, sharing the same handler as `template generate`. No new handler, no new pipeline.

```mermaid
flowchart LR
    Init["awa init"] --> Generate["generateCommand handler"]
    TemplateGen["awa template generate"] --> Generate
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
│   └── index.ts         # configureGenerateCommand helper applied to both template generate and top-level init
└── commands/
    └── generate.ts      # Add config-not-found hint after config load
```

### Architectural Decisions

- SHARED HELPER OVER ALIAS: A `configureGenerateCommand` helper applies the same options and action to both `template generate` and top-level `init`. This avoids commander alias nesting limitations and keeps init at the root level. Alternatives: commander `.alias()` (only works within same parent), separate command definition (duplication risk), shell wrapper (fragile)
- HINT IN HANDLER NOT LOADER: The config hint belongs in `generateCommand`, not the config loader. The loader's responsibility is loading; surfacing UX hints is the handler's concern. Alternatives: loader emits hint (mixed concerns)

## Components and Interfaces

### INIT-ConfigHint

After config loading in `generateCommand`, if no config file was found (loader returned `null`) and no `--config` path was provided, logs a non-blocking info-level hint.

IMPLEMENTS: CHK-1_AC-2, CHK-1_AC-3, CHK-5_AC-2, CHK-5_AC-3, INIT-5_AC-1, JSON-1_AC-1, JSON-5_AC-1, JSON-6_AC-1, JSON-7_AC-1, JSON-8_AC-1, MULTI-6_AC-1, MULTI-10_AC-1, OVL-2_AC-1

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

- INIT_P-1 [Alias Transparency]: `awa init <args>` and `awa template generate <args>` invoke the same handler with identical resolved options
  VALIDATES: INIT-3_AC-1

- INIT_P-2 [Hint Non-Blocking]: Config hint is logged at info level only; it never throws or calls `process.exit`
  VALIDATES: INIT-5_AC-1

## Error Handling

### Strategy

No new error cases introduced. Alias registration and hint logging are non-throwing operations.

PRINCIPLES:

- Alias registration uses a shared helper function — no custom error paths needed
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

### REQ-CHK-check.md

- CHK-1_AC-2 → INIT-ConfigHint
- CHK-1_AC-3 → INIT-ConfigHint
- CHK-5_AC-2 → INIT-ConfigHint
- CHK-5_AC-3 → INIT-ConfigHint

### REQ-INIT-init-alias.md

- INIT-5_AC-1 → INIT-ConfigHint (INIT_P-2)

### REQ-JSON-json-output.md

- JSON-1_AC-1 → INIT-ConfigHint
- JSON-5_AC-1 → INIT-ConfigHint
- JSON-6_AC-1 → INIT-ConfigHint
- JSON-7_AC-1 → INIT-ConfigHint
- JSON-8_AC-1 → INIT-ConfigHint

### REQ-MULTI-multi-target.md

- MULTI-6_AC-1 → INIT-ConfigHint
- MULTI-10_AC-1 → INIT-ConfigHint

### REQ-OVL-overlays.md

- OVL-2_AC-1 → INIT-ConfigHint
