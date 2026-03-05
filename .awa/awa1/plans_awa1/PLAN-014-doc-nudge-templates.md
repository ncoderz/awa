# Encourage Documentation Updates in Templates

STATUS: completed
DIRECTION: lateral

## Context

LLMs write code and tests, then stop. The awa workflow defines CODE & TESTS → DOCUMENTATION,
but nothing in the current templates enforces that final step. This plan adds concise
documentation nudges to the templates, schemas, and prompts that drive implementation.

## Steps

### Templates

- [x] `awa.code.md` — Add step 7 "UPDATE DOCUMENTATION" to Implementation Process
- [x] `awa.code.md` — Add documentation files to Outputs section
- [x] `awa.code.md` — Add concise rule: update docs when user-facing behavior changes
- [x] `awa.tasks.md` — Expand Final Phase to require documentation update tasks
- [x] `awa.tasks.md` — Add doc-task check to Validation Checklist
- [x] `awa.vibe.md` — Add documentation checkpoint after implementation
- [x] `awa.vibe.md` — Add documentation files to Outputs
- [x] `awa.refactor.md` — Add rule: update docs if public interface or behavior changed

### Schemas

- [x] `TASK.schema.yaml` — Add required Documentation phase (may contain "no changes" tasks)
- [x] `PLAN.schema.yaml` — Add optional Documentation subsection (H3) in Steps example

### Validation

- [x] Run `awa check --spec-only` to verify schema changes
- [x] Run `awa template diff` to verify template changes render correctly
- [x] Run `awa template test` to verify test fixtures still pass

## Risks

- Overly aggressive doc nudges cause unnecessary churn on internal-only changes
  - Mitigation: use conditional language ("if user-facing behavior changed")
- Adding to `awa.code.md` makes an already long template longer
  - Mitigation: keep additions concise — step 7 is 3–4 lines, one rule, one output line

## Completion Criteria

- [x] All six templates modified (`code`, `tasks`, `vibe`, `refactor`, `plan schema`, `task schema`)
- [x] `awa check --spec-only` passes
- [x] `awa template test` passes
- [x] Generated output for awa templates reflects the changes (`awa template diff`)
