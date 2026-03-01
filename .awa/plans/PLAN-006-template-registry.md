# Template Registry / Discovery

STATUS: in-progress
DIRECTION: top-down

## Context

awa templates currently require users to know the exact Git URL or local path. There is no way to discover community templates, search by language or framework, or share templates easily. A registry would create network effects: more templates attract more users, more users create more templates.

The approach should be lightweight — a GitHub-based index rather than a full registry service — to minimize infrastructure and maintenance burden while still providing discovery.

## Scope

IN SCOPE:
- `awa search <query>` — search for templates by keyword, tag, or description
- `awa registry list` — list all registered templates
- `awa registry add <repo>` — submit a template to the registry (PR to index repo)
- GitHub-based index: a JSON file in a dedicated GitHub repository (`ncoderz/awa-registry`)
- Template manifest: `awa-template.toml` in template repos with metadata
- Integration with existing `--template` flag (search results show usable URLs)

OUT OF SCOPE:
- Hosted registry API (too much infrastructure for initial version)
- npm-based publishing (too heavy, wrong semantics for template sets)
- Template versioning beyond Git refs (branches/tags are sufficient)
- Quality scoring / star counts (future enhancement)
- Paid / private templates

## Registry Architecture

### Index File

A single JSON file in the `ncoderz/awa-registry` GitHub repo:

```json
{
  "version": 1,
  "templates": [
    {
      "name": "awa",
      "description": "Default awa agent workflow templates",
      "repo": "ncoderz/awa",
      "path": "templates/awa",
      "tags": ["workflow", "agent", "typescript"],
      "features": ["copilot", "claude", "cursor", "windsurf"],
      "author": "ncoderz",
      "updated": "2026-02-28"
    },
    {
      "name": "python-ml",
      "description": "ML project templates with pytest and DVC workflow",
      "repo": "community/awa-python-ml",
      "tags": ["python", "ml", "pytest"],
      "features": ["copilot", "claude"],
      "author": "community-user",
      "updated": "2026-03-01"
    }
  ]
}
```

### Template Manifest (`awa-template.toml`)

Located in the template root directory:

```toml
[template]
name = "python-ml"
description = "ML project templates with pytest and DVC workflow"
tags = ["python", "ml", "pytest"]
author = "community-user"
license = "MIT"
min-awa-version = "1.3.0"

[template.features]
# Auto-discovered from templates, but can be overridden here
documented = ["copilot", "claude", "cursor"]
```

## CLI Interface

```
awa search <query> [options]

Arguments:
  query                 Search terms (matched against name, description, tags)

Options:
  --tag <tag...>        Filter by tag (repeatable)
  --json                Output as JSON
  --refresh             Force re-fetch of registry index

awa registry list [options]

Options:
  --tag <tag...>        Filter by tag
  --json                Output as JSON

awa registry add <repo> [options]

Arguments:
  repo                  GitHub repo (owner/repo format)

Options:
  --path <path>         Template subdirectory within repo
  --dry-run             Validate without submitting
```

Exit codes: 0 = success, 1 = no results / validation error, 2 = network error.

## Output Format

### Search (text)

```
Search results for "python":

  python-ml                                           ★ python, ml, pytest
  ML project templates with pytest and DVC workflow
  → awa init . --template community/awa-python-ml

  python-web                                          ★ python, web, fastapi
  FastAPI project templates with async workflow
  → awa init . --template community/awa-python-web

2 templates found
```

## Steps

### Phase 1: Registry Index Design

- [ ] Create `ncoderz/awa-registry` GitHub repository with README and index.json structure
- [ ] Define index JSON schema (version, templates array)
- [ ] Define `awa-template.toml` manifest schema
- [ ] Create contributing guide for template submissions
- [ ] Seed index with the default `ncoderz/awa` template entry

### Phase 2: Registry Client

