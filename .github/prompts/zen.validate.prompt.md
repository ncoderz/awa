---
description: Validate alignment of source with target (check source matches target)
argument-hint: "<source> [<target>]"
---

# Validate alignment of Source(x) with Target(y)

## Bootstrap

<tool name="read_file">
 <read path=".zen/.agent/zen.core.md" required="true" error="on not found" />
 <read path=".zen/rules/*.md" required="true" />
 <read path=".zen/specs/ARCHITECTURE.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/VALIDATION_REPORT.schema.md" required="true" error="on not found" />
</tool>

## User Input

### Source (aka x)
```text
${input:source:source-artifact}
```

If x is not specified, it is the last completed work.

### Target (aka y)
```text
${input:target:target-artifact}
```

If y is not specified, it is implied according to these rules:

1. x is plan → ask for clarification
2. previous work against a plan → use that plan
3. else → walk UP workflow toward architecture

You **MUST** consider the user input before proceeding (if not empty).

## Definitions

x = source artifact (what is being validated) = design(s).
y = target artifact (what x is validated against) = requirement(s).

## Inputs

<file type="architecture" path=".zen/specs/ARCHITECTURE.md" />
<file type="requirements" path=".zen/specs/REQ-{code}-{feature-name}.md" required="if relevant" />
<file type="design" path=".zen/specs/DESIGN-{code}-{feature-name}.md" required="if relevant" />
<file type="api" path=".zen/specs/API-{code}-{feature-name}.md" required="if relevant" />
<file type="plan" path=".zen/plans/PLAN-{code}-{feature-name}.md" required="if relevant" />

## Action

Validate that the specified source:y aligns with the target:y, and if not, report all differences.
Follow Zen conventions.

## Ouputs

<report schema=".zen/.agent/schemas/VALIDATION_REPORT.schema.md" />

## Rules

You SHALL validate alignment of source:y with target:y.
You SHALL report all differences.
You SHALL consider traceability.
You SHALL report missing trace IDs.
You MAY use todos and tools as needed.