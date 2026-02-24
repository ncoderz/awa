# awa CLI Design - Traceability & References

> VERSION: 2.2.0 | STATUS: draft | UPDATED: 2026-02-24

This document contains requirements traceability, library usage strategy, and change log for awa CLI.

PARENT DOCUMENT: [DESIGN-AWA-cli.md](DESIGN-AWA-cli.md)

## Requirements Traceability

SOURCE: .awa/specs/REQ-CLI-cli.md, .awa/specs/REQ-CFG-config.md, .awa/specs/REQ-TPL-templates.md, .awa/specs/REQ-GEN-generation.md, .awa/specs/REQ-DIFF-diff.md, .awa/specs/REQ-FP-feature-presets.md

### CLI Requirements

- CLI-1_AC-1 → CLI-ArgumentParser
- CLI-1_AC-2 → CLI-ArgumentParser
- CLI-1_AC-3 → CLI-ArgumentParser
- CLI-1_AC-4 → CLI-ArgumentParser
- CLI-1_AC-5 → CLI-ArgumentParser
- CLI-2_AC-1 → CLI-ArgumentParser
- CLI-2_AC-2 → CFG-ConfigLoader
- CLI-2_AC-3 → CFG-ConfigLoader
- CLI-2_AC-4 → CFG-ConfigLoader
- CLI-2_AC-5 → CLI-ArgumentParser
- CLI-2_AC-6 → CLI-ArgumentParser
- CLI-3_AC-1 → CLI-ArgumentParser
- CLI-3_AC-2 → TPL-TemplateResolver
- CLI-3_AC-3 → TPL-TemplateResolver
- CLI-4_AC-1 → CLI-ArgumentParser
- CLI-4_AC-2 → CLI-ArgumentParser
- CLI-4_AC-3 → CFG-ConfigLoader
- CLI-5_AC-1 → CLI-ArgumentParser
- CLI-5_AC-2 → GEN-ConflictResolver (GEN_P-4)
- CLI-5_AC-3 → GEN-ConflictResolver
- CLI-6_AC-1 → CLI-ArgumentParser
- CLI-6_AC-2 → GEN-FileGenerator (GEN_P-3)
- CLI-6_AC-3 → GEN-Logger
- CLI-7_AC-1 → CLI-ArgumentParser
- CLI-7_AC-2 → CFG-ConfigLoader
- CLI-8_AC-1 → CLI-ArgumentParser
- CLI-8_AC-2 → TPL-TemplateResolver (TPL_P-4)
- CLI-9_AC-1 → CLI-ArgumentParser
- CLI-9_AC-2 → CLI-ArgumentParser
- CLI-9_AC-3 → CLI-ArgumentParser
- CLI-10_AC-1 → CLI-ArgumentParser
- CLI-10_AC-2 → CLI-ArgumentParser
- CLI-11_AC-1 → CLI-ArgumentParser
- CLI-11_AC-2 → CLI-ArgumentParser
- CLI-11_AC-3 → CLI-ArgumentParser
- CLI-12_AC-1 → CLI-ArgumentParser
- CLI-12_AC-2 → GEN-FileGenerator
- CLI-12_AC-3 → GEN-DeleteResolver
- CLI-13_AC-1 → CLI-ArgumentParser
- CLI-13_AC-2 → CLI-ArgumentParser
- CLI-14_AC-1 → CLI-ArgumentParser
- CLI-14_AC-2 → CLI-ArgumentParser

### Config Requirements

