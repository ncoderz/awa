# awa

[![CI](https://github.com/ncoderz/awa/actions/workflows/test.yaml/badge.svg)](https://github.com/ncoderz/awa/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/@ncoderz/awa.svg)](https://www.npmjs.com/package/@ncoderz/awa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

`Supercharge your AI development.`

awa is an Agent Workflow for AIs. It is also a CLI tool to powerfully manage agent workflow files using templates, awa's or yours.

> awa was written by awa (AI-assisted development using its own workflows). The workflows themselves are designed and crafted by a human who uses Copilot. If something is wrong, let's fix it together.


## The Problem

Divergence.

Developing with AI agents requires process. Configuration files that define this process get copy-pasted between projects, then diverge. Requirements live in one place, implementation in another, tests in a third — nothing connects them. They diverge too.

Without structure, work drifts and nobody, including the AI, can trace what happened or why.

## How awa Solves It

awa generates agent configuration files from **templates**. The generated output includes a powerful spec-driven development workflow with full traceability:

```
ARCHITECTURE → FEAT → REQUIREMENTS → DESIGN → TASKS → CODE & TESTS → DOCUMENTATION
```

Every code and test artefect traces back to its requirement and acceptance criteria origin through explicit markers (`@awa-impl`, `@awa-test`, `@awa-component`). Any line of code traces back to the requirement that motivated it. Any requirement traces forward to the tests that verify it.

Not only this, but awa actively checks that specs match a high quality schema, and that all requirements and acceptance criteria map to code and tests. This helps guide the AI to produce higher quality output.

## Features

### Workflow & Traceability

- Structured but flexible workflow from architecture through features, requirements, design, tasks, code, tests, and docs
- Requirements written in [EARS format](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax) (INCOSE) — structured, testable, unambiguous
- Every requirement has an ID, every line of code links back to it via `@awa-impl` and `@awa-test` markers
- `awa check` checks that specs match their schemas, and that all traceability markers resolve to real spec IDs. Any acceptance criteria missing tests are flagged to the AI automatically
- All AI orchestration documents all live in `.awa/`

See [Workflow](docs/WORKFLOW.md) for the full workflow and traceability chain.

### CLI & Template Engine

The awa CLI can be used to update your AI guiding files such as AGENTS.md automatically from templates, making it easy to keep them up-to-date and in-sync for every project.

- [Eta](https://eta.js.org/) templates with conditionals, loops, and partials allow templating AI files (and other project files if you wish)
- Pull templates from GitHub, GitLab, Bitbucket, or use a local path
- Optional `.awa.toml` config, or just use CLI flags
- Feature flags and presets to turn content on/off per project
- `awa check` validates traceability markers against spec IDs and enforces spec file structure via YAML schemas
- Template overlays (`--overlay`) allow layering custom files over a base template without forking it
- `awa diff` shows exactly what has changed in a template before applying it to your project; `--watch` re-diffs on template changes, making template development easy
- `awa test` verifies templates produce expected output across feature combinations by automatically diffing against fixture files
- `awa features` discovers available feature flags and presets in a template
- `--json` flag for machine-readable output in CI pipelines
- `--summary` flag for compact one-line counts output

See [CLI Reference](docs/CLI.md), [Template Engine](docs/TEMPLATE_ENGINE.md), [Template Testing](docs/TEMPLATE_TESTING.md), and [Schema Rules](docs/SCHEMA_RULES.md) for details.

## Quick Start

### Install

```bash
npm install -g @ncoderz/awa
```

Or use with npx:

```bash
npx @ncoderz/awa init .
```

### Generate

Generate files into the current directory using the bundled default template:

```bash
awa init .
```

Generate with specific features enabled:

```bash
awa init . --features copilot claude cursor
```

Generate to a specific output directory:

```bash
awa init ./my-project
```

### Preview Changes

See what would change without writing files:

```bash
awa diff .
```

Watch for template changes and re-diff automatically:

```bash
awa diff . --watch
```

Apply any template configured file deletions (disabled by default):

```bash
awa init . --delete
```

Layer custom files over the base template with overlays:

```bash
awa init . --overlay ./my-overrides
```

### Validate

Check traceability markers and spec file structure:

```bash
awa check
```

### Test Templates

Verify templates produce expected output across feature combinations:

```bash
awa test
```

### Discover Features

List all feature flags available in a template:

```bash
awa features
awa features --json   # machine-readable output
```

## The `.awa/` Directory

Each workflow stage produces artifacts in `.awa/`:

```
.awa/
├── specs/
│   ├── ARCHITECTURE.md              # System overview
│   ├── FEAT-{CODE}-*.md             # Feature context & motivation
│   ├── EXAMPLES-{CODE}-*-{nnn}.md   # Usage examples per feature
│   ├── REQ-{CODE}-*.md              # Requirements (EARS format)
│   ├── DESIGN-{CODE}-*.md           # Design & components
│   └── API-{CODE}-*.tsp             # TypeSpec API definitions
├── tasks/
│   └── TASK-{CODE}-*-{nnn}.md       # Implementation steps
├── plans/
│   └── PLAN-{nnn}-*.md              # Ad-hoc plans
├── align/
│   └── ALIGN-{x}-WITH-{y}-{nnn}.md  # Alignment reports
└── rules/
    └── *.md                         # Project-specific rules
```

## The Traceability Chain

Every artifact links to its origin through IDs and markers:

```
REQ-{CODE}-*.md
  └── {CODE}-1: Requirement title
        └── {CODE}-1_AC-1: Acceptance criterion
                │
                ▼
DESIGN-{CODE}-*.md
  └── {CODE}-ComponentName
        ├── IMPLEMENTS: {CODE}-1_AC-1
        └── {CODE}_P-1: Correctness property
                │
                ▼
Source code
  └── // @awa-component: {CODE}-ComponentName
      └── // @awa-impl: {CODE}-1_AC-1
                │
                ▼
Tests
  ├── // @awa-test: {CODE}_P-1        ← verifies property
  └── // @awa-test: {CODE}-1_AC-1     ← verifies acceptance criterion
```

Every link is explicit. Nothing is implied.

See [Workflow](docs/WORKFLOW.md) for IDs, markers, and how to read a trace.

## CI Integration

Use `--json` for structured output in CI pipelines, or `--summary` for compact build-log output:

```bash
# Detect template drift (exit code 1 = differences found)
awa diff . --json > diff-result.json

# Compact summary for build logs
awa diff . --summary
# Output: changed: 2, new: 1, matching: 10, deleted: 0

# Validate traceability
awa check --format json > check-result.json
```

See [CI Integration](docs/CLI.md#ci-integration) in the CLI reference for JSON output formats.

## Exit Codes

| Command | 0 | 1 | 2 |
|---------|---|---|---|
| `awa init` / `awa generate` | Success | — | Internal error |
| `awa diff` | All files match | Differences found | Internal error |
| `awa check` | All checks pass | Errors found | Internal error |
| `awa test` | All fixtures pass | Failures found | Internal error |
| `awa features` | Success | Error | — |

## Documentation

| Document | Description |
|----------|-------------|
| [Workflow](docs/WORKFLOW.md) | The awa workflow, `.awa/` structure, traceability chain, IDs and markers |
| [CLI Reference](docs/CLI.md) | Commands, options, configuration, presets, and how it works |
| [Template Engine](docs/TEMPLATE_ENGINE.md) | Template sources, Eta syntax, partials, file handling, delete lists |
| [Template Testing](docs/TEMPLATE_TESTING.md) | The `awa test` command, fixture format, snapshots, CI setup |
| [Traceability Check](docs/TRACEABILITY_CHECK.md) | The `awa check` command, checks, configuration, JSON output |
| [Schema Rules](docs/SCHEMA_RULES.md) | Declarative YAML rules for validating spec file structure |

## Community

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Maintainers](MAINTAINERS.md)
- [Funding](.github/FUNDING.yml)

## Alternatives

Several tools address parts of the AI-assisted development workflow. Here's how they compare:

| | awa | [Kiro](https://kiro.dev) | [Spec Kit](https://github.com/github/spec-kit) | [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) | [AI RPI Protocol](https://github.com/MiguelAxcar/ai-rpi-protocol) | Manual files |
|---|---|---|---|---|---|---|
| **What it is** | CLI that generates agent config from templates | IDE with built-in spec-driven development | Python CLI for Spec-Driven Development | Agile workflow with role-based AI skills | Markdown rules for AI behavior governance | Hand-written CLAUDE.md, .cursorrules, etc. |
| **Structured workflow** | Architecture →</br> Features →</br> Requirements →</br> Design →</br> Tasks →</br> Code & Tests →</br> Docs | Requirements →</br> Design →</br> Tasks | Specify →</br> Plan →</br> Tasks →</br> Implement | Analysis →</br> Planning →</br> Solutioning →</br> Implementation | Research →</br> Plan →</br> Implement | Whatever you put in the file |
| **Workflow flexibility** | ✅ Start at any stage, skip what's not needed | ⚠️ Two variants (Req-First or Design-First), always 3 phases | ⚠️ Optional clarify/analyze steps, otherwise fixed order | ⚠️ Project levels determine required phases | ⚠️ Hard gates between phases, escape commands to bypass | ✅ No workflow to constrain you |
| **Traceability** | ✅ Requirement IDs →</br> design →</br> `@awa-impl` / `@awa-test` code markers</br> + `awa check` | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Template engine** | ✅ Eta with conditionals, loops, partials | ❌ | ❌ Static templates copied on init | ❌ Static skill files | ❌ Static markdown | ❌ |
| **Feature flags** | ✅ Enable/disable content per project | ❌ | ❌ | ❌ | ⚠️ Lite/Full modes | ❌ |
| **Presets** | ✅ Named flag bundles | ❌ | ❌ | ⚠️ Complexity levels | ⚠️ Operation levels | ❌ |
| **AI Instructions Drift detection** | ✅ `awa diff` shows what changed vs. templates | ❌ | ❌ | ❌ | ⚠️ Manual compliance checklist | ❌ |
| **Re-generation** | ✅ Generates from templates on every run | ❌ Specs created per feature | ❌ One-time `specify init` | ❌ One-time install | ❌ One-time copy | ❌ One-time manual creation |
| **Agent hooks** | ❌ | ✅ Event-driven agent triggers on file save | ❌ | ❌ | ❌ | ❌ |
| **Built-in IDE** | ❌ | ✅ VS Code-compatible IDE | ❌ | ❌ | ❌ | ❌ |
| **Runtime** | Node + CLI | Standalone IDE + CLI | Python 3.11+ / uv | Shell / Python / yq | None (markdown only) | None |
| **Agent support** | Agent-agnostic (generate config for any agent) | Kiro only | 18+ agents | Codex-focused | Cursor, VS Code, Claude Code, Windsurf | One agent at a time |


## Development

### Prerequisites

- Node.js 24+
- npm

### Setup

```bash
npm install
npm run build
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production (`dist/`) |
| `npm run dev` | Run CLI in development mode |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run check` | Run `awa check` on this project |
| `npm run lint` | Check code with Biome |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Biome |
| `npm run typecheck` | TypeScript type checking |
| `npm run gen:example` | Generate example template to `outputs/example` |
| `npm run gen:awa` | Generate awa templates to `outputs/awa` |
| `npm run gen:awa:this` | Generate awa templates to current directory |
| `npm run diff:awa:this` | Diff awa templates against current directory |



## License

© 2025-26 ncoderz Ltd. Released under the [MIT License](LICENSE).

## Acknowledgments

- [Eta](https://eta.js.org/) — Lightweight templating engine
- [commander](https://github.com/tj/commander.js) — CLI framework
- [degit](https://github.com/Rich-Harris/degit) — Git repository fetching
