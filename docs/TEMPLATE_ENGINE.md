# Template Engine

awa uses [Eta](https://eta.js.org/) as its template engine. Templates are plain files that can render conditionally based on feature flags, include partials, and optionally declare stale files to delete.

## Quick Overview

- Templates are rendered with context `{ features }` and accessed via `it.features`
- File and directory names are mirrored into the output (except underscore-prefixed paths)
- Whitespace-only output is skipped; `<!-- AWA:EMPTY_FILE -->` creates an intentional empty file
- `_delete.txt` supports post-generation cleanup, including feature-gated sections

## Template Sources

Templates can come from a local directory or a Git repository.

```bash
# Local path
awa generate . --template ./my-templates

# GitHub shorthand
awa generate . --template owner/repo

# With subdirectory
awa generate . --template owner/repo/templates

# Specific branch or tag
awa generate . --template owner/repo#v1.0.0

# GitLab / Bitbucket
awa generate . --template gitlab:owner/repo
awa generate . --template bitbucket:owner/repo

# Full Git URL
awa generate . --template https://github.com/owner/repo
```

Supported Git forms include shorthand (`owner/repo`), provider-prefixed (`github:`, `gitlab:`, `bitbucket:`), SSH/HTTPS URLs, optional subdirectories, and refs (`#branch`, `#tag`, `#commit`).

Remote templates are fetched via [degit](https://github.com/Rich-Harris/degit) and cached in `~/.cache/awa/templates/`. Use `--refresh` to re-fetch cached sources.

## Syntax

Templates receive a context object `it` with a `features` array containing the resolved feature flags.

### Feature Flags

```eta
<% if (it.features.includes('copilot')) { %>
<%~ include('_partials/copilot.instructions', it) %>
<% } %>
```

Feature names are treated as plain strings. awa does not enforce a fixed list at render time.

### Feature Examples

CLI examples:

```bash
# Single feature
awa generate . --template ./templates/awa --features copilot

# Multiple features
awa generate . --template ./templates/awa --features copilot claude cursor

# Add and remove in one run
awa generate . --template ./templates/awa --features copilot claude --remove-features claude

# Preset with subtraction
awa generate . --template ./templates/awa --preset full --remove-features roo agy
```

Template examples:

```eta
<% if (it.features.includes('copilot')) { %>
<%~ include('_partials/copilot.instructions', it) %>
<% } %>

<% if (it.features.includes('claude') || it.features.includes('cursor')) { %>
## Multi-tool guidance
<% } %>

Enabled features:
<% it.features.forEach(function(feature) { %>
- <%= feature %>
<% }) %>
```

### Conditionals

```eta
<% if (it.features.includes('testing')) { %>
## Testing
This section appears only when 'testing' is enabled.
<% } %>
```

### Loops

```eta
<% it.features.forEach(function(feature) { %>
- <%= feature %>
<% }) %>
```

### Output

| Tag | Behaviour |
|-----|-----------|
| `<%= expr %>` | Output, HTML-escaped |
| `<%~ expr %>` | Output, raw (unescaped) |
| `<% code %>` | Execute JavaScript, no output |

## Partials

Reusable content blocks live in `_partials/`. Include them with:

```eta
<%~ include('_partials/header', it) %>
```

Partials receive the same context as the parent template. Use `_partials/` by convention so they are excluded from generated output.

## File Handling

### Naming

Template filenames map directly to output filenames — there is no `.eta` extension stripping. The directory structure is mirrored as-is.

### Underscore Convention

Files and directories starting with `_` are never written to the output directory. This covers:

- `_partials/` — shared content blocks
- `_delete.txt` — delete list
- `_README.md` — template documentation (not output)

### Empty Output

- A template that renders to only whitespace → file is skipped (not created)
- A template that renders exactly `<!-- AWA:EMPTY_FILE -->` (after trim) → an empty file is created intentionally

## Rendering Flow

1. Resolve template source (`--template` or bundled default)
2. Resolve features from CLI/config (`features`, `preset`, `remove-features`)
3. Walk templates (excluding underscore-prefixed paths)
4. Render each template with `{ features }`
5. Create/overwrite/skip files based on conflicts and mode flags
6. Process `_delete.txt` entries (only when delete mode is enabled)

## Delete Lists

Place a `_delete.txt` in the template root to declare files that should be removed from the output directory after generation.

```text
# One path per line, relative to output directory
old-agent.md
deprecated/config.md
```

Rules:

- One relative path per line
- `#` comments and blank lines are ignored
- Deletions are only applied when `--delete` is enabled (or `delete = true` in config)
- Deletions happen after file generation
- Files that don't exist in output are silently skipped
- Files that conflict with generated files are skipped with a warning
- `--force` deletes without prompting (when `--delete` is enabled)
- `--dry-run` logs deletions without executing

### Feature-Gated Delete Sections

Use `# @feature` sections to delete stale files only when tool/features are not active:

```text
# Always considered for deletion
legacy/file.md

# @feature copilot
.github/copilot-instructions.md

# @feature claude cursor
CLAUDE.md
```

For a `# @feature` section, each listed path is deleted only when none of the listed features are active.

Any non-`@feature` comment resets the current feature gate section.

Example:

```text
# @feature copilot
.github/copilot-instructions.md

# This comment resets feature gating
legacy/file.md
```

In this example, `legacy/file.md` is unconditional (always a delete candidate).

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

## Template Overlays

An overlay is a directory of template files that layers on top of a base template.
Use overlays to customize a shared template without forking it.

```bash
# Override one partial while keeping the rest from the base
awa generate . --overlay ./my-overrides

# Stack multiple overlays (last overlay wins on conflict)
awa generate . --overlay ./company --overlay ./project-x

# Use a Git repository as the overlay source
awa generate . --overlay company/awa-overlay

# Diff against the merged view
awa diff . --overlay ./my-overrides
```

Overlay merging rules:

- An overlay file at relative path `P` replaces the base template file at path `P`
- Base files not present in any overlay pass through unchanged
- Overlay files not present in the base are added to the output
- When multiple overlays are stacked, the last one wins on any conflict
- Merging is whole-file only (no line-level patching)
- All file types, including `_partials/` and `_delete.txt`, can be overridden

### Overlay Config

Declare overlays in `.awa.toml` to avoid repeating them on every command:

```toml
overlay = ["./overlays/company", "./overlays/project"]
```

CLI `--overlay` options override the config array entirely.