- CFG-1_AC-1 → CFG-ConfigLoader
- CFG-1_AC-2 → CFG-ConfigLoader
- CFG-1_AC-3 → CFG-ConfigLoader
- CFG-1_AC-4 → CFG-ConfigLoader
- CFG-2_AC-1 → CFG-ConfigLoader
- CFG-2_AC-2 → CFG-ConfigLoader
- CFG-2_AC-3 → CFG-ConfigLoader
- CFG-3_AC-1 → CFG-ConfigLoader
- CFG-3_AC-2 → CFG-ConfigLoader
- CFG-3_AC-3 → CFG-ConfigLoader
- CFG-3_AC-4 → CFG-ConfigLoader
- CFG-3_AC-5 → CFG-ConfigLoader
- CFG-3_AC-6 → CFG-ConfigLoader
- CFG-3_AC-7 → CFG-ConfigLoader
- CFG-3_AC-8 → CFG-ConfigLoader
- CFG-3_AC-9 → CFG-ConfigLoader
- CFG-3_AC-10 → CFG-ConfigLoader
- CFG-4_AC-1 → CFG-ConfigLoader (CFG_P-1)
- CFG-4_AC-2 → CFG-ConfigLoader (CFG_P-1)
- CFG-4_AC-3 → CFG-ConfigLoader
- CFG-4_AC-4 → CFG-ConfigLoader (CFG_P-2)
- CFG-5_AC-1 → CFG-ConfigLoader
- CFG-5_AC-2 → CLI-ArgumentParser
- CFG-6_AC-1 → CFG-ConfigLoader
- CFG-6_AC-2 → CFG-ConfigLoader

### Template Requirements

- TPL-1_AC-1 → TPL-TemplateResolver
- TPL-1_AC-2 → TPL-TemplateResolver
- TPL-1_AC-3 → TPL-TemplateResolver
- TPL-1_AC-4 → TPL-TemplateResolver (TPL_P-3)
- TPL-2_AC-1 → TPL-TemplateResolver
- TPL-2_AC-2 → TPL-TemplateResolver
- TPL-2_AC-3 → TPL-TemplateResolver
- TPL-2_AC-4 → TPL-TemplateResolver
- TPL-2_AC-5 → TPL-TemplateResolver
- TPL-2_AC-6 → TPL-TemplateResolver
- TPL-3_AC-1 → TPL-TemplateResolver
- TPL-3_AC-2 → TPL-TemplateResolver (TPL_P-4)
- TPL-3_AC-3 → TPL-TemplateResolver
- TPL-3_AC-4 → TPL-TemplateResolver
- TPL-4_AC-1 → TPL-TemplateEngine
- TPL-4_AC-2 → TPL-TemplateEngine
- TPL-4_AC-3 → TPL-TemplateEngine
- TPL-4_AC-4 → TPL-TemplateEngine
- TPL-5_AC-1 → TPL-TemplateEngine
- TPL-5_AC-2 → TPL-TemplateEngine
- TPL-5_AC-3 → TPL-TemplateEngine
- TPL-6_AC-1 → TPL-TemplateEngine
- TPL-6_AC-2 → TPL-TemplateEngine
- TPL-7_AC-1 → TPL-TemplateEngine (TPL_P-1)
- TPL-7_AC-2 → TPL-TemplateEngine (TPL_P-2)
- TPL-7_AC-3 → GEN-Logger
- TPL-8_AC-1 → TPL-TemplateEngine
- TPL-8_AC-2 → TPL-TemplateEngine
- TPL-8_AC-3 → TPL-TemplateEngine
- TPL-8_AC-4 → TPL-TemplateEngine
- TPL-9_AC-1 → GEN-FileGenerator (GEN_P-1)
- TPL-9_AC-2 → GEN-FileGenerator (GEN_P-1)
- TPL-10_AC-1 → TPL-TemplateResolver
- TPL-10_AC-2 → TPL-TemplateResolver
- TPL-10_AC-3 → TPL-TemplateResolver
- TPL-11_AC-1 → TPL-TemplateEngine
- TPL-11_AC-2 → TPL-TemplateEngine

### Generation Requirements

