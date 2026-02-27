# PLAN-003: Template Overlays — Layers/Inheritance

**Status:** in-progress
**Workflow direction:** top-down
**Traceability:** New feature — extends existing template resolution

## Problem

Users who want to customize the bundled awa template must copy the entire template set. No way to say "use the default, but replace this one partial." This defeats `awa diff` drift detection — once forked, you own all changes.

## Goal

`--overlay ./my-overrides` merges an overlay directory on top of a base template. Overlay files replace base files by path; base files not in overlay pass through unchanged.

## Workflow Steps

### 1. FEAT

Create `FEAT-OVL-overlays.md` — problem statement, layering conceptual model, use cases.

Key scenarios:
- Override one partial: overlay has `_partials/awa.code.md`, rest comes from base
- Add new files: overlay has `NEW_FILE.md` not in base → included in output
- Delete from base: overlay has `_delete.txt` or empty marker → need design decision
- Multiple overlays: `--overlay a --overlay b` — b wins over a, a wins over base

### 2. REQUIREMENTS

Create `REQ-OVL-overlays.md`:

- OVL-1: Generate command accepts `--overlay <path>` option (repeatable)
- OVL-2: Overlay files replace base template files at the same relative path
- OVL-3: Base files not present in overlay are included unchanged
- OVL-4: Overlay files not present in base are added to output
- OVL-5: Multiple overlays are applied in order (last wins)
- OVL-6: Overlays work with both local and Git template sources
- OVL-7: Diff command supports overlays identically to generate
- OVL-8: Config file supports `overlay` array in `.awa.toml`

### 3. DESIGN

Create `DESIGN-OVL-overlays.md`:

- OVL-OverlayResolver: Resolve overlay sources (same as template resolver — local or git)
- OVL-MergedTemplateView: Virtual filesystem that layers base + overlays
- Approach: resolve all sources to local dirs, then build a merged file list where later sources override earlier
- Template engine receives the merged view — no changes to Eta rendering
- Key decision: merge happens at file level (whole file replacement), not line level

### 4. TASKS

- Add `--overlay` CLI option (repeatable)
- Add `overlay` to `.awa.toml` config
- Add `overlay` to type definitions (RawCliOptions, FileConfig, ResolvedOptions)
- Create overlay resolver (resolve each overlay source to local dir)
- Create merged template view (build merged file list from base + overlays)
- Create merged directory lifecycle: copy base + overlay files into a temp directory, pass to template engine, clean up after generation/diff (similar to diff engine's temp dir pattern)
- Pass merged view to existing template engine
- Update diff command to use overlays
- Unit tests for merged view logic
- Integration tests for overlay generation
- Edge case: overlay partial overrides base partial that's included by base template

### 5. CODE & TESTS

Implement per tasks above.

### 6. DOCUMENTATION

- Update `docs/CLI.md` with `--overlay` option
- Update `docs/TEMPLATE_ENGINE.md` with overlay section
- Update `docs/CLI.md` config example with `overlay` field
- Update `README.md` features list
- Website: Update CLI reference, template engine guide, add overlay guide
- Update ARCHITECTURE.md with OverlayResolver component

## Risks

- Overlay + git cache interaction: what gets cached? Base and overlays separately
- Partial resolution: if overlay replaces a partial, does the base template's `include()` find the overlay version? (Answer: yes, if we merge before passing to Eta)
- Complexity creep: overlays add a layer of indirection to template debugging

## Completion Criteria

- `awa generate . --overlay ./custom` produces merged output
- Overlay files replace base files; base-only files pass through
- `awa diff` respects overlays
- Documentation complete
