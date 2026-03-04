# Design Specification

## Overview

This design implements the CLI restructure to group template-related commands (`generate`, `diff`, `features`, `test`) under an `awa template` parent command, while keeping awa-specific commands (`check`, `trace`) and the `init` convenience command at the top level. The restructure uses commander's nested command support via `addCommand()`.

This design references but does not restate the existing CLI-ArgumentParser component from DESIGN-CLI-cli.md. The change is structural — command definitions move under a parent, but option parsing and action handlers remain unchanged.

## Architecture

AFFECTED LAYERS: CLI Layer

### High-Level Architecture

Nested command tree: root program has `init` convenience command, `template` group, `check`, and `trace`. Template group contains `generate`, `diff`, `features`, `test`.

```mermaid
flowchart TB
    Root[awa] --> Init[init]
    Root --> Template[template]
    Root --> Check[check]
    Root --> Trace[trace]
    Template --> Generate[generate]
    Template --> Diff[diff]
    Template --> Features[features]
    Template --> Test[test]
```

### Module Organization

```
src/
├── cli/
│   └── index.ts              # Root program, template group, top-level commands
├── commands/
│   ├── generate.ts           # Generate command handler (unchanged)
│   ├── diff.ts               # Diff command handler (unchanged)
│   ├── features.ts           # Features command handler (unchanged)
│   ├── test.ts               # Test command handler (unchanged)
│   ├── check.ts              # Check command handler (unchanged)
│   └── trace.ts              # Trace command handler (unchanged)
```

### Architectural Decisions

- NESTED COMMANDS OVER FLAT: Commander supports `addCommand()` for nesting. Groups related commands and improves discoverability. Alternatives: flat with prefixed names (e.g. `template-generate`), separate binaries
- CLEAN BREAK OVER ALIASES: No deprecated root-level aliases for old commands (except init convenience). Simpler and avoids ambiguity. Alternatives: keep old commands with deprecation warnings

## Components and Interfaces

### CLI-TemplateGroup

A commander parent command that acts as a namespace for template-related subcommands. Does not have its own action handler — displays help when invoked without a subcommand.

IMPLEMENTS: CFG-5_AC-2, CLI-23_AC-1, CLI-24_AC-1, CLI-25_AC-1, CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-4, CLI-1_AC-5, CLI-2_AC-1, CLI-2_AC-2, CLI-2_AC-3, CLI-2_AC-5, CLI-2_AC-6, CLI-3_AC-1, CLI-4_AC-1, CLI-4_AC-2, CLI-5_AC-1, CLI-6_AC-1, CLI-6_AC-2, CLI-7_AC-1, CLI-8_AC-1, CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2, CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3, CLI-12_AC-1, CLI-13_AC-1, CLI-13_AC-2, CLI-14_AC-1, CLI-14_AC-2, CLI-15_AC-1, CLI-15_AC-2, DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7, DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10, DIFF-7_AC-11, DIFF-7_AC-12, DIFF-7_AC-13, DISC-4_AC-1, DISC-5_AC-1, CFG-8_AC-1, CFG-8_AC-2, CFG-8_AC-4, CFG-10_AC-1, CFG-10_AC-2, CFG-10_AC-3, CFG-10_AC-5, GEN-10_AC-1, GEN-10_AC-2, GEN-13_AC-1, GEN-14_AC-1, GEN-15_AC-1, GEN-16_AC-1, JSON-1_AC-1, JSON-2_AC-1, JSON-5_AC-1, OVL-1_AC-1, OVL-7_AC-1, CLI-41_AC-1, CLI-41_AC-2, CLI-41_AC-3, CLI-41_AC-4, CLI-41_AC-5, CLI-41_AC-6, CLI-41_AC-7, CLI-42_AC-1, CLI-42_AC-2, CLI-43_AC-1, CLI-43_AC-2, CLI-43_AC-3, CLI-43_AC-4, CLI-44_AC-1, CLI-44_AC-2, CLI-45_AC-1, CLI-45_AC-2, CLI-45_AC-3, CLI-45_AC-4, TRC-8_AC-1, TTST-5_AC-1, TTST-7_AC-1

