// @awa-component: CHK-MarkerScanner
// @awa-test: CHK-1_AC-1
// @awa-test: CHK-11_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { scanMarkers } from '../marker-scanner.js';
import type { CheckConfig } from '../types.js';
import { DEFAULT_CHECK_CONFIG } from '../types.js';

describe('MarkerScanner', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-marker-scanner-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  function makeConfig(overrides: Partial<CheckConfig> = {}): CheckConfig {
    return {
      ...DEFAULT_CHECK_CONFIG,
      codeGlobs: [`${testDir}/**/*.ts`],
      specGlobs: [],
      ...overrides,
    };
  }

  // @awa-test: CHK-1_AC-1
  test('extracts @awa-impl markers from source files', async () => {
    await writeFile(
      join(testDir, 'example.ts'),
      `// @awa-component: CFG-ConfigLoader
// @awa-impl: CFG-1_AC-1
export function load() {}

// @awa-impl: CFG-1_AC-2
export function merge() {}
`
    );

    const result = await scanMarkers(makeConfig());

    expect(result.markers).toHaveLength(3);
    expect(result.markers[0]).toEqual({
      type: 'component',
      id: 'CFG-ConfigLoader',
      filePath: join(testDir, 'example.ts'),
      line: 1,
    });
    expect(result.markers[1]).toEqual({
      type: 'impl',
      id: 'CFG-1_AC-1',
      filePath: join(testDir, 'example.ts'),
      line: 2,
    });
    expect(result.markers[2]).toEqual({
      type: 'impl',
      id: 'CFG-1_AC-2',
      filePath: join(testDir, 'example.ts'),
      line: 5,
    });
  });

  // @awa-test: CHK-1_AC-1
  test('extracts @awa-test markers', async () => {
    await writeFile(
      join(testDir, 'test.ts'),
      `// @awa-test: CFG_P-1
test('preserves defaults', () => {});

// @awa-test: CFG-1_AC-1
test('loads config from path', () => {});
`
    );

    const result = await scanMarkers(makeConfig());

    expect(result.markers).toHaveLength(2);
    expect(result.markers[0]).toMatchObject({ type: 'test', id: 'CFG_P-1' });
    expect(result.markers[1]).toMatchObject({ type: 'test', id: 'CFG-1_AC-1' });
  });

  // @awa-test: CHK-1_AC-1
  test('handles multiple IDs on a single marker line', async () => {
    await writeFile(
      join(testDir, 'multi.ts'),
      `// @awa-impl: CFG-1_AC-1, CFG-1_AC-2, CFG-1_AC-3
export function loadAndMerge() {}
`
    );

    const result = await scanMarkers(makeConfig());

    expect(result.markers).toHaveLength(3);
    expect(result.markers.map((m) => m.id)).toEqual(['CFG-1_AC-1', 'CFG-1_AC-2', 'CFG-1_AC-3']);
  });

  // @awa-test: CHK-1_AC-1
  test('strips partial annotations from marker IDs', async () => {
    await writeFile(
      join(testDir, 'partial.ts'),
      `// @awa-impl: CFG-1_AC-1 (partial: reason for incompleteness)
export function partialImpl() {}
`
    );

    const result = await scanMarkers(makeConfig());

    expect(result.markers).toHaveLength(1);
    expect(result.markers[0]?.id).toBe('CFG-1_AC-1');
  });

  // @awa-test: CHK-1_AC-1
  test('returns empty result for files with no markers', async () => {
    await writeFile(
      join(testDir, 'clean.ts'),
      `export function hello() { return 'world'; }
`
    );

    const result = await scanMarkers(makeConfig());

    expect(result.markers).toHaveLength(0);
  });

  // @awa-test: CHK-1_AC-1
  test('skips files that cannot be read', async () => {
    // Point glob at nonexistent directory — should return empty, not throw
    const result = await scanMarkers(makeConfig({ codeGlobs: [`${testDir}/nonexistent/**/*.ts`] }));

    expect(result.markers).toHaveLength(0);
  });

  // @awa-test: CHK-11_AC-1
  test('uses custom marker names when configured', async () => {
    await writeFile(
      join(testDir, 'custom.ts'),
      `// @trace-impl: FOO-1_AC-1
// @trace-test: FOO_P-1
// @trace-component: FOO-Loader
export function foo() {}
`
    );

    const result = await scanMarkers(
      makeConfig({ markers: ['@trace-impl', '@trace-test', '@trace-component'] })
    );

    expect(result.markers).toHaveLength(3);
    expect(result.markers[0]).toMatchObject({ type: 'impl', id: 'FOO-1_AC-1' });
    expect(result.markers[1]).toMatchObject({ type: 'test', id: 'FOO_P-1' });
    expect(result.markers[2]).toMatchObject({ type: 'component', id: 'FOO-Loader' });
  });

  // @awa-test: CHK-1_AC-1
  test('scans multiple files', async () => {
    await mkdir(join(testDir, 'sub'), { recursive: true });
    await writeFile(join(testDir, 'a.ts'), `// @awa-impl: A-1_AC-1\n`);
    await writeFile(join(testDir, 'sub', 'b.ts'), `// @awa-impl: B-1_AC-1\n`);

    const result = await scanMarkers(makeConfig());

    expect(result.markers).toHaveLength(2);
    const ids = result.markers.map((m) => m.id).sort();
    expect(ids).toEqual(['A-1_AC-1', 'B-1_AC-1']);
  });
});
