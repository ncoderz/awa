# Requirements Specification

## Introduction

Requirements for the `awa trace` command that explores traceability chains and assembles context from specs, code, and tests.

## Glossary

- TRACE INDEX: In-memory graph of relationships between spec IDs and code markers
- CHAIN: The resolved path of nodes (requirement, AC, component, code, test) for a given ID
- CONTENT ASSEMBLY: Extracting actual file sections (spec headings, code blocks) for output
- TOKEN BUDGET: Maximum estimated tokens for content mode output
- CONTEXT LINES: Number of source lines returned around code markers in content mode

## Stakeholders

- DEVELOPER: Navigates traceability chains during development
- AI AGENT: Receives assembled context for task execution
- CI SYSTEM: Consumes JSON output for automation and auditing

## Requirements

### TRC-1: Traceability Index Building [MUST]

AS A developer, I WANT the trace command to build an in-memory index of all traceability relationships, SO THAT chains can be resolved quickly.

ACCEPTANCE CRITERIA

- TRC-1_AC-1 [event]: WHEN trace is invoked THEN the system SHALL scan markers and parse specs to build a TraceIndex containing forward maps (requirement to ACs, AC to components, AC to code, AC to tests) and reverse maps (AC to requirement, component to ACs)

### TRC-2: Input Resolution [MUST]

AS A developer, I WANT to query by ID, task file, or source file, SO THAT I can trace from any starting point.

ACCEPTANCE CRITERIA

- TRC-2_AC-1 [event]: WHEN one or more traceability IDs are provided THEN the system SHALL validate each ID against the index and resolve it
- TRC-2_AC-2 [event]: WHEN `--task <path>` is provided THEN the system SHALL parse the task file for referenced IDs and resolve them
- TRC-2_AC-3 [event]: WHEN `--file <path>` is provided THEN the system SHALL scan the source file for `@awa-*` markers and resolve the referenced IDs
- TRC-2_AC-4 [event]: WHEN `--all` is provided THEN the system SHALL resolve every known ID in the index

### TRC-3: Chain Resolution [MUST]

AS A developer, I WANT the trace command to walk the traceability chain in both directions, SO THAT I see the full context for any ID.

ACCEPTANCE CRITERIA

- TRC-3_AC-1 [event]: WHEN an ID is resolved THEN the system SHALL traverse the chain forward (requirement to ACs to design to code to tests) and reverse (test to code to design to requirement)
- TRC-3_AC-2 [conditional]: IF `--direction forward` is specified THEN the system SHALL only traverse downstream from the ID
- TRC-3_AC-3 [conditional]: IF `--direction reverse` is specified THEN the system SHALL only traverse upstream from the ID
- TRC-3_AC-4 [conditional]: IF `--depth <n>` is specified THEN the system SHALL limit traversal to n levels from the starting ID
- TRC-3_AC-5 [conditional]: IF `--scope <CODE>` is specified THEN the system SHALL exclude results with a different feature code

### TRC-4: Location Tree Output [MUST]

AS A developer, I WANT a text tree showing the chain locations, SO THAT I can quickly see where each artifact lives.

ACCEPTANCE CRITERIA

- TRC-4_AC-1 [ubiquitous]: The system SHALL output a text tree showing requirement, AC, design, implementation, and test locations with file paths and line numbers by default

### TRC-5: Content Assembly [MUST]

AS AN AI agent, I WANT assembled file sections for each node in the chain, SO THAT I receive the actual context needed for my task.

ACCEPTANCE CRITERIA

- TRC-5_AC-1 [conditional]: IF `--content` is specified THEN the system SHALL extract actual file sections (spec H3 sections, code blocks around markers) and output them as Markdown
- TRC-5_AC-2 [conditional]: IF `--content` is active and `-A <n>` is specified THEN the system SHALL include n lines of context after each code marker
- TRC-5_AC-3 [conditional]: IF `--content` is active and `-B <n>` is specified THEN the system SHALL include n lines of context before each code marker
- TRC-5_AC-4 [conditional]: IF `--content` is active and `-C <n>` is specified THEN the system SHALL include n lines of context both before and after each code marker, overriding -A and -B
- TRC-5_AC-5 [conditional]: IF `-A`, `-B`, or `-C` is specified without `--content` THEN the system SHALL silently ignore them

### TRC-6: Token Budget [SHOULD]

AS AN AI agent, I WANT a token limit on content output, SO THAT the assembled context fits my context window.

ACCEPTANCE CRITERIA

- TRC-6_AC-1 [conditional]: IF `--max-tokens <n>` is specified THEN the system SHALL truncate content by priority order and append a truncation footer

### TRC-7: Content Formatters [MUST]

AS A developer, I WANT content output in Markdown and JSON formats, SO THAT I can use the output in different tools.

ACCEPTANCE CRITERIA

- TRC-7_AC-1 [event]: WHEN `--content` is active THEN the system SHALL format output as Markdown with section headings, provenance lines, and code blocks; WHEN `--content --json` is active THEN the system SHALL format output as structured JSON

### TRC-8: CLI Command [MUST]

AS A developer, I WANT a `trace` subcommand with standard options, SO THAT I can invoke it from the command line.

ACCEPTANCE CRITERIA

- TRC-8_AC-1 [event]: WHEN `awa trace` is invoked THEN the system SHALL accept IDs as positional arguments and support `--all`, `--task`, `--file`, `--content`, `--list`, `--json`, `--max-tokens`, `--depth`, `--scope`, `--direction`, `--no-code`, `--no-tests`, `-A`, `-B`, `-C`, and `-c` options
- TRC-8_AC-2 [ubiquitous]: The system SHALL exit with code 0 when chains are found, code 1 when no IDs are found or no context exists, and code 2 on internal error

### TRC-9: List Output [SHOULD]

AS A developer, I WANT a flat list of file paths, SO THAT I can pipe them to other tools.

ACCEPTANCE CRITERIA

- TRC-9_AC-1 [conditional]: IF `--list` is specified THEN the system SHALL output file paths with line numbers only, one per line

### TRC-10: JSON Output [SHOULD]

AS A CI system, I WANT JSON output, SO THAT trace results can be parsed programmatically.

ACCEPTANCE CRITERIA

- TRC-10_AC-1 [conditional]: IF `--json` is specified without `--content` THEN the system SHALL output the chain structure as valid JSON

### TRC-11: Filtering Options [SHOULD]

AS A developer, I WANT to exclude code or tests from output, SO THAT I can focus on spec-level context.

ACCEPTANCE CRITERIA

- TRC-11_AC-1 [conditional]: IF `--no-code` is specified THEN the system SHALL exclude implementation locations from output
- TRC-11_AC-2 [conditional]: IF `--no-tests` is specified THEN the system SHALL exclude test locations from output

## Assumptions

- Traceability markers follow the `@awa-impl`, `@awa-test`, `@awa-component` conventions
- Spec files follow the awa schema conventions with identifiable IDs

## Constraints

- Must reuse the existing check engine's scanner and parser (no duplicate scanning)
- Must handle projects with no specs gracefully (exit 1, not crash)

## Out of Scope

- MCP server mode
- Interactive TUI or REPL mode
- IDE integration
- Modification of artifacts (read-only operation)

## Change Log

- 1.0.0 (2026-03-01): Initial requirements