- [ ] Create `src/core/registry/types.ts` with `RegistryEntry`, `RegistryIndex`, `SearchResult` types
- [ ] Create `src/core/registry/client.ts` that fetches index.json from GitHub raw URL
- [ ] Implement index caching: store in `~/.cache/awa/registry.json` with TTL (default 1 hour)
- [ ] Implement `--refresh` to force re-fetch
- [ ] Implement search: match query against name, description, tags (case-insensitive, fuzzy-ish)
- [ ] Implement tag filtering: `--tag` intersects with entry tags
- [ ] Handle network errors gracefully: show cached results if available, clear error message if not
- [ ] Unit test client with mock fetch

### Phase 3: CLI Commands

- [ ] Create `src/commands/search.ts` with search command handler
- [ ] Create `src/commands/registry.ts` with `registry list` and `registry add` subcommands
- [ ] Register commands in `src/cli/index.ts`
- [ ] `search` output: template name, description, tags, install command
- [ ] `registry add`: validate repo exists, fetch `awa-template.toml`, generate PR body, open GitHub PR URL in browser (or output for CI)
- [ ] JSON output format for all commands
- [ ] Integration test with mock registry

### Phase 4: Template Manifest Validation

- [ ] Implement `awa-template.toml` parser (reuse smol-toml)
- [ ] Validate manifest on `registry add`: required fields, tag format, feature list
- [ ] Validate `min-awa-version` against current CLI version during search (show warning for incompatible)
- [ ] Add manifest to `awa features` output if present

### Phase 5: Documentation

- [ ] Document registry in README under "Community Templates" section
- [ ] Document how to create and publish templates
- [ ] Document `awa-template.toml` format
- [ ] Add example templates section to docs

## Edge Cases

- Registry index unreachable → use cached copy if available, error if no cache
- Template repo deleted after registration → search shows it, `awa init` fails with clear error
- Duplicate names in registry → reject on PR validation
- Very large index (1000+ entries) → search is client-side, should be fast enough for JSON
- Query with no results → "No templates found. Try different search terms." (exit 1)

## Risks

- CHICKEN-AND-EGG: empty registry has no value, no users means no contributions. Mitigation: seed with official templates, create example templates across languages, encourage early community contributions.
- GOVERNANCE BURDEN: reviewing PRs to the registry index. Mitigation: automated validation (manifest exists, repo accessible, features discoverable), manual review only for description quality.
- STALE ENTRIES: templates may become unmaintained. Mitigation: periodic validation job that checks repo accessibility, remove stale entries.
- TRUST AND QUALITY: users may submit low-quality or malicious templates. Mitigation: templates are just files — they execute only through Eta (sandboxed). Registry has no code execution. Review descriptions manually.
- SCOPE CREEP: temptation to build a full npm-like registry. Mitigation: stay with the single JSON file approach. Scale to a database-backed API only if index exceeds ~1000 entries.

## Dependencies

- GitHub API or raw content URL for index fetching (no auth required for public repos)
- No new required npm dependencies (native fetch in Node.js 24)
- `ncoderz/awa-registry` repository (needs to be created)

## Completion Criteria

- [ ] `ncoderz/awa-registry` repo created and seeded
- [ ] `awa search python` finds templates tagged with python
- [ ] `awa registry list` shows all registered templates
- [ ] Search results display install command (`awa init . --template ...`)
- [ ] `--json` format for all commands
- [ ] Registry index cached locally with TTL
- [ ] `--refresh` forces re-fetch
- [ ] Network errors handled gracefully with cached fallback
- [ ] All unit tests pass
- [ ] `awa check` passes

## References

- Template resolver: src/core/template-resolver.ts (existing Git URL resolution)
- Config loader: src/core/config.ts (smol-toml parsing patterns)
- Homebrew tap model: https://docs.brew.sh/Taps (inspiration for lightweight registry)
- PLAN-001: .awa/plans/PLAN-001-killer-features-planning.md

## Change Log

- 001 (2026-03-01): Initial plan
