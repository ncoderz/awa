// @zen-component: ArgumentParser
// @zen-impl: CLI-1 AC-1.1
// @zen-impl: CLI-1 AC-1.2
// @zen-impl: CLI-1 AC-1.3
// @zen-impl: CLI-1 AC-1.4
// @zen-impl: CLI-1 AC-1.5
// @zen-impl: CLI-2 AC-2.1
// @zen-impl: CLI-2 AC-2.2
// @zen-impl: CLI-2 AC-2.3
// @zen-impl: CLI-2 AC-2.5
// @zen-impl: CLI-2 AC-2.6
// @zen-impl: CLI-3 AC-3.1
// @zen-impl: CLI-4 AC-4.1
// @zen-impl: CLI-4 AC-4.2
// @zen-impl: CLI-5 AC-5.1
// @zen-impl: CLI-6 AC-6.1
// @zen-impl: CLI-7 AC-7.1
// @zen-impl: CLI-8 AC-8.1
// @zen-impl: CLI-9 AC-9.1
// @zen-impl: CLI-9 AC-9.2
// @zen-impl: CLI-9 AC-9.3
// @zen-impl: CLI-10 AC-10.1
// @zen-impl: CLI-10 AC-10.2
// @zen-impl: CLI-11 AC-11.1
// @zen-impl: CLI-11 AC-11.2
// @zen-impl: CLI-11 AC-11.3
// @zen-impl: CFG-5 AC-5.2
// @zen-impl: DIFF-7 AC-7.1
// @zen-impl: DIFF-7 AC-7.2
// @zen-impl: DIFF-7 AC-7.3
// @zen-impl: DIFF-7 AC-7.4
// @zen-impl: DIFF-7 AC-7.5
// @zen-impl: DIFF-7 AC-7.6
// @zen-impl: DIFF-7 AC-7.7
// @zen-impl: DIFF-7 AC-7.8
// @zen-impl: DIFF-7 AC-7.9
// @zen-impl: DIFF-7 AC-7.10
// @zen-impl: FP-2 AC-2.1
// @zen-impl: FP-2 AC-2.2
// @zen-impl: FP-2 AC-2.4
// @zen-impl: FP-4 AC-4.1
// @zen-impl: FP-4 AC-4.2
// @zen-impl: FP-4 AC-4.3
// @zen-impl: FP-4 AC-4.5
// @zen-impl: GEN-10 AC-10.1
// @zen-impl: GEN-10 AC-10.2

import { Command } from 'commander';
import { PACKAGE_INFO } from '../_generated/package_info.js';
import { diffCommand } from '../commands/diff.js';
import { generateCommand } from '../commands/generate.js';
import type { RawCliOptions } from '../types/index.js';

const version = PACKAGE_INFO.version;

// @zen-impl: CLI-1 AC-1.2, CLI-9 AC-9.1, CLI-9 AC-9.2, CLI-9 AC-9.3, CLI-10 AC-10.1, CLI-10 AC-10.2
const program = new Command();

program
  .name('zen')
  .description('Zen - tool for generating AI coding agent configuration files')
  .version(version, '-v, --version', 'Display version number');

// @zen-impl: CLI-1 AC-1.1, CLI-1 AC-1.2, CLI-1 AC-1.3, CLI-1 AC-1.4, CLI-1 AC-1.5
program
  .command('generate')
  .description('Generate AI agent configuration files from templates')
  // @zen-impl: CLI-2 AC-2.1, CLI-2 AC-2.5, CLI-2 AC-2.6
  .argument('[output]', 'Output directory (optional if specified in config)')
  // @zen-impl: CLI-3 AC-3.1
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  // @zen-impl: CLI-4 AC-4.1, CLI-4 AC-4.2
  .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
  .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
  .option(
    '--remove-features <flag...>',
    'Feature flags to remove (can be specified multiple times)'
  )
  // @zen-impl: CLI-5 AC-5.1
  .option('--force', 'Force overwrite existing files without prompting', false)
  // @zen-impl: CLI-6 AC-6.1
  .option('--dry-run', 'Preview changes without modifying files', false)
  // @zen-impl: CLI-7 AC-7.1
  .option('-c, --config <path>', 'Path to configuration file')
  // @zen-impl: CLI-8 AC-8.1
  .option('--refresh', 'Force refresh of cached Git templates', false)
  .action(async (output: string | undefined, options) => {
    // @zen-impl: CLI-11 AC-11.1, CLI-11 AC-11.2, CLI-11 AC-11.3
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

// @zen-impl: DIFF-7 AC-7.1, DIFF-7 AC-7.2, DIFF-7 AC-7.3, DIFF-7 AC-7.4, DIFF-7 AC-7.5, DIFF-7 AC-7.6, DIFF-7 AC-7.7, DIFF-7 AC-7.8, DIFF-7 AC-7.9, DIFF-7 AC-7.10
program
  .command('diff')
  .description('Compare template output with existing target directory')
  // @zen-impl: DIFF-7 AC-7.1, DIFF-7 AC-7.2, DIFF-7 AC-7.3, DIFF-7 AC-7.4, DIFF-7 AC-7.5
  .argument('[target]', 'Target directory to compare against (optional if specified in config)')
  // @zen-impl: DIFF-7 AC-7.6
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  // @zen-impl: DIFF-7 AC-7.7
  .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
  .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
  .option(
    '--remove-features <flag...>',
    'Feature flags to remove (can be specified multiple times)'
  )
  // @zen-impl: DIFF-7 AC-7.8
  .option('-c, --config <path>', 'Path to configuration file')
  // @zen-impl: DIFF-7 AC-7.9
  .option('--refresh', 'Force refresh of cached Git templates', false)
  // @zen-impl: DIFF-7 AC-7.10 - Note: --force and --dry-run are intentionally NOT accepted for diff command
  .action(async (target: string | undefined, options) => {
    const cliOptions: RawCliOptions = {
      output: target, // Use target as output for consistency
      template: options.template,
      features: options.features || [],
      preset: options.preset || [],
      removeFeatures: options.removeFeatures || [],
      config: options.config,
      refresh: options.refresh,
    };

    const exitCode = await diffCommand(cliOptions);
    process.exit(exitCode);
  });

// @zen-impl: GEN-10 AC-10.1, GEN-10 AC-10.2
program.parse();