- GEN-1_AC-1 → GEN-FileGenerator (GEN_P-2)
- GEN-1_AC-2 → GEN-FileGenerator (GEN_P-2)
- GEN-1_AC-3 → GEN-FileGenerator
- GEN-2_AC-1 → GEN-FileGenerator
- GEN-2_AC-2 → GEN-FileGenerator
- GEN-2_AC-3 → GEN-FileGenerator
- GEN-3_AC-1 → GEN-FileGenerator
- GEN-3_AC-2 → GEN-FileGenerator
- GEN-3_AC-3 → GEN-FileGenerator
- GEN-4_AC-1 → GEN-ConflictResolver
- GEN-4_AC-2 → GEN-ConflictResolver
- GEN-4_AC-3 → GEN-ConflictResolver (GEN_P-4)
- GEN-5_AC-1 → GEN-ConflictResolver
- GEN-5_AC-2 → GEN-ConflictResolver
- GEN-5_AC-3 → GEN-ConflictResolver
- GEN-5_AC-4 → GEN-ConflictResolver
- GEN-5_AC-5 → GEN-ConflictResolver
- GEN-5_AC-6 → GEN-ConflictResolver
- GEN-5_AC-7 → GEN-ConflictResolver (GEN_P-5)
- GEN-6_AC-1 → GEN-FileGenerator (GEN_P-3)
- GEN-6_AC-2 → GEN-FileGenerator (GEN_P-3)
- GEN-6_AC-3 → GEN-ConflictResolver
- GEN-6_AC-4 → GEN-Logger
- GEN-7_AC-1 → GEN-Logger
- GEN-7_AC-2 → GEN-Logger
- GEN-7_AC-3 → GEN-Logger
- GEN-7_AC-4 → GEN-Logger
- GEN-8_AC-1 → GEN-FileGenerator (GEN_P-1)
- GEN-8_AC-2 → GEN-FileGenerator (GEN_P-1)
- GEN-8_AC-3 → GEN-FileGenerator (GEN_P-1)
- GEN-9_AC-1 → GEN-Logger
- GEN-9_AC-2 → GEN-Logger
- GEN-9_AC-3 → GEN-Logger
- GEN-9_AC-4 → GEN-Logger
- GEN-9_AC-5 → GEN-Logger
- GEN-9_AC-6 → GEN-Logger
- GEN-9_AC-7 → GEN-Logger
- GEN-9_AC-8 → GEN-Logger
- GEN-10_AC-1 → CLI-ArgumentParser
- GEN-10_AC-2 → CLI-ArgumentParser
- GEN-10_AC-3 → GEN-ConflictResolver
- GEN-11_AC-1 → GEN-Logger
- GEN-11_AC-2 → GEN-Logger
- GEN-11_AC-3 → GEN-FileGenerator
- GEN-11_AC-4 → GEN-Logger
- GEN-12_AC-1 → GEN-FileGenerator
- GEN-12_AC-2 → GEN-FileGenerator
- GEN-12_AC-3 → GEN-DeleteResolver
- GEN-12_AC-4 → GEN-FileGenerator
- GEN-12_AC-5 → GEN-FileGenerator
- GEN-12_AC-6 → GEN-FileGenerator
- GEN-12_AC-7 → GEN-FileGenerator
- GEN-12_AC-8 → GEN-DeleteList (GEN_P-6)

### Diff Requirements

- DIFF-1_AC-1 → DIFF-DiffEngine
- DIFF-1_AC-2 → DIFF-DiffEngine
- DIFF-1_AC-3 → DIFF-DiffEngine (DIFF_P-1)
- DIFF-2_AC-1 → DIFF-DiffEngine (DIFF_P-3)
- DIFF-2_AC-2 → DIFF-DiffEngine
- DIFF-2_AC-3 → DIFF-DiffEngine
- DIFF-2_AC-4 → DIFF-DiffEngine
- DIFF-2_AC-5 → DIFF-DiffEngine
- DIFF-3_AC-1 → DIFF-DiffEngine
- DIFF-3_AC-2 → DIFF-DiffEngine (DIFF_P-5)
- DIFF-3_AC-3 → DIFF-DiffEngine (DIFF_P-5)
- DIFF-3_AC-4 → DIFF-DiffEngine (DIFF_P-5)
- DIFF-4_AC-1 → DIFF-DiffEngine
- DIFF-4_AC-2 → DIFF-DiffEngine
- DIFF-4_AC-3 → GEN-Logger
- DIFF-4_AC-4 → GEN-Logger
- DIFF-4_AC-5 → GEN-Logger
- DIFF-5_AC-1 → DIFF-DiffEngine (DIFF_P-4)
- DIFF-5_AC-2 → DIFF-DiffEngine (DIFF_P-4)
- DIFF-5_AC-3 → DIFF-DiffEngine (DIFF_P-4)
- DIFF-6_AC-1 → DIFF-DiffEngine (DIFF_P-2)
- DIFF-6_AC-2 → DIFF-DiffEngine (DIFF_P-2)
- DIFF-6_AC-3 → DIFF-DiffEngine (DIFF_P-2)
- DIFF-7_AC-1 → CLI-ArgumentParser
- DIFF-7_AC-2 → CLI-ArgumentParser
- DIFF-7_AC-3 → CLI-ArgumentParser
- DIFF-7_AC-4 → CLI-ArgumentParser
- DIFF-7_AC-5 → CLI-ArgumentParser
- DIFF-7_AC-6 → CLI-ArgumentParser
- DIFF-7_AC-11 → CLI-ArgumentParser
- DIFF-7_AC-12 → CLI-ArgumentParser
- DIFF-7_AC-13 → CLI-ArgumentParser
- DIFF-8_AC-1 → DIFF-DiffEngine (DIFF_P-6)
- DIFF-8_AC-2 → DIFF-DiffEngine (DIFF_P-6)
- DIFF-8_AC-3 → DIFF-DiffEngine (DIFF_P-6)
- DIFF-8_AC-4 → DIFF-DiffEngine

