// @awa-component: CLI-ArgumentParser
// @awa-impl: CLI-1_AC-1
// @awa-impl: CLI-1_AC-2
// @awa-impl: CLI-1_AC-3
// @awa-impl: CLI-1_AC-4
// @awa-impl: CLI-1_AC-5
// @awa-impl: CLI-2_AC-1
// @awa-impl: CLI-2_AC-2
// @awa-impl: CLI-2_AC-3
// @awa-impl: CLI-2_AC-5
// @awa-impl: CLI-2_AC-6
// @awa-impl: CLI-3_AC-1
// @awa-impl: CLI-4_AC-1
// @awa-impl: CLI-4_AC-2
// @awa-impl: CLI-5_AC-1
// @awa-impl: CLI-6_AC-1
// @awa-impl: CLI-7_AC-1
// @awa-impl: CLI-8_AC-1
// @awa-impl: CLI-9_AC-1
// @awa-impl: CLI-9_AC-2
// @awa-impl: CLI-9_AC-3
// @awa-impl: CLI-10_AC-1
// @awa-impl: CLI-10_AC-2
// @awa-impl: CLI-11_AC-1
// @awa-impl: CLI-11_AC-2
// @awa-impl: CLI-11_AC-3
// @awa-impl: CFG-5_AC-2
// @awa-impl: DIFF-7_AC-1
// @awa-impl: DIFF-7_AC-2
// @awa-impl: DIFF-7_AC-3
// @awa-impl: DIFF-7_AC-4
// @awa-impl: DIFF-7_AC-5
// @awa-impl: DIFF-7_AC-6
// @awa-impl: DIFF-7_AC-7
// @awa-impl: DIFF-7_AC-8
// @awa-impl: DIFF-7_AC-9
// @awa-impl: DIFF-7_AC-10
// @awa-impl: DIFF-7_AC-11
// @awa-impl: FP-2_AC-1
// @awa-impl: FP-2_AC-2
// @awa-impl: FP-2_AC-4
// @awa-impl: FP-4_AC-1
// @awa-impl: FP-4_AC-2
// @awa-impl: FP-4_AC-3
// @awa-impl: FP-4_AC-5
// @awa-impl: GEN-10_AC-1
// @awa-impl: GEN-10_AC-2
// @awa-impl: INIT-1_AC-1
// @awa-impl: INIT-2_AC-1
// @awa-impl: INIT-3_AC-1
// @awa-impl: INIT-4_AC-1

import { Command } from 'commander';
import { PACKAGE_INFO } from '../_generated/package_info.js';
import { checkCommand } from '../commands/check.js';
import { diffCommand } from '../commands/diff.js';
import { generateCommand } from '../commands/generate.js';
import { testCommand } from '../commands/test.js';
import type { RawCheckOptions } from '../core/check/types.js';
import type { RawTestOptions } from '../core/template-test/types.js';
import type { RawCliOptions } from '../types/index.js';

const version = PACKAGE_INFO.version;

// @awa-impl: CLI-1_AC-2, CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2
const program = new Command();

program
  .name('awa')
  .description('awa - tool for generating AI coding agent configuration files')
  .version(version, '-v, --version', 'Display version number');

