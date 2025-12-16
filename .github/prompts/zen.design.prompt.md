---
description: Create or update design documents
argument-hint: "<design-instruction>"
---

# Create or Update Design(s)

## Bootstrap

<tool name="read_file">
 <read path=".zen/.agent/zen.core.md" required="true" error="on not found" />
 <read path=".zen/rules/*.md" required="true" />
 <read path=".zen/specs/ARCHITECTURE.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/DESIGN.schema.md" required="true" error="on not found" />
 <read path=".zen/.agent/schemas/REQ.schema.md" optional="true" />
</tool>

## User Input

```text
${input:instruction}
```

You **MUST** consider the user input before proceeding (if not empty).

## Inputs

<file type="architecture" path=".zen/specs/ARCHITECTURE.md" />
<file type="requirements" path=".zen/specs/REQ-{code}-{feature-name}.md" required="if relevant" />
<file type="design" path=".zen/specs/DESIGN-{code}-{feature-name}.md" required="if relevant" />
<file type="api" path=".zen/specs/API-{code}-{feature-name}.md" required="if relevant" />

## Action

Update or create the requirements document(s) as specified in the instruction above, following Zen conventions.

## Ouput File(s)

<file path=".zen/specs/DESIGN-{code}-{feature-name}.md" />
<file path=".zen/specs/API-{code}-{api-name}.tsp" />

## Rules

You SHALL solidify design with respect to architecture and requirements,
You SHALL create and maintain design specifications for features.
You SHALL create and maintain API specifications in TypeSpec format.
You SHALL Define component interfaces, data models, and error handling strategies.
You SHALL identify existing requirements to update, or new requirements to create.
You SHALL consider edge cases, UX, technical constraints, success criteria.
You MUST identify areas where research is needed based on the feature requirements.
You MUST conduct research and build up context in the conversation thread.
You SHALL ensure the 3-letter {code} used in the filename is unique within the project.
You SHALL clarify open points with user.
You MAY use todos and tools as needed.