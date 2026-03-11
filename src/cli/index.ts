// @awa-component: CLI-ArgumentParser
// @awa-impl: CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-4, CLI-1_AC-5
// @awa-impl: CLI-2_AC-1, CLI-2_AC-2, CLI-2_AC-3, CLI-2_AC-5, CLI-2_AC-6
// @awa-impl: CLI-3_AC-1, CLI-4_AC-1, CLI-4_AC-2, CLI-5_AC-1, CLI-6_AC-1, CLI-6_AC-2, CLI-7_AC-1, CLI-8_AC-1
// @awa-impl: CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2
// @awa-impl: CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3, CLI-12_AC-1
// @awa-impl: CLI-13_AC-1, CLI-13_AC-2, CLI-14_AC-1, CLI-14_AC-2, CLI-15_AC-1, CLI-15_AC-2
// @awa-impl: CLI-23_AC-1, CLI-24_AC-1, CLI-25_AC-1
// @awa-impl: CFG-5_AC-2, CFG-8_AC-1, CFG-8_AC-2, CFG-8_AC-4
// @awa-impl: CFG-10_AC-1, CFG-10_AC-2, CFG-10_AC-3, CFG-10_AC-5
// @awa-impl: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7, DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10, DIFF-7_AC-11, DIFF-7_AC-12, DIFF-7_AC-13
// @awa-impl: DISC-4_AC-1, DISC-5_AC-1
// @awa-impl: GEN-10_AC-1, GEN-10_AC-2, GEN-13_AC-1, GEN-14_AC-1, GEN-15_AC-1, GEN-16_AC-1
// @awa-impl: JSON-1_AC-1, JSON-2_AC-1, JSON-5_AC-1, OVL-1_AC-1, OVL-7_AC-1
// @awa-impl: CLI-41_AC-1, CLI-41_AC-2, CLI-41_AC-3, CLI-41_AC-4, CLI-41_AC-5, CLI-41_AC-6, CLI-41_AC-7
// @awa-impl: CLI-42_AC-1, CLI-42_AC-2, CLI-43_AC-1, CLI-43_AC-2, CLI-43_AC-3, CLI-43_AC-4
// @awa-impl: CLI-44_AC-1, CLI-44_AC-2, CLI-45_AC-1, CLI-45_AC-2, CLI-45_AC-3, CLI-45_AC-4
// @awa-impl: TRC-8_AC-1, TTST-5_AC-1, TTST-7_AC-1

import { Command, Option } from 'commander';

import { PACKAGE_INFO } from '../_generated/package_info.js';
import { checkCommand } from '../commands/check.js';
import { codesCommand } from '../commands/codes.js';
import { diffCommand } from '../commands/diff.js';
import { featuresCommand } from '../commands/features.js';
import { generateCommand } from '../commands/generate.js';
import { mergeCommand } from '../commands/merge.js';
import { recodeCommand } from '../commands/recode.js';
import { renumberCommand } from '../commands/renumber.js';
import { testCommand } from '../commands/test.js';
import { traceCommand } from '../commands/trace.js';
import type { RawCheckOptions } from '../core/check/types.js';
import type { CodesCommandOptions } from '../core/codes/types.js';
import type { MergeCommandOptions } from '../core/merge/types.js';
import type { RecodeCommandOptions } from '../core/recode/types.js';
import type { RenumberCommandOptions } from '../core/renumber/types.js';
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
import { cliProvidedOption } from './option-source.js';

const version = PACKAGE_INFO.version;

// @awa-impl: CLI-1_AC-2, CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2
// @awa-impl: CLI-44_AC-1
const program = new Command();

program
  .name('awa')
  .description('awa - tool for generating AI coding agent configuration files')
  .version(version, '-v, --version', 'Display version number');

