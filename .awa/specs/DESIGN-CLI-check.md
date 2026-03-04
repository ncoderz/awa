# Design Specification

## Overview

This design implements the `awa check` command as a pipeline: config → scanner/parser → checkers → reporter. It reuses the existing config loader (extended with a `[check]` section) and follows the same command pattern as `diff` and `generate`.

## Architecture

AFFECTED LAYERS: CLI Layer, Core Engine

### High-Level Architecture

Pipeline architecture: load config, scan code and parse specs in parallel, run checkers, report findings.

```mermaid
flowchart LR
    Config[".awa.toml [check]"] --> Scanner[MarkerScanner]
    Config --> Parser[SpecParser]
    Scanner --> CSC[CodeSpecChecker]
    Parser --> CSC
    Parser --> SSC[SpecSpecChecker]
    CSC --> Reporter
    SSC --> Reporter
    Reporter --> Output["stdout (text/JSON)"]
```

### Module Organization

```
src/
├── commands/
│   └── check.ts
└── core/
    └── check/
        ├── types.ts
        ├── errors.ts
        ├── spec-parser.ts
        ├── marker-scanner.ts
        ├── code-spec-checker.ts
        ├── spec-spec-checker.ts
        ├── matrix-fixer.ts
        ├── reporter.ts
        └── __tests__/
            ├── spec-parser.test.ts
            ├── marker-scanner.test.ts
            ├── code-spec-checker.test.ts
            ├── spec-spec-checker.test.ts
            ├── matrix-fixer.test.ts
            └── reporter.test.ts
```

### Architectural Decisions

- PIPELINE OVER VISITOR: Linear pipeline keeps each stage independently testable. Alternatives: visitor pattern, event-driven
- REGEX OVER AST: Spec files are Markdown with predictable patterns; regex is simpler and sufficient. Alternatives: Markdown AST parsing
- SEPARATE CHECKERS: Code-to-spec and spec-to-spec are independent concerns with different inputs. Alternatives: single monolithic checker

## Components and Interfaces

### CLI-MarkerScanner

Scans code files matching configured globs for traceability markers. Extracts marker type, referenced ID, file path, and line number.

IMPLEMENTS: CFG-1_AC-4, CLI-16_AC-1, CLI-26_AC-1, CLI-28_AC-1

```typescript
interface MarkerScanResult {
  markers: CodeMarker[];
}

interface CodeMarker {
  type: 'impl' | 'test' | 'component';
  id: string;
  filePath: string;
  line: number;
}

function scanMarkers(config: CheckConfig): Promise<MarkerScanResult>;
```

### CLI-SpecParser

Parses spec files matching configured globs to extract requirement IDs, AC IDs, property IDs, and component names.

IMPLEMENTS: CLI-17_AC-1, CLI-27_AC-1

```typescript
interface SpecParseResult {
  requirementIds: Set<string>;
  acIds: Set<string>;
  propertyIds: Set<string>;
  componentNames: Set<string>;
  allIds: Set<string>;
  specFiles: SpecFile[];
}

interface SpecFile {
  filePath: string;
  code: string;
  requirementIds: string[];
  acIds: string[];
  propertyIds: string[];
  componentNames: string[];
  crossRefs: CrossReference[];
}

interface CrossReference {
  type: 'implements' | 'validates';
  ids: string[];
  filePath: string;
  line: number;
}

function parseSpecs(config: CheckConfig): Promise<SpecParseResult>;
```

### CLI-CodeSpecChecker

Matches code markers against spec IDs. Reports orphaned markers (code references non-existent spec ID) and uncovered ACs (spec AC with no test marker).

IMPLEMENTS: CLI-18_AC-1, CLI-19_AC-1, CLI-21_AC-1, CLI-29_AC-1, CLI-33_AC-1, CLI-34_AC-1, CLI-35_AC-1, CLI-36_AC-1, CLI-37_AC-1

```typescript
interface CheckResult {
  findings: Finding[];
}

function checkCodeAgainstSpec(
  markers: MarkerScanResult,
  specs: SpecParseResult,
  config: CheckConfig
): CheckResult;
```

### CLI-SpecSpecChecker

Validates cross-references between spec files. Reports broken IMPLEMENTS/VALIDATES references and orphaned spec files.

IMPLEMENTS: CLI-20_AC-1, CLI-22_AC-1, CLI-30_AC-1, CLI-36_AC-1

```typescript
function checkSpecAgainstSpec(
  specs: SpecParseResult,
  markers: MarkerScanResult,
  config: CheckConfig
): CheckResult;
```