### Feature Preset Requirements

- FP-1_AC-1 → CFG-ConfigLoader
- FP-1_AC-2 → CFG-ConfigLoader
- FP-1_AC-3 → CFG-ConfigLoader
- FP-1_AC-4 → CFG-ConfigLoader
- FP-2_AC-1 → CLI-ArgumentParser
- FP-2_AC-2 → CLI-ArgumentParser
- FP-2_AC-3 → FP-FeatureResolver (FP_P-1)
- FP-2_AC-4 → CLI-ArgumentParser
- FP-3_AC-1 → CFG-ConfigLoader
- FP-3_AC-2 → CFG-ConfigLoader
- FP-3_AC-3 → CFG-ConfigLoader
- FP-4_AC-1 → CLI-ArgumentParser
- FP-4_AC-2 → CLI-ArgumentParser
- FP-4_AC-3 → CLI-ArgumentParser
- FP-4_AC-4 → FP-FeatureResolver (FP_P-5)
- FP-4_AC-5 → CLI-ArgumentParser
- FP-5_AC-1 → CFG-ConfigLoader
- FP-5_AC-2 → CFG-ConfigLoader
- FP-5_AC-3 → CFG-ConfigLoader
- FP-6_AC-1 → FP-FeatureResolver (FP_P-2)
- FP-6_AC-2 → FP-FeatureResolver (FP_P-2)
- FP-6_AC-3 → FP-FeatureResolver (FP_P-2)
- FP-6_AC-4 → FP-FeatureResolver (FP_P-2)
- FP-6_AC-5 → FP-FeatureResolver (FP_P-3)
- FP-7_AC-1 → FP-FeatureResolver (FP_P-4)
- FP-7_AC-2 → FP-FeatureResolver (FP_P-3)

## Library Usage Strategy

### Framework Features

- COMMANDER: Command definition, argument parsing, help generation with positional args, version display
- ETA: Template rendering, partial includes, context passing
- SMOL_TOML: TOML parsing with error location
- DEGIT: Shallow Git fetches, ref support, subdirectory extraction
- CLACK_PROMPTS: Interactive select prompts for conflict resolution
- CLACK_CORE: Custom multiselect prompts for destructive-styled delete confirmation (red checkboxes)
- CHALK: Styled terminal output (colors, bold, dim)

### External Libraries

- commander (latest): CLI framework — argument parsing, help with positional args, subcommands
- eta (3.x): Template engine — fast, TypeScript-native, partials
- smol-toml (1.x): TOML parser — lightweight, spec-compliant
- degit (2.x): Git fetcher — shallow clones without .git
- @clack/prompts (latest): Interactive prompts — styled, accessible
- @clack/core (latest): Custom prompt primitives — used for destructive-styled delete multiselect
- chalk (5.x): Terminal colors — ESM-native, no dependencies
- fast-check (3.x): Property-based testing — generators, shrinking
- diff (latest): Unified diff generation — cross-platform text comparison
- isbinaryfile (latest): Binary file detection — null-byte heuristic, well-maintained

## Change Log

- 1.0.0 (2025-12-11): Initial design based on requirements
- 2.2.0 (2026-02-24): Added CLI-12/13/14 ACs, CFG-3_AC-7/8/9/10, GEN-12 and GEN-9_AC-7/8, DIFF-8 and DIFF-7_AC-12/13; added @clack/core library; added GEN_P-6, DIFF_P-6 properties
