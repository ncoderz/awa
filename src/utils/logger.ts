// @awa-component: GEN-Logger
// @awa-impl: CLI-6_AC-3
// @awa-impl: GEN-6_AC-4
// @awa-impl: GEN-7_AC-1
// @awa-impl: GEN-7_AC-2
// @awa-impl: GEN-7_AC-3
// @awa-impl: GEN-7_AC-4
// @awa-impl: GEN-9_AC-1
// @awa-impl: GEN-9_AC-2
// @awa-impl: GEN-9_AC-3
// @awa-impl: GEN-9_AC-4
// @awa-impl: GEN-9_AC-5
// @awa-impl: GEN-9_AC-6
// @awa-impl: GEN-9_AC-7
// @awa-impl: GEN-9_AC-8
// @awa-impl: GEN-11_AC-1
// @awa-impl: GEN-11_AC-2
// @awa-impl: GEN-11_AC-4
// @awa-impl: TPL-7_AC-3

import chalk from 'chalk';
import type { DiffResult, FileAction, GenerationResult } from '../types/index.js';

export class Logger {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✔'), message);
  }

  warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  error(message: string): void {
    console.error(chalk.red('✖'), message);
  }

  fileAction(action: FileAction): void {
    const { type, outputPath } = action;

    switch (type) {
      case 'create':
        console.log(chalk.green('  + '), chalk.dim(outputPath));
        break;
      case 'overwrite':
        console.log(chalk.yellow('  ~ '), chalk.dim(outputPath));
        break;
      case 'skip-user':
        console.log(chalk.blue('  - '), chalk.dim(outputPath), chalk.dim('(skipped)'));
        break;
      case 'skip-empty':
        console.log(chalk.dim('  · '), chalk.dim(outputPath), chalk.dim('(empty)'));
        break;
      case 'skip-equal':
        console.log(chalk.dim('  = '), chalk.dim(outputPath), chalk.dim('(unchanged)'));
        break;
      case 'delete':
        console.log(chalk.red('  ✖ '), chalk.dim(outputPath), chalk.red('(deleted)'));
        break;
    }
  }

  // @awa-impl: GEN-9_AC-1, GEN-9_AC-2, GEN-9_AC-3, GEN-9_AC-4, GEN-9_AC-5, GEN-9_AC-6
  summary(result: GenerationResult): void {
    console.log('');
    console.log(chalk.bold('Summary:'));

    // @awa-impl: GEN-9_AC-6
    // Check if no files were created, overwritten, or deleted
    if (result.created === 0 && result.overwritten === 0 && result.deleted === 0) {
      console.log(chalk.yellow('  ⚠ No files were created, overwritten, or deleted'));
    }

    if (result.created > 0) {
      console.log(chalk.green(`  Created: ${result.created}`));
    }

    if (result.overwritten > 0) {
      console.log(chalk.yellow(`  Overwritten: ${result.overwritten}`));
    }

    if (result.deleted > 0) {
      console.log(chalk.red(`  Deleted: ${result.deleted}`));
    }

    if (result.skippedEqual > 0) {
      console.log(chalk.dim(`  Skipped (equal): ${result.skippedEqual}`));
    }

    if (result.skippedUser > 0) {
      console.log(chalk.blue(`  Skipped (user): ${result.skippedUser}`));
    }

    if (result.skippedEmpty > 0) {
      console.log(chalk.dim(`  Skipped (empty): ${result.skippedEmpty}`));
    }

    console.log('');
  }

  // @awa-impl: DIFF-4_AC-3
  diffLine(line: string, type: 'add' | 'remove' | 'context'): void {
    switch (type) {
      case 'add':
        console.log(chalk.green(line));
        break;
      case 'remove':
        console.log(chalk.red(line));
        break;
      case 'context':
        console.log(chalk.dim(line));
        break;
    }
  }

  // @awa-impl: DIFF-4_AC-4, DIFF-4_AC-5
  diffSummary(result: DiffResult): void {
    console.log('');

    const filesCompared =
      result.identical +
      result.modified +
      result.newFiles +
      result.extraFiles +
      result.binaryDiffers +
      result.deleteListed;
    const differences =
      result.modified +
      result.newFiles +
      result.extraFiles +
      result.binaryDiffers +
      result.deleteListed;

    // @awa-impl: DIFF-4_AC-5
    console.log(chalk.bold(`${filesCompared} files compared, ${differences} differences`));

    if (!result.hasDifferences) {
      // @awa-impl: DIFF-4_AC-4
      console.log(chalk.green('✔ No differences found'));
    }

    // @awa-impl: DIFF-4_AC-5
    console.log(chalk.bold('Summary:'));
    console.log(chalk.dim(`  Identical: ${result.identical}`));

    if (result.modified > 0) {
      console.log(chalk.yellow(`  Modified: ${result.modified}`));
    }

    if (result.newFiles > 0) {
      console.log(chalk.green(`  New: ${result.newFiles}`));
    }

    if (result.extraFiles > 0) {
      console.log(chalk.red(`  Extra: ${result.extraFiles}`));
    }

    if (result.binaryDiffers > 0) {
      console.log(chalk.red(`  Binary differs: ${result.binaryDiffers}`));
    }

    if (result.deleteListed > 0) {
      console.log(chalk.red(`  Delete listed: ${result.deleteListed}`));
    }

    console.log('');
  }
}

export const logger = new Logger();
