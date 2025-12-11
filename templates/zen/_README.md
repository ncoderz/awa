# Zen Agent Templates

This template set generates the 8 Zen agent files for `.github/agents/`.

## Usage

```bash
npx zen generate zen --output .github/agents
```

## Generated Files

| Template | Output | Description |
|----------|--------|-------------|
| `zen-alignment.agent.md` | `.github/agents/zen-alignment.agent.md` | Validate alignment between artifacts |
| `zen-architect.agent.md` | `.github/agents/zen-architect.agent.md` | Define system architecture |
| `zen-code.agent.md` | `.github/agents/zen-code.agent.md` | Implement code and tests |
| `zen-design.agent.md` | `.github/agents/zen-design.agent.md` | Create design specifications |
| `zen-document.agent.md` | `.github/agents/zen-document.agent.md` | Write documentation |
| `zen-plan.agent.md` | `.github/agents/zen-plan.agent.md` | Create implementation plans |
| `zen-requirements.agent.md` | `.github/agents/zen-requirements.agent.md` | Define requirements in EARS format |
| `zen-vibe.agent.md` | `.github/agents/zen-vibe.agent.md` | Unrestricted "vibe coding" mode |

## Partials

Shared content is extracted into `_partials/`:

| Partial | Description |
|---------|-------------|
| `header.md` | Common header (~95 lines) with core principles, terminology, file structure, traceability chain |
| `file-permissions-table.md` | Parameterized file permissions table (accepts `permissions` object) |
| `design-schema.md` | JSON schema for DESIGN documents |
| `plan-schema.md` | JSON schema for PLAN documents |
| `requirements-schema.md` | JSON schema for REQ documents |
| `alignment-output-schema.md` | JSON schema for alignment report output |

## Template Data

Each template receives an `it` object with template data. The file-permissions-table partial expects:

```javascript
{
  permissions: {
    architecture: { read: true, write: false },
    requirements: { read: true, write: true },
    design: { read: true, write: true },
    api: { read: true, write: true },
    plan: { read: true, write: false },
    project: { read: true, write: false },
    code: { read: true, write: true },
    tests: { read: true, write: true },
    documentation: { read: true, write: false }
  }
}
```

## Architecture

### DRY Extraction

The templates apply DRY principles:

1. **Header** (~95 lines): Identical across all 8 agents - extracted to `_partials/header.md`
2. **File Permissions**: Same structure but different values per agent - parameterized partial
3. **JSON Schemas**: Large schemas (200-500 lines each) used by specific agents - separate partials

### Mode-Specific Content

The following sections are NOT extracted as they differ per agent:
- State machines (each mode has unique workflow)
- Traceability sections (code, alignment, vibe have different approaches)
- Important Rules (mode-specific constraints)
- Mode-specific abilities and constraints

## Customization

To customize the agents for a project:

1. Copy `templates/zen/` to your project's `templates/` directory
2. Modify partials in `_partials/` for shared changes
3. Modify individual agent templates for mode-specific changes
4. Run `npx zen generate zen` to regenerate agents
