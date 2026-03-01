# awa

[![CI](https://github.com/ncoderz/awa/actions/workflows/test.yaml/badge.svg)](https://github.com/ncoderz/awa/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/@ncoderz/awa.svg)](https://www.npmjs.com/package/@ncoderz/awa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

`Supercharge your AI development.`

awa is an Agent Workflow for AIs. It is also a CLI tool to powerfully manage agent workflow files using templates, awa's or yours.

> awa was written by awa (AI-assisted development using its own workflows). The workflows themselves are designed and crafted by a human who uses Copilot. If something is wrong, let's fix it together.

**[Documentation](https://awa.ncoderz.com)** · **[Quick Start](https://awa.ncoderz.com/guides/quick-start/)** · **[CLI Reference](https://awa.ncoderz.com/reference/cli/)**

## The Problem

Divergence.

Developing with AI agents requires process. Configuration files that define this process get copy-pasted between projects, then diverge. Requirements live in one place, implementation in another, tests in a third — nothing connects them. They diverge too.

Without structure, work drifts and nobody, including the AI, can trace what happened or why.

## How awa Solves It

awa does two thing. Firstly, it generates agent configuration files from **templates**. Secondly, the generated output includes a powerful spec-driven development workflow with full traceability:

```
ARCHITECTURE → FEAT → REQUIREMENTS → DESIGN → TASKS → CODE & TESTS → DOCUMENTATION
```

Every code and test artifact traces back to its requirement and acceptance criteria origin through explicit markers (`@awa-impl`, `@awa-test`, `@awa-component`). Any line of code traces back to the requirement that motivated it. Any requirement traces forward to the tests that verify it.

Not only this, but awa actively checks that specs match a high quality schema, and that all requirements and acceptance criteria map to code and tests. This helps guide the AI to produce higher quality output.

## Workflow Features

- **Structured workflow with full traceability** - every requirement, acceptance critera and property test has an ID, every line of code links back via `@awa-component`, `@awa-impl` and `@awa-test` code markers
- **`awa check`** - allows AI or humans to enforces spec structure via YAML schemas, and to validate traceability markers against spec IDs
- **`awa trace`** - allows AI or humans to explore traceability chains and quickly assemble context from specs, code, and tests
- **Agent-agnostic** - Copilot, Claude, Cursor, Windsurf, and more from a single template set

## Template Features

- **[Eta](https://eta.js.org/) templates** with conditionals, loops, and partials for AI configuration files
- **Feature flags and presets** - to turn content on/off per project
- **Template overlays** - to layer customizations without forking
- **`awa template diff`** - shows exactly what changed before you commit; `--watch` re-diffs on template changes
- **`awa template test`** - verifies templates against fixtures and snapshots
- **`awa template features`** - discovers available feature flags and presets
- **Multi-target configuration** - for generating different agent setups in one command
- **Git or local** - template sources — GitHub, GitLab, Bitbucket, or local path
- **`--json` and `--summary`** - flags for CI integration

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
| **AI Instructions Drift detection** | ✅ `awa template diff` shows what changed vs. templates | ❌ | ❌ | ❌ | ⚠️ Manual compliance checklist | ❌ |
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