// @awa-component: CLI-TemplateGroup
// @awa-impl: CLI-2_AC-2, CLI-2_AC-3, CLI-6_AC-2
// @awa-impl: CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2
// @awa-impl: CLI-12_AC-1, CLI-13_AC-1, CLI-13_AC-2, CLI-14_AC-1, CLI-14_AC-2
// @awa-impl: CFG-5_AC-2, CFG-8_AC-1, CFG-8_AC-2, CFG-8_AC-4
// @awa-impl: CFG-10_AC-1, CFG-10_AC-2, CFG-10_AC-3, CFG-10_AC-5
// @awa-impl: DIFF-7_AC-12, DIFF-7_AC-13
// @awa-impl: GEN-10_AC-1, GEN-10_AC-2
// @awa-impl: TRC-8_AC-1, CLI-43_AC-2, CLI-43_AC-4, CLI-44_AC-1
// @awa-impl: CLI-41_AC-1, CLI-41_AC-2, CLI-41_AC-3, CLI-44_AC-2
// @awa-impl: CLI-45_AC-1, CLI-45_AC-2, CLI-45_AC-3, CLI-45_AC-4
const template = new Command('template').description(
  'Template operations (generate, diff, features, test)',
);

// @awa-impl: CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-4, CLI-1_AC-5
// @awa-impl: GEN-13_AC-1, GEN-14_AC-1, GEN-15_AC-1, GEN-16_AC-1
// @awa-impl: CLI-41_AC-4, CLI-42_AC-1, CLI-42_AC-2

/** Configure a generate/init command with shared options and action handler. */
function configureGenerateCommand(cmd: Command): Command {
  return (
    cmd
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
        'Feature flags to remove (can be specified multiple times)',
      )
      // @awa-impl: CLI-5_AC-1
      .option('--force', 'Force overwrite existing files without prompting', false)
      // @awa-impl: CLI-6_AC-1
      .option('--dry-run', 'Preview changes without modifying files', false)
      .option(
        '--delete',
        'Enable deletion of files listed in the delete list (default: warn only)',
        false,
      )
      // @awa-impl: CLI-7_AC-1
      .option('-c, --config <path>', 'Path to configuration file')
      // @awa-impl: CLI-8_AC-1
      .option('--refresh', 'Force refresh of cached Git templates', false)
      // @awa-impl: CLI-15_AC-1
      .option('--all-targets', 'Process all named targets from config', false)
      // @awa-impl: CLI-15_AC-2
      .option('--target <name>', 'Process a specific named target from config')
      // @awa-impl: OVL-1_AC-1
      .option(
        '--overlay <path...>',
        'Overlay directory paths applied over base template (repeatable)',
      )
      // @awa-impl: JSON-1_AC-1
      .option('--json', 'Output results as JSON (implies --dry-run)', false)
      // @awa-impl: JSON-5_AC-1
      .option('--summary', 'Output compact one-line summary', false)
      .action(async (output: string | undefined, options, command: Command) => {
        // @awa-impl: CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3
        const allTargets = cliProvidedOption<boolean>(command, options, 'allTargets');
        const cliOptions: RawCliOptions = {
          output,
          template: cliProvidedOption<string>(command, options, 'template'),
          features: cliProvidedOption<string[]>(command, options, 'features'),
          preset: cliProvidedOption<string[]>(command, options, 'preset'),
          removeFeatures: cliProvidedOption<string[]>(command, options, 'removeFeatures'),
          force: cliProvidedOption<boolean>(command, options, 'force'),
          dryRun: cliProvidedOption<boolean>(command, options, 'dryRun'),
          delete: cliProvidedOption<boolean>(command, options, 'delete'),
          config: cliProvidedOption<string>(command, options, 'config'),
          refresh: cliProvidedOption<boolean>(command, options, 'refresh'),
          all: allTargets,
          allTargets,
          target: cliProvidedOption<string>(command, options, 'target'),
          overlay: cliProvidedOption<string[]>(command, options, 'overlay'),
          json: cliProvidedOption<boolean>(command, options, 'json'),
          summary: cliProvidedOption<boolean>(command, options, 'summary'),
        };

        await generateCommand(cliOptions);
      })
  );
}

configureGenerateCommand(template.command('generate'));

// @awa-impl: CLI-42_AC-1, CLI-42_AC-2
// Top-level init convenience command (delegates to same handler as template generate)
configureGenerateCommand(program.command('init'));

