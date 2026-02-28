// @awa-component: TTST-FixtureLoader
// @awa-test: TTST_P-1
// @awa-test: TTST-1_AC-1
// @awa-test: TTST-2_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { discoverFixtures, parseFixture } from '../fixture-loader.js';

describe('discoverFixtures', () => {
  let testDir: string;
  let testsDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-fixture-test-${Date.now()}`);
    testsDir = join(testDir, '_tests');
    await mkdir(testsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // @awa-test: TTST-1_AC-1
  test('discovers all .toml files in _tests/ directory', async () => {
    await writeFile(join(testsDir, 'full.toml'), 'features = ["a", "b"]\n');
    await writeFile(join(testsDir, 'minimal.toml'), 'features = ["a"]\n');

    const fixtures = await discoverFixtures(testDir);

    expect(fixtures).toHaveLength(2);
    expect(fixtures.map((f) => f.name)).toEqual(['full', 'minimal']);
  });

  // @awa-test: TTST-1_AC-1
  test('returns empty array when _tests/ directory does not exist', async () => {
    const emptyDir = join(tmpdir(), `awa-no-tests-${Date.now()}`);
    await mkdir(emptyDir, { recursive: true });

    const fixtures = await discoverFixtures(emptyDir);

    expect(fixtures).toHaveLength(0);

    await rm(emptyDir, { recursive: true, force: true });
  });

  // @awa-test: TTST-1_AC-1
  test('ignores non-toml files', async () => {
    await writeFile(join(testsDir, 'valid.toml'), 'features = ["a"]\n');
    await writeFile(join(testsDir, 'readme.md'), '# Tests\n');
    await writeFile(join(testsDir, 'notes.txt'), 'some notes\n');

    const fixtures = await discoverFixtures(testDir);

    expect(fixtures).toHaveLength(1);
    expect(fixtures[0].name).toBe('valid');
  });

  // @awa-test: TTST-1_AC-1
  test('returns fixtures sorted alphabetically', async () => {
    await writeFile(join(testsDir, 'zebra.toml'), 'features = ["z"]\n');
    await writeFile(join(testsDir, 'alpha.toml'), 'features = ["a"]\n');
    await writeFile(join(testsDir, 'middle.toml'), 'features = ["m"]\n');

    const fixtures = await discoverFixtures(testDir);

    expect(fixtures.map((f) => f.name)).toEqual(['alpha', 'middle', 'zebra']);
  });
});

describe('parseFixture', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-parse-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // @awa-test: TTST-2_AC-1
  test('parses features from fixture TOML', async () => {
    const filePath = join(testDir, 'test.toml');
    await writeFile(filePath, 'features = ["copilot", "claude"]\n');

    const fixture = await parseFixture(filePath);

    expect(fixture.name).toBe('test');
    expect(fixture.features).toEqual(['copilot', 'claude']);
    expect(fixture.preset).toEqual([]);
    expect(fixture.removeFeatures).toEqual([]);
    expect(fixture.expectedFiles).toEqual([]);
  });

  // @awa-test: TTST-2_AC-1
  test('parses all fixture fields', async () => {
    const filePath = join(testDir, 'full.toml');
    await writeFile(
      filePath,
      `features = ["copilot", "claude"]
preset = ["full"]
remove-features = ["vibe"]
expected-files = ["CLAUDE.md", ".github/agents/copilot.agent.md"]
`
    );

    const fixture = await parseFixture(filePath);

    expect(fixture.name).toBe('full');
    expect(fixture.features).toEqual(['copilot', 'claude']);
    expect(fixture.preset).toEqual(['full']);
    expect(fixture.removeFeatures).toEqual(['vibe']);
    expect(fixture.expectedFiles).toEqual(['CLAUDE.md', '.github/agents/copilot.agent.md']);
  });

  // @awa-test: TTST-2_AC-1
  test('defaults missing fields to empty arrays', async () => {
    const filePath = join(testDir, 'empty.toml');
    await writeFile(filePath, '# empty fixture\n');

    const fixture = await parseFixture(filePath);

    expect(fixture.features).toEqual([]);
    expect(fixture.preset).toEqual([]);
    expect(fixture.removeFeatures).toEqual([]);
    expect(fixture.expectedFiles).toEqual([]);
  });
});
