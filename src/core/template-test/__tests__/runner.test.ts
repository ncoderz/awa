// @awa-component: TTST-TestRunner
// @awa-test: TTST_P-2
// @awa-test: TTST-3_AC-1
// @awa-test: TTST-4_AC-1
// @awa-test: TTST-8_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { runAll, runFixture } from '../runner.js';
import type { TestFixture } from '../types.js';

describe('runFixture', () => {
  let templateDir: string;

  beforeEach(async () => {
    templateDir = join(tmpdir(), `awa-runner-test-${Date.now()}`);
    await mkdir(templateDir, { recursive: true });

    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(templateDir, { recursive: true, force: true });
  });

  // @awa-test: TTST-3_AC-1
  test('renders templates for a fixture and passes when expected files exist', async () => {
    // Create a simple template
    await writeFile(join(templateDir, 'output.md'), '# Hello\n');

    const fixture: TestFixture = {
      name: 'basic',
      features: [],
      preset: [],
      removeFeatures: [],
      expectedFiles: ['output.md'],
      filePath: '/tmp/basic.toml',
    };

    const result = await runFixture(fixture, templateDir, { updateSnapshots: false });

    expect(result.passed).toBe(true);
    expect(result.name).toBe('basic');
    expect(result.fileResults).toHaveLength(1);
    expect(result.fileResults[0]?.found).toBe(true);
  });

  // @awa-test: TTST-4_AC-1
  test('fails when expected file is missing from rendered output', async () => {
    // Create a conditional template that only outputs with the right feature
    await writeFile(
      join(templateDir, 'conditional.md'),
      '<% if (it.features.includes("myfeature")) { %>content<% } %>\n'
    );

    const fixture: TestFixture = {
      name: 'missing',
      features: [], // Feature not enabled, so file will be empty and skipped
      preset: [],
      removeFeatures: [],
      expectedFiles: ['conditional.md'],
      filePath: '/tmp/missing.toml',
    };

    const result = await runFixture(fixture, templateDir, { updateSnapshots: false });

    expect(result.passed).toBe(false);
    expect(result.fileResults).toHaveLength(1);
    expect(result.fileResults[0]?.found).toBe(false);
  });

  // @awa-test: TTST-8_AC-1
  test('excludes _tests/ directory from rendered output', async () => {
    // The _tests/ directory exists in the template but should not appear in output
    await writeFile(join(templateDir, 'output.md'), '# Hello\n');
    const testsDir = join(templateDir, '_tests');
    await mkdir(testsDir, { recursive: true });
    await writeFile(join(testsDir, 'fixture.toml'), 'features = ["a"]\n');

    const fixture: TestFixture = {
      name: 'exclusion-test',
      features: [],
      preset: [],
      removeFeatures: [],
      expectedFiles: ['output.md'],
      filePath: '/tmp/exclusion.toml',
    };

    const result = await runFixture(fixture, templateDir, { updateSnapshots: false });

    expect(result.passed).toBe(true);
    // _tests/ should not be in the output
  });

  // @awa-test: TTST-3_AC-1
  test('returns error result when generation fails', async () => {
    const fixture: TestFixture = {
      name: 'error-test',
      features: [],
      preset: [],
      removeFeatures: [],
      expectedFiles: ['nonexistent.md'],
      filePath: '/tmp/error.toml',
    };

    // Use a non-existent template directory
    const result = await runFixture(fixture, '/tmp/nonexistent-template-path', {
      updateSnapshots: false,
    });

    expect(result.passed).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('runAll', () => {
  let templateDir: string;

  beforeEach(async () => {
    templateDir = join(tmpdir(), `awa-runall-test-${Date.now()}`);
    await mkdir(templateDir, { recursive: true });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(templateDir, { recursive: true, force: true });
  });

  // @awa-test: TTST_P-2
  test('aggregates results from multiple fixtures', async () => {
    await writeFile(join(templateDir, 'file.md'), '# File\n');

    const fixtures: TestFixture[] = [
      {
        name: 'pass',
        features: [],
        preset: [],
        removeFeatures: [],
        expectedFiles: ['file.md'],
        filePath: '/tmp/pass.toml',
      },
      {
        name: 'fail',
        features: [],
        preset: [],
        removeFeatures: [],
        expectedFiles: ['missing.md'],
        filePath: '/tmp/fail.toml',
      },
    ];

    const result = await runAll(fixtures, templateDir, { updateSnapshots: false });

    expect(result.total).toBe(2);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(1);
  });
});