// @awa-impl: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7, DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10
// @awa-impl: CLI-41_AC-5
template
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
    'Feature flags to remove (can be specified multiple times)',
  )
  // @awa-impl: DIFF-7_AC-8
  .option('-c, --config <path>', 'Path to configuration file')
  // @awa-impl: DIFF-7_AC-9
  .option('--refresh', 'Force refresh of cached Git templates', false)
  // @awa-impl: DIFF-7_AC-11
  .option('--list-unknown', 'Include target-only files in diff results', false)
  // @awa-impl: CLI-15_AC-1
  .option('--all-targets', 'Process all named targets from config', false)
  // @awa-impl: CLI-15_AC-2
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
  .action(async (target: string | undefined, options, command: Command) => {
    const allTargets = cliProvidedOption<boolean>(command, options, 'allTargets');
    const cliOptions: RawCliOptions = {
      output: target, // Use target as output for consistency
      template: cliProvidedOption<string>(command, options, 'template'),
      features: cliProvidedOption<string[]>(command, options, 'features'),
      preset: cliProvidedOption<string[]>(command, options, 'preset'),
      removeFeatures: cliProvidedOption<string[]>(command, options, 'removeFeatures'),
      config: cliProvidedOption<string>(command, options, 'config'),
      refresh: cliProvidedOption<boolean>(command, options, 'refresh'),
      listUnknown: cliProvidedOption<boolean>(command, options, 'listUnknown'),
      all: allTargets,
      allTargets,
      target: cliProvidedOption<string>(command, options, 'target'),
      watch: cliProvidedOption<boolean>(command, options, 'watch'),
      overlay: cliProvidedOption<string[]>(command, options, 'overlay'),
      json: cliProvidedOption<boolean>(command, options, 'json'),
      summary: cliProvidedOption<boolean>(command, options, 'summary'),
    };

    const exitCode = await diffCommand(cliOptions);
    process.exit(exitCode);
  });

// @awa-impl: CLI-23_AC-1, CLI-24_AC-1, CLI-25_AC-1
// @awa-impl: CLI-43_AC-1, CLI-43_AC-3
program
  .command('check')
  .description(
    'Validate spec files against schemas and check traceability between code markers and specs',
  )
  .option('-c, --config <path>', 'Path to configuration file')
  // @awa-impl: CLI-25_AC-1
  .option('--spec-ignore <pattern...>', 'Glob patterns to exclude from spec file scanning')
  .option('--code-ignore <pattern...>', 'Glob patterns to exclude from code file scanning')
  // @awa-impl: CLI-24_AC-1
  .option('--json', 'Output results as JSON', false)
  .addOption(
    new Option('--format <format>', 'Output format (text or json)').default('text').hideHelp(),
  )
  .option('--summary', 'Output compact one-line summary', false)
  .option(
    '--allow-warnings',
    'Allow warnings without failing (default: warnings are errors)',
    false,
  )
  .option(
    '--spec-only',
    'Run only spec-level checks (schema and cross-refs); skip code-to-spec traceability',
    false,
  )
  .option(
    '--no-fix',
    'Skip regeneration of Requirements Traceability sections in DESIGN and TASK files',
  )
  .action(async (options, command: Command) => {
    const cliOptions: RawCheckOptions = {
      config: cliProvidedOption<string>(command, options, 'config'),
      specIgnore: cliProvidedOption<string[]>(command, options, 'specIgnore'),
      codeIgnore: cliProvidedOption<string[]>(command, options, 'codeIgnore'),
      format: cliProvidedOption<'text' | 'json'>(command, options, 'format'),
      json: cliProvidedOption<boolean>(command, options, 'json'),
      summary: cliProvidedOption<boolean>(command, options, 'summary'),
      allowWarnings: cliProvidedOption<boolean>(command, options, 'allowWarnings'),
      specOnly: cliProvidedOption<boolean>(command, options, 'specOnly'),
      fix: cliProvidedOption<boolean>(command, options, 'fix'),
    };

    const exitCode = await checkCommand(cliOptions);
    process.exit(exitCode);
  });

// @awa-impl: DISC-4_AC-1, DISC-5_AC-1
// @awa-impl: CLI-41_AC-6
template
  .command('features')
  .description('Discover feature flags available in a template')
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--refresh', 'Force refresh of cached Git templates', false)
  .option('--overlay <path...>', 'Overlay directory paths applied over base template (repeatable)')
  .option('--json', 'Output results as JSON', false)
  .option('--summary', 'Output compact one-line summary', false)
  .action(async (options, command: Command) => {
    const exitCode = await featuresCommand({
      template: cliProvidedOption<string>(command, options, 'template'),
      config: cliProvidedOption<string>(command, options, 'config'),
      refresh: cliProvidedOption<boolean>(command, options, 'refresh'),
      json: cliProvidedOption<boolean>(command, options, 'json'),
      summary: cliProvidedOption<boolean>(command, options, 'summary'),
      overlay: cliProvidedOption<string[]>(command, options, 'overlay'),
    });
    process.exit(exitCode);
  });

