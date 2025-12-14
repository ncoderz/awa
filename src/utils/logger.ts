// @zen-component: Logger
// @zen-impl: CLI-6 AC-6.3
// @zen-impl: GEN-6 AC-6.4
// @zen-impl: GEN-7 AC-7.1
// @zen-impl: GEN-7 AC-7.2
// @zen-impl: GEN-7 AC-7.3
// @zen-impl: GEN-7 AC-7.4
// @zen-impl: GEN-9 AC-9.1
// @zen-impl: GEN-9 AC-9.2
// @zen-impl: GEN-9 AC-9.3
// @zen-impl: GEN-9 AC-9.4
// @zen-impl: GEN-9 AC-9.5
// @zen-impl: GEN-9 AC-9.6
// @zen-impl: GEN-11 AC-11.1
// @zen-impl: GEN-11 AC-11.2
// @zen-impl: GEN-11 AC-11.4
// @zen-impl: TPL-7 AC-7.3

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
    }
  }

  // @zen-impl: GEN-9 AC-9.1, GEN-9 AC-9.2, GEN-9 AC-9.3, GEN-9 AC-9.4, GEN-9 AC-9.5, GEN-9 AC-9.6
  summary(result: GenerationResult): void {
    console.log('');
    console.log(chalk.bold('Summary:'));

    // @zen-impl: GEN-9 AC-9.6
    // Check if no files were created or overwritten
    if (result.created === 0 && result.overwritten === 0) {
      console.log(chalk.yellow('  ⚠ No files were created or overwritten'));
    }

    if (result.created > 0) {
      console.log(chalk.green(`  Created: ${result.created}`));
    }

    if (result.overwritten > 0) {
      console.log(chalk.yellow(`  Overwritten: ${result.overwritten}`));
    }

    if (result.skippedUser > 0) {
      console.log(chalk.blue(`  Skipped (user): ${result.skippedUser}`));
    }

    if (result.skippedEmpty > 0) {
      console.log(chalk.dim(`  Skipped (empty): ${result.skippedEmpty}`));
    }

    console.log('');
  }

  // @zen-impl: DIFF-4 AC-4.3
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

  // @zen-impl: DIFF-4 AC-4.4, DIFF-4 AC-4.5
  diffSummary(result: DiffResult): void {
    console.log('');

    const filesCompared =
      result.identical +
      result.modified +
      result.newFiles +
      result.extraFiles +
      result.binaryDiffers;
    const differences =
      result.modified + result.newFiles + result.extraFiles + result.binaryDiffers;

    // @zen-impl: DIFF-4 AC-4.5
    console.log(chalk.bold(`${filesCompared} files compared, ${differences} differences`));

    if (!result.hasDifferences) {
      // @zen-impl: DIFF-4 AC-4.4
      console.log(chalk.green('✔ No differences found'));
    }

    // @zen-impl: DIFF-4 AC-4.5
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

    console.log('');
  }
}

export const logger = new Logger();
