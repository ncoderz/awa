# File Generation [INFORMATIVE]

## Problem

Generating agent configuration files involves more than rendering templates. The output directory may already contain files from a previous run. Some files may have been customised by the user and overwriting them silently would destroy their changes. Some files from earlier template versions may no longer be needed and should be cleaned up.

Without a structured generation pipeline, developers face either losing changes (force overwrite everything) or accumulating stale files (never clean up).

## Conceptual Model

File generation is a pipeline with several stages:

1. **Template walking** — the generator traverses the template directory, mirroring its structure in the output path. Files and directories starting with `_` (partials, helpers, delete lists) are excluded from output.

2. **Rendering** — each template file is rendered through the template engine. Empty output means the file is skipped; the `AWA:EMPTY_FILE` marker creates an intentionally empty file.

3. **Conflict resolution** — when an output file already exists, the system compares the new content against the existing content:
   - Identical content → automatically skipped (no prompt).
   - Different content → user is prompted to choose overwrite or skip, unless `--force` (auto-overwrite) or `--dry-run` (simulate only) is active.
   - Conflicts are batched into a single interactive multiselect prompt rather than one-at-a-time.

4. **Delete list processing** — after generation, if `_delete.txt` exists in the template root and `--delete` is provided, the system identifies files that are candidates for deletion. These are files that the template author has declared as obsolete. Feature-gated sections in `_delete.txt` allow conditional deletion: paths are deleted only when none of the listed features are active. Without `--delete`, the system warns about eligible files but does not delete them.

5. **Summary** — a count of created, overwritten, skipped (user-declined, empty, identical), and deleted files is displayed.

An important concept is the **interactive multi-tool selection**: when the `generate` command is run without any tool-related feature flags, the user is presented with an interactive multiselect prompt showing available tools (copilot, claude, cursor, windsurf, etc.). This makes first-run onboarding smoother.

## Scenarios

### Scenario 1: Clean generation

A developer runs `awa generate ./my-project` for the first time. No files exist in the output directory. The generator creates all files, reports "N created", and finishes without prompts.

### Scenario 2: Regeneration with conflicts

The developer runs `awa generate .` again. Some files have changed in the template. The system detects files where content differs and presents a single multiselect prompt listing all conflicting files (all checked by default). The developer unchecks two files they want to keep, and the rest are overwritten.

### Scenario 3: Identical content auto-skip

A file was generated previously and neither the template nor the feature flags have changed. The rendered output is byte-for-byte identical to the existing file. The system automatically skips it without prompting — reported as "Skipped (equal)" in the summary.

### Scenario 4: Dry run

A developer runs `awa generate . --dry-run`. The system renders all templates, detects conflicts, and prints what it would do — but writes nothing to disk. The summary shows what would be created, overwritten, and skipped.

### Scenario 5: Force overwrite

A CI pipeline runs `awa generate . --force`. All conflicts are automatically overwritten without prompting. The pipeline needs no interactive input.

### Scenario 6: Delete list processing

A template update adds entries to `_delete.txt` for agent config files that are no longer needed. The developer runs `awa generate . --delete`. After generation, the system finds the listed files in the output directory and presents a destructive-styled multiselect (red checkboxes, all pre-selected) for confirmation. The developer confirms, and the stale files are removed.

### Scenario 7: Delete list without --delete flag

The developer runs `awa generate .` (without `--delete`). The system sees files in `_delete.txt` that exist in the output, logs a warning about each one, but does not delete anything. The developer must opt-in explicitly.

### Scenario 8: Feature-gated delete list

The `_delete.txt` contains:
```
# @feature copilot
.github/copilot-instructions.md
```
When the developer generates with `--features copilot --delete`, the file is NOT deleted (the `copilot` feature is active). Without `copilot` in the features, it would be a deletion candidate.

### Scenario 9: Interactive tool selection

A developer runs `awa generate .` with no feature flags. The CLI presents a multiselect of available tools (copilot, claude, cursor, etc.). The developer selects the ones they use, and those become the active features for this generation run.

## Change Log

- 1.0.0 (2026-02-24): Initial feature context derived from code and requirements
