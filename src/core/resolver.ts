// @awa-component: GEN-ConflictResolver
// @awa-component: GEN-DeleteResolver
// @awa-impl: CLI-5_AC-2
// @awa-impl: CLI-5_AC-3
// @awa-impl: GEN-4_AC-1
// @awa-impl: GEN-4_AC-2
// @awa-impl: GEN-4_AC-3
// @awa-impl: GEN-5_AC-1
// @awa-impl: GEN-5_AC-2
// @awa-impl: GEN-5_AC-3
// @awa-impl: GEN-5_AC-4
// @awa-impl: GEN-5_AC-5
// @awa-impl: GEN-5_AC-6
// @awa-impl: GEN-5_AC-7
// @awa-impl: GEN-6_AC-3
// @awa-impl: GEN-10_AC-3
// @awa-impl: GEN-12_AC-3
// @awa-impl: GEN-12_AC-4
// @awa-impl: GEN-12_AC-5
// @awa-impl: CLI-12_AC-3

import { MultiSelectPrompt } from '@clack/core';
import { isCancel, multiselect } from '@clack/prompts';
import chalk from 'chalk';
import type { BatchConflictResolution, ConflictItem } from '../types/index.js';

// Unicode symbols (mirrors @clack/prompts internals)
const _unicode = process.platform !== 'win32';
const _s = (c: string, fb: string) => (_unicode ? c : fb);
const _CHECKED = _s('\u25FC', '[+]'); // ◼
const _UNCHECKED_A = _s('\u25FB', '[·]'); // ◻ active
const _UNCHECKED = _s('\u25FB', '[ ]'); // ◻ inactive
const _BAR = _s('\u2502', '|'); // │
const _BAR_END = _s('\u2514', '-'); // └

type SelectOption = { value: string; label?: string; hint?: string };

function _renderDeleteItem(opt: SelectOption, state: string): string {
  const label = opt.label ?? opt.value;
  const hint = opt.hint ? ` ${chalk.dim(`(${opt.hint})`)}` : '';
  switch (state) {
    case 'active':
      return `${chalk.cyan(_UNCHECKED_A)} ${label}${hint}`;
    case 'selected':
      return `${chalk.red(_CHECKED)} ${chalk.dim(label)}${hint}`;
    case 'active-selected':
      return `${chalk.red(_CHECKED)} ${label}${hint}`;
    case 'cancelled':
      return chalk.strikethrough(chalk.dim(label));
    case 'submitted':
      return chalk.dim(label);
    default:
      return `${chalk.dim(_UNCHECKED)} ${chalk.dim(label)}`;
  }
}

/** Like @clack/prompts `multiselect` but with red checkboxes for destructive operations. */
async function deleteMultiselect(opts: {
  message: string;
  options: SelectOption[];
  initialValues?: string[];
  required?: boolean;
}): Promise<string[] | symbol> {
  const { message, options, initialValues, required = false } = opts;
  return new MultiSelectPrompt({
    options,
    initialValues,
    required,
    render() {
      const self = this as unknown as {
        state: string;
        options: SelectOption[];
        cursor: number;
        value: string[];
      };
      const header = `${chalk.gray(_BAR)}\n${chalk.cyan(_BAR)}  ${message}\n`;
      const getState = (opt: SelectOption, idx: number): string => {
        const active = idx === self.cursor;
        const sel = self.value.includes(opt.value);
        if (active && sel) return 'active-selected';
        if (sel) return 'selected';
        if (active) return 'active';
        return 'inactive';
      };
      switch (self.state) {
        case 'submit':
          return (
            `${header}${chalk.gray(_BAR)}  ` +
            (self.options
              .filter((o) => self.value.includes(o.value))
              .map((o) => _renderDeleteItem(o, 'submitted'))
              .join(chalk.dim(', ')) || chalk.dim('none'))
          );
        case 'cancel': {
          const cancelled = self.options
            .filter((o) => self.value.includes(o.value))
            .map((o) => _renderDeleteItem(o, 'cancelled'))
            .join(chalk.dim(', '));
          return `${header}${chalk.gray(_BAR)}  ${cancelled.trim() ? `${cancelled}\n${chalk.gray(_BAR)}` : chalk.dim('none')}`;
        }
        default:
          return (
            `${header}${chalk.cyan(_BAR)}  ` +
            self.options
              .map((o, i) => _renderDeleteItem(o, getState(o, i)))
              .join(`\n${chalk.cyan(_BAR)}  `) +
            `\n${chalk.cyan(_BAR_END)}\n`
          );
      }
    },
  }).prompt() as Promise<string[] | symbol>;
}