// @awa-impl: CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-4, CLI-1_AC-5
// @awa-impl: INIT-1_AC-1, INIT-2_AC-1, INIT-3_AC-1, INIT-4_AC-1
program
  .command('generate')
  .alias('init')
  .description('Generate AI agent configuration files from templates')
  // @awa-impl: CLI-2_AC-1, CLI-2_AC-5, CLI-2_AC-6
  .argument('[output]', 'Output directory (optional if specified in config)')
  // @awa-impl: CLI-3_AC-1
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  // @awa-impl: CLI-4_AC-1, CLI-4_AC-2
  .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
  .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
  .option(
    '--remove-features <flag...>',
    'Feature flags to remove (can be specified multiple times)'
  )
  // @awa-impl: CLI-5_AC-1
  .option('--force', 'Force overwrite existing files without prompting', false)
  // @awa-impl: CLI-6_AC-1
  .option('--dry-run', 'Preview changes without modifying files', false)
  .option(
    '--delete',
    'Enable deletion of files listed in the delete list (default: warn only)',
    false
  )
  // @awa-impl: CLI-7_AC-1
  .option('-c, --config <path>', 'Path to configuration file')
  // @awa-impl: CLI-8_AC-1
  .option('--refresh', 'Force refresh of cached Git templates', false)
  // @awa-impl: JSON-1_AC-1
  .option('--json', 'Output results as JSON (implies --dry-run)', false)
  // @awa-impl: JSON-5_AC-1
  .option('--summary', 'Output compact one-line summary', false)
  .action(async (output: string | undefined, options) => {
    // @awa-impl: CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3
    const cliOptions: RawCliOptions = {
      output,
      template: options.template,
      features: options.features || [],
      preset: options.preset || [],
      removeFeatures: options.removeFeatures || [],
      force: options.force,
      dryRun: options.dryRun,
      delete: options.delete,
      config: options.config,
      refresh: options.refresh,
      json: options.json,
      summary: options.summary,
    };

    await generateCommand(cliOptions);
  });

// @awa-impl: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7, DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10
program
  .command('diff')
  .description('Compare template output with existing target directory')
  // @awa-impl: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5
  .argument('[target]', 'Target directory to compare against (optional if specified in config)')
  // @awa-impl: DIFF-7_AC-6
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  // @awa-impl: DIFF-7_AC-7
  .option('-f, --features <flag...>', 'Feature flags (can be specified multiple times)')
  .option('--preset <name...>', 'Preset names to enable (can be specified multiple times)')
  .option(
    '--remove-features <flag...>',
    'Feature flags to remove (can be specified multiple times)'
  )
  // @awa-impl: DIFF-7_AC-8
  .option('-c, --config <path>', 'Path to configuration file')
  // @awa-impl: DIFF-7_AC-9
  .option('--refresh', 'Force refresh of cached Git templates', false)
  // @awa-impl: DIFF-7_AC-11
  .option('--list-unknown', 'Include target-only files in diff results', false)
  // @awa-impl: JSON-2_AC-1
  .option('--json', 'Output results as JSON', false)
  // @awa-impl: JSON-5_AC-1
  .option('--summary', 'Output compact one-line summary', false)
  // @awa-impl: DIFF-7_AC-10
  // Note: --force and --dry-run are intentionally NOT accepted for diff command
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
      json: options.json,
      summary: options.summary,
    };

    const exitCode = await diffCommand(cliOptions);
    process.exit(exitCode);
  });

// @awa-impl: CHK-8_AC-1, CHK-9_AC-1, CHK-10_AC-1
program
  .command('check')
  .description('Check traceability chain between code markers and spec files')
  .option('-c, --config <path>', 'Path to configuration file')
  // @awa-impl: CHK-10_AC-1
  .option('--ignore <pattern...>', 'Glob patterns for paths to exclude')
  // @awa-impl: CHK-9_AC-1
  .option('--format <format>', 'Output format (text or json)', 'text')
  .option(
    '--allow-warnings',
    'Allow warnings without failing (default: warnings are errors)',
    false
  )
  .action(async (options) => {
    const cliOptions: RawCheckOptions = {
      config: options.config,
      ignore: options.ignore,
      format: options.format,
      allowWarnings: options.allowWarnings,
    };

    const exitCode = await checkCommand(cliOptions);
    process.exit(exitCode);
  });

// @awa-impl: TTST-7_AC-1, TTST-5_AC-1
program
  .command('test')
  .description('Run template test fixtures to verify expected output')
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--update-snapshots', 'Update stored snapshots with current rendered output', false)
  .action(async (options) => {
    const testOptions: RawTestOptions = {
      template: options.template,
      config: options.config,
      updateSnapshots: options.updateSnapshots,
    };

    const exitCode = await testCommand(testOptions);
    process.exit(exitCode);
  });

// @awa-impl: GEN-10_AC-1, GEN-10_AC-2
program.parse();
