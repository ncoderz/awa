# Zen Agent Templates Plan

STATUS: completed
WORKFLOW: bottom-up
TRACEABILITY: Templates — templates/zen/; Code — src/core/template.ts, src/core/generator.ts

## Objective

Create Eta templates in `/templates/zen/` to generate the 8 zen agent files currently in `.github/agents/`, extracting common content into reusable partials to eliminate duplication and enable feature-driven generation.

## Workflow

DIRECTION: bottom-up

INPUTS:
- [code] .github/agents/zen-alignment.agent.md: Alignment mode agent (851 lines)
- [code] .github/agents/zen-architect.agent.md: Architect mode agent (~300 lines)
- [code] .github/agents/zen-code.agent.md: Code mode agent (~350 lines)
- [code] .github/agents/zen-design.agent.md: Design mode agent (833 lines)
- [code] .github/agents/zen-document.agent.md: Document mode agent (~280 lines)
- [code] .github/agents/zen-plan.agent.md: Plan mode agent (641 lines)
- [code] .github/agents/zen-requirements.agent.md: Requirements mode agent (~500 lines)
- [code] .github/agents/zen-vibe.agent.md: Vibe mode agent (~320 lines)

OUTPUTS:
- [code] templates/zen/_partials/header.md: Shared header (Core Principles, Terminology, etc.)
- [code] templates/zen/_partials/state-machine-common.md: Common state machine states
- [code] templates/zen/_partials/file-permissions-table.md: Configurable permissions table
- [code] templates/zen/_partials/important-rules-base.md: Common important rules
- [code] templates/zen/_partials/traceability.md: Traceability documentation
- [code] templates/zen/_partials/alignment-output-schema.md: Alignment report JSON schema
- [code] templates/zen/_partials/design-schema.md: Design document JSON schema
- [code] templates/zen/_partials/plan-schema.md: Plan document JSON schema
- [code] templates/zen/_partials/requirements-schema.md: Requirements document JSON schema
- [code] templates/zen/zen-alignment.agent.md: Alignment agent template
- [code] templates/zen/zen-architect.agent.md: Architect agent template
- [code] templates/zen/zen-code.agent.md: Code agent template
- [code] templates/zen/zen-design.agent.md: Design agent template
- [code] templates/zen/zen-document.agent.md: Document agent template
- [code] templates/zen/zen-plan.agent.md: Plan agent template
- [code] templates/zen/zen-requirements.agent.md: Requirements agent template
- [code] templates/zen/zen-vibe.agent.md: Vibe agent template

## Constraints

- Templates MUST use Eta syntax (`<%= %>`, `<% %>`, `<%~ include() %>`)
- Output MUST match current agent files exactly when generated with default features
- Partials MUST be in `_partials/` directory (underscore prefix)
- Each template file MUST stay under 500 lines
- Partials MUST NOT contain Eta code unless parameterization is required

## Assumptions

- All 8 agent files are the source of truth
- The HEADER section between `<!-- HEADER -->` markers is 100% identical across all files
- State machine XML format will be preserved
- Frontmatter (YAML between `---` markers) varies per agent and will remain in main templates
- Feature flags may be added later for optional sections

## High-Level Strategy

1. Extract the HEADER section into `_partials/header.md` (identical across all agents)
2. Create parameterized file permissions partial with configurable read/write flags
3. Extract large JSON schemas into dedicated partials (design, plan, requirements, alignment)
4. Extract traceability documentation into a partial (shared by alignment and code modes)
5. Create main agent templates that compose partials with mode-specific content
6. Validate generated output matches original files

## Detailed Plan

### S1 Create Directory Structure

- Create `templates/zen/_partials/` directory

RATIONALE: Establishes the folder structure before creating files

### S2 Extract Header Partial

- Copy the HEADER section (lines between `<!-- HEADER -->` and `<!-- /HEADER -->`) to `_partials/header.md`
- Content is ~85 lines, identical across all 8 agents
- Include the HTML comment markers in the partial

RATIONALE: Largest single block of duplicated content, used by all agents

### S3 Create File Permissions Partial

- Create `_partials/file-permissions-table.md` with Eta parameterization
- Accept a permissions object: `{ architecture, requirements, design, api, plan, project, code, tests, documentation }`
- Each property is an object with `read` and `write` boolean flags
- Render the markdown table with checkmarks/X based on flags

RATIONALE: All agents have this table but with different permission combinations

### S4 Extract JSON Schemas into Partials

- Create `_partials/design-schema.md` with the design document JSON schema (~250 lines)
- Create `_partials/plan-schema.md` with the plan document JSON schema (~200 lines)
- Create `_partials/requirements-schema.md` with the requirements document JSON schema (~200 lines)
- Create `_partials/alignment-output-schema.md` with the alignment report JSON schema (~350 lines)

