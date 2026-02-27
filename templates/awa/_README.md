# awa Agent Templates

This template set generates the awa agent files for all major AI coding tools.

## Usage

```bash
# Interactive tool selection (prompts when no tool flag provided)
npx awa generate . --template ./templates/awa

# Single tool
npx awa generate . --template ./templates/awa --features copilot
npx awa generate . --template ./templates/awa --features claude
npx awa generate . --template ./templates/awa --features cursor

# Multiple tools
npx awa generate . --template ./templates/awa --features copilot claude cursor

# Cross-tool AGENTS.md only
npx awa generate . --template ./templates/awa --features agents-md
```

## Tool Feature Flags

| Flag | Tool | Core Instruction File | Skills | Commands / Prompts |
|------|------|-----------------------|--------|--------------------|
| `copilot` | GitHub Copilot | `.github/agents/awa.agent.md` | `.github/skills/awa-*/SKILL.md` | `.github/prompts/awa.*.prompt.md` |
| `claude` | Claude Code | `CLAUDE.md` + `.claude/agents/awa.md` | `.claude/skills/awa-*/SKILL.md` | — |
| `cursor` | Cursor | `.cursor/rules/awa-agent.md` | — | `.cursor/rules/awa-*.md` |
| `windsurf` | Windsurf | `.windsurf/rules/awa-agent.md` | `.windsurf/skills/awa-*/SKILL.md` | — |
| `kilocode` | Kilocode | `.kilocode/rules/awa-agent.md` | `.kilocode/skills/awa-*/SKILL.md` | `.kilocode/workflows/awa-*.md` |
| `opencode` | OpenCode | `.opencode/agents/awa.md` | `.opencode/skills/awa-*/SKILL.md` | `.opencode/commands/awa-*.md` |
| `gemini` | Gemini CLI | `GEMINI.md` | `.gemini/skills/awa-*/SKILL.md` | `.gemini/commands/awa-*.md` |
| `roo` | Roo Code | `.roo/rules/awa-agent.md` + `AGENTS.md` | `.roo/skills/awa-*/SKILL.md` | — |
| `qwen` | Qwen Code | `QWEN.md` | `.qwen/skills/awa-*/SKILL.md` | `.qwen/commands/awa-*.md` |
| `codex` | Codex CLI | `AGENTS.md` | `.agents/skills/awa-*/SKILL.md` | `.codex/prompts/awa-*.md` |
| `agy` | Antigravity | `AGENTS.md` | `.agent/skills/awa-*/SKILL.md` | `.agent/workflows/awa-*.md` |
| `agents-md` | Cross-tool | `AGENTS.md` | — | — |

## Generated Skills

Each tool that supports Agent Skills receives the full set of 15 awa skills:

| Skill | Description |
|-------|-------------|
| `awa-architecture` | Create or update ARCHITECTURE.md |
| `awa-brainstorm` | Brainstorm ideas, explore solutions |
| `awa-check` | Run traceability and schema checks, then fix errors |
| `awa-code` | Implement code and tests |
| `awa-design` | Create or update design documents |
| `awa-documentation` | Create or update project documentation |
| `awa-examples` | Create or update usage examples |
| `awa-feature` | Create or update feature context documents |
| `awa-plan` | Create or update ad-hoc plan documents |
| `awa-refactor` | Refactor code or docs |
| `awa-requirements` | Create or update requirements documents |
| `awa-tasks` | Create or update task list documents |
| `awa-upgrade` | Upgrade specs to match current schemas |
| `awa-align` | Validate alignment between artifacts |
| `awa-vibe` | Full awa workflow from idea to completion |

## Partials

Shared content is in `_partials/`:

| Partial | Description |
|---------|-------------|
| `awa.*.md` | Tool-agnostic skill content (one per skill) |
| `awa.core.md` | Core system instructions (used in all agent/root files) |
| `_skill.awa-*.md` | Standard Agent Skills YAML frontmatter wrapper |
| `_cmd.awa-*.md` | Command/prompt YAML frontmatter wrapper |

## Selection Policy

- **With tool flags**: generates only the selected tools — `--features copilot claude`
- **Without tool flags**: interactive multi-select prompt appears

## Stale File Cleanup

`_delete.txt` lists all possible output paths. When tool selection changes (e.g. removing `copilot`), the engine deletes the now-unused files after generation.

## Customization

1. Copy `templates/awa/` to your project
2. Modify `_partials/awa.core.md` for shared system instruction changes
3. Modify individual `_partials/awa.*.md` for skill-specific changes
4. Run `npx awa generate . --features <tool>` to regenerate
