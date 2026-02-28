// @awa-component: DIFF-DiffCommand
// @awa-component: JSON-DiffCommand
// @awa-impl: DIFF-5_AC-1
// @awa-impl: DIFF-5_AC-2
// @awa-impl: DIFF-5_AC-3

import { intro, outro } from '@clack/prompts';
import { configLoader } from '../core/config.js';
import { diffEngine } from '../core/differ.js';
import { featureResolver } from '../core/feature-resolver.js';
import { formatDiffSummary, serializeDiffResult, writeJsonOutput } from '../core/json-output.js';
import { buildMergedDir, resolveOverlays } from '../core/overlay.js';
import { templateResolver } from '../core/template-resolver.js';
import { DiffError, type RawCliOptions } from '../types/index.js';
import { FileWatcher } from '../utils/file-watcher.js';
import { pathExists, rmDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export async function diffCommand(cliOptions: RawCliOptions): Promise<number> {
  let mergedDir: string | null = null;
  try {
    // Load configuration file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Merge CLI and file config
    const options = configLoader.merge(cliOptions, fileConfig);

    const silent = options.json || options.summary;

    // @awa-impl: JSON-6_AC-1
    // Suppress interactive output when --json or --summary is active
    if (!silent) {
      intro('awa CLI - Template Diff');
    }

    // Validate target directory exists (now from options.output)
    if (!(await pathExists(options.output))) {
      throw new DiffError(`Target directory does not exist: ${options.output}`);
    }

    const targetPath = options.output;

    // Resolve template source
    const template = await templateResolver.resolve(options.template, options.refresh);

    // Validate watch mode: only local templates are supported
    if (cliOptions.watch && template.type !== 'local' && template.type !== 'bundled') {
      throw new DiffError('--watch is only supported with local template sources');
    }

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

    const diffOptions = {
      templatePath,
      targetPath,
      features,
      listUnknown: options.listUnknown,
    };

    // Run diff once
    const result = await runDiff(diffOptions, options, mergedDir);

    if (!cliOptions.watch) {
      return result;
    }

    // Watch mode: re-run diff on template changes
    // Resolves only on SIGINT (Ctrl+C) — this is intentional for watch mode
    logger.info(`Watching for changes in ${template.localPath}...`);

    return new Promise<number>((resolve) => {
      let running = false;
      const watcher = new FileWatcher({
        directory: template.localPath,
        onChange: async () => {
          if (running) return;
          running = true;
          try {
            console.clear();
            logger.info(`[${new Date().toLocaleTimeString()}] Change detected, re-running diff...`);
            logger.info('---');
            await runDiff(diffOptions, options, null);
          } finally {
            running = false;
          }
        },
      });

      watcher.start();

      process.once('SIGINT', () => {
        watcher.stop();
        logger.info('\nWatch mode stopped.');
        resolve(0);
      });
    });
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

async function runDiff(
  diffOptions: {
    templatePath: string;
    targetPath: string;
    features: string[];
    listUnknown: boolean;
  },
  options: { json: boolean; summary: boolean },
  mergedDir: string | null
): Promise<number> {
  try {
    // Perform diff
    const result = await diffEngine.diff(diffOptions);

    // @awa-impl: JSON-2_AC-1, JSON-8_AC-1
    if (options.json) {
      writeJsonOutput(serializeDiffResult(result));
      // @awa-impl: DIFF-5_AC-1, DIFF-5_AC-2
      return result.hasDifferences ? 1 : 0;
    }

    // @awa-impl: JSON-5_AC-1
    if (options.summary) {
      console.log(formatDiffSummary(result));
      return result.hasDifferences ? 1 : 0;
    }

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
