# Zen Upgrade Prompt Plan

STATUS: in-progress
WORKFLOW: top-down
TRACEABILITY: Requirements — [.zen/specs/REQ-cli.md](.zen/specs/REQ-cli.md), [.zen/specs/REQ-config.md](.zen/specs/REQ-config.md), [.zen/specs/REQ-diff.md](.zen/specs/REQ-diff.md), [.zen/specs/REQ-generation.md](.zen/specs/REQ-generation.md), [.zen/specs/REQ-templates.md](.zen/specs/REQ-templates.md), [.zen/specs/REQ-feature-presets.md](.zen/specs/REQ-feature-presets.md); Design — [.zen/specs/DESIGN-zen-cli.md](.zen/specs/DESIGN-zen-cli.md); Code — [.github/prompts](.github/prompts); Tests — [src/__tests__](src/__tests__)

## Objective
Create a new prompt `zen.upgrade` that guides upgrading architecture, requirements, design, task, and plan specs to conform to their current schemas in [.zen/.agent/schemas](.zen/.agent/schemas), producing safe, repeatable upgrade instructions.

## Scope
- In-scope: Prompt file [.github/prompts/zen.upgrade.prompt.md](.github/prompts/zen.upgrade.prompt.md); guidance for documents in [.zen/specs](.zen/specs) and [.zen/tasks](.zen/tasks); plan alignment to [.zen/plans](.zen/plans).
- Out-of-scope: Implementing actual spec rewrites; code changes outside prompts.

## Workflow
DIRECTION: top-down
INPUTS: [.zen/.agent/zen.core.md](.zen/.agent/zen.core.md); [.zen/rules/system-information.md](.zen/rules/system-information.md); schemas in [.zen/.agent/schemas](.zen/.agent/schemas); existing prompts in [.github/prompts](.github/prompts); current specs and tasks.
OUTPUTS: [.github/prompts/zen.upgrade.prompt.md](.github/prompts/zen.upgrade.prompt.md); usage notes for template mirroring in [templates/zen/.github/prompts/zen.upgrade.prompt.md](templates/zen/.github/prompts/zen.upgrade.prompt.md).

## Constraints
- Keep prompt concise; reuse existing prompt patterns (frontmatter, Bootstrap, Inputs, Action, Output File(s), Rules).
- Respect schema requirements for ARCHITECTURE, REQ, DESIGN, TASK, PLAN; no restating content outside schema fields.
- Non-destructive: prompt must avoid direct edits to target specs unless user confirms.
- Maintain traceability markers and 500-line file limit guidance.

## Assumptions
- Schemas in [.zen/.agent/schemas](.zen/.agent/schemas) are source of truth.
- Existing prompts (architecture, requirements, design, tasks, validate) represent preferred style.
- No additional feature-specific schemas are required for this upgrade.

## Strategy
1) Derive structure from existing prompts (e.g., architecture, plan) to ensure consistency.
2) Embed explicit bootstrap reads for zen.core, rules, target spec, and corresponding schema per artifact type.
3) Define upgrade checklist per artifact type (ARCHITECTURE, REQ, DESIGN, TASK, PLAN) mapping sections to schema fields.
4) Add validation guidance (schema conformance, traceability markers, line limits).
5) Mirror prompt into templates/zen for generation parity.

## Detailed Plan

### S1 Baseline Review
- Read existing prompts (architecture, requirements, design, tasks, plan, validate) and schemas to capture consistent tone, structure, and required tools.
- Identify reusable sections (frontmatter keys, bootstrap tool calls, Rules patterns).

### S2 Prompt Skeleton
- Draft `zen.upgrade` frontmatter (description, argument-hint, tools list) matching house style.
- Add Bootstrap section to read zen.core, rules, target documents, and all relevant schemas.
- Define Inputs section enumerating architecture, req, design, task, plan files.

### S3 Upgrade Instructions
- For each artifact type, add concise guidance to align sections to schema fields (required vs optional, prohibited patterns, rendering hints).
- Include traceability expectations (AC IDs, property IDs, @zen-component/impl/test markers) and change-log handling.

### S4 Validation Flow
- Add Action section steps: assess user input, audit current doc vs schema, propose edits, validate against schema, flag open questions.
- Include Output File(s) section pointing to updated spec paths and template mirror.

### S5 Safety and Mirrors
- Add Rules emphasizing non-destructive edits, schema compliance, and confirmation before changes.
- Add note to update template copy at [templates/zen/.github/prompts/zen.upgrade.prompt.md](templates/zen/.github/prompts/zen.upgrade.prompt.md) to keep generators in sync.

### S6 Review and Handoff
- Self-check for brevity, clarity, and alignment with PLAN.schema metadata requirements.
- Capture open questions and success criteria; hand off for execution.

## Risks
- SCHEMA DRIFT: Missing future schema changes → Mitigate by referencing schema files explicitly in Bootstrap.
- STYLE INCONSISTENCY: Prompt diverges from existing pattern → Mitigate by reusing structure from current prompts.
- OVER-SCOPING: Prompt attempts to auto-apply changes instead of guiding → Keep instructions advisory, user-driven.

## Completion Criteria
- New prompt exists at [.github/prompts/zen.upgrade.prompt.md](.github/prompts/zen.upgrade.prompt.md) and mirrored in templates.
- Prompt includes bootstrap reads for zen.core, rules, target docs, and all five schemas.
- Prompt provides per-artifact upgrade checklists tied to schema fields and traceability markers.
- Language is succinct and consistent with existing zen.* prompts.
