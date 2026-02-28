// @awa-component: GEN-GenerateCommand
// @awa-component: JSON-GenerateCommand

import { intro, isCancel, multiselect, outro } from '@clack/prompts';
import { configLoader } from '../core/config.js';
import { featureResolver } from '../core/feature-resolver.js';
import { fileGenerator } from '../core/generator.js';
import {
  formatGenerationSummary,
  serializeGenerationResult,
  writeJsonOutput,
} from '../core/json-output.js';
import { templateResolver } from '../core/template-resolver.js';
import type { RawCliOptions } from '../types/index.js';
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

export async function generateCommand(cliOptions: RawCliOptions): Promise<void> {
  try {
    // Load configuration file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Merge CLI and file config
    const options = configLoader.merge(cliOptions, fileConfig);

    const silent = options.json || options.summary;

    // @awa-impl: JSON-6_AC-1
    // Suppress interactive output when --json or --summary is active
    if (!silent) {
      intro('awa CLI - Template Generator');
    }

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
    // @awa-impl: JSON-6_AC-1
    const hasToolFlag = features.some((f) => TOOL_FEATURE_VALUES.has(f));
    if (!hasToolFlag && !silent) {
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

    // @awa-impl: JSON-7_AC-1
    // --json implies --dry-run for generate
    const effectiveDryRun = options.json || options.dryRun;

    // Display mode indicators
    if (!silent) {
      if (effectiveDryRun) {
        logger.info('Running in dry-run mode (no files will be modified)');
      }
      if (options.force) {
        logger.info('Force mode enabled (existing files will be overwritten)');
      }
    }

    // Generate files
    const result = await fileGenerator.generate({
      templatePath: template.localPath,
      outputPath: options.output,
      features,
      force: options.force,
      dryRun: effectiveDryRun,
      delete: options.delete,
    });

    // @awa-impl: JSON-1_AC-1, JSON-8_AC-1
    if (options.json) {
      writeJsonOutput(serializeGenerationResult(result));
    } else if (options.summary) {
      // @awa-impl: JSON-5_AC-1
      console.log(formatGenerationSummary(result));
    } else {
      // Display summary
      logger.summary(result);
      outro('Generation complete!');
    }
  } catch (error) {
    // @awa-impl: JSON-8_AC-1
    // Error handling with proper exit codes — errors always go to stderr
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    process.exit(1);
  }
}
