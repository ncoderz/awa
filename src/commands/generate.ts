// @awa-component: GEN-GenerateCommand

import { intro, isCancel, multiselect, outro } from '@clack/prompts';
import { batchRunner } from '../core/batch-runner.js';
import { configLoader } from '../core/config.js';
import { featureResolver } from '../core/feature-resolver.js';
import { fileGenerator } from '../core/generator.js';
import { templateResolver } from '../core/template-resolver.js';
import type { RawCliOptions, ResolvedOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';

/** Known AI tool feature flags for interactive selection. */
const TOOL_FEATURES = [
  { value: 'copilot', label: 'GitHub Copilot' },
  { value: 'claude', label: 'Claude Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'kilocode', label: 'Kilocode' },
  { value: 'opencode', label: 'OpenCode' },
  { value: 'gemini', label: 'Gemini CLI' },
  { value: 'roo', label: 'Roo Code' },
  { value: 'qwen', label: 'Qwen Code' },
  { value: 'codex', label: 'Codex CLI' },
  { value: 'agy', label: 'Antigravity (agy)' },
  { value: 'agents-md', label: 'AGENTS.md (cross-tool)' },
] as const;

const TOOL_FEATURE_VALUES = new Set<string>(TOOL_FEATURES.map((t) => t.value));

async function runGenerate(options: ResolvedOptions, batchMode: boolean): Promise<void> {
  // Resolve template source
  const template = await templateResolver.resolve(options.template, options.refresh);

  const features = featureResolver.resolve({
    baseFeatures: [...options.features],
    presetNames: [...options.preset],
    removeFeatures: [...options.removeFeatures],
    presetDefinitions: options.presets,
  });

  // @awa-impl: MTT-1_AC-1 // @awa-ignore
  // If no tool feature flag is present, prompt the user to select tools interactively
  // In batch mode (--all / --target), skip prompting
  if (!batchMode) {
    const hasToolFlag = features.some((f) => TOOL_FEATURE_VALUES.has(f));
    if (!hasToolFlag) {
      const selected = await multiselect({
        message: 'Select AI tools to generate for (space to toggle, enter to confirm):',
        options: TOOL_FEATURES.map((t) => ({ value: t.value, label: t.label })),
        required: true,
      });
      if (isCancel(selected)) {
        logger.info('Generation cancelled.');
        process.exit(0);
      }
      features.push(...(selected as string[]));
    }
  }

  // Display mode indicators
  if (options.dryRun) {
    logger.info('Running in dry-run mode (no files will be modified)');
  }
  if (options.force) {
    logger.info('Force mode enabled (existing files will be overwritten)');
  }

  // Generate files
  const result = await fileGenerator.generate({
    templatePath: template.localPath,
    outputPath: options.output,
    features,
    force: options.force,
    dryRun: options.dryRun,
    delete: options.delete,
  });

  // Display summary
  logger.summary(result);
}

export async function generateCommand(cliOptions: RawCliOptions): Promise<void> {
  try {
    intro('awa CLI - Template Generator');

    // Load configuration file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Batch mode: --all or --target
    if (cliOptions.all || cliOptions.target) {
      const mode = cliOptions.all ? 'all' : 'single';
      const targets = batchRunner.resolveTargets(cliOptions, fileConfig, mode, cliOptions.target);

      for (const { targetName, options } of targets) {
        batchRunner.logForTarget(targetName, 'Starting generation...');
        await runGenerate(options, true);
        batchRunner.logForTarget(targetName, 'Generation complete.');
      }

      outro('All targets generated!');
      return;
    }

    // Standard single-target mode (backward compatible)
    const options = configLoader.merge(cliOptions, fileConfig);
    await runGenerate(options, false);

    outro('Generation complete!');
  } catch (error) {
    // Error handling with proper exit codes
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    process.exit(1);
  }
}
