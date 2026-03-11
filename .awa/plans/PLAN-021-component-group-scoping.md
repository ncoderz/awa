# Fix Multi-Component @awa-impl Attribution via Positional Scoping

STATUS: in-progress
DIRECTION: bottom-up

## Context

When a source file declares multiple `@awa-component` markers, the checker (`code-spec-checker.ts`, `checkCodeAgainstSpec`) attributes every `@awa-impl` marker in the file to every component. This is the `fileToComponents` + flat iteration loop at lines ~170–192. The assignment is file-level only — no line-position awareness.

This causes false `impl-not-in-implements` warnings when an impl logically belongs to only one of the file's components.

See: CLI-37_AC-1 (IMPLEMENTS vs @awa-impl Consistency).

### Correct convention (to be enforced)

The intended placement convention is:

- `@awa-component` — placed before the component code it describes (not at file top)
- `@awa-impl` — placed where the implementation actually occurs (not at file top)
- `@awa-test` — placed where the test actually occurs

The existing template partial (`templates/awa/_partials/awa.code.md`) erroneously says "Add @awa-component marker at file/module top". This led to the current codebase pattern where all markers are lumped at the top of multi-component files. These files will need to be fixed — wrong placement should fail `awa check`, not be silently tolerated.

### Chosen approach: nearest preceding component

Each `@awa-impl` or `@awa-test` is attributed to the single nearest preceding `@awa-component` in the same file.

- Single-component files: unchanged behavior (one component, all markers attributed to it).
- Multi-component files: each `@awa-component` starts a scope; subsequent impl/test markers belong to it until the next `@awa-component`.
- Impl/test before any component: error — no component to attribute to.

## Algorithm

```
for each file with markers (sorted by line):
  activeComponent = null

  for each marker in line order:
    if marker.type == 'component':
      activeComponent = marker.id
    else:  // impl or test
      if activeComponent:
        componentFiles[activeComponent].add(marker.id)
      // else: no preceding component — handled by existing orphan checks
      //       or a new finding if needed
```

### Examples

Positional scoping (correct convention):
```
// @awa-component: COMP-A
// @awa-impl: A-ONLY-1        → attributed to COMP-A

function compA() { ... }

// @awa-component: COMP-B
// @awa-impl: B-ONLY-1        → attributed to COMP-B

function compB() { ... }
```

Single-component file (unchanged):
```
// @awa-component: COMP-A
// @awa-impl: A-1              → attributed to COMP-A
// @awa-impl: A-2              → attributed to COMP-A
```

## Steps

### Implementation

- [ ] Extract a `buildComponentAttribution` helper function from `checkCodeAgainstSpec` in `src/core/check/code-spec-checker.ts`
  - Takes the full marker list, returns `Map<componentId, Set<markerId>>`
  - Implements nearest-preceding-component: sort by file+line, track active component, attribute each impl/test
  - Scanner already provides `line` on each marker — no changes to `MarkerScanner`, `SpecParser`, or types needed
- [ ] Update `checkCodeAgainstSpec` to use the new helper for impl-vs-implements checks

### Tests

- [ ] Verify existing single-component tests still pass
- [ ] Add test: multi-component file, positional scoping → each impl attributed to its nearest preceding component
- [ ] Add test: single-component file → all impls attributed to that component (unchanged)
- [ ] Add test: impl/test markers interleaved with component markers

### Fix existing multi-component files

- [ ] Restructure marker placement in existing multi-component source files so each `@awa-component` precedes its own code section, with `@awa-impl` at the implementation site
  - `src/commands/generate.ts` (4 components)
  - `src/commands/diff.ts` (3 components)
  - `src/cli/index.ts` (3 components)
  - `src/core/overlay.ts` (2 components)
  - Any other multi-component files found

### Documentation / templates

- [x] Fix marker placement convention in `templates/awa/_partials/awa.code.md` (the source partial) — updated manually
  - `@awa-component` — place before the component code, not at file top
  - `@awa-impl` — place where the implementation occurs
  - For multi-component files, each `@awa-component` scopes subsequent impl/test markers to that component
- [ ] Regenerate outputs from the partial (`awa template generate`) so skill/prompt files pick up the fix

### Validation

- [ ] `npm run build && npm run test`
- [ ] `npx awa check` passes on this project after fixing multi-component files

## Risks

- Existing multi-component files will fail `awa check` until restructured. This is intentional — correct the code, not the checker.
- Agents reordering markers could change semantics. Mitigate by documenting that order matters.

## Non-goals

- Backward compatibility for "all components at top" pattern — this is the bug, not a feature to preserve.
- Parenthesized syntax (`@awa-impl(COMP-B): ID`) — not needed with positional scoping.
- Changes to the marker scanner — scanner already captures line numbers.
- Spec changes (REQ/DESIGN) — CLI-37_AC-1 wording already supports positional scoping.
