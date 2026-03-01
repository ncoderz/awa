// @awa-component: TTST-FixtureLoader
// @awa-impl: TTST-1_AC-1
// @awa-impl: TTST-2_AC-1

import { readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { parse } from 'smol-toml';
import { readTextFile } from '../../utils/fs.js';
import type { TestFixture } from './types.js';

// @awa-impl: TTST-1_AC-1
export async function discoverFixtures(templatePath: string): Promise<TestFixture[]> {
  const testsDir = join(templatePath, '_tests');

  let entries: string[];
  try {
    const dirEntries = await readdir(testsDir, { withFileTypes: true });
    entries = dirEntries
      .filter((e) => e.isFile() && extname(e.name) === '.toml')
      .map((e) => e.name)
      .sort();
  } catch {
    // _tests/ directory doesn't exist — no fixtures
    return [];
  }

  const fixtures: TestFixture[] = [];
  for (const filename of entries) {
    const filePath = join(testsDir, filename);
    const fixture = await parseFixture(filePath);
    fixtures.push(fixture);
  }

  return fixtures;
}

// @awa-impl: TTST-2_AC-1
export async function parseFixture(filePath: string): Promise<TestFixture> {
  const content = await readTextFile(filePath);
  const parsed = parse(content) as Record<string, unknown>;

  const name = basename(filePath, extname(filePath));

  const features = toStringArray(parsed.features) ?? [];
  const preset = toStringArray(parsed.preset) ?? [];
  const removeFeatures = toStringArray(parsed['remove-features']) ?? [];
  const expectedFiles = toStringArray(parsed['expected-files']) ?? [];

  return {
    name,
    features,
    preset,
    removeFeatures,
    expectedFiles,
    filePath,
  };
}

function toStringArray(value: unknown): string[] | null {
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value as string[];
  }
  return null;
}
