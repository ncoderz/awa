# Traceability Explorer [INFORMATIVE]

## Problem

awa's traceability chain links requirements, design, code, and tests through explicit IDs and markers. The `awa check` command validates these links exist but provides no way to navigate or exploit them. A developer looking at an AC ID must manually grep spec files, source code, and tests to trace the chain. An AI coding agent has no way to receive exactly the specs, code, and tests relevant to its current task.

## Conceptual Model

`awa trace` makes the traceability chain queryable and actionable. Given any ID, task file, source file, or the entire project, it displays the chain as a location tree or assembles actual file content optimized for AI context windows.

Key abstractions:

- TRACE INDEX: An in-memory graph of relationships between requirement IDs, acceptance criteria, design components, code markers, and test markers. Built from the same data `awa check` collects.
- CHAIN: The full path from a requirement down to tests (forward) or from a test up to a requirement (reverse) for a given ID.
- CONTENT ASSEMBLY: Reading actual file sections (spec headings, code blocks) rather than just listing locations, with configurable context windows around code markers.
- TOKEN BUDGET: A cap on assembled content size, with priority-based truncation so the most important context fits first.

Users think of trace as a search tool: give it an ID and it shows everything related. Give it a task file and it assembles the context an AI agent needs. Give it `--all` and it dumps the full traceability map.

## Scenarios

### Scenario 1: Tracing an Acceptance Criterion

A developer is implementing a feature and wants to understand what is expected for a specific acceptance criterion. They run `awa trace DIFF-1` and see the requirement, the design component that implements it, the source files with implementation markers, and the test files that verify it.

### Scenario 2: Assembling Context for AI

An AI coding agent is assigned a task file. The orchestrator runs `awa trace --task TASK-DIFF-diff-001.md --content --max-tokens 4000` and feeds the output into the agent's context window. The agent receives the relevant requirements, design, code, and tests without needing to search itself.

### Scenario 3: Finding All Markers in a File

A developer refactored a source file and wants to know what traceability IDs it covers. They run `awa trace --file src/core/differ.ts` and see every chain connected to that file's markers.

### Scenario 4: Full Project Marker Listing

A team lead wants to see the full traceability map. They run `awa trace --all --json` to get a structured dump of every known ID and its chain, suitable for dashboards or auditing.

### Scenario 5: Controlling Code Context Size

A developer wants more code context around markers when assembling content. They run `awa trace DIFF-1 --content -C 40` to get 40 lines before and after each code marker, or `-A 50 -B 3` for an asymmetric window.

## Glossary

- TRACE INDEX: In-memory graph mapping all traceability relationships
- CHAIN: The resolved path of nodes (requirement, AC, component, code, test) for an ID
- CONTENT ASSEMBLY: Extracting actual file sections for assembled output
- TOKEN BUDGET: Maximum estimated tokens for content mode output

## Change Log

- 1.0.0 (2026-03-01): Initial feature context
