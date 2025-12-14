// @zen-component: GenerateCommand

import { intro, outro } from '@clack/prompts';
import { configLoader } from '../core/config.js';
import { featureResolver } from '../core/feature-resolver.js';
import { fileGenerator } from '../core/generator.js';
import { templateResolver } from '../core/template-resolver.js';
import type { RawCliOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function generateCommand(cliOptions: RawCliOptions): Promise<void> {
  try {
    intro('Zen CLI - Template Generator');

    // Load configuration file
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Merge CLI and file config
    const options = configLoader.merge(cliOptions, fileConfig);

    // Resolve template source
    const template = await templateResolver.resolve(options.template, options.refresh);

    const features = featureResolver.resolve({
      baseFeatures: [...options.features],
      presetNames: [...options.preset],
      removeFeatures: [...options.removeFeatures],
      presetDefinitions: options.presets,
    });

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
    });

    // Display summary
    logger.summary(result);

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
