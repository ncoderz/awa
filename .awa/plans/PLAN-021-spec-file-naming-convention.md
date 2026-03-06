# Spec File Naming Convention Change

STATUS: in-progress
DIRECTION: lateral

## Context

The current spec file naming convention places the document TYPE first (e.g., `FEAT-DIFF-diffing.md`, `REQ-DIFF-diffing.md`). This scatters files for the same feature code throughout the directory listing. The proposed change moves the feature CODE to the front with a fixed numeric index prefix and a mandatory trailing sequence number, grouping all related spec files together in sorted directory listings.

This is a template-only change — no source code, no files outside `/templates/` are modified. No actual template files are renamed; only the naming convention references within template file content are updated.

### Current Convention

```
specs/
  FEAT-{CODE}-{feature-name}.md
  EXAMPLE-{CODE}-{feature-name}-{nnn}.md
  REQ-{CODE}-{feature-name}.md
  DESIGN-{CODE}-{feature-name}.md
  API-{CODE}-{api-name}.tsp
tasks/
  TASK-{CODE}-{feature-name}-{nnn}.md
```

### Proposed Convention

Each feature code is assigned a fixed 3-digit index `{NNN}` (e.g., CLI=001, LOG=002). Every spec file now carries a trailing `{nnn}` sequence number, not just EXAMPLE and TASK.

```
specs/
  ARCHITECTURE.md
  {NNN}-{CODE}-{TYPE}-{feature-name}-{nnn}.md  (TYPE: FEAT|EXAMPLE|REQ|DESIGN)
  {NNN}-{CODE}-{TYPE}-{feature-name}-{nnn}.tsp (TYPE: API)
tasks/
  {NNN}-{CODE}-TASK-{feature-name}-{nnn}.md
plans/
  PLAN-{nnn}-{plan-name}.md
align/
  ALIGN-{x}-WITH-{y}-{nnn}.md
```

Example listing:

```
001-CLI-REQ-command-line-001.md
001-CLI-REQ-command-line-002.md
002-LOG-REQ-logging-001.md
```

## Steps

### Phase 1: Primary Source Templates (partials + schemas)

These are the canonical sources. Test fixtures under `_tests/` are regenerated from these.

- [ ] 1.1 Update `templates/awa/_partials/awa.core.md` — file_structure tree, file_descriptions, traceability_chain
- [ ] 1.2 Update `templates/awa/_partials/awa.usage.md` — directory tree, document table, traceability examples
- [ ] 1.3 Update `templates/awa/_partials/awa.design.md` — Inputs/Outputs file paths
- [ ] 1.4 Update `templates/awa/_partials/awa.feature.md` — Inputs/Outputs file paths
- [ ] 1.5 Update `templates/awa/_partials/awa.requirements.md` — Inputs/Outputs file paths
- [ ] 1.6 Update `templates/awa/_partials/awa.examples.md` — Inputs/Outputs file paths
- [ ] 1.7 Update `templates/awa/_partials/awa.tasks.md` — Inputs/Outputs file paths
- [ ] 1.8 Update `templates/awa/_partials/awa.code.md` — Inputs file paths
- [ ] 1.9 Update `templates/awa/_partials/awa.plan.md` — Inputs file paths
- [ ] 1.10 Update `templates/awa/_partials/awa.align.md` — Inputs file paths
- [ ] 1.11 Update `templates/awa/_partials/awa.check.md` — Inputs file paths
- [ ] 1.12 Update `templates/awa/_partials/awa.refactor.md` — Inputs file paths
- [ ] 1.13 Update `templates/awa/_partials/awa.brainstorm.md` — Inputs file paths
- [ ] 1.14 Update `templates/awa/_partials/awa.vibe.md` — Inputs file paths
- [ ] 1.15 Update `templates/awa/_partials/awa.upgrade.md` — Inputs file paths
- [ ] 1.16 Update `templates/awa/_partials/awa.documentation.md` — Inputs file paths

### Phase 2: Schema Templates

- [ ] 2.1 Update `templates/awa/.awa/.agent/schemas/FEAT.schema.yaml` — comment + `target-files` glob
- [ ] 2.2 Update `templates/awa/.awa/.agent/schemas/REQ.schema.yaml` — comment + `target-files` glob
- [ ] 2.3 Update `templates/awa/.awa/.agent/schemas/DESIGN.schema.yaml` — comment + `target-files` glob + internal REQ ref
- [ ] 2.4 Update `templates/awa/.awa/.agent/schemas/EXAMPLE.schema.yaml` — comment + `target-files` glob
- [ ] 2.5 Update `templates/awa/.awa/.agent/schemas/API.schema.yaml` — comment + `target-files` glob
- [ ] 2.6 Update `templates/awa/.awa/.agent/schemas/TASK.schema.yaml` — comment + `target-files` glob + internal REQ ref

