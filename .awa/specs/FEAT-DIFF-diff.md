# Diff Command [INFORMATIVE]

## Problem

After generating agent configuration files, developers need to know when their project's files have drifted from the latest templates — whether from template updates, manual edits, or feature flag changes. Running `awa template generate` again risks overwriting intentional changes. Developers need a read-only comparison that shows exactly what differs without touching anything.

This is especially important in CI pipelines, where an automated check can flag drift and block merges until agent files are regenerated.

## Conceptual Model

The `awa template diff` command is a read-only comparison between what the templates would produce and what currently exists in the target directory. It works in three steps:

1. GENERATE TO TEMP — templates are rendered into a system temporary directory using the same pipeline as `generate` (same features, same template, same config).

2. COMPARE — each generated file is compared against its counterpart in the target directory:
   - IDENTICAL: content matches byte-for-byte.
   - MODIFIED: content differs; a unified diff (git-style, with color) is displayed.
   - NEW: file exists in generated output but not in target.
   - BINARY-DIFFERS: binary files that differ (no textual diff).
   - EXTRA: file exists in target but not in generated output (only reported with `--list-unknown`).
   - DELETE-LISTED: file exists in target and is listed in `_delete.txt` (respecting feature-gated sections).

3. CLEAN UP — the temporary directory is always deleted, even if an error occurs mid-comparison.

Exit codes convey the result: 0 means all files match (no drift), 1 means differences were found, 2 means an error occurred. This makes `awa template diff` directly usable as a CI gate.

Target-only ("extra") files are excluded by default to reduce noise. The `--list-unknown` flag includes them in results and summary. Delete-listed files are always reported when they exist in the target.

## Scenarios

### Scenario 1: No drift

A developer runs `awa template diff .` after a clean generation. All files match. Exit code 0, no output beyond a brief summary.

### Scenario 2: Template update detected

After upgrading awa, `awa template diff .` shows unified diffs for three modified files and one new file. The developer reviews the diffs and decides to regenerate.

### Scenario 3: CI drift check

A GitHub Actions workflow includes `awa template diff .` as a step. If it exits with code 1, the workflow fails and comments on the PR that agent files need regeneration.

### Scenario 4: Listing unknown files

A developer suspects stale files in their `.github/` directory. They run `awa template diff . --list-unknown`. In addition to the usual comparison, files in the target that don't correspond to any template are reported as "extra".

### Scenario 5: Delete-listed file detection

The template's `_delete.txt` lists a file that still exists in the target. `awa template diff .` reports it as "delete-listed" and counts it as a difference (affecting the exit code and summary).

### Scenario 6: Feature-gated delete awareness

The `_delete.txt` has a feature-gated section for `copilot`. When diffing with `--features copilot`, the gated files are not reported as delete-listed (the feature is active, so they're kept). Without `copilot` in the features, they appear as delete-listed.

### Scenario 7: Binary file differences

A template includes a binary asset. The asset in the target differs from the generated version. The diff reports "binary files differ" without attempting a textual comparison.

## Change Log

- 1.0.0 (2026-02-24): Initial feature context derived from code and requirements
- 1.1.0 (2026-02-27): Schema upgrade — replaced bold formatting with CAPITALS