export class ConflictResolver {
  // @awa-impl: GEN-4_AC-1, GEN-4_AC-2, GEN-4_AC-3
  // @awa-impl: GEN-5_AC-1, GEN-5_AC-2, GEN-5_AC-3, GEN-5_AC-4, GEN-5_AC-5, GEN-5_AC-6, GEN-5_AC-7
  // @awa-impl: CLI-5_AC-2, CLI-5_AC-3
  // @awa-impl: GEN-6_AC-3
  async resolveBatch(
    conflicts: ConflictItem[],
    force: boolean,
    dryRun: boolean
  ): Promise<BatchConflictResolution> {
    // Separate identical-content files from different files
    const identicalPaths = conflicts
      .filter((c) => c.newContent === c.existingContent)
      .map((c) => c.outputPath);
    const differentFiles = conflicts.filter((c) => c.newContent !== c.existingContent);

    // In dry-run mode, never modify files (P7: Dry Run Immutable)
    if (dryRun) {
      return {
        overwrite: [],
        skip: differentFiles.map((c) => c.outputPath),
        equal: identicalPaths,
      };
    }

    // In force mode, always overwrite without prompting (P8: Force No Prompt)
    if (force) {
      return {
        overwrite: differentFiles.map((c) => c.outputPath),
        skip: [],
        equal: identicalPaths,
      };
    }

    // If all files are identical, skip them all
    if (differentFiles.length === 0) {
      return {
        overwrite: [],
        skip: [],
        equal: identicalPaths,
      };
    }

    // @awa-impl: GEN-5_AC-1, GEN-5_AC-2, GEN-5_AC-5, GEN-5_AC-6
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

    // @awa-impl: GEN-10_AC-3
    // Handle user cancellation (Ctrl+C)
    if (isCancel(selected)) {
      process.exit(1);
    }

    const selectedPaths = selected as string[];
    const allPaths = differentFiles.map((c) => c.outputPath);

    return {
      overwrite: selectedPaths,
      skip: allPaths.filter((p) => !selectedPaths.includes(p)),
      equal: identicalPaths,
    };
  }
}

export const conflictResolver = new ConflictResolver();

export class DeleteResolver {
  /**
   * Prompt user to confirm which files to delete.
   * Returns the list of absolute paths confirmed for deletion.
   */
  async resolveDeletes(candidates: string[], force: boolean, dryRun: boolean): Promise<string[]> {
    if (candidates.length === 0) {
      return [];
    }

    // In dry-run mode, return all candidates (caller logs but won't delete)
    if (dryRun) {
      return candidates;
    }

    // In force mode, delete without prompting
    if (force) {
      return candidates;
    }

    // Prompt user with multi-select (all selected by default, red checkboxes)
    const selected = await deleteMultiselect({
      message:
        '⚠ WARNING: The selected files will be PERMANENTLY DELETED from disk.\n' +
        '  Deselect any files you want to keep. Press Enter to confirm deletion:',
      options: candidates.map((p) => ({
        value: p,
        label: p,
      })),
      initialValues: candidates,
      required: false,
    });

    // Handle user cancellation (Ctrl+C)
    if (isCancel(selected)) {
      process.exit(1);
    }

    return selected as string[];
  }
}

export const deleteResolver = new DeleteResolver();
