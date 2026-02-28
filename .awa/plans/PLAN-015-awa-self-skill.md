# Create awa Usage Skill

STATUS: done
DIRECTION: lateral

## Context

The existing awa skills (awa-code, awa-design, awa-check, etc.) teach AIs how to perform specific workflow tasks *within* the awa system. However, there is no skill that teaches AIs **what awa itself is** and how to use it as a tool — its CLI, configuration, file structure, and workflow concepts.

When an AI agent encounters a project using awa for the first time, it needs a skill that explains what awa is, where all its files live, how to invoke the CLI, and how to write `.awa.toml` configuration. This is a reference skill — it does not perform a workflow action, it provides foundational knowledge.

## Steps

### Skill Design

- [x] Skill name: `awa-usage` — "Understand awa, its CLI, and configuration. Use this when asked about awa itself, how to use it, or how to configure it."
- [x] Always present (not feature-gated beyond per-agent gates)
- [x] Template-generated skill (lives in `templates/awa/.github/skills/` and all agent skill dirs)
- [x] Skill-only — no command/workflow partial needed (this is a reference skill, not an action)

### Skill Content

All CLI and config detail included inline (AIs may not have access to `docs/` in every project):

- [x] **What awa is** — agent workflow for AIs, CLI tool, spec-driven development with traceability
- [x] **The `.awa/` directory** — structure of specs/, tasks/, plans/, align/, rules/, .agent/schemas/
- [x] **The workflow** — stages, traceability chain, IDs and markers
- [x] **CLI commands** — full reference for `awa init`/`generate`, `awa diff`, `awa check`, `awa test`, `awa features` with all options
- [x] **Configuration** — complete `.awa.toml` format: root options, `[presets]`, `[check]`, `[targets.*]`, feature resolution order

### Implementation

Files to create following the existing skill pattern:
- [x] `templates/awa/_partials/awa.usage.md` — the actual content
- [x] `templates/awa/_partials/_skill.awa-usage.md` — frontmatter wrapper for non-copilot agents
- [x] `templates/awa/.github/skills/awa-usage/SKILL.md` — copilot (inline frontmatter)
- [x] `templates/awa/.claude/skills/awa-usage/SKILL.md` — claude
- [x] `templates/awa/.agent/skills/awa-usage/SKILL.md` — agy
- [x] `templates/awa/.agents/skills/awa-usage/SKILL.md` — codex
- [x] `templates/awa/.kilocode/skills/awa-usage/SKILL.md` — kilocode
- [x] `templates/awa/.gemini/skills/awa-usage/SKILL.md` — gemini
- [x] `templates/awa/.opencode/skills/awa-usage/SKILL.md` — opencode
- [x] `templates/awa/.qwen/skills/awa-usage/SKILL.md` — qwen
- [x] `templates/awa/.roo/skills/awa-usage/SKILL.md` — roo
- [x] `templates/awa/.windsurf/skills/awa-usage/SKILL.md` — windsurf

### Validation

- [x] Run `awa test` to verify templates still pass
- [x] Run `awa diff .` to verify diff is clean or expected

## Risks

- Skill content could become stale as awa evolves — CLI options and directory structures may change
- Skill may be long given "all detail" requirement — stay under 500 lines
- **Do NOT use markdown fences** (`` ``` ``) in template files — they break Eta rendering when the template itself is inside a fenced block in agent config. Use indented code blocks or plain text instead.

## Dependencies

- Current CLI.md, WORKFLOW.md, and README.md must be up-to-date (source of truth)

## Completion Criteria

- [x] Skill file exists in all 10 agent skill directories plus `_partials/`
- [x] Skill follows the `---` frontmatter + markdown body format of other skills
- [x] Skill accurately covers: what awa is, `.awa/` structure, workflow, CLI commands (full reference), `.awa.toml` config (full reference)
- [x] `awa test` passes with the new skill in place

## Open Questions

- [x] Skill name: `awa-usage` (resolved)
- [x] Feature-gated: always present per agent (resolved)
- [x] CLI detail level: all detail inline (resolved)
- [x] Include common tasks / example prompts: no, CLI and config reference only (resolved)

## References

- Existing skills: `templates/awa/.github/skills/awa-*/SKILL.md`
- CLI docs: `docs/CLI.md`
- Workflow docs: `docs/WORKFLOW.md`
- README: `README.md`
- Config example: `.awa.toml`
