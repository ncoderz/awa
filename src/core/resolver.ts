// @zen-component: ConflictResolver
// @zen-impl: CLI-5 AC-5.2
// @zen-impl: CLI-5 AC-5.3
// @zen-impl: GEN-4 AC-4.1
// @zen-impl: GEN-4 AC-4.2
// @zen-impl: GEN-4 AC-4.3
// @zen-impl: GEN-5 AC-5.1
// @zen-impl: GEN-5 AC-5.2
// @zen-impl: GEN-5 AC-5.3
// @zen-impl: GEN-5 AC-5.4
// @zen-impl: GEN-5 AC-5.5
// @zen-impl: GEN-5 AC-5.6
// @zen-impl: GEN-5 AC-5.7
// @zen-impl: GEN-6 AC-6.3
// @zen-impl: GEN-10 AC-10.3

import { isCancel, multiselect } from '@clack/prompts';
import type { BatchConflictResolution, ConflictItem } from '../types/index.js';

export class ConflictResolver {
  // @zen-impl: GEN-4 AC-4.1, GEN-4 AC-4.2, GEN-4 AC-4.3
  // @zen-impl: GEN-5 AC-5.1, GEN-5 AC-5.2, GEN-5 AC-5.3, GEN-5 AC-5.4, GEN-5 AC-5.5, GEN-5 AC-5.6, GEN-5 AC-5.7
  // @zen-impl: CLI-5 AC-5.2, CLI-5 AC-5.3
  // @zen-impl: GEN-6 AC-6.3
  async resolveBatch(
    conflicts: ConflictItem[],
    force: boolean,
    dryRun: boolean
  ): Promise<BatchConflictResolution> {
    // In dry-run mode, never modify files (P7: Dry Run Immutable)
    if (dryRun) {
      return {
        overwrite: [],
        skip: conflicts.map((c) => c.outputPath),
      };
    }

    // In force mode, always overwrite without prompting (P8: Force No Prompt)
    if (force) {
      return {
        overwrite: conflicts.map((c) => c.outputPath),
        skip: [],
      };
    }

    // Filter out files where content is identical (AC-5.7)
    const differentFiles = conflicts.filter((c) => c.newContent !== c.existingContent);

    // If all files are identical, skip them all
    if (differentFiles.length === 0) {
      return {
        overwrite: [],
        skip: conflicts.map((c) => c.outputPath),
      };
    }

    // @zen-impl: GEN-5 AC-5.1, GEN-5 AC-5.2, GEN-5 AC-5.5, GEN-5 AC-5.6
    // Prompt user with multi-select (all selected by default)
    const selected = await multiselect({
      message: 'The following files already exist. Select files to overwrite:',
      options: differentFiles.map((c) => ({
        value: c.outputPath,
        label: c.outputPath,
      })),
      initialValues: differentFiles.map((c) => c.outputPath), // All selected by default (AC-5.6)
      required: false,
    });

    // @zen-impl: GEN-10 AC-10.3
    // Handle user cancellation (Ctrl+C)
    if (isCancel(selected)) {
      process.exit(1);
    }

    const selectedPaths = selected as string[];
    const allPaths = differentFiles.map((c) => c.outputPath);

    // Files with identical content that were filtered out should be skipped
    const identicalPaths = conflicts
      .filter((c) => c.newContent === c.existingContent)
      .map((c) => c.outputPath);

    return {
      overwrite: selectedPaths,
      skip: [...allPaths.filter((p) => !selectedPaths.includes(p)), ...identicalPaths],
    };
  }
}

export const conflictResolver = new ConflictResolver();
