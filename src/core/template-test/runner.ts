// @awa-component: TTST-TestRunner
// @awa-impl: TTST-3_AC-1
// @awa-impl: TTST-4_AC-1
// @awa-impl: TTST-5_AC-1

import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathExists } from '../../utils/fs.js';
import { featureResolver } from '../feature-resolver.js';
import { fileGenerator } from '../generator.js';
import { compareSnapshots, updateSnapshots } from './snapshot.js';
import type {
  FileAssertionResult,
  FixtureResult,
  SnapshotFileResult,
  TestFixture,
  TestRunOptions,
  TestSuiteResult,
} from './types.js';

// @awa-impl: TTST-3_AC-1
export async function runFixture(
  fixture: TestFixture,
  templatePath: string,
  options: TestRunOptions,
  presetDefinitions: Record<string, string[]> = {}
): Promise<FixtureResult> {
  const tempDir = join(tmpdir(), `awa-test-${fixture.name}-${Date.now()}`);

  try {
    await mkdir(tempDir, { recursive: true });

    // Resolve features using presets and remove-features
    const features = featureResolver.resolve({
      baseFeatures: [...fixture.features],
      presetNames: [...fixture.preset],
      removeFeatures: [...fixture.removeFeatures],
      presetDefinitions,
    });

    // Render templates to temp dir
    await fileGenerator.generate({
      templatePath,
      outputPath: tempDir,
      features,
      force: true,
      dryRun: false,
      delete: false,
    });

    // @awa-impl: TTST-4_AC-1
    // Check expected files
    const fileResults: FileAssertionResult[] = [];
    for (const expectedFile of fixture.expectedFiles) {
      const fullPath = join(tempDir, expectedFile);
      const found = await pathExists(fullPath);
      fileResults.push({ path: expectedFile, found });
    }

    const missingFiles = fileResults.filter((r) => !r.found);

    // @awa-impl: TTST-5_AC-1
    // Snapshot comparison
    const snapshotDir = join(templatePath, '_tests', fixture.name);
    let snapshotResults: SnapshotFileResult[] = [];
    if (options.updateSnapshots) {
      await updateSnapshots(tempDir, snapshotDir);
    } else if (await pathExists(snapshotDir)) {
      snapshotResults = await compareSnapshots(tempDir, snapshotDir);
    }

    const snapshotFailures = snapshotResults.filter((r) => r.status !== 'match');

    const passed = missingFiles.length === 0 && snapshotFailures.length === 0;

    return {
      name: fixture.name,
      passed,
      fileResults,
      snapshotResults,
    };
  } catch (error) {
    return {
      name: fixture.name,
      passed: false,
      fileResults: [],
      snapshotResults: [],
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    // Clean up temp dir
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function runAll(
  fixtures: TestFixture[],
  templatePath: string,
  options: TestRunOptions,
  presetDefinitions: Record<string, string[]> = {}
): Promise<TestSuiteResult> {
  const results: FixtureResult[] = [];

  for (const fixture of fixtures) {
    const result = await runFixture(fixture, templatePath, options, presetDefinitions);
    results.push(result);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    results,
    total: results.length,
    passed,
    failed,
  };
}