```typescript
interface TemplateGroup {
  /** Commander Command instance acting as parent for template subcommands */
  command: Command;
  /** Subcommands: generate, diff, features, test */
  subcommands: Command[];
}
```

### CLI-RootProgram

The root `awa` command that wires together the template group, top-level init convenience command, and top-level awa commands.

IMPLEMENTS: CFG-5_AC-2, CLI-23_AC-1, CLI-24_AC-1, CLI-25_AC-1, CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-4, CLI-1_AC-5, CLI-2_AC-1, CLI-2_AC-2, CLI-2_AC-3, CLI-2_AC-5, CLI-2_AC-6, CLI-3_AC-1, CLI-4_AC-1, CLI-4_AC-2, CLI-5_AC-1, CLI-6_AC-1, CLI-6_AC-2, CLI-7_AC-1, CLI-8_AC-1, CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2, CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3, CLI-12_AC-1, CLI-13_AC-1, CLI-13_AC-2, CLI-14_AC-1, CLI-14_AC-2, CLI-15_AC-1, CLI-15_AC-2, DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7, DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10, DIFF-7_AC-11, DIFF-7_AC-12, DIFF-7_AC-13, DISC-4_AC-1, DISC-5_AC-1, CFG-8_AC-1, CFG-8_AC-2, CFG-8_AC-4, CFG-10_AC-1, CFG-10_AC-2, CFG-10_AC-3, CFG-10_AC-5, GEN-10_AC-1, GEN-10_AC-2, GEN-13_AC-1, GEN-14_AC-1, GEN-15_AC-1, GEN-16_AC-1, JSON-1_AC-1, JSON-2_AC-1, JSON-5_AC-1, OVL-1_AC-1, OVL-7_AC-1, CLI-41_AC-1, CLI-41_AC-2, CLI-41_AC-3, CLI-41_AC-4, CLI-41_AC-5, CLI-41_AC-6, CLI-41_AC-7, CLI-42_AC-1, CLI-42_AC-2, CLI-43_AC-1, CLI-43_AC-2, CLI-43_AC-3, CLI-43_AC-4, CLI-44_AC-1, CLI-44_AC-2, CLI-45_AC-1, CLI-45_AC-2, CLI-45_AC-3, CLI-45_AC-4, TRC-8_AC-1, TTST-5_AC-1, TTST-7_AC-1

```typescript
interface RootProgram {
  /** Commander root program */
  program: Command;
  /** Adds template group, init convenience command, and top-level commands */
  configure(): void;
}
```

## Data Models

### Command Types

- TEMPLATE_GROUP: Commander Command instance with no action, serving as namespace
- ROOT_PROGRAM: Top-level Commander program with version, help, and child commands

## Correctness Properties

- CLI_P-20 [Template Nesting]: All template commands are only accessible under the `template` parent and not at the root level
  VALIDATES: CLI-41_AC-2, CLI-45_AC-1, CLI-45_AC-2, CLI-45_AC-3, CLI-45_AC-4

- CLI_P-21 [Option Preservation]: Template subcommands accept the same options as their former top-level counterparts
  VALIDATES: CLI-41_AC-4, CLI-41_AC-5, CLI-41_AC-6, CLI-41_AC-7, CLI-42_AC-2

- CLI_P-22 [Top-Level Awa Commands]: check and trace remain accessible directly under `awa`
  VALIDATES: CLI-43_AC-1, CLI-43_AC-2

## Error Handling

### CommandError

Errors from the restructured command tree.

