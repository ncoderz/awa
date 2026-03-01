# Template System [INFORMATIVE]

## Problem

Agent configuration files contain a mix of shared structure and project-specific content. Static files can't accommodate this — each project either gets the same generic content (too broad) or requires manual customisation (diverges over time).

Additionally, templates may live in a local directory during development but in a Git repository for distribution. The system needs to handle both transparently, with caching for remote sources so that repeated runs don't re-download.

## Conceptual Model

The template system has three layers:

1. TEMPLATE RESOLUTION — determines where templates come from (local path or Git repo), fetches remote sources, and provides a local directory to the engine.
2. TEMPLATE ENGINE — loads template files, renders them with context data (feature flags), and returns the rendered output as strings.
3. PARTIALS — reusable content blocks shared across templates, stored in `_partials/` and included via Eta's `include()` syntax.

Templates use Eta syntax for conditionals, loops, and composition:
- `<%= it.features %>` — output expressions
- `<% if (it.features.includes('copilot')) { %>` — conditional blocks
- `<%~ include('_partials/header', it) %>` — partial inclusion

Feature flags are the primary mechanism for conditional content. The template receives `it.features` (an array of strings) and uses standard JavaScript expressions to decide what to include.

Two special output conventions control file creation:
- EMPTY OUTPUT (after trimming): the file is not created at all. This lets a template produce nothing when no relevant features are active.
- EMPTY FILE MARKER (`<!-- AWA:EMPTY_FILE -->`): creates an intentionally empty file. This distinguishes "nothing to output" from "output an empty file."

Template CACHING works for Git sources: fetched repositories are stored in `~/.cache/awa/templates/` and reused on subsequent runs. The `--refresh` flag forces a re-fetch. Local paths are used directly with no caching.

## Scenarios

### Scenario 1: Local template development

A template author creates a `./templates/` directory with `.md` files using Eta syntax. They run `awa template generate . --template ./templates/` to test rendering. Changes to the local templates take effect immediately — no caching.

### Scenario 2: Git repository templates

A team publishes templates at `github:myorg/agent-templates`. A developer runs `awa template generate . --template myorg/agent-templates`. The first run fetches via degit (shallow, no `.git` directory); subsequent runs use the cached copy.

### Scenario 3: Refreshing a cached template

After the team pushes template updates, a developer runs `awa template generate . --template myorg/agent-templates --refresh` to re-fetch the latest version from Git.

### Scenario 4: Conditional content via features

A template file contains:
```
<% if (it.features.includes('copilot')) { %>
Copilot-specific instructions here.
<% } %>
```
When run with `--features copilot`, the output includes the Copilot section. Without that feature, the block is omitted.

### Scenario 5: Partial composition

Multiple agent templates share a common workflow section. The template author puts it in `_partials/_workflow.md` and includes it via `<%~ include('_partials/_workflow', it) %>`. The partial receives the same feature flags and can itself use conditionals.

### Scenario 6: Empty output suppression

A template produces content only when certain features are active. When no relevant features are enabled, the rendered output is an empty string. awa detects this and skips file creation entirely — no empty file littering the output.

### Scenario 7: Intentionally empty file

A template needs to create an empty placeholder file. The template outputs `<!-- AWA:EMPTY_FILE -->` and awa creates a zero-byte file at the target path.

### Scenario 8: Git ref and subdirectory support

A developer runs `awa template generate . --template myorg/repo/templates#v2.0` to fetch from a specific tag and subdirectory within the repository.

## Change Log

- 1.0.0 (2026-02-24): Initial feature context derived from code and requirements
- 1.1.0 (2026-02-27): Schema upgrade — replaced bold formatting with CAPITALS