// @awa-impl: TTST-7_AC-1, TTST-5_AC-1
// @awa-impl: CLI-41_AC-7
template
  .command('test')
  .description('Run template test fixtures to verify expected output')
  .option('-t, --template <source>', 'Template source (local path or Git repository)')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--update-snapshots', 'Update stored snapshots with current rendered output', false)
  .option('--refresh', 'Force refresh of cached Git templates', false)
  .option('--overlay <path...>', 'Overlay directory paths applied over base template (repeatable)')
  .option('--json', 'Output results as JSON', false)
  .option('--summary', 'Output compact one-line summary', false)
  .action(async (options, command: Command) => {
    const testOptions: RawTestOptions = {
      template: cliProvidedOption<string>(command, options, 'template'),
      config: cliProvidedOption<string>(command, options, 'config'),
      updateSnapshots: cliProvidedOption<boolean>(command, options, 'updateSnapshots') ?? false,
      refresh: cliProvidedOption<boolean>(command, options, 'refresh'),
      json: cliProvidedOption<boolean>(command, options, 'json'),
      summary: cliProvidedOption<boolean>(command, options, 'summary'),
      overlay: cliProvidedOption<string[]>(command, options, 'overlay'),
    };

    const exitCode = await testCommand(testOptions);
    process.exit(exitCode);
  });

// @awa-component: CLI-RootProgram
// @awa-impl: CLI-1_AC-1, CLI-1_AC-2, CLI-1_AC-3, CLI-1_AC-4, CLI-1_AC-5
// @awa-impl: CLI-2_AC-1, CLI-2_AC-2, CLI-2_AC-3, CLI-2_AC-5, CLI-2_AC-6
// @awa-impl: CLI-3_AC-1, CLI-4_AC-1, CLI-4_AC-2, CLI-5_AC-1, CLI-6_AC-1, CLI-6_AC-2, CLI-7_AC-1, CLI-8_AC-1
// @awa-impl: CLI-9_AC-1, CLI-9_AC-2, CLI-9_AC-3, CLI-10_AC-1, CLI-10_AC-2
// @awa-impl: CLI-11_AC-1, CLI-11_AC-2, CLI-11_AC-3, CLI-12_AC-1
// @awa-impl: CLI-13_AC-1, CLI-13_AC-2, CLI-14_AC-1, CLI-14_AC-2, CLI-15_AC-1, CLI-15_AC-2
// @awa-impl: CLI-23_AC-1, CLI-24_AC-1, CLI-25_AC-1
// @awa-impl: CFG-5_AC-2, CFG-8_AC-1, CFG-8_AC-2, CFG-8_AC-4
// @awa-impl: CFG-10_AC-1, CFG-10_AC-2, CFG-10_AC-3, CFG-10_AC-5
// @awa-impl: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-4, DIFF-7_AC-5, DIFF-7_AC-6, DIFF-7_AC-7, DIFF-7_AC-8, DIFF-7_AC-9, DIFF-7_AC-10, DIFF-7_AC-11, DIFF-7_AC-12, DIFF-7_AC-13
// @awa-impl: DISC-4_AC-1, DISC-5_AC-1
// @awa-impl: GEN-13_AC-1, GEN-14_AC-1, GEN-15_AC-1, GEN-16_AC-1
// @awa-impl: JSON-1_AC-1, JSON-2_AC-1, JSON-5_AC-1, OVL-1_AC-1, OVL-7_AC-1
// @awa-impl: CLI-41_AC-1, CLI-41_AC-2, CLI-41_AC-3, CLI-41_AC-4, CLI-41_AC-5, CLI-41_AC-6, CLI-41_AC-7
// @awa-impl: CLI-42_AC-1, CLI-42_AC-2, CLI-43_AC-1, CLI-43_AC-2, CLI-43_AC-3, CLI-43_AC-4
// @awa-impl: CLI-44_AC-1, CLI-44_AC-2, CLI-45_AC-1, CLI-45_AC-2, CLI-45_AC-3, CLI-45_AC-4
// @awa-impl: TRC-8_AC-1, TTST-5_AC-1, TTST-7_AC-1
// Add template group to root program
program.addCommand(template);

