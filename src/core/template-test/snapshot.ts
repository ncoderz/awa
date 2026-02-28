// @awa-component: TTST-TestRunner
// @awa-impl: TTST-5_AC-1

import { mkdir, readdir, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathExists, readTextFile, writeTextFile } from '../../utils/fs.js';
import type { SnapshotFileResult } from './types.js';

/** Walk a directory recursively and yield relative file paths. */
async function walkRelative(dir: string, base: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walkRelative(fullPath, base);
      results.push(...sub);
    } else if (entry.isFile()) {
      results.push(relative(base, fullPath));
    }
  }

  return results;
}

// @awa-impl: TTST-5_AC-1
export async function compareSnapshots(
  renderedDir: string,
  snapshotDir: string
): Promise<SnapshotFileResult[]> {
  const results: SnapshotFileResult[] = [];

  const renderedFiles = await walkRelative(renderedDir, renderedDir);
  const snapshotFiles = await walkRelative(snapshotDir, snapshotDir);

  const snapshotSet = new Set(snapshotFiles);
  const renderedSet = new Set(renderedFiles);

  // Check rendered files against snapshots
  for (const file of renderedFiles) {
    const renderedPath = join(renderedDir, file);
    const snapshotPath = join(snapshotDir, file);

    if (!snapshotSet.has(file)) {
      results.push({ path: file, status: 'missing-snapshot' });
      continue;
    }

    const renderedContent = await readTextFile(renderedPath);
    const snapshotContent = await readTextFile(snapshotPath);

    results.push({
      path: file,
      status: renderedContent === snapshotContent ? 'match' : 'mismatch',
    });
  }

  // Check for extra snapshot files not in rendered output
  for (const file of snapshotFiles) {
    if (!renderedSet.has(file)) {
      results.push({ path: file, status: 'extra-snapshot' });
    }
  }

  return results;
}

// @awa-impl: TTST-5_AC-1
export async function updateSnapshots(
  renderedDir: string,
  snapshotDir: string
): Promise<void> {
  // Remove existing snapshot directory
  if (await pathExists(snapshotDir)) {
    await rm(snapshotDir, { recursive: true, force: true });
  }

  await mkdir(snapshotDir, { recursive: true });

  // Copy rendered files to snapshot directory
  const files = await walkRelative(renderedDir, renderedDir);
  for (const file of files) {
    const srcPath = join(renderedDir, file);
    const destPath = join(snapshotDir, file);
    const content = await readTextFile(srcPath);
    await writeTextFile(destPath, content);
  }
}
