// @awa-test: DISC_P-1
// @awa-test: DISC_P-2
// VALIDATES: DISC-1_AC-1, DISC-2_AC-1, DISC-3_AC-1

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { rmDir } from '../../../utils/fs.js';
import { FeatureScanner } from '../scanner.js';

const TEST_DIR = join(import.meta.dirname ?? '.', '__fixtures__', 'scanner-test');
const scanner = new FeatureScanner();

describe('FeatureScanner', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rmDir(TEST_DIR);
  });

  describe('extractFlags', () => {
    // VALIDATES: DISC-2_AC-1
    test('should extract flags from it.features.includes() with single quotes', () => {
      const content = `<% if (it.features.includes('copilot')) { %>content<% } %>`;
      const flags = scanner.extractFlags(content);
      expect(flags).toEqual(['copilot']);
    });

    test('should extract flags from it.features.includes() with double quotes', () => {
      const content = `<% if (it.features.includes("claude")) { %>content<% } %>`;
      const flags = scanner.extractFlags(content);
      expect(flags).toEqual(['claude']);
    });

    test('should extract flags from it.features.indexOf()', () => {
      const content = `<% if (it.features.indexOf('cursor') >= 0) { %>content<% } %>`;
      const flags = scanner.extractFlags(content);
      expect(flags).toEqual(['cursor']);
    });

    test('should extract multiple flags from same file', () => {
      const content = [
        `<% if (it.features.includes('copilot')) { %>`,
        'copilot content',
        '<% } %>',
        `<% if (it.features.includes('claude')) { %>`,
        'claude content',
        '<% } %>',
      ].join('\n');
      const flags = scanner.extractFlags(content);
      expect(flags).toContain('copilot');
      expect(flags).toContain('claude');
      expect(flags).toHaveLength(2);
    });

    test('should deduplicate flags within the same content', () => {
      const content = [
        `<% if (it.features.includes('copilot')) { %>a<% } %>`,
        `<% if (it.features.includes('copilot')) { %>b<% } %>`,
      ].join('\n');
      const flags = scanner.extractFlags(content);
      expect(flags).toEqual(['copilot']);
    });

    test('should return empty array for content without feature references', () => {
      const content = 'plain text without any features';
      const flags = scanner.extractFlags(content);
      expect(flags).toEqual([]);
    });
  });

  describe('scan', () => {
    // VALIDATES: DISC-1_AC-1
    test('should scan template files and find feature flags', async () => {
      await writeFile(
        join(TEST_DIR, 'template.md'),
        `<% if (it.features.includes('copilot')) { %>copilot content<% } %>`
      );
      await writeFile(
        join(TEST_DIR, 'other.md'),
        `<% if (it.features.includes('claude')) { %>claude content<% } %>`
      );

      const result = await scanner.scan(TEST_DIR);
      expect(result.features).toHaveLength(2);
      expect(result.filesScanned).toBe(2);

      const flagNames = result.features.map((f) => f.name);
      expect(flagNames).toContain('copilot');
      expect(flagNames).toContain('claude');
    });

    // VALIDATES: DISC-3_AC-1
    test('should aggregate files per flag', async () => {
      await writeFile(
        join(TEST_DIR, 'a.md'),
        `<% if (it.features.includes('copilot')) { %>a<% } %>`
      );
      await writeFile(
        join(TEST_DIR, 'b.md'),
        `<% if (it.features.includes('copilot')) { %>b<% } %>`
      );

      const result = await scanner.scan(TEST_DIR);
      const copilot = result.features.find((f) => f.name === 'copilot');
      expect(copilot).toBeDefined();
      expect(copilot!.files).toHaveLength(2);
      expect(copilot!.files).toContain('a.md');
      expect(copilot!.files).toContain('b.md');
    });

    test('should sort features by name', async () => {
      await writeFile(join(TEST_DIR, 'z.md'), `<% if (it.features.includes('zebra')) { %><% } %>`);
      await writeFile(join(TEST_DIR, 'a.md'), `<% if (it.features.includes('alpha')) { %><% } %>`);

      const result = await scanner.scan(TEST_DIR);
      expect(result.features[0].name).toBe('alpha');
      expect(result.features[1].name).toBe('zebra');
    });

    test('should scan subdirectories recursively', async () => {
      const subDir = join(TEST_DIR, 'sub');
      await mkdir(subDir, { recursive: true });
      await writeFile(join(subDir, 'deep.md'), `<% if (it.features.includes('deep')) { %><% } %>`);

      const result = await scanner.scan(TEST_DIR);
      const deep = result.features.find((f) => f.name === 'deep');
      expect(deep).toBeDefined();
      expect(deep!.files).toContain(join('sub', 'deep.md'));
    });

    test('should include underscore-prefixed files (partials)', async () => {
      const partialDir = join(TEST_DIR, '_partials');
      await mkdir(partialDir, { recursive: true });
      await writeFile(
        join(partialDir, '_header.md'),
        `<% if (it.features.includes('partial-flag')) { %><% } %>`
      );

      const result = await scanner.scan(TEST_DIR);
      const flag = result.features.find((f) => f.name === 'partial-flag');
      expect(flag).toBeDefined();
    });

    test('should return empty features for directory without feature references', async () => {
      await writeFile(join(TEST_DIR, 'plain.md'), 'no features here');

      const result = await scanner.scan(TEST_DIR);
      expect(result.features).toHaveLength(0);
      expect(result.filesScanned).toBe(1);
    });
  });
});