### CLI-Reporter

Formats and outputs validation findings in text or JSON format.

IMPLEMENTS: CLI-24_AC-1, CLI-24_AC-2, CLI-24_AC-3

```typescript
function report(findings: Finding[], format: 'text' | 'json'): void;
```

### CLI-RuleLoader

Loads and validates YAML rule files from the schema directory. Each rule file defines structural expectations for matching spec files.

IMPLEMENTS: CLI-31_AC-1

```typescript
function loadRules(schemaDir: string): Promise<LoadedRule[]>;
function matchesTargetGlob(filePath: string, glob: string): boolean;
```

### CLI-SchemaChecker

Validates Markdown spec files against loaded YAML rules. Checks heading structure, required sections, content patterns, tables, and code blocks.

IMPLEMENTS: CLI-17_AC-1

```typescript
function checkSchema(config: CheckConfig, specFiles: string[]): Promise<Finding[]>;
```

### CLI-CheckCommand

Orchestrates the validation pipeline: load config, scan/parse, check, report, set exit code. Runs matrix generation by default after checks complete (skip with `--no-fix`).

IMPLEMENTS: CLI-23_AC-1, CLI-25_AC-1, CLI-31_AC-1, CLI-32_AC-1, CLI-32_AC-2, CLI-32_AC-3, CLI-39_AC-1

```typescript
function checkCommand(cliOptions: RawCheckOptions): Promise<number>;
```

### CLI-MatrixFixer

Regenerates Requirements Traceability sections in DESIGN and TASK files. For DESIGN files, inverts component IMPLEMENTS and property VALIDATES lines to build AC→Component(Property) entries. For TASK files, inverts task IMPLEMENTS and TESTS lines to build AC→Task(Test) entries.

IMPLEMENTS: CLI-38_AC-1, CLI-38_AC-2

```typescript
interface FixResult {
  readonly filesFixed: number;
  readonly fileResults: readonly FileFixResult[];
}

function fixMatrices(
  specs: SpecParseResult,
  crossRefPatterns: readonly string[]
): Promise<FixResult>;
```

### CLI-CodesFixer

Regenerates the Feature Codes table in ARCHITECTURE.md from spec data. Discovers codes from REQ files via scanCodes(), extracts scope text using the FEAT Scope Boundary → FEAT first paragraph → REQ first paragraph → DESIGN first paragraph fallback chain, and replaces the ## Feature Codes section content.

IMPLEMENTS: CLI-40_AC-1, CLI-40_AC-2

```typescript
interface CodesFixResult extends FixResult {
  readonly emptyScopeCodes: readonly string[];
}

function fixCodesTable(
  specs: SpecParseResult,
  config: Pick<CheckConfig, 'specGlobs' | 'specIgnore'>
): Promise<CodesFixResult>;
```

## Data Models

### Core Types

- VALIDATE_CONFIG: Configuration for the check command

```typescript
interface CheckConfig {
  specGlobs: string[];
  codeGlobs: string[];
  ignore: string[];
  markers: string[];
  idPattern: string;
  crossRefPatterns: string[];
  format: 'text' | 'json';
}
```

- FINDING: A single validation finding (error or warning)

```typescript
interface Finding {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  filePath?: string;
  line?: number;
  id?: string;
}
```

- RAW_CHECK_OPTIONS: CLI argument parser output for check

```typescript
interface RawCheckOptions {
  ignore?: string[];
  format?: string;
  config?: string;
}
```

## Correctness Properties

- CLI_P-8 [Orphan Detection Completeness]: Every code marker referencing a non-existent spec ID is reported as an error
  VALIDATES: CLI-18_AC-1

- CLI_P-9 [Coverage Detection Completeness]: Every spec AC without a corresponding `@awa-test` marker is reported as a warning
  VALIDATES: CLI-19_AC-1

- CLI_P-10 [Cross-Reference Integrity]: Every DESIGN cross-reference pointing to a non-existent REQ ID is reported as an error
  VALIDATES: CLI-20_AC-1

- CLI_P-11 [ID Format Enforcement]: Every marker ID not matching the configured pattern is reported as an error
  VALIDATES: CLI-21_AC-1

- CLI_P-12 [Exit Code Correctness]: Exit code is 0 when no errors exist, 1 when errors exist (warnings alone do not affect exit code)
  VALIDATES: CLI-23_AC-1

- CLI_P-13 [Component Coverage Detection]: Every DESIGN component without a corresponding `@awa-component` marker is reported as a warning
  VALIDATES: CLI-33_AC-1