### Phase 3: Regenerate Test Fixtures

The test fixtures in `templates/awa/_tests/` are generated output. After updating source templates:

- [ ] 3.1 Run `awa generate` (or equivalent) to regenerate `templates/awa/_tests/claude/` fixtures
- [ ] 3.2 Run `awa generate` to regenerate `templates/awa/_tests/copilot/` fixtures
- [ ] 3.3 Verify regenerated fixtures contain the new naming convention
- [ ] 3.4 Diff old vs new to confirm no unintended content changes beyond the rename

### Phase 4: Validation

- [ ] 4.1 Run `npm run build && npm run test` to ensure nothing breaks
- [ ] 4.2 Manually verify a sample of files to confirm correct naming in all contexts (file_structure blocks, `<file>` XML tags, prose references, schema target-files globs, traceability chain diagrams)

## Naming Transformation Reference

The pattern swap is: `TYPE-{CODE}-{name}[.md]` → `{NNN}-{CODE}-TYPE-{name}-{nnn}[.md]`.
`{NNN}` is a fixed 3-digit code index. `{nnn}` is a per-file sequence number (always present).

| Old Pattern | New Pattern |
|---|---|
| `FEAT-{CODE}-{feature-name}.md` | `{NNN}-{CODE}-FEAT-{kebab-name}-{nnn}.md` |
| `EXAMPLE-{CODE}-{feature-name}-{nnn}.md` | `{NNN}-{CODE}-EXAMPLE-{kebab-name}-{nnn}.md` |
| `REQ-{CODE}-{feature-name}.md` | `{NNN}-{CODE}-REQ-{kebab-name}-{nnn}.md` |
| `DESIGN-{CODE}-{feature-name}.md` | `{NNN}-{CODE}-DESIGN-{kebab-name}-{nnn}.md` |
| `API-{CODE}-{api-name}.tsp` | `{NNN}-{CODE}-API-{kebab-name}-{nnn}.tsp` |
| `TASK-{CODE}-{feature-name}-{nnn}.md` | `{NNN}-{CODE}-TASK-{kebab-name}-{nnn}.md` |

Schema target-files glob changes:

| Old Glob | New Glob |
|---|---|
| `.awa/specs/FEAT-*.md` | `.awa/specs/*-FEAT-*.md` |
| `.awa/specs/EXAMPLE-*.md` | `.awa/specs/*-EXAMPLE-*.md` |
| `.awa/specs/REQ-*.md` | `.awa/specs/*-REQ-*.md` |
| `.awa/specs/DESIGN-*.md` | `.awa/specs/*-DESIGN-*.md` |
| `.awa/specs/API-*.tsp` | `.awa/specs/*-API-*.tsp` |
| `.awa/tasks/TASK-*.md` | `.awa/tasks/*-TASK-*.md` |

Also rename `{feature-name}` → `{kebab-name}` and `{api-name}` → `{kebab-name}` in placeholders to use consistent terminology.

## Risks

- Schema `target-files` globs: The new `*-TYPE-*` pattern is less specific than `TYPE-*`. If users place non-spec files in the directory, they could be matched. Risk is low since `.awa/specs/` is convention-controlled.
- NNN code index management: Users must assign and maintain the 3-digit `{NNN}` index per feature code. This is a new concept that must be clearly documented in templates.
- Mandatory `{nnn}` on all types: Previously only EXAMPLE and TASK had sequence numbers. Now all spec types do (FEAT, REQ, DESIGN, API). Templates must communicate this consistently.
- Downstream consumers: Any code in `src/` that parses spec filenames (e.g., `spec-file-utils.ts`, `feature-resolver.ts`, schema validation) will need corresponding updates — but that is out of scope for this plan (template-only).
- Test fixture regeneration: Must regenerate `_tests/` fixtures after source changes to keep them in sync.

## Completion Criteria

- [ ] All 22 primary source template files updated with new naming convention
- [ ] All 6 schema template files updated (target-files + internal references)
- [ ] Test fixtures regenerated and consistent with source templates
- [ ] Build and tests pass
- [ ] No residual references to old `TYPE-{CODE}` pattern in any template file
