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
// @awa-impl: CLI-12_AC-1
// @awa-impl: CLI-13_AC-1
// @awa-impl: CLI-13_AC-2
// @awa-impl: CLI-14_AC-1
// @awa-impl: CLI-14_AC-2
// @awa-impl: CLI-6_AC-2
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
// @awa-impl: DIFF-7_AC-12
// @awa-impl: DIFF-7_AC-13
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
import { featuresCommand } from '../commands/features.js';
import { generateCommand } from '../commands/generate.js';
import { testCommand } from '../commands/test.js';
import { traceCommand } from '../commands/trace.js';
import type { RawCheckOptions } from '../core/check/types.js';
import type { RawTestOptions } from '../core/template-test/types.js';
import type { TraceCommandOptions } from '../core/trace/types.js';
import type { RawCliOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import {
  checkForUpdate,
  printUpdateWarning,
  type UpdateCheckResult,
} from '../utils/update-check.js';
import { shouldCheck, writeCache } from '../utils/update-check-cache.js';

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
  .option('--all', 'Process all named targets from config', false)
  .option('--target <name>', 'Process a specific named target from config')
  // @awa-impl: OVL-1_AC-1
  .option('--overlay <path...>', 'Overlay directory paths applied over base template (repeatable)')
  // @awa-impl: JSON-1_AC-1
  .option('--json', 'Output results as JSON (implies --dry-run)', false)
  // @awa-impl: JSON-5_AC-1
  .option('--summary', 'Output compact one-line summary', false)
  .action(async (output: string | undefined, options) => {
    // @awa-impl: CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3
    const cliOptions: RawCliOptions = {
      output,
      template: options.template,
      features: options.features,
      preset: options.preset,
      removeFeatures: options.removeFeatures,
      force: options.force,
      dryRun: options.dryRun,
      delete: options.delete,
      config: options.config,
      refresh: options.refresh,
      all: options.all,
      target: options.target,
      overlay: options.overlay || [],
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
  .option('--all', 'Process all named targets from config', false)
  .option('--target <name>', 'Process a specific named target from config')
  .option('-w, --watch', 'Watch template directory for changes and re-run diff', false)
  // @awa-impl: OVL-7_AC-1
  .option('--overlay <path...>', 'Overlay directory paths applied over base template (repeatable)')
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
      features: options.features,
      preset: options.preset,
      removeFeatures: options.removeFeatures,
      config: options.config,
      refresh: options.refresh,
      listUnknown: options.listUnknown,
      all: options.all,
      target: options.target,
      watch: options.watch,
      overlay: options.overlay || [],
      json: options.json,
      summary: options.summary,
    };

    const exitCode = await diffCommand(cliOptions);
    process.exit(exitCode);
  });

// @awa-impl: CHK-8_AC-1, CHK-9_AC-1, CHK-10_AC-1
program
  .command('check')
  .description(
    'Validate spec files against schemas and check traceability between code markers and specs'
  )
  .option('-c, --config <path>', 'Path to configuration file')
  // @awa-impl: CHK-10_AC-1
  .option('--spec-ignore <pattern...>', 'Glob patterns to exclude from spec file scanning')
  .option('--code-ignore <pattern...>', 'Glob patterns to exclude from code file scanning')
  // @awa-impl: CHK-9_AC-1
  .option('--format <format>', 'Output format (text or json)', 'text')
  .option(
    '--allow-warnings',
    'Allow warnings without failing (default: warnings are errors)',
    false
  )
  .option(
    '--spec-only',
    'Run only spec-level checks (schema and cross-refs); skip code-to-spec traceability',
    false
  )
  .action(async (options) => {
    const cliOptions: RawCheckOptions = {
      config: options.config,
      specIgnore: options.specIgnore,
      codeIgnore: options.codeIgnore,
      format: options.format,
      allowWarnings: options.allowWarnings,
      specOnly: options.specOnly,
    };

    const exitCode = await checkCommand(cliOptions);
    process.exit(exitCode);
  });

// @awa-impl: DISC-4_AC-1, DISC-5_AC-1
program
  .command('features')
  .description('Discover feature flags available in a template')
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--refresh', 'Force refresh of cached Git templates', false)
  .option('--json', 'Output results as JSON', false)
  .action(async (options) => {
    const exitCode = await featuresCommand({
      template: options.template,
      config: options.config,
      refresh: options.refresh,
      json: options.json,
    });
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

// @awa-impl: TRC-8_AC-1
program
  .command('trace')
  .description('Explore traceability chains and assemble context from specs, code, and tests')
  .argument('[ids...]', 'Traceability ID(s) to trace')
  .option('--all', 'Trace all known IDs in the project', false)
  .option('--task <path>', 'Resolve IDs from a task file')
  .option('--file <path>', "Resolve IDs from a source file's markers")
  .option('--content', 'Output actual file sections instead of locations', false)
  .option('--list', 'Output file paths only (no content or tree)', false)
  .option('--max-tokens <n>', 'Cap content output size (implies --content)')
  .option('--depth <n>', 'Maximum traversal depth')
  .option('--scope <code>', 'Limit results to a feature code')
  .option('--direction <dir>', 'Traversal direction: both, forward, reverse', 'both')
  .option('--no-code', 'Exclude source code (spec-only context)')
  .option('--no-tests', 'Exclude test files')
  .option('--json', 'Output as JSON', false)
  .option('-A <n>', 'Lines of context after a code marker (--content only; default: 20)')
  .option('-B <n>', 'Lines of context before a code marker (--content only; default: 5)')
  .option('-C <n>', 'Lines of context before and after (--content only; overrides -A and -B)')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (ids: string[], options) => {
    const traceOptions: TraceCommandOptions = {
      ids,
      all: options.all,
      task: options.task,
      file: options.file,
      content: options.content,
      list: options.list,
      json: options.json,
      maxTokens: options.maxTokens !== undefined ? Number(options.maxTokens) : undefined,
      depth: options.depth !== undefined ? Number(options.depth) : undefined,
      scope: options.scope,
      direction: options.direction,
      noCode: options.code === false,
      noTests: options.tests === false,
      beforeContext:
        options.C !== undefined
          ? Number(options.C)
          : options.B !== undefined
            ? Number(options.B)
            : undefined,
      afterContext:
        options.C !== undefined
          ? Number(options.C)
          : options.A !== undefined
            ? Number(options.A)
            : undefined,
      config: options.config,
    };

    const exitCode = await traceCommand(traceOptions);
    process.exit(exitCode);
  });

// Fire update check asynchronously (non-blocking) before parse
let updateCheckPromise: Promise<UpdateCheckResult | null> | null = null;

const isJsonOrSummary = process.argv.includes('--json') || process.argv.includes('--summary');
const isTTY = process.stdout.isTTY === true;
const isDisabledByEnv = !!process.env.NO_UPDATE_NOTIFIER;

if (!isJsonOrSummary && isTTY && !isDisabledByEnv) {
  updateCheckPromise = (async () => {
    try {
      // Load config to check update-check settings
      const { configLoader } = await import('../core/config.js');
      const configPath =
        process.argv.indexOf('-c') !== -1
          ? process.argv[process.argv.indexOf('-c') + 1]
          : process.argv.indexOf('--config') !== -1
            ? process.argv[process.argv.indexOf('--config') + 1]
            : undefined;
      const fileConfig = await configLoader.load(configPath ?? null);

      const updateCheckConfig = fileConfig?.['update-check'];
      if (updateCheckConfig?.enabled === false) return null;

      const intervalSeconds = updateCheckConfig?.interval ?? 86400;
      const intervalMs = intervalSeconds * 1000;

      const needsCheck = await shouldCheck(intervalMs);
      if (!needsCheck) return null;

      const result = await checkForUpdate();
      if (result) {
        await writeCache(result.latest);
      }
      return result;
    } catch {
      return null;
    }
  })();
}

// Print update warning after command completes
program.hook('postAction', async () => {
  if (!updateCheckPromise) return;
  try {
    const result = await updateCheckPromise;
    if (result?.isOutdated) {
      printUpdateWarning(logger, result);
    }
  } catch {
    // Silently ignore
  }
});

// @awa-impl: GEN-10_AC-1, GEN-10_AC-2
program.parseAsync();
