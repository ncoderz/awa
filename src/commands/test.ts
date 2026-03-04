// @awa-component: TTST-TestCommand
// @awa-impl: TTST-7_AC-1
// @awa-impl: TTST-9_AC-1
// @awa-impl: TTST-11_AC-1
// @awa-impl: TTST-12_AC-1

import { intro, outro } from '@clack/prompts';

import { configLoader } from '../core/config.js';
import { buildMergedDir, resolveOverlays } from '../core/overlay.js';
import { templateResolver } from '../core/template-resolver.js';
import { discoverFixtures } from '../core/template-test/fixture-loader.js';
import { report } from '../core/template-test/reporter.js';
import { runAll } from '../core/template-test/runner.js';
import type { RawTestOptions } from '../core/template-test/types.js';
import { rmDir } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

// @awa-impl: TTST-7_AC-1
export async function testCommand(options: RawTestOptions): Promise<number> {
  let mergedDir: string | null = null;

  try {
    const isJson = options.json === true;
    const isSummary = options.summary === true;
    const silent = isJson || isSummary;

    if (!silent) {
      intro('awa CLI - Template Test');
    }

    // Load configuration file
    const fileConfig = await configLoader.load(options.config ?? null);
    const templateSource = options.template ?? fileConfig?.template ?? null;

    // Resolve template source
    const refresh = options.refresh ?? false;
    const template = await templateResolver.resolve(templateSource, refresh);

    // Build merged dir if overlays are specified
    const overlays = options.overlay ?? fileConfig?.overlay ?? [];
    let templatePath = template.localPath;
    if (overlays.length > 0) {
      const overlayDirs = await resolveOverlays(overlays, refresh);
      mergedDir = await buildMergedDir(template.localPath, overlayDirs);
      templatePath = mergedDir;
    }

    // Discover fixtures
    const fixtures = await discoverFixtures(templatePath);

    if (fixtures.length === 0) {
      if (isSummary) {
        console.log('passed: 0, failed: 0, total: 0');
      } else if (isJson) {
        console.log(JSON.stringify({ total: 0, passed: 0, failed: 0, results: [] }, null, 2));
      } else {
        logger.warn('No test fixtures found in _tests/ directory');
        outro('No tests to run.');
      }
      return 0;
    }

    if (!silent) {
      logger.info(`Found ${fixtures.length} fixture(s)`);
    }

    // Extract preset definitions from config
    const presetDefinitions = fileConfig?.presets ?? {};

    // Run all fixtures
    const result = await runAll(
      fixtures,
      templatePath,
      { updateSnapshots: options.updateSnapshots },
      presetDefinitions
    );

    // Report results
    if (isSummary) {
      console.log(`passed: ${result.passed}, failed: ${result.failed}, total: ${result.total}`);
    } else {
      report(result, { json: isJson });
    }

    if (result.failed > 0) {
      if (!silent) {
        outro(`${result.failed} fixture(s) failed.`);
      }
      return 1;
    }

    if (!silent) {
      outro('All tests passed!');
    }
    return 0;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    return 2;
  } finally {
    if (mergedDir) {
      await rmDir(mergedDir);
    }
  }
}
