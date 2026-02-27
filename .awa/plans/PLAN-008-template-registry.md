# PLAN-008: Template Registry — Community Discovery

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — no existing specs

## Problem

There's no way to discover community templates. `--template owner/repo` works, but users must know the repo exists. No discoverability, no curation.

## Goal

A lightweight template index (curated list) with `awa templates` CLI commands for browsing. Not a package manager — just a searchable index.

## Workflow Steps

### 1. FEAT

Create `FEAT-REG-template-registry.md` — community ecosystem, template discoverability.

Key scenarios:
- `awa templates list` — show all known template sets
- `awa templates search "react"` — search by keyword
- `awa templates info owner/repo` — show details (features, description)
- Template authors register by adding to a central index file (PR to awa repo or website)

### 2. REQUIREMENTS

Create `REQ-REG-template-registry.md`:

- REG-1: Templates command lists entries from a remote index
- REG-2: Index is a JSON/TOML file hosted at a known URL (awa website or GitHub raw)
- REG-3: Templates list command displays name, description, source for each entry
- REG-4: Templates search command filters by keyword (name, description, tags)
- REG-5: Templates info command shows detailed info for a single entry (features, files, author) — data comes from the index itself, not from fetching remote repos (too expensive); the index format (REG-8) includes features pre-populated
- REG-6: Index is cached locally with TTL (default 1 hour)
- REG-7: `--refresh` forces re-fetch of index
- REG-8: Index format includes: name, source (owner/repo), description, tags, features

### 3. DESIGN

Create `DESIGN-REG-template-registry.md`:

- REG-IndexFetcher: HTTP fetch of index file, cache to `~/.cache/awa/registry.json`
- REG-IndexParser: Parse JSON index
- REG-SearchEngine: Simple keyword match on name, description, tags
- REG-InfoFetcher: Optionally fetch template's README or run `awa features` on it
- Index hosting: static JSON file in awa website repo, updated via PR
- No server infrastructure — fully static

### 4. TASKS

- Define index format (JSON schema)
- Create index fetcher with caching
- Create search/filter logic
- Add `templates` subcommand group (list, search, info)
- Create initial index with bundled awa template and example
- Host index on awa website (public URL)
- Unit tests for search, caching
- Integration test for templates command

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `awa templates` command reference
- New doc: `docs/TEMPLATE_REGISTRY.md` — how to submit a template, index format
- Update `README.md` with template discovery section
- Website: Add templates page (browsable index), submission guide
- Update ARCHITECTURE.md with Registry components

## Risks

- Curation burden — who reviews template submissions?
- Index freshness — stale entries pointing to deleted repos
- Feature creep — resist building a package manager
- HTTP dependency — CLI now requires network for templates list (cached fallback)

## Completion Criteria

- `awa templates list` shows indexed templates
- Search works by keyword
- Index hosted publicly
- Submission process documented