- UNKNOWN_COMMAND: User invokes an old top-level command name (commander's default behavior)
- MISSING_SUBCOMMAND: User invokes `awa template` without a subcommand

### Strategy

PRINCIPLES:

- Commander's built-in unknown command error handling applies
- `awa template` without subcommand shows help (commander default)
- No custom error handling needed beyond existing patterns

## Testing Strategy

### Property-Based Testing

- FRAMEWORK: fast-check
- MINIMUM_ITERATIONS: 100
- TAG_FORMAT: @awa-test: TCLI_P-{n}

### Unit Testing

Verify command tree structure by inspecting commander Command instances.

- AREAS: Template group contains expected subcommands, root program contains init/template/check/trace, old top-level commands absent

### Integration Testing

- SCENARIOS: `awa template generate --help` shows options, `awa template diff --help` shows options, `awa --help` shows command groups, `awa init --help` shows generate options

## Requirements Traceability

### REQ-CFG-config.md

- CFG-5_AC-2 → CLI-TemplateGroup
- CFG-5_AC-2 → CLI-RootProgram
- CFG-8_AC-1 → CLI-TemplateGroup
- CFG-8_AC-1 → CLI-RootProgram
- CFG-8_AC-2 → CLI-TemplateGroup
- CFG-8_AC-2 → CLI-RootProgram
- CFG-8_AC-4 → CLI-TemplateGroup
- CFG-8_AC-4 → CLI-RootProgram
- CFG-10_AC-1 → CLI-TemplateGroup
- CFG-10_AC-1 → CLI-RootProgram
- CFG-10_AC-2 → CLI-TemplateGroup
- CFG-10_AC-2 → CLI-RootProgram
- CFG-10_AC-3 → CLI-TemplateGroup
- CFG-10_AC-3 → CLI-RootProgram
- CFG-10_AC-5 → CLI-TemplateGroup
- CFG-10_AC-5 → CLI-RootProgram

### REQ-CLI-cli.md

- CLI-1_AC-1 → CLI-TemplateGroup
- CLI-1_AC-1 → CLI-RootProgram
- CLI-1_AC-2 → CLI-TemplateGroup
- CLI-1_AC-2 → CLI-RootProgram
- CLI-1_AC-3 → CLI-TemplateGroup
- CLI-1_AC-3 → CLI-RootProgram
- CLI-1_AC-4 → CLI-TemplateGroup
- CLI-1_AC-4 → CLI-RootProgram
- CLI-1_AC-5 → CLI-TemplateGroup
- CLI-1_AC-5 → CLI-RootProgram
- CLI-2_AC-1 → CLI-TemplateGroup
- CLI-2_AC-1 → CLI-RootProgram
- CLI-2_AC-2 → CLI-TemplateGroup
- CLI-2_AC-2 → CLI-RootProgram
- CLI-2_AC-3 → CLI-TemplateGroup
- CLI-2_AC-3 → CLI-RootProgram
- CLI-2_AC-5 → CLI-TemplateGroup
- CLI-2_AC-5 → CLI-RootProgram
- CLI-2_AC-6 → CLI-TemplateGroup
- CLI-2_AC-6 → CLI-RootProgram
- CLI-3_AC-1 → CLI-TemplateGroup
- CLI-3_AC-1 → CLI-RootProgram
- CLI-4_AC-1 → CLI-TemplateGroup
- CLI-4_AC-1 → CLI-RootProgram
- CLI-4_AC-2 → CLI-TemplateGroup
- CLI-4_AC-2 → CLI-RootProgram
- CLI-5_AC-1 → CLI-TemplateGroup
- CLI-5_AC-1 → CLI-RootProgram
- CLI-6_AC-1 → CLI-TemplateGroup
- CLI-6_AC-1 → CLI-RootProgram
- CLI-6_AC-2 → CLI-TemplateGroup
- CLI-6_AC-2 → CLI-RootProgram
- CLI-7_AC-1 → CLI-TemplateGroup
- CLI-7_AC-1 → CLI-RootProgram
- CLI-8_AC-1 → CLI-TemplateGroup
- CLI-8_AC-1 → CLI-RootProgram
- CLI-9_AC-1 → CLI-TemplateGroup
- CLI-9_AC-1 → CLI-RootProgram
- CLI-9_AC-2 → CLI-TemplateGroup
- CLI-9_AC-2 → CLI-RootProgram
- CLI-9_AC-3 → CLI-TemplateGroup
- CLI-9_AC-3 → CLI-RootProgram
- CLI-10_AC-1 → CLI-TemplateGroup
- CLI-10_AC-1 → CLI-RootProgram
- CLI-10_AC-2 → CLI-TemplateGroup
- CLI-10_AC-2 → CLI-RootProgram
- CLI-11_AC-1 → CLI-TemplateGroup
- CLI-11_AC-1 → CLI-RootProgram
- CLI-11_AC-2 → CLI-TemplateGroup
- CLI-11_AC-2 → CLI-RootProgram
- CLI-11_AC-3 → CLI-TemplateGroup
- CLI-11_AC-3 → CLI-RootProgram
- CLI-12_AC-1 → CLI-TemplateGroup
- CLI-12_AC-1 → CLI-RootProgram
- CLI-13_AC-1 → CLI-TemplateGroup
- CLI-13_AC-1 → CLI-RootProgram
- CLI-13_AC-2 → CLI-TemplateGroup
- CLI-13_AC-2 → CLI-RootProgram
- CLI-14_AC-1 → CLI-TemplateGroup
- CLI-14_AC-1 → CLI-RootProgram
- CLI-14_AC-2 → CLI-TemplateGroup
- CLI-14_AC-2 → CLI-RootProgram
- CLI-15_AC-1 → CLI-TemplateGroup
- CLI-15_AC-1 → CLI-RootProgram
- CLI-15_AC-2 → CLI-TemplateGroup
- CLI-15_AC-2 → CLI-RootProgram
- CLI-23_AC-1 → CLI-TemplateGroup
- CLI-23_AC-1 → CLI-RootProgram
- CLI-24_AC-1 → CLI-TemplateGroup
- CLI-24_AC-1 → CLI-RootProgram
- CLI-25_AC-1 → CLI-TemplateGroup
- CLI-25_AC-1 → CLI-RootProgram
- CLI-41_AC-1 → CLI-TemplateGroup
- CLI-41_AC-1 → CLI-RootProgram
- CLI-41_AC-2 → CLI-TemplateGroup (CLI_P-20)
- CLI-41_AC-2 → CLI-RootProgram (CLI_P-20)
- CLI-41_AC-3 → CLI-TemplateGroup
- CLI-41_AC-3 → CLI-RootProgram
- CLI-41_AC-4 → CLI-TemplateGroup (CLI_P-21)
- CLI-41_AC-4 → CLI-RootProgram (CLI_P-21)
- CLI-41_AC-5 → CLI-TemplateGroup (CLI_P-21)
- CLI-41_AC-5 → CLI-RootProgram (CLI_P-21)
- CLI-41_AC-6 → CLI-TemplateGroup (CLI_P-21)
- CLI-41_AC-6 → CLI-RootProgram (CLI_P-21)
- CLI-41_AC-7 → CLI-TemplateGroup (CLI_P-21)
- CLI-41_AC-7 → CLI-RootProgram (CLI_P-21)
- CLI-42_AC-1 → CLI-TemplateGroup
- CLI-42_AC-1 → CLI-RootProgram
- CLI-42_AC-2 → CLI-TemplateGroup (CLI_P-21)
- CLI-42_AC-2 → CLI-RootProgram (CLI_P-21)
- CLI-43_AC-1 → CLI-TemplateGroup (CLI_P-22)
- CLI-43_AC-1 → CLI-RootProgram (CLI_P-22)
- CLI-43_AC-2 → CLI-TemplateGroup (CLI_P-22)
- CLI-43_AC-2 → CLI-RootProgram (CLI_P-22)
- CLI-43_AC-3 → CLI-TemplateGroup
- CLI-43_AC-3 → CLI-RootProgram
- CLI-43_AC-4 → CLI-TemplateGroup
- CLI-43_AC-4 → CLI-RootProgram
- CLI-44_AC-1 → CLI-TemplateGroup
- CLI-44_AC-1 → CLI-RootProgram
- CLI-44_AC-2 → CLI-TemplateGroup
- CLI-44_AC-2 → CLI-RootProgram
- CLI-45_AC-1 → CLI-TemplateGroup (CLI_P-20)
- CLI-45_AC-1 → CLI-RootProgram (CLI_P-20)
- CLI-45_AC-2 → CLI-TemplateGroup (CLI_P-20)
- CLI-45_AC-2 → CLI-RootProgram (CLI_P-20)
- CLI-45_AC-3 → CLI-TemplateGroup (CLI_P-20)
- CLI-45_AC-3 → CLI-RootProgram (CLI_P-20)
- CLI-45_AC-4 → CLI-TemplateGroup (CLI_P-20)
- CLI-45_AC-4 → CLI-RootProgram (CLI_P-20)

### REQ-DIFF-diff.md

- DIFF-7_AC-1 → CLI-TemplateGroup
- DIFF-7_AC-1 → CLI-RootProgram
- DIFF-7_AC-2 → CLI-TemplateGroup
- DIFF-7_AC-2 → CLI-RootProgram
- DIFF-7_AC-3 → CLI-TemplateGroup
- DIFF-7_AC-3 → CLI-RootProgram
- DIFF-7_AC-4 → CLI-TemplateGroup
- DIFF-7_AC-4 → CLI-RootProgram
- DIFF-7_AC-5 → CLI-TemplateGroup
- DIFF-7_AC-5 → CLI-RootProgram
- DIFF-7_AC-6 → CLI-TemplateGroup
- DIFF-7_AC-6 → CLI-RootProgram
- DIFF-7_AC-7 → CLI-TemplateGroup
- DIFF-7_AC-7 → CLI-RootProgram
- DIFF-7_AC-8 → CLI-TemplateGroup
- DIFF-7_AC-8 → CLI-RootProgram
- DIFF-7_AC-9 → CLI-TemplateGroup
- DIFF-7_AC-9 → CLI-RootProgram
- DIFF-7_AC-10 → CLI-TemplateGroup
- DIFF-7_AC-10 → CLI-RootProgram
- DIFF-7_AC-11 → CLI-TemplateGroup
- DIFF-7_AC-11 → CLI-RootProgram
- DIFF-7_AC-12 → CLI-TemplateGroup
- DIFF-7_AC-12 → CLI-RootProgram
- DIFF-7_AC-13 → CLI-TemplateGroup
- DIFF-7_AC-13 → CLI-RootProgram

### REQ-DISC-feature-discovery.md

- DISC-4_AC-1 → CLI-TemplateGroup
- DISC-4_AC-1 → CLI-RootProgram
- DISC-5_AC-1 → CLI-TemplateGroup
- DISC-5_AC-1 → CLI-RootProgram

### REQ-GEN-generation.md

- GEN-10_AC-1 → CLI-TemplateGroup
- GEN-10_AC-1 → CLI-RootProgram
- GEN-10_AC-2 → CLI-TemplateGroup
- GEN-10_AC-2 → CLI-RootProgram
- GEN-13_AC-1 → CLI-TemplateGroup
- GEN-13_AC-1 → CLI-RootProgram
- GEN-14_AC-1 → CLI-TemplateGroup
- GEN-14_AC-1 → CLI-RootProgram
- GEN-15_AC-1 → CLI-TemplateGroup
- GEN-15_AC-1 → CLI-RootProgram
- GEN-16_AC-1 → CLI-TemplateGroup
- GEN-16_AC-1 → CLI-RootProgram

### REQ-JSON-json-output.md

- JSON-1_AC-1 → CLI-TemplateGroup
- JSON-1_AC-1 → CLI-RootProgram
- JSON-2_AC-1 → CLI-TemplateGroup
- JSON-2_AC-1 → CLI-RootProgram
- JSON-5_AC-1 → CLI-TemplateGroup
- JSON-5_AC-1 → CLI-RootProgram

### REQ-OVL-overlays.md

- OVL-1_AC-1 → CLI-TemplateGroup
- OVL-1_AC-1 → CLI-RootProgram
- OVL-7_AC-1 → CLI-TemplateGroup
- OVL-7_AC-1 → CLI-RootProgram

### REQ-TRC-trace.md

- TRC-8_AC-1 → CLI-TemplateGroup
- TRC-8_AC-1 → CLI-RootProgram

### REQ-TTST-template-test.md

- TTST-5_AC-1 → CLI-TemplateGroup
- TTST-5_AC-1 → CLI-RootProgram
- TTST-7_AC-1 → CLI-TemplateGroup
- TTST-7_AC-1 → CLI-RootProgram

## Library Usage

### Framework Features

- COMMANDER: Nested commands via `addCommand()`, alias support, automatic help for parent commands

### External Libraries

- commander (latest): CLI framework — nested command groups, help generation
