# Zen CLI

> TypeScript CLI tool for generating AI coding agent configuration files

## Installation

```bash
npm install -g @zen/cli
```

Or use with npx:

```bash
npx @zen/cli generate
```

## Quick Start

Generate agent files with default templates:

```bash
zen generate
```

With feature flags:

```bash
zen generate --features planning --features testing
```

Custom template and output:

```bash
zen generate --template ./my-templates --output ./output
```

## Commands

### `zen generate`

Generate AI agent configuration files from templates.

**Options:**

- `-o, --output <path>` - Output directory (default: current directory)
- `-t, --template <source>` - Template source (local path or Git repo)
- `-f, --features <flag>` - Feature flags (can be used multiple times)
- `--force` - Overwrite existing files without prompting
- `--dry-run` - Preview changes without modifying files
- `-c, --config <path>` - Path to configuration file
- `--refresh` - Force refresh of cached Git templates
- `-h, --help` - Display help information
- `-v, --version` - Display version number

## Configuration

Create a `.zen.toml` file in your project root:

```toml
output = ".github/agents"
template = "owner/repo"
features = ["planning", "testing"]
force = false
dry-run = false
refresh = false
```

CLI arguments override configuration file values.

## Templates

### Local Templates

```bash
zen generate --template ./templates
zen generate --template /absolute/path/to/templates
```

### Git Templates

```bash
# GitHub shorthand
zen generate --template owner/repo

# With subdirectory
zen generate --template owner/repo/templates

# With branch/tag/commit
zen generate --template owner/repo#main

# Full URLs
zen generate --template https://github.com/owner/repo
zen generate --template git@github.com:owner/repo
```

### Template Syntax

Templates use [Eta](https://eta.js.org/) syntax:

```eta
# <%= it.agentName %>

<% if (it.features.includes('testing')) { %>
## Testing Features
This section appears when 'testing' feature is enabled.
<% } %>

<% it.features.forEach(function(feature) { %>
- <%= feature %>
<% }) %>
```

### Partials

Create reusable fragments in `_partials/`:

```eta
<%~ include('_partials/header', it) %>
```

Files/directories starting with `_` are never output.

### Empty Files

Create empty files explicitly:

```html
<!-- ZEN:EMPTY_FILE -->
```

Otherwise, templates producing only whitespace are skipped.

## Development

### Setup

```bash
npm install
npm run build
```

### Scripts

- `npm run build` - Build the CLI
- `npm run dev` - Build in watch mode
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run typecheck` - Type check without building

### Testing

```bash
npm test
```

## License

MIT
