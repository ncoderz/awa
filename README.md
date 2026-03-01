# awa

[![CI](https://github.com/ncoderz/awa/actions/workflows/test.yaml/badge.svg)](https://github.com/ncoderz/awa/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/@ncoderz/awa.svg)](https://www.npmjs.com/package/@ncoderz/awa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

`Structured, traceable AI development.`

awa is an Agent Workflow for AIs. It provides a Spec-Driven Design (SDD) workflow with full end-to-end traceability, with tools to enforced consistency and help the AI follow the connections. It is also a powerful templating tool for agent configuration files.

> awa was written by awa (AI-assisted development using its own workflows). The workflows themselves are designed and crafted by a human who uses Copilot. If something is wrong, let's fix it together.

**[Documentation](https://awa.ncoderz.com)** · **[Quick Start](https://awa.ncoderz.com/guides/quick-start/)** · **[CLI Reference](https://awa.ncoderz.com/reference/cli/)**

## The Problem

AI agents produce output that looks right but isn't connected. Requirements live in one place, implementation in another, tests in a third — nothing links them. The AI doesn't know when it has drifted from the original intent. You don't either, until something breaks.

Agent configuration files diverge too: copy-pasted between projects, modified by hand, silently out of date.

## How awa Solves It

awa provides a structured SDD workflow:

```
ARCHITECTURE → FEAT → REQUIREMENTS → DESIGN → TASKS → CODE & TESTS → DOCUMENTATION
```

Every code and test artifact carries an explicit traceability marker (`@awa-impl`, `@awa-test`, `@awa-component`) that links it back to its originating requirement and acceptance criterion. Any line of code traces back to why it was written. Any requirement traces forward to the tests that verify it.

`awa check` enforces this chain — validating spec structure via YAML schemas and ensuring every acceptance criterion maps to code and tests. `awa trace` assembles the chain into context so AI agents can navigate it rather than guess.

Agent configuration files are generated from **templates** — and can be added to your project or updated consistently with a single `awa init` call.

## SDD & Traceability Features

- **Structured workflow with full traceability** - every requirement, acceptance critera and property test has an ID, every line of code links back via `@awa-component`, `@awa-impl` and `@awa-test` code markers
- **`awa check`** - allows AI or humans to enforces spec structure via YAML schemas, and to validate traceability markers against spec IDs
- **`awa trace`** - allows AI or humans to explore traceability chains and quickly assemble context from specs, code, and tests
- **Agent-agnostic** - Copilot, Claude, Cursor, Windsurf, and more from a single template set

## Template Bootstrap Features

- **[Eta](https://eta.js.org/) templates** with conditionals, loops, and partials for AI configuration files
- **Feature flags and presets** — turn content on/off per project
- **Template overlays** — layer customizations without forking
- **`awa template diff`** — shows exactly what changed before you commit; `--watch` re-diffs on template changes
- **`awa template test`** — verifies templates against fixtures and snapshots
- **`awa template features`** — discovers available feature flags and presets
- **Multi-target configuration** — for generating different agent setups in one command
- **Git or local** — template sources (GitHub, GitLab, Bitbucket, or local path)
- **`--json` and `--summary`** — flags for CI integration

See the **[full documentation](https://awa.ncoderz.com)** for details.

## Quick Start

### Install

```bash
npm install -g @ncoderz/awa
```

Or use with npx:

```bash
npx @ncoderz/awa init .
```

### Initialise Project

```bash
# Current directory, default template
awa init .

# With specific features
awa init . --features copilot claude cursor
```


See the **[Quick Start guide](https://awa.ncoderz.com/guides/quick-start/)** for more.

## Related Tools

Several tools address AI-assisted development workflows. Each brings different strengths:

| Tool | Description | Runtime |
|---|---|---|
| **awa** | Templated agent config generation with spec-driven workflow and traceability | Node + CLI |
| **[Kiro](https://kiro.dev)** | IDE with built-in spec-driven development and agent hooks | Standalone IDE + CLI |
| **[Spec Kit](https://github.com/github/spec-kit)** | Python CLI for structured specs with broad agent support (18+) | Python 3.11+ / uv |
| **[BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD)** | Agile workflow with role-based AI personas | Shell / Python / yq |
| **[AI RPI Protocol](https://github.com/MiguelAxcar/ai-rpi-protocol)** | Zero-dependency markdown rules for disciplined AI development | None (markdown only) |

### What each tool does well

- **Kiro** — Deep IDE integration with agent hooks that trigger on file save, giving a seamless spec-driven experience without leaving your editor
- **Spec Kit** — Supports 18+ agents out of the box and brings GitHub's backing; great if you work in Python and want broad compatibility
- **BMAD Method** — Role-based AI personas (architect, PM, developer) that mirror agile team structures, useful for larger or more formal projects
- **AI RPI Protocol** — Works instantly with no tooling to install; a simple, proven mental model for disciplined AI-assisted development

### Where awa fits

awa focuses on two things other tools don't combine: **end-to-end traceability** (every line of code links back to a requirement via `@awa-impl` / `@awa-test` markers, validated by `awa check`) and **templateable agent configuration** (feature flags, presets, overlays, diff detection). It's agent-agnostic — one template set generates config for Copilot, Claude, Cursor, Windsurf, and more.


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

## Community

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Maintainers](MAINTAINERS.md)
- [Funding](.github/FUNDING.yml)

## License

© 2025-26 ncoderz Ltd. Released under the [MIT License](LICENSE).

## Acknowledgments

- [Eta](https://eta.js.org/) — Lightweight templating engine
- [commander](https://github.com/tj/commander.js) — CLI framework
- [degit](https://github.com/Rich-Harris/degit) — Git repository fetching
