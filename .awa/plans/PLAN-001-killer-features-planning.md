# Killer Features — Detail Planning

STATUS: completed
DIRECTION: top-down

## Context

This meta-plan tracks the creation of 9 detailed feature plans from the brainstorm session. Each plan will fully specify a new awa capability — scope, steps, risks, dependencies, and completion criteria — so that any plan can be picked up and executed independently.

The 9 features span traceability power-ups (A1–A3), visualization (B4), ecosystem (D7–D8), AI-native (E9–E10), and developer experience (12). They share a common foundation: the data already collected by `awa check` (markers, spec IDs, cross-references).

## Steps

### PLAN-002: `awa trace` — Interactive Traceability Explorer (A1)

- [ ] Define scope: query by any ID (requirement, AC, property, component) and display the full chain in both directions
- [ ] Specify output formats: human-readable tree, `--json`, `--depth` control
- [ ] Detail data source: reuse/extend marker-scanner and spec-parser from Check Engine
- [ ] Design reverse-index: AC → code locations, AC → test locations
- [ ] Define CLI interface: `awa trace <ID> [options]`
- [ ] Identify edge cases: partial chains, multiple impls per AC, comma-separated markers
- [ ] Specify exit codes and error handling
- [ ] Outline implementation steps (core index builder, CLI command, formatter)
- [ ] Identify testing strategy: unit tests for index, integration tests for CLI output
- [ ] Assess risks and dependencies on Check Engine internals

### PLAN-003: `awa coverage` — Spec Coverage Report (A2)

- [ ] Define coverage dimensions: REQ→DESIGN, DESIGN→CODE, AC→TEST, overall chain
- [ ] Specify metrics: percentage per dimension, aggregate, per-feature-code breakdown
- [ ] Design output formats: text table, `--json`, `--badge` (SVG generation)
- [ ] Detail data source: aggregate from spec-parser + marker-scanner results
- [ ] Define gap reporting: list uncovered ACs, unimplemented components, untested properties
- [ ] Specify CLI interface: `awa coverage [options]`
- [ ] Design badge output: shield.io-compatible SVG or redirect URL
- [ ] Outline implementation steps (aggregator, formatter, badge generator)
- [ ] Identify testing strategy: fixtures with known coverage gaps
- [ ] Assess risks: how to handle partial specs, features with no design yet

### PLAN-004: `awa impact` — Change Impact Analysis (A3)

- [ ] Define scope: given a requirement/AC/component ID, show all downstream artifacts
- [ ] Specify analysis modes: direct impact, transitive impact, `--if-removed` simulation
- [ ] Design reverse-index structure (shared with `awa trace`)
- [ ] Detail output formats: tree view, `--json`, summary counts
- [ ] Define CLI interface: `awa impact <ID> [options]`
- [ ] Specify transitive traversal: requirement → design components → code files → test files
- [ ] Identify edge cases: circular references, requirements with no downstream artifacts
- [ ] Outline implementation steps (impact analyzer, tree formatter)
- [ ] Identify testing strategy: fixture projects with known dependency chains
- [ ] Assess risks: performance on large codebases, accuracy of transitive analysis

### PLAN-005: `awa graph` — Traceability Graph Visualization (B4)

- [ ] Define scope: generate visual graph of traceability chain
- [ ] Specify output formats: Mermaid (default), DOT/Graphviz, SVG (via Mermaid CLI)
- [ ] Design graph structure: nodes (REQ, DESIGN component, code file, test file), edges (IMPLEMENTS, @awa-impl, @awa-test)
- [ ] Specify filtering: `--scope <CODE>` for single feature, `--show-gaps` for missing links
- [ ] Define CLI interface: `awa graph [options]`
- [ ] Detail node styling: color by type, shape by artifact kind, red for gaps/orphans
- [ ] Specify size management: clustering by feature code, collapsible subgraphs
- [ ] Outline implementation steps (graph builder, Mermaid serializer, DOT serializer)
- [ ] Identify testing strategy: snapshot tests for generated Mermaid/DOT output
- [ ] Assess risks: graph readability for large projects (100+ nodes), Mermaid rendering limits

### PLAN-006: Template Registry / Discovery (D7)

- [ ] Define scope: discover, search, and install community template sets
- [ ] Evaluate registry approaches: GitHub-based index (JSON/YAML in a repo), npm registry tags, custom API
- [ ] Design CLI interface: `awa search <query>`, `awa install <template>`, `awa publish`
- [ ] Specify metadata format: template manifest (name, description, tags, features, author, version)
- [ ] Define discovery UX: search by keyword, tag, language, framework
- [ ] Detail install mechanism: resolve to Git URL, integrate with existing TemplateResolver
- [ ] Specify publish workflow: validation, PR to index repo, or npm publish with awa tag
- [ ] Outline implementation steps (registry client, manifest schema, search command, install command)
- [ ] Identify testing strategy: mock registry, integration with real GitHub repos
- [ ] Assess risks: chicken-and-egg adoption, governance, quality control, spam, maintenance burden

### PLAN-007: `awa plugin` — Extensible Check Rules (D8)

