# awa Workflow

awa defines a structured development workflow. Each stage produces artifacts that trace forward and backward through the chain.

## Stages

```
ARCHITECTURE → FEAT → REQUIREMENTS → DESIGN → TASKS → CODE & TESTS → DOCUMENTATION
```

| Stage | Artifact | Purpose |
|-------|----------|---------|
| Architecture | `ARCHITECTURE.md` | System overview, components, constraints |
| Feature | `FEAT-{CODE}-*.md` | Context, motivation, scenarios for a feature |
| Requirements | `REQ-{CODE}-*.md` | What must be built, in EARS format (INCOSE) |
| Design | `DESIGN-{CODE}-*.md` | How it gets built — components, interfaces, properties |
| Tasks | `TASK-{CODE}-*-{nnn}.md` | Step-by-step implementation work items |
| Code & Tests | Source files | Implementation with trace markers |
| Documentation | `README.md`, `docs/` | User-facing docs |

## The `.awa/` Directory

All spec artifacts live in `.awa/`:

```
.awa/
├── specs/
│   ├── ARCHITECTURE.md              # System overview
│   ├── FEAT-{CODE}-*.md             # Feature context & motivation
│   ├── REQ-{CODE}-*.md              # Requirements (EARS format)
│   ├── DESIGN-{CODE}-*.md           # Design & components
│   ├── API-{CODE}-*.tsp             # TypeSpec API definitions
│   └── EXAMPLES-{CODE}-*-{nnn}.md   # Usage examples per feature
├── tasks/
│   └── TASK-{CODE}-*-{nnn}.md       # Implementation steps
├── plans/
│   └── PLAN-{nnn}-*.md              # Ad-hoc plans
├── align/
│   └── ALIGN-{x}-WITH-{y}-{nnn}.md  # Alignment reports
└── rules/
    └── *.md                         # Project-specific rules
```

## Traceability Chain

Every artifact links to its origin through IDs and markers:

```
REQ-{CODE}-*.md
  └── {CODE}-1: Requirement title
        └── {CODE}-1_AC-1: Acceptance criterion
                │
                ▼
DESIGN-{CODE}-*.md
  └── {CODE}-ComponentName
        ├── IMPLEMENTS: {CODE}-1_AC-1
        └── {CODE}_P-1: Correctness property
                │
                ▼
Source code
  └── // @awa-component: {CODE}-ComponentName
      └── // @awa-impl: {CODE}-1_AC-1
                │
                ▼
Tests
  ├── // @awa-test: {CODE}_P-1        ← verifies property
  └── // @awa-test: {CODE}-1_AC-1     ← verifies acceptance criterion
```

Every link is explicit. Nothing is implied.

## IDs and Markers

### Requirement IDs

- `{CODE}-{n}` — requirement, e.g. `DIFF-1`
- `{CODE}-{n}.{p}` — subrequirement, e.g. `DIFF-1.1`
- `{CODE}-{n}_AC-{m}` — acceptance criterion, e.g. `DIFF-1_AC-1`
- `{CODE}_P-{n}` — correctness property, e.g. `DIFF_P-2`

### Code Markers

| Marker | Links to | Example |
|--------|----------|---------|
| `@awa-component` | Design component | `// @awa-component: DIFF-Parser` |
| `@awa-impl` | Acceptance criterion | `// @awa-impl: DIFF-1.1_AC-1` |
| `@awa-test` | Property or AC | `// @awa-test: DIFF_P-2` |

### How to Read a Trace

Starting from a test:

```typescript
// @awa-test: DIFF-1_AC-1
test('produces unified diff for modified files', () => { ... });
```

→ `DIFF-1_AC-1` is defined in `REQ-DIFF-*.md` under requirement `DIFF-1`
→ `DESIGN-DIFF-*.md` has a component that `IMPLEMENTS: DIFF-1_AC-1`
→ Source code is marked `@awa-impl: DIFF-1_AC-1`

Starting from a requirement, follow the same chain forward.

## Workflow Direction

The standard direction is top-down (architecture → code). But the workflow supports any direction:

- **Top-down** — start from architecture, work toward implementation
- **Bottom-up** — start from code, extract requirements retroactively
- **Lateral** — documentation updates, refactors, or ad-hoc plans

## Prompt Examples

Use prompts like these depending on where you are in the workflow.

### Top-down (new feature)

```text
Let's brainstorm how to add a PKI flow for the bobcat server.
```

```text
Update the architecture for the changes we just discussed, then follow the standard awa workflow to update the specs.
```

```text
Create REQ and DESIGN for bulk export jobs with retry support. Keep scope MVP and generate implementation tasks.
```

```text
Create tasks for implementing the CLI feature.
```

```text
Implement the tasks in tasks 006.
```

```text
Check the code aligns with the GUI requirements.
```

### Bottom-up (existing code first)

```text
Analyze src/core/differ.ts and tests, then derive FEAT and REQ docs for the existing diff behavior.
```

```text
We already implemented delete-list feature gating. Extract requirements and design from code, including acceptance criteria and properties.
```

### Ad-hoc Plan and Code (skip the specs)

```text
Let's create a plan to implement a --delete flag in the CLI for gating automatic deletion.
```

```text
Let's implement plan 004.
```

### Lateral (single-stage updates)

```text
Update README and docs to match current CLI options (--delete, --list-unknown) without changing code.
```

```text
Refactor src/core/template-resolver.ts for readability.
```

```text
Create an implementation plan for migrating cache layout; no code changes yet.
```

### Traceability and validation

```text
Validate alignment of DESIGN-DIFF with REQ-DIFF and produce an alignment report.
```

```text
Check whether @awa-impl and @awa-test markers fully cover DIFF-7 acceptance criteria. List any gaps.
```

### Examples and usage docs

```text
Create EXAMPLES docs for tool feature flags, including CLI commands and expected outputs for copilot/claude/cursor combinations.
```
