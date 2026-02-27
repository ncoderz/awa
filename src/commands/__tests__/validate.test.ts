// @awa-component: VAL-ValidateCommand
// @awa-test: VAL-8_AC-1
// @awa-test: VAL-10_AC-1
// @awa-test: VAL-16_AC-1
// @awa-test: VAL_P-5

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { validateCommand } from '../validate.js';

describe('validateCommand', () => {
  let testDir: string;
  let specDir: string;
  let codeDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `awa-validate-cmd-test-${Date.now()}`);
    specDir = join(testDir, '.awa', 'specs');
    codeDir = join(testDir, 'src');
    await mkdir(specDir, { recursive: true });
    await mkdir(codeDir, { recursive: true });
    process.chdir(testDir);

    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    await rm(testDir, { recursive: true, force: true });
  });

  // @awa-test: VAL_P-5
  // @awa-test: VAL-8_AC-1
  test('returns exit code 0 when all markers resolve', async () => {
    await writeFile(
      join(specDir, 'REQ-X-x.md'),
      `### X-1: Feature [MUST]

ACCEPTANCE CRITERIA

- [ ] X-1_AC-1 [event]: WHEN foo THEN bar
`
    );
    await writeFile(
      join(specDir, 'DESIGN-X-x.md'),
      `### X-Loader

IMPLEMENTS: X-1_AC-1

## Correctness Properties

- X_P-1 [Prop]: Description
  VALIDATES: X-1_AC-1
`
    );
    await writeFile(
      join(codeDir, 'loader.ts'),
      `// @awa-component: X-Loader
// @awa-impl: X-1_AC-1
export function load() {}
`
    );
    await writeFile(
      join(codeDir, 'loader.test.ts'),
      `// @awa-test: X_P-1
// @awa-test: X-1_AC-1
test('works', () => {});
`
    );

    const exitCode = await validateCommand({
      config: undefined,
      ignore: [],
      format: 'json',
    });

    // No orphaned markers, all ACs tested, cross-refs valid
    expect(exitCode).toBe(0);
  });

  // @awa-test: VAL_P-5
  // @awa-test: VAL-8_AC-1
  test('returns exit code 1 when orphaned markers exist', async () => {
    await writeFile(
      join(codeDir, 'broken.ts'),
      `// @awa-impl: GHOST-1_AC-1
export function ghost() {}
`
    );

    const exitCode = await validateCommand({
      config: undefined,
      ignore: [],
      format: 'json',
    });

    expect(exitCode).toBe(1);
  });

  // @awa-test: VAL-16_AC-1
  test('works with default config (no .awa.toml)', async () => {
    // Should not throw even without config file
    const exitCode = await validateCommand({
      config: undefined,
    });

    // Returns 0 or 1 (not 2 for error)
    expect(exitCode).toBeLessThanOrEqual(1);
  });

  // @awa-test: VAL-10_AC-1
  test('respects --ignore patterns', async () => {
    await writeFile(
      join(codeDir, 'ignored.ts'),
      `// @awa-impl: GHOST-1_AC-1
export function ghost() {}
`
    );

    const exitCode = await validateCommand({
      config: undefined,
      ignore: ['src/**'],
      format: 'json',
    });

    // With code dir ignored, no orphaned markers to find
    expect(exitCode).toBe(0);
  });
});