// ── spec subcommand group ──
const spec = new Command('spec').description(
  'Spec operations (trace, renumber, recode, merge, codes)',
);

// @awa-impl: TRC-8_AC-1
// @awa-impl: CLI-43_AC-2, CLI-43_AC-4

/** Configure a trace command with shared options and action handler. */
function configureTraceCommand(cmd: Command): Command {
  return cmd
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
    .option('--json', 'Output results as JSON', false)
    .option('--summary', 'Output compact one-line summary', false)
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
        summary: options.summary,
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
}

configureTraceCommand(spec.command('trace'));

/** Configure a renumber command with shared options and action handler. */
function configureRenumberCommand(cmd: Command): Command {
  return cmd
    .description('Renumber traceability IDs to match document order')
    .argument('[code]', 'Feature code to renumber (e.g. CHK, TRC)')
    .option('--all', 'Renumber all feature codes', false)
    .option('--dry-run', 'Preview changes without modifying files', false)
    .option('--json', 'Output results as JSON', false)
    .option(
      '--expand-unambiguous-ids',
      'Expand unambiguous malformed ID shorthand (slash ranges, dot-dot ranges) before renumbering',
      false,
    )
    .option('-c, --config <path>', 'Path to configuration file')
    .action(async (code: string | undefined, options) => {
      const renumberOptions: RenumberCommandOptions = {
        code,
        all: options.all,
        dryRun: options.dryRun,
        json: options.json,
        config: options.config,
        expandUnambiguousIds: options.expandUnambiguousIds,
      };

      const exitCode = await renumberCommand(renumberOptions);
      process.exit(exitCode);
    });
}

configureRenumberCommand(spec.command('renumber'));

spec
  .command('recode')
  .description('Recode traceability IDs from one feature code to another and rename spec files')
  .argument('<source>', 'Source feature code to recode from (e.g. CHK)')
  .argument('<target>', 'Target feature code to recode into (e.g. CLI)')
  .option('--dry-run', 'Preview changes without modifying files', false)
  .option('--json', 'Output results as JSON', false)
  .option('--renumber', 'Renumber target code after recode', false)
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (source: string, target: string, options) => {
    const recodeOptions: RecodeCommandOptions = {
      sourceCode: source,
      targetCode: target,
      dryRun: options.dryRun,
      json: options.json,
      renumber: options.renumber,
      config: options.config,
    };

    const exitCode = await recodeCommand(recodeOptions);
    process.exit(exitCode);
  });

spec
  .command('merge')
  .description('Merge one feature code into another (recode + content merge + cleanup)')
  .argument('<source>', 'Source feature code to merge from (e.g. CHK)')
  .argument('<target>', 'Target feature code to merge into (e.g. CLI)')
  .option('--dry-run', 'Preview changes without modifying files', false)
  .option('--json', 'Output results as JSON', false)
  .option('--renumber', 'Renumber target code after merge', false)
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (source: string, target: string, options) => {
    const mergeOptions: MergeCommandOptions = {
      sourceCode: source,
      targetCode: target,
      dryRun: options.dryRun,
      json: options.json,
      renumber: options.renumber,
      config: options.config,
    };

    const exitCode = await mergeCommand(mergeOptions);
    process.exit(exitCode);
  });

spec
  .command('codes')
  .description('List all feature codes with requirement counts and scope summaries')
  .option('--json', 'Output results as JSON', false)
  .option('--summary', 'Output compact one-line summary', false)
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    const codesOptions: CodesCommandOptions = {
      json: options.json,
      summary: options.summary,
      config: options.config,
    };

    const exitCode = await codesCommand(codesOptions);
    process.exit(exitCode);
  });

// Add spec group to root program
program.addCommand(spec);

// Backward-compat aliases: `awa trace` → `awa spec trace`, `awa renumber` → `awa spec renumber`
configureTraceCommand(program.command('trace'));
configureRenumberCommand(program.command('renumber', { hidden: true }));

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
void program.parseAsync();