- [ ] Define scope: user-authored JS/TS check plugins loaded at runtime
- [ ] Design plugin API: context object (markers, specs, files), reporting interface, lifecycle hooks
- [ ] Specify plugin resolution: local paths, npm packages, config `[check].plugins` array
- [ ] Define plugin manifest: name, version, description, exported check function
- [ ] Detail execution model: plugins run after built-in checks, findings merged into report
- [ ] Specify API stability contract: semver for plugin API, deprecation warnings
- [ ] Identify edge cases: plugin errors, conflicting findings, async plugins, timeout
- [ ] Outline implementation steps (plugin loader, API types, execution harness, integration with reporter)
- [ ] Identify testing strategy: example plugins, plugin API contract tests
- [ ] Assess risks: API surface area creep, security (arbitrary code execution), maintenance burden of stable API

### PLAN-008: `awa context` — Intelligent Context Assembly (E9)

- [ ] Define scope: assemble optimized context payload for AI agents based on spec chain
- [ ] Specify query modes: by ID (`awa context DIFF-7`), by task (`--task TASK-DIFF-diff-003`), by file (`--file src/core/differ.ts`)
- [ ] Design context selection algorithm: follow traceability links, include referenced specs + relevant code + tests
- [ ] Specify output formats: concatenated Markdown (default), `--json` (structured), `--clipboard` (copy to clipboard)
- [ ] Define relevance ranking: direct references first, transitive second, configurable depth
- [ ] Detail token budget: `--max-tokens <n>` to cap output size, prioritize by relevance
- [ ] Specify integration points: pipe to AI tools, use in prompt templates, MCP server potential
- [ ] Outline implementation steps (context resolver, relevance ranker, output formatter, token estimator)
- [ ] Identify testing strategy: fixture projects, verify correct spec/code inclusion
- [ ] Assess risks: context quality vs. quantity tradeoff, token counting accuracy, keeping up with AI model context limits

### PLAN-009: `awa review` — Spec-Aware Code Review (E10)

- [ ] Define scope: analyze code diffs against the spec chain and report gaps
- [ ] Specify input modes: git staged changes (default), `--pr <number>` (GitHub PR), `--stdin` (piped diff)
- [ ] Design analysis: new code without `@awa-impl`, changed `@awa-impl` code that may need test updates, missing spec updates
- [ ] Specify output formats: text (default), `--json`, `--summary`
- [ ] Define CLI interface: `awa review [options]`
- [ ] Detail GitHub PR integration: fetch diff via API, post findings as PR comment or check
- [ ] Specify severity levels: error (new impl code without marker), warning (changed impl without test update)
- [ ] Outline implementation steps (diff parser, marker analyzer, spec cross-checker, GitHub client, reporter)
- [ ] Identify testing strategy: fixture diffs with known gaps, mock GitHub API
- [ ] Assess risks: git dependency, GitHub API rate limits, false positives on non-impl code changes, scope creep

### PLAN-010: LSP / IDE Integration (12)

- [ ] Define scope: Language Server providing hover, go-to-definition, diagnostics, and autocomplete for awa markers
- [ ] Specify LSP capabilities phase 1: hover on `@awa-*` markers shows requirement/AC text, go-to-definition jumps to spec file
- [ ] Specify LSP capabilities phase 2: diagnostics (red squiggles) for orphaned markers, autocomplete for marker IDs
- [ ] Specify LSP capabilities phase 3: code lens (show linked tests/impls inline), rename refactoring across spec+code
- [ ] Design data model: index of all spec IDs + marker locations, incremental updates on file change
- [ ] Specify supported editors: VS Code extension (primary), generic LSP for Neovim/Emacs/others
- [ ] Detail VS Code extension: activation events, configuration, status bar integration
- [ ] Outline implementation steps (LSP server, spec index, VS Code extension wrapper, incremental file watcher)
- [ ] Identify testing strategy: LSP protocol tests, VS Code extension integration tests
- [ ] Assess risks: very high effort, LSP complexity, multi-editor maintenance, performance on large projects, versioning between CLI and LSP

## Dependencies

- All plans (002–010) depend on understanding the Check Engine internals (marker-scanner, spec-parser, code-spec-checker)
- PLAN-002 (trace), PLAN-004 (impact), PLAN-005 (graph) share a reverse-index data structure — design this once
- PLAN-008 (context) builds on the index from PLAN-002 (trace)
- PLAN-009 (review) builds on PLAN-003 (coverage) gap detection
- PLAN-010 (LSP) reuses the index from PLAN-002 (trace) and diagnostics from Check Engine

## Risks

- Scope creep: each plan could expand into a major feature. Keep plans focused on MVP scope with explicit "out of scope" sections.
- Shared foundation: the reverse-index / traceability index is a shared dependency. If its design is wrong, multiple plans are affected. Design it during PLAN-002 (trace) and validate it against PLAN-004 (impact) and PLAN-005 (graph) before implementing.
- Ordering matters: plans that share data structures should be designed together even if implemented sequentially.

## Completion Criteria

- [x] PLAN-002 created: `awa trace`
- [x] PLAN-003 created: `awa coverage`
- [x] PLAN-004 created: `awa impact`
- [x] PLAN-005 created: `awa graph`
- [x] PLAN-006 created: template registry
- [x] PLAN-007 created: `awa plugin`
- [x] PLAN-008 created: `awa context`
- [x] PLAN-009 created: `awa review`
- [x] PLAN-010 created: LSP / IDE integration

## Change Log

- 001 (2026-03-01): Initial meta-plan from brainstorm session
- 002 (2026-03-01): All 9 detail plans created (PLAN-002 through PLAN-010)
