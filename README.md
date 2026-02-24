# awa

[![CI](https://github.com/ncoderz/awa/actions/workflows/test.yaml/badge.svg)](https://github.com/ncoderz/awa/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/awa.svg)](https://www.npmjs.com/package/awa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

`Supercharge your AI development.`

awa is an Agent Workflow for AIs. It is also a CLI tool to powerfully manage agent workflow files using templates, awa's or yours.

> awa was written by awa (AI-assisted development using its own workflows). The workflows themselves are designed and crafted by a human who uses Copilot. If something is wrong, let's fix it together.


## The Problem

Divergence.

Developing with AI agents requires process. Configuration files that define this process get copy-pasted between projects, then diverge. Requirements live in one place, implementation in another, tests in a third — nothing connects them. They diverge too.

Without structure, work drifts and nobody, including the AI, can trace what happened or why.

## How awa Solves It

awa generates agent configuration files from **templates** with **feature flags**. The generated output includes a spec-driven development workflow with full traceability:

```
ARCHITECTURE → FEAT → REQUIREMENTS → DESIGN → TASKS → CODE & TESTS → DOCUMENTATION
```

Every artifact traces back to its origin through explicit markers (`@awa-impl`, `@awa-test`, `@awa-component`). Any line of code traces back to the requirement that motivated it. Any requirement traces forward to the tests that verify it.

## Features

### Workflow & Traceability

- Structured workflow from architecture through features, requirements, design, tasks, code, tests, and docs
- Requirements written in [EARS format](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax) (INCOSE) — structured, testable, unambiguous
- Every requirement has an ID, every line of code links back to it via `@awa-impl` and `@awa-test` markers
- Spec artifacts (requirements, designs, tasks, plans, rules) all live in `.awa/`

See [Workflow](docs/WORKFLOW.md) for the full workflow and traceability chain.

### CLI & Template Engine

- [Eta](https://eta.js.org/) templates with conditionals, loops, and partials
- Feature flags and presets to turn content on/off per project
- `awa diff` shows exactly what changed before you commit
- Pull templates from GitHub, GitLab, Bitbucket, or use a local path
- Optional `.awa.toml` config, or just use CLI flags

See [CLI Reference](docs/CLI.md) and [Template Engine](docs/TEMPLATE_ENGINE.md) for details.

## Quick Start

### Install

```bash
npm install -g awa
```

Or use with npx:

```bash
npx awa generate .
```

### Generate

Generate files into the current directory using the bundled default template:

```bash
awa generate .
```

Generate with specific features enabled:

```bash
awa generate . --features copilot claude cursor
```

Generate to a specific output directory:

```bash
awa generate ./my-project
```

### Preview Changes

See what would change without writing files:

```bash
awa diff .
```

Apply any template configured file deletions (disabled by default):

```bash
awa generate . --delete
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

## Documentation

| Document | Description |
|----------|-------------|
| [Workflow](docs/WORKFLOW.md) | The awa workflow, `.awa/` structure, traceability chain, IDs and markers |
| [CLI Reference](docs/CLI.md) | Commands, options, configuration, presets, and how it works |
| [Template Engine](docs/TEMPLATE_ENGINE.md) | Template sources, Eta syntax, partials, file handling, delete lists |

## Community

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Maintainers](MAINTAINERS.md)
- [Funding](.github/FUNDING.yml)

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
| `npm run lint` | Check code with Biome |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Biome |
| `npm run typecheck` | TypeScript type checking |
| `npm run gen:example` | Generate example template to `outputs/example` |
| `npm run gen:awa` | Generate awa templates to `outputs/awa` |
| `npm run gen:awa:this` | Generate awa templates to current directory |
| `npm run diff:awa` | Diff awa templates against current directory |

## Alternatives

Several tools address parts of the AI-assisted development workflow. Here's how they compare:

| | awa | [Kiro](https://kiro.dev) | [Spec Kit](https://github.com/github/spec-kit) | [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) | [AI RPI Protocol](https://github.com/MiguelAxcar/ai-rpi-protocol) | Manual files |
|---|---|---|---|---|---|---|
| **What it is** | CLI that generates agent config from templates | IDE with built-in spec-driven development | Python CLI for Spec-Driven Development | Agile workflow with role-based AI skills | Markdown rules for AI behavior governance | Hand-written CLAUDE.md, .cursorrules, etc. |
| **Structured workflow** | Architecture →</br> Features →</br> Requirements →</br> Design →</br> Tasks →</br> Code & Tests →</br> Docs | Requirements →</br> Design →</br> Tasks | Specify →</br> Plan →</br> Tasks →</br> Implement | Analysis →</br> Planning →</br> Solutioning →</br> Implementation | Research →</br> Plan →</br> Implement | Whatever you put in the file |
| **Workflow flexibility** | ✅ Start at any stage, skip what's not needed | ⚠️ Two variants (Req-First or Design-First), always 3 phases | ⚠️ Optional clarify/analyze steps, otherwise fixed order | ⚠️ Project levels determine required phases | ⚠️ Hard gates between phases, escape commands to bypass | ✅ No workflow to constrain you |
| **Traceability** | ✅ Requirement IDs →</br> design →</br> `@awa-impl` / `@awa-test` code markers | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Template engine** | ✅ Eta with conditionals, loops, partials | ❌ | ❌ Static templates copied on init | ❌ Static skill files | ❌ Static markdown | ❌ |
| **Feature flags** | ✅ Enable/disable content per project | ❌ | ❌ | ❌ | ⚠️ Lite/Full modes | ❌ |
| **Presets** | ✅ Named flag bundles | ❌ | ❌ | ⚠️ Complexity levels | ⚠️ Operation levels | ❌ |
| **AI Instructions Drift detection** | ✅ `awa diff` shows what changed vs. templates | ❌ | ❌ | ❌ | ⚠️ Manual compliance checklist | ❌ |
| **Re-generation** | ✅ Generates from templates on every run | ❌ Specs created per feature | ❌ One-time `specify init` | ❌ One-time install | ❌ One-time copy | ❌ One-time manual creation |
| **Agent hooks** | ❌ | ✅ Event-driven agent triggers on file save | ❌ | ❌ | ❌ | ❌ |
| **Built-in IDE** | ❌ | ✅ VS Code-compatible IDE | ❌ | ❌ | ❌ | ❌ |
| **Runtime** | Node + CLI | Standalone IDE + CLI | Python 3.11+ / uv | Shell / Python / yq | None (markdown only) | None |
| **Agent support** | Agent-agnostic (generate config for any agent) | Kiro only | 18+ agents | Codex-focused | Cursor, VS Code, Claude Code, Windsurf | One agent at a time |



## License

[MIT](LICENSE)

## Acknowledgments

- [Eta](https://eta.js.org/) — Lightweight templating engine
- [commander](https://github.com/tj/commander.js) — CLI framework
- [degit](https://github.com/Rich-Harris/degit) — Git repository fetching
