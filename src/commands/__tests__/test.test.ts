// @awa-component: TTST-TestCommand
// @awa-test: TTST_P-3
// @awa-test: TTST-6_AC-1
// @awa-test: TTST-7_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { testCommand } from '../test.js';

describe('testCommand', () => {
  let templateDir: string;
  let testsDir: string;

  beforeEach(async () => {
    templateDir = join(tmpdir(), `awa-cmd-test-${Date.now()}`);
    testsDir = join(templateDir, '_tests');
    await mkdir(testsDir, { recursive: true });

    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(templateDir, { recursive: true, force: true });
  });

  // @awa-test: TTST-7_AC-1
  test('returns exit code 0 when all fixtures pass', async () => {
    // Create a template file
    await writeFile(join(templateDir, 'output.md'), '# Hello\n');

    // Create a fixture that expects the file
    await writeFile(
      join(testsDir, 'basic.toml'),
      'features = []\nexpected-files = ["output.md"]\n'
    );

    const exitCode = await testCommand({
      template: templateDir,
      updateSnapshots: false,
    });

    expect(exitCode).toBe(0);
  });

  // @awa-test: TTST-7_AC-1
  test('returns exit code 1 when a fixture fails', async () => {
    // Create a fixture that expects a non-existent file
    await writeFile(
      join(testsDir, 'failing.toml'),
      'features = []\nexpected-files = ["missing.md"]\n'
    );

    const exitCode = await testCommand({
      template: templateDir,
      updateSnapshots: false,
    });

    expect(exitCode).toBe(1);
  });

  // @awa-test: TTST-7_AC-1
  test('returns exit code 0 when no fixtures found', async () => {
    // Remove _tests directory to simulate no fixtures
    await rm(testsDir, { recursive: true, force: true });

    const exitCode = await testCommand({
      template: templateDir,
      updateSnapshots: false,
    });

    expect(exitCode).toBe(0);
  });

  // @awa-test: TTST-6_AC-1
  test('reports pass/fail per fixture', async () => {
    await writeFile(join(templateDir, 'file.md'), '# Content\n');

    // One passing and one failing fixture
    await writeFile(join(testsDir, 'pass.toml'), 'features = []\nexpected-files = ["file.md"]\n');
    await writeFile(
      join(testsDir, 'fail.toml'),
      'features = []\nexpected-files = ["nonexistent.md"]\n'
    );

    const exitCode = await testCommand({
      template: templateDir,
      updateSnapshots: false,
    });

    expect(exitCode).toBe(1);

    // Check that report was printed (console.log captured)
    const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => String(c[0] ?? '') + String(c[1] ?? ''))
      .join('\n');

    expect(logCalls).toContain('pass');
    expect(logCalls).toContain('fail');
  });

  // @awa-test: TTST-7_AC-1
  test('returns exit code 2 on internal error', async () => {
    const exitCode = await testCommand({
      template: '/tmp/nonexistent-template-path-for-test',
      updateSnapshots: false,
    });

    expect(exitCode).toBe(2);
  });
});
