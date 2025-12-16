---
description: Upgrade specs to match current schemas
argument-hint: "<upgrade-instructions>"
---

# Upgrade Specs to Current Schemas

## Bootstrap

<tool name="read_file">
 <read path=".zen/.agent/zen.core.md" required="true" error="on not found" />
 <read path=".zen/rules/*.md" required="true" />
 <read path=".zen/specs/ARCHITECTURE.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/ARCHITECTURE.schema.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/REQ.schema.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/DESIGN.schema.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/TASK.schema.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/PLAN.schema.md" required="true" error="on not found" />
</tool>

## User Input

```text
${input}
```

You **MUST** consider the user input before proceeding (if not empty).

## Inputs

<file type="architecture" path=".zen/specs/ARCHITECTURE.md" />
<file type="requirements" path=".zen/specs/REQ-{CODE}-{feature-name}.md" required="if relevant" />
<file type="design" path=".zen/specs/DESIGN-{CODE}-{feature-name}.md" required="if relevant" />
<file type="tasks" path=".zen/tasks/TASK-{CODE}-{feature-name}-{nnn}.md" required="if relevant" />
<file type="plan" path=".zen/plans/PLAN-{nnn}-{plan-name}.md" required="if relevant" />
<file type="code_and_tests" path="various" required="if reverse workflow" />

## Action

Upgrade the specified specs to conform to their schemas and traceability rules.

1) ORIENT: Confirm which artifacts to upgrade; clarify missing targets.
2) AUDIT: Compare each document to its schema; rely on the schema for section structure, required/optional fields, and prohibited patterns.
3) ALIGN: Update IDs and code refs to match schema patterns and current agent/code context (requirements, criteria, properties, tasks, components, trace markers). Adjust content to satisfy schema expectations without restating schema details here.
4) TRACEABILITY: Preserve and update @zen-component/@zen-impl/@zen-test markers and any trace matrices when IDs change.
5) VALIDATE: Re-scan against schemas; avoid empty placeholders; keep files under 500 lines.
6) MIRROR TEMPLATES: If editing a prompt or spec that has a template, update the mirror in templates/zen/ to match.
7) REPORT: Summarize changes and remaining questions before finalizing.

## Output File(s)

- Updated spec(s) and supporting templates (as applicable)

## Rules

You SHALL avoid destructive edits; propose clarifications when unsure.
You SHALL obey schema render expectations (omit optional empty sections, avoid prohibited patterns).
You SHALL maintain existing trace IDs; do not invent new codes without direction.
You SHALL keep Eta/template syntax intact when editing template mirrors.
You SHALL respect the 500-line limit; split logically if needed.
You SHALL keep templates in sync at templates/zen/.github/prompts/zen.upgrade.prompt.md.
You MAY use todos and tools as needed.
