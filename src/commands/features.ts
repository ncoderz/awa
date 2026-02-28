// @awa-component: DISC-FeaturesCommand
// @awa-impl: DISC-4_AC-1
// @awa-impl: DISC-5_AC-1

import { intro, outro } from '@clack/prompts';
import { configLoader } from '../core/config.js';
import { featuresReporter } from '../core/features/reporter.js';
import { featureScanner } from '../core/features/scanner.js';
import { templateResolver } from '../core/template-resolver.js';
import { logger } from '../utils/logger.js';

export interface FeaturesCommandOptions {
  template?: string;
  config?: string;
  refresh?: boolean;
  json?: boolean;
}

// @awa-impl: DISC-4_AC-1, DISC-5_AC-1
export async function featuresCommand(cliOptions: FeaturesCommandOptions): Promise<number> {
  try {
    if (!cliOptions.json) {
      intro('awa CLI - Feature Discovery');
    }

    // Load configuration file (for presets and default template)
    const fileConfig = await configLoader.load(cliOptions.config ?? null);

    // Resolve template source — reuse same resolver as generate/diff
    const templateSource = cliOptions.template ?? fileConfig?.template ?? null;
    const refresh = cliOptions.refresh ?? fileConfig?.refresh ?? false;
    const template = await templateResolver.resolve(templateSource, refresh);

    // Scan template for feature flags
    const scanResult = await featureScanner.scan(template.localPath);

    // Retrieve preset definitions from config if available
    const presets = fileConfig?.presets;

    // Report results
    featuresReporter.report({
      scanResult,
      json: cliOptions.json ?? false,
      presets,
    });

    if (!cliOptions.json) {
      outro('Feature discovery complete!');
    }

    return 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    return 1;
  }
}
