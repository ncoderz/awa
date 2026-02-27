# Usage Examples: Template Engine [INFORMATIVE]

## Prerequisites

- Node.js 20 or higher
- awa CLI installed globally

## Example 1: Basic Generation

Generate configuration files with default settings.

```bash
awa generate
```

EXPECTED OUTPUT:

```
Created .github/agents/copilot.md
Created .github/agents/claude.md
```

## Example 2: Feature Flags

Enable specific features when generating.

```bash
awa generate --features copilot,claude,cursor
```

## Example 3: Custom Template Source

Use a Git repository as the template source.

```bash
awa generate --template owner/repo --features copilot
```

## Change Log

- 1.0.0 (2025-01-10): Initial examples
