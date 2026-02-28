// @awa-component: GEN-GenerateCommand
// @awa-component: JSON-GenerateCommand
// @awa-impl: INIT-5_AC-1

import { intro, isCancel, multiselect, outro } from '@clack/prompts';
import { configLoader } from '../core/config.js';
import { featureResolver } from '../core/feature-resolver.js';
import { fileGenerator } from '../core/generator.js';
import {
  formatGenerationSummary,
  serializeGenerationResult,
  writeJsonOutput,
} from '../core/json-output.js';
import { buildMergedDir, resolveOverlays } from '../core/overlay.js';
import { templateResolver } from '../core/template-resolver.js';
import type { RawCliOptions } from '../types/index.js';
import { rmDir } from '../utils/fs.js';
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
  let mergedDir: string | null = null;
  try {
    // Load configuration file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // @awa-impl: INIT-5_AC-1
    // Non-blocking hint when no config file is present and --config was not provided
    if (!cliOptions.config && fileConfig === null) {
      logger.info('Tip: create .awa.toml to save your options for next time.');
    }

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

    // @awa-impl: OVL-2_AC-1
    // Build merged template dir if overlays are specified
    let templatePath = template.localPath;
    if (options.overlay.length > 0) {
      const overlayDirs = await resolveOverlays([...options.overlay], options.refresh);
      mergedDir = await buildMergedDir(template.localPath, overlayDirs);
      templatePath = mergedDir;
    }

    // Generate files
    const result = await fileGenerator.generate({
      templatePath,
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
  } finally {
    // Clean up merged overlay temp directory
    if (mergedDir) {
      try {
        await rmDir(mergedDir);
      } catch {
        // Swallow cleanup errors — temp dir will be cleaned by OS eventually
      }
    }
  }
}
