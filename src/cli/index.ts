// @zen-component: CLI-ArgumentParser
// @zen-impl: CLI-1_AC-1
// @zen-impl: CLI-1_AC-2
// @zen-impl: CLI-1_AC-3
// @zen-impl: CLI-1_AC-4
// @zen-impl: CLI-1_AC-5
// @zen-impl: CLI-2_AC-1
// @zen-impl: CLI-2_AC-2
// @zen-impl: CLI-2_AC-3
// @zen-impl: CLI-2_AC-5
// @zen-impl: CLI-2_AC-6
// @zen-impl: CLI-3_AC-1
// @zen-impl: CLI-4_AC-1
// @zen-impl: CLI-4_AC-2
// @zen-impl: CLI-5_AC-1
// @zen-impl: CLI-6_AC-1
// @zen-impl: CLI-7_AC-1
// @zen-impl: CLI-8_AC-1
// @zen-impl: CLI-9_AC-1
// @zen-impl: CLI-9_AC-2
// @zen-impl: CLI-9_AC-3
// @zen-impl: CLI-10_AC-1
// @zen-impl: CLI-10_AC-2
// @zen-impl: CLI-11_AC-1
// @zen-impl: CLI-11_AC-2
// @zen-impl: CLI-11_AC-3
// @zen-impl: CFG-5_AC-2
// @zen-impl: DIFF-7_AC-1
// @zen-impl: DIFF-7_AC-2
// @zen-impl: DIFF-7_AC-3
// @zen-impl: DIFF-7_AC-4
// @zen-impl: DIFF-7_AC-5
// @zen-impl: DIFF-7_AC-6
// @zen-impl: DIFF-7_AC-7
// @zen-impl: DIFF-7_AC-8
// @zen-impl: DIFF-7_AC-9
// @zen-impl: DIFF-7_AC-10
// @zen-impl: DIFF-7_AC-11
// @zen-impl: FP-2_AC-1
// @zen-impl: FP-2_AC-2
// @zen-impl: FP-2_AC-4
// @zen-impl: FP-4_AC-1
// @zen-impl: FP-4_AC-2
// @zen-impl: FP-4_AC-3
// @zen-impl: FP-4_AC-5
// @zen-impl: GEN-10_AC-1
// @zen-impl: GEN-10_AC-2

import { Command } from 'commander';
import { PACKAGE_INFO } from '../_generated/package_info.js';
import { diffCommand } from '../commands/diff.js';
import { generateCommand } from '../commands/generate.js';
import type { RawCliOptions } from '../types/index.js';

const version = PACKAGE_INFO.version;

// @zen-impl: CLI-1_AC-2, CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2
const program = new Command();

program
  .name('zen')
  .description('Zen - tool for generating AI coding agent configuration files')
  .version(version, '-v, --version', 'Display version number');

// @zen-impl: CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-4, CLI-1_AC-5
program
  .command('generate')
  .description('Generate AI agent configuration files from templates')
  // @zen-impl: CLI-2_AC-1, CLI-2_AC-5, CLI-2_AC-6
  .argument('[output]', 'Output directory (optional if specified in config)')
  // @zen-impl: CLI-3_AC-1
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  // @zen-impl: CLI-4_AC-1, CLI-4_AC-2
  .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
  .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
  .option(
    '--remove-features <flag...>',
    'Feature flags to remove (can be specified multiple times)'
  )
  // @zen-impl: CLI-5_AC-1
  .option('--force', 'Force overwrite existing files without prompting', false)
  // @zen-impl: CLI-6_AC-1
  .option('--dry-run', 'Preview changes without modifying files', false)
  // @zen-impl: CLI-7_AC-1
  .option('-c, --config <path>', 'Path to configuration file')
  // @zen-impl: CLI-8_AC-1
  .option('--refresh', 'Force refresh of cached Git templates', false)
  .action(async (output: string | undefined, options) => {
    // @zen-impl: CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3
    const cliOptions: RawCliOptions = {
      output,
      template: options.template,
      features: options.features || [],
      preset: options.preset || [],
      removeFeatures: options.removeFeatures || [],
      force: options.force,
      dryRun: options.dryRun,
      config: options.config,
      refresh: options.refresh,
    };

    await generateCommand(cliOptions);
  });

// @zen-impl: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7, DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10
program
  .command('diff')
  .description('Compare template output with existing target directory')
  // @zen-impl: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5
  .argument('[target]', 'Target directory to compare against (optional if specified in config)')
  // @zen-impl: DIFF-7_AC-6
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  // @zen-impl: DIFF-7_AC-7
  .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
  .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
  .option(
    '--remove-features <flag...>',
    'Feature flags to remove (can be specified multiple times)'
  )
  // @zen-impl: DIFF-7_AC-8
  .option('-c, --config <path>', 'Path to configuration file')
  // @zen-impl: DIFF-7_AC-9
  .option('--refresh', 'Force refresh of cached Git templates', false)
  // @zen-impl: DIFF-7_AC-11
  .option('--list-unknown', 'Include target-only files in diff results', false)
  // @zen-impl: DIFF-7_AC-10 - Note: --force and --dry-run are intentionally NOT accepted for diff command
  .action(async (target: string | undefined, options) => {
    const cliOptions: RawCliOptions = {
      output: target, // Use target as output for consistency
      template: options.template,
      features: options.features || [],
      preset: options.preset || [],
      removeFeatures: options.removeFeatures || [],
      config: options.config,
      refresh: options.refresh,
      listUnknown: options.listUnknown,
    };

    const exitCode = await diffCommand(cliOptions);
    process.exit(exitCode);
  });

// @zen-impl: GEN-10_AC-1, GEN-10_AC-2
program.parse();
