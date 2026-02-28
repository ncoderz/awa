// @awa-component: DIFF-DiffCommand
// @awa-impl: DIFF-5_AC-1
// @awa-impl: DIFF-5_AC-2
// @awa-impl: DIFF-5_AC-3

import { intro, outro } from '@clack/prompts';
import { configLoader } from '../core/config.js';
import { diffEngine } from '../core/differ.js';
import { featureResolver } from '../core/feature-resolver.js';
import { buildMergedDir, resolveOverlays } from '../core/overlay.js';
import { templateResolver } from '../core/template-resolver.js';
import { DiffError, type RawCliOptions } from '../types/index.js';
import { pathExists, rmDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export async function diffCommand(cliOptions: RawCliOptions): Promise<number> {
  let mergedDir: string | null = null;
  try {
    intro('awa CLI - Template Diff');

    // Load configuration file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Merge CLI and file config
    const options = configLoader.merge(cliOptions, fileConfig);

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

    // @awa-impl: OVL-7_AC-1
    // Build merged template dir if overlays are specified
    let templatePath = template.localPath;
    if (options.overlay.length > 0) {
      const overlayDirs = await resolveOverlays([...options.overlay], options.refresh);
      mergedDir = await buildMergedDir(template.localPath, overlayDirs);
      templatePath = mergedDir;
    }

    // Perform diff
    const result = await diffEngine.diff({
      templatePath,
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

    outro('Diff complete!');

    // @awa-impl: DIFF-5_AC-1, DIFF-5_AC-2
    return result.hasDifferences ? 1 : 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }

    // @awa-impl: DIFF-5_AC-3
    return 2;
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
