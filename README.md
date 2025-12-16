# Zen CLI

[![npm version](https://img.shields.io/npm/v/@six5536-private/zen.svg)](https://www.npmjs.com/package/@six5536-private/zen)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Generate AI coding agent configuration files from templates with feature flags and conditional output. Zen CLI enables rapid scaffolding of consistent, customizable agent setups across projects.

## Features

- **Template-based generation** — Create agent files from local or remote templates
- **Feature flags** — Conditional content with granular control
- **Smart diffing** — Preview changes before applying
- **Multiple sources** — Local paths, Git repos (GitHub, GitLab, Bitbucket)
- **Zero config** — Works out of the box with sensible defaults
- **TOML configuration** — Optional `.zen.toml` for project-specific settings

## Installation

### Prerequisites

- Node.js 24 or higher

### Install

```bash
npm install -g @six5536-private/zen
```

Or use with npx:

```bash
npx @six5536-private/zen generate
```

## Usage

### Quick Start

Generate agent files with default templates:

```bash
zen generate
```

### Feature Flags

Enable specific features in your templates:

```bash
zen generate --features planning,testing
```

### Custom Templates

Use your own templates from local or remote sources:

```bash
# Local path
zen generate --template ./my-templates --output ./.ai

# GitHub repository
zen generate --template owner/repo

# With subdirectory
zen generate --template owner/repo/templates

# Specific branch or tag
zen generate --template owner/repo#v1.0.0
```

### Preview Changes

Check what would be generated without writing files:

```bash
# Dry run mode
zen generate --dry-run

# Or use diff command
zen diff ./target --template ./templates
```

## Commands

### `zen generate`

Generate AI agent configuration files from templates.

**Options:**

- `-o, --output <path>` — Output directory (default: current directory)
- `-t, --template <source>` — Template source (local path or Git repo)
- `-f, --features <flag>` — Feature flags (repeatable)
- `--force` — Overwrite existing files without prompting
- `--dry-run` — Preview changes without modifying files
- `-c, --config <path>` — Path to configuration file
- `--refresh` — Force refresh of cached Git templates
- `-h, --help` — Display help information
- `-v, --version` — Display version number

### `zen diff`

Compare generated templates against target directory.

**Options:**

- Same as `generate`, minus `--force` and `--dry-run`
- `--list-unknown` — Include files in target not present in templates

Exit code 0 = files match, exit code 1 = differences found.

## Configuration

Create a `.zen.toml` file in your project root:

```toml
output = ".github/agents"
template = "owner/repo"
features = ["planning", "testing"]
refresh = false
```

CLI arguments override configuration file values.

## Templates

### Template Syntax

Templates use [Eta](https://eta.js.org/) syntax for conditional content:

```eta
# <%= it.agentName %>

<% if (it.features.includes('testing')) { %>
## Testing Features
This section appears when 'testing' feature is enabled.
<% } %>

### Enabled Features
<% it.features.forEach(function(feature) { %>
- <%= feature %>
<% }) %>
```

### Partials

Create reusable content blocks in `_partials/`:

```eta
<%~ include('_partials/header', it) %>
```

Files and directories starting with `_` are never output as files.

### Empty Files

Create empty files explicitly using a marker:

```html
<!-- ZEN:EMPTY_FILE -->
```

Templates producing only whitespace are automatically skipped.

## Development

### Setup

```bash
npm install
npm run build
```

### Scripts

- `npm run build` — Build the CLI
- `npm run dev` — Run in development mode
- `npm test` — Run test suite
- `npm run test:coverage` — Run tests with coverage report
- `npm run lint` — Check code with Biome
- `npm run format` — Format code with Biome
- `npm run typecheck` — Type check without building

### Example Commands

```bash
# Generate example template
npm run gen:example

# Generate Zen templates
npm run gen:zen

# Diff Zen templates against current directory
npm run diff:zen
```

## License

[MIT](LICENSE)

## Acknowledgments

- [Eta](https://eta.js.org/) — Lightweight templating engine
- [commander](https://github.com/tj/commander.js) — CLI framework
- [degit](https://github.com/Rich-Harris/degit) — Git repository fetching
