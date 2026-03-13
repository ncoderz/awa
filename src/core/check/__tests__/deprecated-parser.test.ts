// @awa-component: DEP-DeprecatedParser
// @awa-test: DEP-1_AC-1
// @awa-test: DEP-1_AC-2
// @awa-test: DEP-1_AC-3
// @awa-test: DEP-2_AC-1
// @awa-test: DEP-2_AC-2
// @awa-test: DEP-2_AC-3
// @awa-test: DEP_P-5

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { parseDeprecated } from '../deprecated-parser.js';

let tempDir: string;

beforeEach(() => {
  tempDir = join(tmpdir(), `awa-dep-test-${Date.now()}`);
  mkdirSync(join(tempDir, 'deprecated'), { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('parseDeprecated', () => {
  // @awa-test: DEP_P-5
  test('returns empty set when file does not exist', async () => {
    await parseDeprecated(tempDir);
    // Remove the deprecated dir so the file is truly missing
    rmSync(join(tempDir, 'deprecated'), { recursive: true, force: true });
    const result2 = await parseDeprecated(tempDir);
    expect(result2.deprecatedIds.size).toBe(0);
  });

  // @awa-test: DEP-1_AC-1, DEP-1_AC-2, DEP-2_AC-1, DEP-2_AC-2
  test('parses valid deprecated file with multiple code sections', async () => {
    const content = `# GEN

GEN-5, GEN-5.1
GEN-5_AC-1, GEN-5_AC-2, GEN-5.1_AC-1
GEN_P-3
GEN-CacheManager

# DIFF

DIFF-4
DIFF-4_AC-1, DIFF-4_AC-2
`;
    writeFileSync(join(tempDir, 'deprecated', 'DEPRECATED.md'), content);

    const result = await parseDeprecated(tempDir);

    expect(result.deprecatedIds).toContain('GEN-5');
    expect(result.deprecatedIds).toContain('GEN-5.1');
    expect(result.deprecatedIds).toContain('GEN-5_AC-1');
    expect(result.deprecatedIds).toContain('GEN-5_AC-2');
    expect(result.deprecatedIds).toContain('GEN-5.1_AC-1');
    expect(result.deprecatedIds).toContain('GEN_P-3');
    expect(result.deprecatedIds).toContain('GEN-CacheManager');
    expect(result.deprecatedIds).toContain('DIFF-4');
    expect(result.deprecatedIds).toContain('DIFF-4_AC-1');
    expect(result.deprecatedIds).toContain('DIFF-4_AC-2');
    expect(result.deprecatedIds.size).toBe(10);
  });

  // @awa-test: DEP-2_AC-3
  test('file contains only IDs, no natural language parsed', async () => {
    // Even if someone adds prose, only valid ID patterns are extracted
    const content = `# GEN

GEN-5, GEN-5.1
This line has no valid IDs
GEN-5_AC-1
`;
    writeFileSync(join(tempDir, 'deprecated', 'DEPRECATED.md'), content);

    const result = await parseDeprecated(tempDir);

    // Only actual IDs are captured, not arbitrary words
    expect(result.deprecatedIds).toContain('GEN-5');
    expect(result.deprecatedIds).toContain('GEN-5.1');
    expect(result.deprecatedIds).toContain('GEN-5_AC-1');
    expect(result.deprecatedIds).not.toContain('This');
    expect(result.deprecatedIds).not.toContain('line');
  });

  // @awa-test: DEP-1_AC-3
  test('returns empty set when deprecated directory does not exist', async () => {
    const nonExistentDir = join(tempDir, 'nonexistent');
    const result = await parseDeprecated(nonExistentDir);
    expect(result.deprecatedIds.size).toBe(0);
  });
});
