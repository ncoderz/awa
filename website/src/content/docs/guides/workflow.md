---
title: Workflow Overview
description: Understand the awa development workflow and how each stage produces traceable artifacts.
---

awa defines a structured development workflow. Each stage produces artifacts that trace forward and backward through the chain.

## Stages

```
ARCHITECTURE → FEAT → REQUIREMENTS → DESIGN → TASKS → CODE & TESTS → DOCUMENTATION
```

| Stage         | Artifact                 | Purpose                                                |
| ------------- | ------------------------ | ------------------------------------------------------ |
| Architecture  | `ARCHITECTURE.md`        | System overview, components, constraints               |
| Feature       | `FEAT-{CODE}-*.md`       | Context, motivation, scenarios for a feature           |
| Requirements  | `REQ-{CODE}-*.md`        | What must be built, in EARS format (INCOSE)            |
| Design        | `DESIGN-{CODE}-*.md`     | How it gets built — components, interfaces, properties |
| Tasks         | `TASK-{CODE}-*-{nnn}.md` | Step-by-step implementation work items                 |
| Code & Tests  | Source files             | Implementation with trace markers                      |
| Documentation | `README.md`, `docs/`     | User-facing docs                                       |

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
│   ├── EXAMPLE-{CODE}-*-{nnn}.md   # Usage examples per feature
│   └── deprecated/
│       └── DEPRECATED.md            # Tombstone file for retired IDs
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
Your agent MAY use the awa skills to execute the workflows, but to guarantee
it, we recommend using the skills as slach commands, e.g.

```text
/awa.feature Add a logging layer with configurable sinks.
Use the most idiomatic logging library.
```

### Starting a New Feature (Top-Down)

You can easily add a whole new feature by working through the awa SDD workflow. It is recommended
to check the spec documents at each stage to make changes (either manually or via the AI) before
going to the next stage.

You can also use your prompts to guide the AI as little or as much as you want or need.

```text
/awa.brainstorm Let's brainstorm how to add a PKI flow for the bobcat server.
```

```text
/awa.architecture Update the architecture for the changes we just discussed,
then follow the standard awa workflow to update the specs.
```

```text
/awa.feature
...
/awa.requirements Keep scope MVP
...
/awa.design
```

OR

```text
/awa.vibe Create FEAT, REQ and DESIGN for bulk export jobs with retry support.
Keep scope MVP and generate implementation tasks.
```

THEN

```text
/awa.tasks
```

#### Implementing Code / Tests from Specs

```text
/awa.code Implement the tasks in tasks 006.
```

THEN see what is missing

```text
/awa.align
```

### Extracting Specs from Existing Code (Bottom-Up)

At any time, you can work in a different direction in the flow.

```text
Analyze src/core/differ.ts and tests, then derive FEAT, REQ and DESIGN
docs for the existing diff behavior.
```

### Ad-Hoc Plans (Skip the Specs)

If you don't want to follow the full flow as the project does not require it, use ad-hoc plans.

```text
/awa.plan Let's create a plan to implement a --delete flag in the CLI.
```

```text
/awa.code Let's implement plan 004.
```

### Lateral Updates

```text
Update README and docs to match current CLI options
(--delete, --list-unknown) without changing code.
```

```text
/awa.refactor Refactor src/core/template-resolver.ts for readability.
```

### Traceability and Validation

```text
/awa.check <-- this will validate all spec markers and may well
discover missing code / tests / specs
```

```text
/awa.align Align DESIGN-DIFF with REQ-DIFF and produce an
alignment report.
```

### Spec Management

Specification documents are written fast by AI and can quickly get out of hand and messy. awa tries to guide the AI to generate well structured specs, but it also has features to reliably tidy up specs without losing meaning or changing wording where it matters.

You can also renumber your requirements at any time. Be aware that tidying the specs will likely cause some renumbering unless you expressly forbid it.

```text
/awa.spec-tidy Tidy and reorganise the specifications logically.
```

```text
/awa.spec-merge Merge the PARSE and SCAN feature codes into a
single PARSE feature.
```

```text
/awa.usage List all feature codes in the project.
```

```text
/awa.usage Renumber all traceability IDs to close gaps.
```

```text
/awa.usage Recode the CHK feature code to CLI
(rename all IDs, spec files, and headings).
```

### Feature Discovery

awa has a skill about itself, so you can ask the AI questions about how to use awa, or ask it to
use awa command line for you.

```text
/awa.usage List all available feature flags in the
awa template.
```

```text
/awa.usage Run awa features --json and explain
what each flag controls.
```

## How It Works

Each awa command follows a specific pipeline:

1. **Load config** — read `.awa.toml` (if present), merge with CLI arguments
2. **Resolve template** — local path used directly; Git repos fetched via degit and cached
3. **Apply overlays** — if `--overlay` paths are given, each is resolved and merged on top of the base template (last wins)
4. **Resolve features** — combine `--features`, expand `--preset`, subtract `--remove-features`
5. **Render** — walk template directory, render each file with Eta passing `{ features }` as context
6. **Write** — create output files, prompt on conflicts (or `--force`/`--dry-run`), process `_delete.txt`
7. **Delete** — apply delete list entries only when `--delete` (or `delete = true` in config) is set
8. **Diff** (for `awa template diff`) — render to a temp directory, compare against target, report unified diffs
9. **Validate** (for `awa check`) — scan code for traceability markers, parse spec files, cross-check, report findings
10. **Test** (for `awa template test`) — discover fixtures in `_tests/`, render per fixture, verify expected files, compare snapshots
11. **Trace** (for `awa trace`) — scan markers, build index, resolve IDs, format trace chains
12. **Renumber** (for `awa spec renumber`) — scan IDs, build renumber map, propagate to specs and code
13. **Recode** (for `awa spec recode`) — build offset map, propagate, rename spec files, update codes table
14. **Merge** (for `awa spec merge`) — recode + move source files + stale-ref check + optional renumber
15. **Codes** (for `awa spec codes`) — scan spec files, build code inventory, report

## Next Steps

- [Traceability](/guides/traceability/) — how IDs and markers connect everything
- [CI Integration](/guides/ci-integration/) — use awa in CI pipelines
- [CLI Reference](/reference/cli/) — all commands, options, and exit codes
