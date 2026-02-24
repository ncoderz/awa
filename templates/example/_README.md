# awa CLI Templates

This directory contains the default templates bundled with awa CLI.

## Structure

- `agent.md` - Main agent configuration template
- `_partials/` - Reusable template fragments (not output directly)
- `.github/agents/` - Example nested directory structure

## Template Syntax

Templates use [Eta](https://eta.js.org/) syntax:

- `<%= expression %>` - Output expression (escaped)
- `<%~ expression %>` - Output expression (raw/unescaped)
- `<% code %>` - Control flow (if/else, loops, etc.)

## Available Context

Templates receive a `features` array via `it.features`:

```eta
<% if (it.features.includes('feature-name')) { %>
  Content for feature-name
<% } %>
```

## Empty File Marker

To create an empty file explicitly, use:

```html
<!-- AWA:EMPTY_FILE -->
```

## Partials

Include partials from `_partials/`:

```eta
<%~ include('_partials/planning', it) %>
```