DEPENDS ON: S1

RATIONALE: These schemas are large blocks that bloat the main templates; extracting them improves readability

### S5 Extract Traceability Partial

- Create `_partials/traceability.md` with the traceability documentation (~150 lines)
- Content is shared between alignment mode (full version) and code mode (abbreviated reference)
- Use Eta conditional to include full vs abbreviated version: `<% if (it.fullTraceability) { %>`

DEPENDS ON: S1

RATIONALE: Large documentation block shared between modes

### S6 Create Important Rules Base Partial

- Create `_partials/important-rules-base.md` with the common task discipline rules
- Rules about breaking down tasks, focusing on one task, TODO/TASK tool usage
- ~10 lines of common content

DEPENDS ON: S1

RATIONALE: DRY principle for rules that appear in 7 of 8 agents

### S7 Create Alignment Agent Template

- Create `templates/zen/zen-alignment.agent.md`
- Include frontmatter (description, tools, handoffs)
- Include header partial: `<%~ include('_partials/header', it) %>`
- Include mode-specific content (Alignment Mode section)
- Include state machine (alignment-specific states)
- Include file permissions partial with read-only permissions for all types
- Include traceability partial with `fullTraceability: true`
- Include alignment output schema partial
- Include important rules

DEPENDS ON: S2, S3, S4, S5, S6

### S8 Create Architect Agent Template

- Create `templates/zen/zen-architect.agent.md`
- Include frontmatter, header partial
- Include mode-specific content (Architect Mode section)
- Include state machine (architect-specific states)
- Include file permissions partial with architecture write permission
- Include architecture file format documentation
- Include important rules

DEPENDS ON: S2, S3, S6

### S9 Create Code Agent Template

- Create `templates/zen/zen-code.agent.md`
- Include frontmatter, header partial
- Include mode-specific content (Code Mode section)
- Include state machine (code-specific states with iteration counter)
- Include file permissions partial with code/tests/project write permissions
- Include traceability reference (abbreviated version)
- Include important rules

DEPENDS ON: S2, S3, S5, S6

### S10 Create Design Agent Template

- Create `templates/zen/zen-design.agent.md`
- Include frontmatter, header partial
- Include mode-specific content (Design Mode section)
- Include state machine
- Include file permissions partial with design/api write permissions
- Include design schema partial
- Include important rules

DEPENDS ON: S2, S3, S4, S6

### S11 Create Document Agent Template

- Create `templates/zen/zen-document.agent.md`
- Include frontmatter, header partial
- Include mode-specific content (Document Mode section)
- Include state machine
- Include file permissions partial with documentation write permission
- Include important rules

DEPENDS ON: S2, S3, S6

### S12 Create Plan Agent Template

- Create `templates/zen/zen-plan.agent.md`
- Include frontmatter, header partial
- Include mode-specific content (Plan Mode section)
- Include state machine
- Include file permissions partial with plan write permission
- Include plan schema partial
- Include important rules

DEPENDS ON: S2, S3, S4, S6

### S13 Create Requirements Agent Template

- Create `templates/zen/zen-requirements.agent.md`
- Include frontmatter, header partial
- Include mode-specific content (Requirements Mode section)
- Include state machine
- Include file permissions partial with requirements write permission
- Include requirements schema partial
- Include important rules

DEPENDS ON: S2, S3, S4, S6

### S14 Create Vibe Agent Template

- Create `templates/zen/zen-vibe.agent.md`
- Include frontmatter, header partial
- Include mode-specific content (Vibe Mode section)
- Include state machine
- Include file permissions partial with all write permissions
- Include traceability reference
- Include important rules

DEPENDS ON: S2, S3, S5, S6

### S15 Create Template README

- Create `templates/zen/_README.md` with usage documentation
- Document available partials
- Document template context expectations
- Document how to generate the agent files

DEPENDS ON: S7, S8, S9, S10, S11, S12, S13, S14

### S16 Validate Output

- Run `npm run gen:zen` or equivalent to generate agents
- Compare generated output with original files in `.github/agents/`
- Fix any discrepancies

DEPENDS ON: S15

## Risks

- TEMPLATE SYNTAX ERRORS [low/medium]: Eta syntax errors may cause generation failures. Mitigation: Test each template incrementally.
- OUTPUT MISMATCH [medium/medium]: Generated files may differ from originals due to whitespace or formatting. Mitigation: Use diff tool to validate exact match.
- PARTIAL BOUNDARIES [low/low]: Incorrect extraction boundaries may break document structure. Mitigation: Include context lines around partial boundaries.

## Completion Criteria

- All 8 agent templates exist in `templates/zen/`
- All 9 partials exist in `templates/zen/_partials/`
- Running generation produces files matching originals in `.github/agents/`
- No template file exceeds 500 lines
- Duplicated content reduced by at least 50%
