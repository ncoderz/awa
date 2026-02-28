// @awa-component: DIFF-DiffCommand
// @awa-impl: DIFF-5_AC-1
// @awa-impl: DIFF-5_AC-2
// @awa-impl: DIFF-5_AC-3
// @awa-impl: MULTI-6_AC-1
// @awa-impl: MULTI-12_AC-1

import { intro, outro } from '@clack/prompts';
import { batchRunner } from '../core/batch-runner.js';
import { configLoader } from '../core/config.js';
import { diffEngine } from '../core/differ.js';
import { featureResolver } from '../core/feature-resolver.js';
import { templateResolver } from '../core/template-resolver.js';
import { DiffError, type RawCliOptions, type ResolvedOptions } from '../types/index.js';
import { pathExists } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

async function runDiff(options: ResolvedOptions): Promise<number> {
  // Validate target directory exists (now from options.output)
  if (!(await pathExists(options.output))) {
    throw new DiffError(`Target directory does not exist: ${options.output}`);
  }

  const targetPath = options.output;

  // Resolve template source
  const template = await templateResolver.resolve(options.template, options.refresh);

  const features = featureResolver.resolve({
    baseFeatures: [...options.features],
    presetNames: [...options.preset],
    removeFeatures: [...options.removeFeatures],
    presetDefinitions: options.presets,
  });

  // Perform diff
  const result = await diffEngine.diff({
    templatePath: template.localPath,
    targetPath,
    features,
    listUnknown: options.listUnknown,
  });

  // Display diff output
  for (const file of result.files) {
    switch (file.status) {
      case 'modified':
        logger.info(`Modified: ${file.relativePath}`);
        if (file.unifiedDiff) {
          // Parse and display unified diff with colors
          const lines = file.unifiedDiff.split('\n');
          for (const line of lines) {
            if (
              line.startsWith('diff --git') ||
              line.startsWith('index ') ||
              line.startsWith('--- ') ||
              line.startsWith('+++ ')
            ) {
              logger.diffLine(line, 'context');
            } else if (line.startsWith('+')) {
              logger.diffLine(line, 'add');
            } else if (line.startsWith('-')) {
              logger.diffLine(line, 'remove');
            } else if (line.startsWith('@@')) {
              logger.diffLine(line, 'context');
            } else {
              logger.diffLine(line, 'context');
            }
          }
        }
        break;
      case 'new':
        logger.info(`New file: ${file.relativePath}`);
        break;
      case 'extra':
        logger.warn(`Extra file (not in template): ${file.relativePath}`);
        break;
      case 'binary-differs':
        logger.warn(`binary files differ: ${file.relativePath}`);
        break;
      case 'delete-listed':
        logger.warn(`Delete listed: ${file.relativePath}`);
        break;
      case 'identical':
        // Skip identical files from output
        break;
    }
  }

  // Display summary
  logger.diffSummary(result);

  // @awa-impl: DIFF-5_AC-1, DIFF-5_AC-2
  return result.hasDifferences ? 1 : 0;
}

export async function diffCommand(cliOptions: RawCliOptions): Promise<number> {
  try {
    intro('awa CLI - Template Diff');

    // Load configuration file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Batch mode: --all or --target
    if (cliOptions.all || cliOptions.target) {
      const mode = cliOptions.all ? 'all' : 'single';
      const targets = batchRunner.resolveTargets(cliOptions, fileConfig, mode, cliOptions.target);

      // @awa-impl: MULTI-12_AC-1
      // Exit code aggregation: 0 if all identical, 1 if any differ, 2 on error (first error short-circuits)
      let hasDifferences = false;
      for (const { targetName, options } of targets) {
        batchRunner.logForTarget(targetName, 'Starting diff...');
        const exitCode = await runDiff(options);
        if (exitCode === 1) {
          hasDifferences = true;
        }
        batchRunner.logForTarget(targetName, 'Diff complete.');
      }

      outro('All targets diffed!');
      return hasDifferences ? 1 : 0;
    }

    // Standard single-target mode (backward compatible)
    const options = configLoader.merge(cliOptions, fileConfig);
    const exitCode = await runDiff(options);

    outro('Diff complete!');
    return exitCode;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }

    // @awa-impl: DIFF-5_AC-3
    return 2;
  }
}
