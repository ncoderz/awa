// @awa-component: TTST-TestCommand
// @awa-impl: TTST-7_AC-1

import { intro, outro } from '@clack/prompts';
import { configLoader } from '../core/config.js';
import { templateResolver } from '../core/template-resolver.js';
import { discoverFixtures } from '../core/template-test/fixture-loader.js';
import { report } from '../core/template-test/reporter.js';
import { runAll } from '../core/template-test/runner.js';
import type { RawTestOptions } from '../core/template-test/types.js';
import { logger } from '../utils/logger.js';

// @awa-impl: TTST-7_AC-1
export async function testCommand(options: RawTestOptions): Promise<number> {
  try {
    intro('awa CLI - Template Test');

    // Load configuration file
    const fileConfig = await configLoader.load(options.config ?? null);
    const templateSource = options.template ?? fileConfig?.template ?? null;

    // Resolve template source
    const template = await templateResolver.resolve(templateSource, false);

    // Discover fixtures
    const fixtures = await discoverFixtures(template.localPath);

    if (fixtures.length === 0) {
      logger.warn('No test fixtures found in _tests/ directory');
      outro('No tests to run.');
      return 0;
    }

    logger.info(`Found ${fixtures.length} fixture(s)`);

    // Extract preset definitions from config
    const presetDefinitions = fileConfig?.presets ?? {};

    // Run all fixtures
    const result = await runAll(
      fixtures,
      template.localPath,
      { updateSnapshots: options.updateSnapshots },
      presetDefinitions
    );

    // Report results
    report(result);

    if (result.failed > 0) {
      outro(`${result.failed} fixture(s) failed.`);
      return 1;
    }

    outro('All tests passed!');
    return 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    return 2;
  }
}
