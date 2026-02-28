---
title: Template Engine
description: Learn how to write awa templates using Eta — conditionals, loops, partials, and file handling.
---

awa uses [Eta](https://eta.js.org/) as its template engine. Templates are plain files that can render conditionally based on feature flags, include partials, and declare stale files to delete.

## Quick Overview

- Templates are rendered with context `{ features }` and accessed via `it.features`
- File and directory names are mirrored into the output (except underscore-prefixed paths)
- Whitespace-only output is skipped; `<!-- AWA:EMPTY_FILE -->` creates an intentional empty file
- `_delete.txt` supports post-generation cleanup, including feature-gated sections

## Syntax

Templates receive a context object `it` with a `features` array containing the resolved feature flags.

### Feature Flags

```html
<% if (it.features.includes('copilot')) { %>
<%~ include('_partials/copilot.instructions', it) %>
<% } %>
```

Feature names are treated as plain strings. awa does not enforce a fixed list at render time.

### Conditionals

```html
<% if (it.features.includes('testing')) { %>
## Testing
This section appears only when 'testing' is enabled.
<% } %>
```

### Loops

```html
<% it.features.forEach(function(feature) { %>
- <%= feature %>
<% }) %>
```

### Output Tags

| Tag | Behaviour |
|-----|-----------|
| `<%= expr %>` | Output, HTML-escaped |
| `<%~ expr %>` | Output, raw (unescaped) |
| `<% code %>` | Execute JavaScript, no output |

## Partials

Reusable content blocks live in `_partials/`. Include them with:

```html
<%~ include('_partials/header', it) %>
```

Partials receive the same context as the parent template. Use `_partials/` so they are excluded from generated output.

## File Handling

### Naming

Template filenames map directly to output filenames — there is no `.eta` extension stripping. The directory structure is mirrored as-is.

### Underscore Convention

Files and directories starting with `_` are never written to the output directory:

- `_partials/` — shared content blocks
- `_delete.txt` — delete list
- `_README.md` — template documentation (not output)

### Empty Output

- A template that renders to only whitespace → file is skipped (not created)
- A template that renders exactly `<!-- AWA:EMPTY_FILE -->` (after trim) → an empty file is created intentionally

## Delete Lists

Place a `_delete.txt` in the template root to declare files that should be removed from the output directory after generation.

```text
# One path per line, relative to output directory
old-agent.md
deprecated/config.md
```

Rules:

- Deletions are only applied when `--delete` is enabled (or `delete = true` in config)
- Deletions happen after file generation
- Files that don't exist in output are silently skipped
- Files that conflict with generated files are skipped with a warning
- `--force` deletes without prompting
- `--dry-run` logs deletions without executing

### Feature-Gated Delete Sections

Use `# @feature` sections to delete stale files only when specific features are not active:

```text
# @feature copilot
.github/copilot-instructions.md

# @feature claude cursor
CLAUDE.md
```

For a `# @feature` section, each listed path is deleted only when **none** of the listed features are active.

Any non-`@feature` comment resets the current feature gate section.

## Template Directory Layout

A typical template directory:

```
my-templates/
├── _partials/
│   ├── header.md
│   └── workflow.md
├── _delete.txt
├── _README.md
├── .github/
│   ├── agents/
│   │   └── awa.agent.md
│   └── prompts/
│       ├── awa.code.prompt.md
│       └── awa.design.prompt.md
└── .awa/
    └── rules/
        └── conventions.md
```

## Best Practices

- Keep templates deterministic: same inputs should produce same outputs
- Put reusable blocks in `_partials/` instead of duplicating content
- Keep `_delete.txt` focused on stale output paths and document intent with comments
- Test template changes with `awa diff . --template <path>` before writing changes
- Use `--dry-run` and `--delete` together when validating cleanup behavior
- Use `awa test` with snapshot fixtures to catch template regressions in CI

## Overlays

Overlays let you layer additional files on top of a base template without modifying it. Each overlay directory is merged over the base template (last overlay wins for conflicting paths).

```bash
awa generate . --overlay ./overlays/company --overlay ./overlays/project
awa diff . --overlay ./my-overrides
```

Overlays are also configurable in `.awa.toml`:

```toml
template = "owner/repo"
overlay = ["./overlays/company", "./overlays/project"]
```

The merged result is passed to the template engine as if it were a single template directory. Overlay files take precedence over base template files with the same path.

## Rendering Flow

1. Resolve template source (`--template` or bundled default)
2. Resolve features from CLI/config (`features`, `preset`, `remove-features`)
3. Walk templates (excluding underscore-prefixed paths)
4. Render each template with `{ features }`
5. Create/overwrite/skip files based on conflicts and mode flags
6. Process `_delete.txt` entries (only when delete mode is enabled)
