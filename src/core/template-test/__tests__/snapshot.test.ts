// @awa-component: TTST-TestRunner
// @awa-test: TTST_P-4
// @awa-test: TTST-5_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { pathExists, readTextFile } from '../../../utils/fs.js';
import { compareSnapshots, updateSnapshots } from '../snapshot.js';

describe('compareSnapshots', () => {
  let renderedDir: string;
  let snapshotDir: string;

  beforeEach(async () => {
    const base = join(tmpdir(), `awa-snap-test-${Date.now()}`);
    renderedDir = join(base, 'rendered');
    snapshotDir = join(base, 'snapshot');
    await mkdir(renderedDir, { recursive: true });
    await mkdir(snapshotDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(renderedDir, { recursive: true, force: true });
    await rm(snapshotDir, { recursive: true, force: true });
  });

  // @awa-test: TTST-5_AC-1
  test('returns match for identical files', async () => {
    await writeFile(join(renderedDir, 'file.md'), '# Hello\n');
    await writeFile(join(snapshotDir, 'file.md'), '# Hello\n');

    const results = await compareSnapshots(renderedDir, snapshotDir);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('match');
    expect(results[0]?.path).toBe('file.md');
  });

  // @awa-test: TTST-5_AC-1
  test('returns mismatch for different files', async () => {
    await writeFile(join(renderedDir, 'file.md'), '# New\n');
    await writeFile(join(snapshotDir, 'file.md'), '# Old\n');

    const results = await compareSnapshots(renderedDir, snapshotDir);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('mismatch');
  });

  // @awa-test: TTST-5_AC-1
  test('returns missing-snapshot for files only in rendered output', async () => {
    await writeFile(join(renderedDir, 'new-file.md'), '# New\n');

    const results = await compareSnapshots(renderedDir, snapshotDir);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('missing-snapshot');
    expect(results[0]?.path).toBe('new-file.md');
  });

  // @awa-test: TTST-5_AC-1
  test('returns extra-snapshot for files only in snapshot', async () => {
    await writeFile(join(snapshotDir, 'old-file.md'), '# Old\n');

    const results = await compareSnapshots(renderedDir, snapshotDir);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('extra-snapshot');
    expect(results[0]?.path).toBe('old-file.md');
  });

  // @awa-test: TTST-5_AC-1
  test('handles nested directories', async () => {
    await mkdir(join(renderedDir, 'sub'), { recursive: true });
    await mkdir(join(snapshotDir, 'sub'), { recursive: true });
    await writeFile(join(renderedDir, 'sub', 'nested.md'), '# Content\n');
    await writeFile(join(snapshotDir, 'sub', 'nested.md'), '# Content\n');

    const results = await compareSnapshots(renderedDir, snapshotDir);

    expect(results).toHaveLength(1);
    expect(results[0]?.status).toBe('match');
    expect(results[0]?.path).toBe('sub/nested.md');
  });
});

describe('updateSnapshots', () => {
  let renderedDir: string;
  let snapshotDir: string;

  beforeEach(async () => {
    const base = join(tmpdir(), `awa-snap-update-${Date.now()}`);
    renderedDir = join(base, 'rendered');
    snapshotDir = join(base, 'snapshot');
    await mkdir(renderedDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(renderedDir, { recursive: true, force: true });
    await rm(snapshotDir, { recursive: true, force: true });
  });

  // @awa-test: TTST-5_AC-1
  test('creates snapshot directory with rendered files', async () => {
    await writeFile(join(renderedDir, 'file.md'), '# Content\n');

    await updateSnapshots(renderedDir, snapshotDir);

    expect(await pathExists(join(snapshotDir, 'file.md'))).toBe(true);
    expect(await readTextFile(join(snapshotDir, 'file.md'))).toBe('# Content\n');
  });

  // @awa-test: TTST-5_AC-1
  test('replaces existing snapshot directory', async () => {
    // Create existing snapshot with different content
    await mkdir(snapshotDir, { recursive: true });
    await writeFile(join(snapshotDir, 'old-file.md'), '# Old\n');

    // Create rendered output
    await writeFile(join(renderedDir, 'new-file.md'), '# New\n');

    await updateSnapshots(renderedDir, snapshotDir);

    expect(await pathExists(join(snapshotDir, 'old-file.md'))).toBe(false);
    expect(await pathExists(join(snapshotDir, 'new-file.md'))).toBe(true);
  });
});
