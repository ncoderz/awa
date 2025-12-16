---
description: "Update Zen template files to match changes in generated agent files"
tools: ["edit", "runCommands", "search", "read"]
---

# Update Zen Templates Prompt

This prompt guides you through updating the Zen template files in `./templates/zen` to match changes made in the generated Zen agent files.

## Context

The Zen CLI generates agent files from templates using the Eta templating engine. Templates can include partials from `./templates/zen/_partials/` directory. Your goal is to reverse-engineer changes from the generated files back into the template source files.

## Understanding Template Assembly

Templates use Eta syntax:

- `<%~ include('_partials/header.md', it) %>` - includes a partial
- `<% if (condition) { %> ... <% } %>` - conditional logic
- `<%= variable %>` - output variable
- `<%~ variable %>` - output variable without escaping

Key files:

- **Generated files** (TARGET - do not modify):
  - `./.zen/.agent/zen.core.md` - Core agent configuration
  - `./.zen/.agent/schemas/*.schema.md` - Schema definitions (ARCHITECTURE, DESIGN, PLAN, REQ, TASK, etc.)
  - `./.github/agents/zen.agent.md` - Main Zen agent file
  - `./.github/prompts/zen.*.prompt.md` - Mode-specific prompts (architecture, code, design, documentation, plan, requirements, tasks, validate)
- **Template files** (SOURCE - edit these): `./templates/zen/` mirrors the root directory structure:
  - `./templates/zen/.zen/.agent/zen.core.md` → `./.zen/.agent/zen.core.md`
  - `./templates/zen/.zen/.agent/schemas/*.schema.md` → `./.zen/.agent/schemas/*.schema.md`
  - `./templates/zen/.github/agents/zen.agent.md` → `./.github/agents/zen.agent.md`
  - `./templates/zen/.github/prompts/zen.*.prompt.md` → `./.github/prompts/zen.*.prompt.md`
- **Partial files**: `./templates/zen/_partials/*.md` (shared content included by templates)

## State Machine

<stateMachine name="UpdateZenTemplates" initialState="AnalyzeDifferences">

  <state id="AnalyzeDifferences" label="Analyze Differences">
    <description>Compare generated agent files with template files to identify changes</description>
    <actions>
      <run command="npm run diff:zen" description="Generate diff report between templates and target files" />
      <analyze target="diff_output" description="Identify which files have differences" />
      <read path="./.zen/.agent/zen.core.md" description="Read core agent file" />
      <read path="./.zen/.agent/schemas/*.schema.md" description="Read schema files" />
      <read path="./.github/agents/zen.agent.md" description="Read main agent file" />
      <read path="./.github/prompts/zen.*.prompt.md" description="Read mode-specific prompt files" />
      <read path="./templates/zen/.zen/.agent/*.md" description="Read corresponding template files" />
      <read path="./templates/zen/.zen/.agent/schemas/*.schema.md" description="Read schema template files" />
      <read path="./templates/zen/.github/agents/*.md" description="Read agent template files" />
      <read path="./templates/zen/.github/prompts/*.prompt.md" description="Read prompt template files" />
      <read path="./templates/zen/_partials/*.md" description="Read partial files that may be included" />
      <identify target="change_locations" description="Determine if changes are in template-specific content or in partials" />
    </actions>
    <transitions>
      <transition target="Success" condition="No differences found (exit code 0)" />
      <transition target="UpdateTemplates" condition="Differences found (exit code 1)" />
    </transitions>
  </state>

  <state id="UpdateTemplates" label="Update Templates">
    <description>Apply changes from generated files back to template source files</description>
    <actions>
      <determine target="affected_files" description="Identify which template or partial files need updates" />
      <foreach item="changed_file" in="affected_files">
        <if condition="change is in partial content">
          <edit path="./templates/zen/_partials/{partial}.md" description="Update partial file with changes" />
        </if>
        <if condition="change is in a target file">
          <edit path="./templates/zen/{target_path}" description="Update template file (mirrors root structure)" />
        </if>
      </foreach>
      <note>NEVER modify files in ./.zen/.agent/, ./.github/agents/, or ./.github/prompts/ - these are target files only</note>
      <note>Only edit files in ./templates/zen/ directory</note>
      <note>Template paths mirror root: e.g., ./.github/agents/zen.agent.md → ./templates/zen/.github/agents/zen.agent.md</note>
      <note>Preserve Eta template syntax (includes, conditionals, variables)</note>
      <note>If content appears in multiple generated files, it likely belongs in a partial</note>
    </actions>
    <transitions>
      <transition target="ValidateChanges" />
    </transitions>
  </state>

  <state id="ValidateChanges" label="Validate Changes">
    <description>Verify template changes produce exact original files</description>
    <actions>
      <run command="npm run diff:zen" description="Re-run diff to validate template changes" />
      <analyze target="diff_output" description="Check if differences remain" />
    </actions>
    <transitions>
      <transition target="Success" condition="No differences (exit code 0)" />
      <transition target="AnalyzeDifferences" condition="Differences remain (exit code 1) AND iterations &lt; 5" />
      <transition target="Failure" condition="Differences remain (exit code 1) AND iterations >= 5" />
    </transitions>
  </state>

  <state id="Success" label="Success">
    <description>Templates successfully updated to match generated files</description>
    <actions>
      <report status="success" message="Template files updated successfully. Generated files match target files exactly." />
      <list target="files_modified" description="Show which template/partial files were changed" />
    </actions>
    <transitions>
      <transition target="End" />
    </transitions>
  </state>

  <state id="Failure" label="Failure">
    <description>Unable to resolve all differences after maximum iterations</description>
    <actions>
      <report status="failure" message="Unable to resolve all differences after 5 iterations." />
      <report target="remaining_diffs" description="Show remaining differences that could not be resolved" />
      <suggest target="manual_review" description="Suggest manual review of remaining differences" />
    </actions>
    <transitions>
      <transition target="End" />
    </transitions>
  </state>

  <state id="End" label="End">
    <description>Process complete</description>
  </state>

