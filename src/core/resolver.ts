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
// @zen-impl: GEN-6 AC-6.3
// @zen-impl: GEN-10 AC-10.3

import { isCancel, select } from '@clack/prompts';
import type { ConflictChoice } from '../types/index.js';

export class ConflictResolver {
  // @zen-impl: GEN-4 AC-4.1, GEN-4 AC-4.2, GEN-4 AC-4.3
  // @zen-impl: GEN-5 AC-5.1, GEN-5 AC-5.2, GEN-5 AC-5.3, GEN-5 AC-5.4, GEN-5 AC-5.5
  // @zen-impl: CLI-5 AC-5.2, CLI-5 AC-5.3
  // @zen-impl: GEN-6 AC-6.3
  async resolve(filePath: string, force: boolean, dryRun: boolean): Promise<ConflictChoice> {
    // In force mode, always overwrite without prompting
    if (force) {
      return 'overwrite';
    }

    // In dry-run mode, don't prompt (will be handled by caller)
    if (dryRun) {
      return 'skip';
    }

    // @zen-impl: GEN-5 AC-5.1, GEN-5 AC-5.5
    // Prompt user for action
    const choice = await select({
      message: `File exists: ${filePath}`,
      options: [
        { value: 'overwrite', label: 'Overwrite' },
        { value: 'skip', label: 'Skip' },
      ],
    });

    // @zen-impl: GEN-10 AC-10.3
    // Handle user cancellation (Ctrl+C)
    if (isCancel(choice)) {
      process.exit(1);
    }

    return choice as ConflictChoice;
  }
}

export const conflictResolver = new ConflictResolver();
