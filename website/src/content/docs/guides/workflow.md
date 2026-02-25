---
title: Workflow Overview
description: Understand the awa development workflow and how each stage produces traceable artifacts.
---

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

## Workflow Direction

The standard direction is top-down (architecture → code). But the workflow supports any direction:

- **Top-down** — start from architecture, work toward implementation
- **Bottom-up** — start from code, extract requirements retroactively
- **Lateral** — documentation updates, refactors, or ad-hoc plans

You can start at any stage and skip what isn't needed. awa is flexible.

## Prompt Examples

Here are some example prompts you can use with your AI agent at each stage.

### Starting a New Feature (Top-Down)

```text
Let's brainstorm how to add a PKI flow for the bobcat server.
```

```text
Update the architecture for the changes we just discussed,
then follow the standard awa workflow to update the specs.
```

```text
Create REQ and DESIGN for bulk export jobs with retry support.
Keep scope MVP and generate implementation tasks.
```

### Implementing from Specs

```text
Implement the tasks in tasks 006.
```

### Extracting Specs from Existing Code (Bottom-Up)

```text
Analyze src/core/differ.ts and tests, then derive FEAT and REQ
docs for the existing diff behavior.
```

### Ad-Hoc Plans (Skip the Specs)

```text
Let's create a plan to implement a --delete flag in the CLI.
```

```text
Let's implement plan 004.
```

### Lateral Updates

```text
Update README and docs to match current CLI options
(--delete, --list-unknown) without changing code.
```

## Next Steps

- [Traceability](/awa/guides/traceability/) — how IDs and markers connect everything
- [CLI Reference](/awa/reference/cli/) — `awa generate` and `awa diff` commands