- CLI_P-14 [Implementation Coverage Detection]: Every spec AC without a corresponding `@awa-impl` marker is reported as a warning
  VALIDATES: CLI-34_AC-1

- CLI_P-15 [Property Coverage Detection]: Every DESIGN property without a corresponding `@awa-test` marker is reported as a warning
  VALIDATES: CLI-35_AC-1

- CLI_P-16 [IMPLEMENTS Consistency]: Every mismatch between a component's DESIGN IMPLEMENTS list and code @awa-impl markers is reported as a warning
  VALIDATES: CLI-37_AC-1

- CLI_P-17 [Unlinked AC Detection]: Every REQ AC not claimed by any DESIGN IMPLEMENTS is reported as an error
  VALIDATES: CLI-36_AC-1

- CLI_P-18 [DESIGN Matrix Idempotence]: Running fix twice on a DESIGN file produces identical output
  VALIDATES: CLI-38_AC-1

- CLI_P-19 [TASK Matrix Idempotence]: Running fix twice on a TASK file produces identical output
  VALIDATES: CLI-38_AC-2

## Error Handling

### CheckError

Validation operation errors

- FILE_READ_ERROR: Cannot read a spec or code file
- INVALID_CONFIG: Validate config has invalid values
- GLOB_ERROR: Glob pattern matching failed

### Strategy

PRINCIPLES:

- Fail fast on config errors (before scanning)
- Continue on individual file errors (report and skip)
- Distinguish errors (exit 1) from warnings (informational only)

## Testing Strategy

### Property-Based Testing

- FRAMEWORK: fast-check
- MINIMUM_ITERATIONS: 100
- TAG_FORMAT: `@awa-test: CHK_P-{n}`

### Unit Testing

- AREAS: marker scanner, spec parser, code-spec checker, spec-spec checker, reporter

### Integration Testing

- SCENARIOS: check command with default config, check with custom markers, check with broken references

## Requirements Traceability

### REQ-CFG-config.md

- CFG-1_AC-4 → CLI-MarkerScanner

### REQ-CLI-cli.md

- CLI-16_AC-1 → CLI-MarkerScanner
- CLI-17_AC-1 → CLI-SpecParser
- CLI-17_AC-1 → CLI-SchemaChecker
- CLI-18_AC-1 → CLI-CodeSpecChecker (CLI_P-8)
- CLI-19_AC-1 → CLI-CodeSpecChecker (CLI_P-9)
- CLI-20_AC-1 → CLI-SpecSpecChecker (CLI_P-10)
- CLI-21_AC-1 → CLI-CodeSpecChecker (CLI_P-11)
- CLI-22_AC-1 → CLI-SpecSpecChecker
- CLI-23_AC-1 → CLI-CheckCommand (CLI_P-12)
- CLI-24_AC-1 → CLI-Reporter
- CLI-24_AC-2 → CLI-Reporter
- CLI-24_AC-3 → CLI-Reporter
- CLI-25_AC-1 → CLI-CheckCommand
- CLI-26_AC-1 → CLI-MarkerScanner
- CLI-27_AC-1 → CLI-SpecParser
- CLI-28_AC-1 → CLI-MarkerScanner
- CLI-29_AC-1 → CLI-CodeSpecChecker
- CLI-30_AC-1 → CLI-SpecSpecChecker
- CLI-31_AC-1 → CLI-RuleLoader
- CLI-31_AC-1 → CLI-CheckCommand
- CLI-32_AC-1 → CLI-CheckCommand
- CLI-32_AC-2 → CLI-CheckCommand
- CLI-32_AC-3 → CLI-CheckCommand
- CLI-33_AC-1 → CLI-CodeSpecChecker (CLI_P-13)
- CLI-34_AC-1 → CLI-CodeSpecChecker (CLI_P-14)
- CLI-35_AC-1 → CLI-CodeSpecChecker (CLI_P-15)
- CLI-36_AC-1 → CLI-CodeSpecChecker (CLI_P-17)
- CLI-36_AC-1 → CLI-SpecSpecChecker (CLI_P-17)
- CLI-37_AC-1 → CLI-CodeSpecChecker (CLI_P-16)
- CLI-38_AC-1 → CLI-MatrixFixer (CLI_P-18)
- CLI-38_AC-2 → CLI-MatrixFixer (CLI_P-19)
- CLI-39_AC-1 → CLI-CheckCommand
- CLI-40_AC-1 → CLI-CodesFixer
- CLI-40_AC-2 → CLI-CodesFixer
