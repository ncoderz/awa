# Merge Two Feature Codes

## Bootstrap

<tool name="read_file">
 <read path=".awa/.agent/awa.core.md" required="true" error="on not found" />
 <read path=".awa/rules/*.md" required="true" />
 <read path=".awa/specs/ARCHITECTURE.md" required="true" error="on not found" />
</tool>

## User Input

```text
${input}
```

You **MUST** consider the user input before proceeding (if not empty).

## Inputs

<file type="architecture" path=".awa/specs/ARCHITECTURE.md" />
<file type="feat" path=".awa/specs/FEAT-{SOURCE_CODE}-*.md" required="true" />
<file type="feat" path=".awa/specs/FEAT-{TARGET_CODE}-*.md" required="if exists" />
<file type="requirements" path=".awa/specs/REQ-{SOURCE_CODE}-*.md" required="if exists" />
<file type="requirements" path=".awa/specs/REQ-{TARGET_CODE}-*.md" required="if exists" />
<file type="design" path=".awa/specs/DESIGN-{SOURCE_CODE}-*.md" required="if exists" />
<file type="design" path=".awa/specs/DESIGN-{TARGET_CODE}-*.md" required="if exists" />
<file type="tasks" path=".awa/tasks/TASK-{SOURCE_CODE}-*.md" required="if exists" />
<file type="tasks" path=".awa/tasks/TASK-{TARGET_CODE}-*.md" required="if exists" />

## Action

Merge the source feature code into the target feature code using `awa spec merge`, following awa conventions.

This combines all spec files, traceability IDs, code markers, and tests from the source code into the target code's namespace, then removes the source.

## Merge Process

0. PRE-VALIDATE
   - Run `awa check` to record existing errors before proceeding

1. IDENTIFY CODES
   - Determine the source code (to be absorbed) and target code (to receive content)
   - Verify both codes exist by checking for spec files: `awa spec codes`
   - Confirm the merge direction with the user if ambiguous

2. PREVIEW CHANGES
   - Run `awa spec merge <source> <target> --dry-run` to see planned operations
   - Review the output: ID remap table, file merges, renames, deletions
   - If output looks wrong, abort and investigate

3. EXECUTE MERGE
   - Run `awa spec merge <source> <target>` to apply the merge
   - The command performs these phases automatically:
     a. **Recode IDs**: Source IDs are offset past target's highest IDs and rewritten
     b. **Merge spec files**: For single-instance types (FEAT, REQ, DESIGN), content is appended to the target file; for multi-instance types (EXAMPLE, TASK), files are renamed
     c. **Cleanup**: Source files are deleted after merge
     d. **Stale reference check**: Remaining references to the source code are reported

4. FIX MERGED FILES
   - Open every merged spec file and verify content coherence
   - Reorder content into logical order
   - Merge blocks where logical, but otherwise do not modify wording
   - Check that merged REQ files have consistent requirement structure
   - Check that merged DESIGN files have non-overlapping component names
   - Generally fix the files

5. VALIDATE
   - Run `awa check` to verify new status
   - Fix any newly reported errors
   - If no errors reported, process is complete

## Outputs

- Merged spec files under the target code namespace
- Renamed multi-instance files (EXAMPLE, TASK) under the target code
- Updated code and test files with recoded traceability markers
- Updated ARCHITECTURE.md feature codes table
- Deleted source code spec files

## Rules

You SHALL always preview with `--dry-run` before executing a merge.
You SHALL confirm the merge direction (source → target) with the user.
You SHALL run `awa check --spec-only` after merge to verify structural integrity.
You SHALL run `awa check` after merge if code markers were rewritten.
You SHALL review merged file content for coherence and size limits.
You SHALL use `--renumber` when clean sequential IDs are requested.
You SHALL NOT merge a code into itself.
You SHALL NOT proceed if `--dry-run` reveals unexpected stale references.
You SHALL update user-facing documentation when the merge changes public features, CLI, or configuration.
You SHALL clarify open points with user.
You MAY use todos and tools as needed.