</stateMachine>

## Important Notes

1. **NEVER MODIFY TARGET FILES**: You SHALL NOT modify or regenerate files in `./.zen/.agent/`, `./.github/agents/`, or `./.github/prompts/`. These are the target files that contain the desired changes. Only update template files in `./templates/zen/` to match them.
2. **Template Structure**: Templates mirror root directory structure. For example:
   - `./.github/agents/zen.agent.md` → `./templates/zen/.github/agents/zen.agent.md`
   - `./.zen/.agent/schemas/DESIGN.schema.md` → `./templates/zen/.zen/.agent/schemas/DESIGN.schema.md`
3. **Partial vs Template**: If the same content appears in multiple generated files, it's likely from a shared partial in `_partials/`
4. **Preserve Syntax**: Maintain all Eta template syntax (`<%~`, `<%`, `%>`, etc.)
5. **Template Data**: Templates receive an `it` object with data (check `_README.md` for structure)
6. **Exact Match**: The diff must show zero differences for success (whitespace-sensitive)
7. **Iteration Limit**: Maximum 10 iterations to prevent infinite loops

## Validation Command

```bash
npm run diff:zen
```

This runs: `tsx src/cli/index.ts diff . --template ./templates/zen`

Compares templates against the root directory, matching files like:
- `./.zen/.agent/` - Core agent and schema files
- `./.github/agents/` - Main agent file
- `./.github/prompts/` - Mode-specific prompt files

Exit codes:

- `0` = all files match exactly (success)
- `1` = differences found (continue iteration)

## Example Workflow

1. Run `npm run diff:zen` to see what changed
2. If `.github/prompts/zen.code.prompt.md` has changes:
   - Read `./.github/prompts/zen.code.prompt.md` (target, has changes)
   - Read `./templates/zen/.github/prompts/zen.code.prompt.md` (template source)
   - Read `./templates/zen/_partials/header.md` (if changes are in header)
   - Apply changes to appropriate template file(s)
3. If `.zen/.agent/schemas/DESIGN.schema.md` has changes:
   - Read `./.zen/.agent/schemas/DESIGN.schema.md` (target, has changes)
   - Read `./templates/zen/.zen/.agent/schemas/DESIGN.schema.md` (template source)
   - Apply changes to the template
4. Run `npm run diff:zen` again to validate
5. Repeat until exit code is 0

## Success Criteria

- `npm run diff:zen` exits with code 0
- No output diffs shown
- All template files preserve Eta syntax
- All agent files match their generated counterparts exactly
