// @awa-component: JSON-JsonSerializer
// @awa-test: JSON_P-1
// @awa-test: JSON_P-2

import { describe, expect, test, vi } from 'vitest';
import type { DiffResult, GenerationResult } from '../../types/index.js';
import {
  formatDiffSummary,
  formatGenerationSummary,
  serializeDiffResult,
  serializeGenerationResult,
  writeJsonOutput,
} from '../json-output.js';

describe('serializeGenerationResult', () => {
  // @awa-test: JSON-1_AC-1, JSON-3_AC-1
  test('should produce valid JSON with actions and counts', () => {
    const result: GenerationResult = {
      actions: [
        { type: 'create', sourcePath: '/tmp/src/a.md', outputPath: '/out/a.md' },
        { type: 'overwrite', sourcePath: '/tmp/src/b.md', outputPath: '/out/b.md' },
        { type: 'skip-equal', sourcePath: '/tmp/src/c.md', outputPath: '/out/c.md' },
        { type: 'delete', outputPath: '/out/d.md' },
      ],
      created: 1,
      overwritten: 1,
      deleted: 1,
      skipped: 1,
      skippedEmpty: 0,
      skippedUser: 0,
      skippedEqual: 1,
    };

    const json = serializeGenerationResult(result);

    expect(json.actions).toHaveLength(4);
    expect(json.actions[0]).toEqual({ type: 'create', path: '/out/a.md' });
    expect(json.actions[1]).toEqual({ type: 'overwrite', path: '/out/b.md' });
    expect(json.actions[2]).toEqual({ type: 'skip-equal', path: '/out/c.md' });
    expect(json.actions[3]).toEqual({ type: 'delete', path: '/out/d.md' });
    expect(json.counts).toEqual({
      created: 1,
      overwritten: 1,
      skipped: 1,
      deleted: 1,
    });
  });

  // @awa-test: JSON_P-1
  test('should produce valid parseable JSON', () => {
    const result: GenerationResult = {
      actions: [{ type: 'create', sourcePath: '/tmp/src/a.md', outputPath: '/out/a.md' }],
      created: 1,
      overwritten: 0,
      deleted: 0,
      skipped: 0,
      skippedEmpty: 0,
      skippedUser: 0,
      skippedEqual: 0,
    };

    const json = serializeGenerationResult(result);
    const serialized = JSON.stringify(json);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual(json);
  });

  // @awa-test: JSON_P-2
  test('should have counts matching actions array entries', () => {
    const result: GenerationResult = {
      actions: [
        { type: 'create', sourcePath: '/tmp/src/a.md', outputPath: '/out/a.md' },
        { type: 'create', sourcePath: '/tmp/src/b.md', outputPath: '/out/b.md' },
        { type: 'overwrite', sourcePath: '/tmp/src/c.md', outputPath: '/out/c.md' },
      ],
      created: 2,
      overwritten: 1,
      deleted: 0,
      skipped: 0,
      skippedEmpty: 0,
      skippedUser: 0,
      skippedEqual: 0,
    };

    const json = serializeGenerationResult(result);

    const createCount = json.actions.filter((a) => a.type === 'create').length;
    const overwriteCount = json.actions.filter((a) => a.type === 'overwrite').length;

    expect(json.counts.created).toBe(createCount);
    expect(json.counts.overwritten).toBe(overwriteCount);
  });

  test('should handle empty results', () => {
    const result: GenerationResult = {
      actions: [],
      created: 0,
      overwritten: 0,
      deleted: 0,
      skipped: 0,
      skippedEmpty: 0,
      skippedUser: 0,
      skippedEqual: 0,
    };

    const json = serializeGenerationResult(result);

    expect(json.actions).toEqual([]);
    expect(json.counts).toEqual({ created: 0, overwritten: 0, skipped: 0, deleted: 0 });
  });
});

describe('serializeDiffResult', () => {
  // @awa-test: JSON-2_AC-1, JSON-4_AC-1
  test('should produce valid JSON with diffs and counts', () => {
    const result: DiffResult = {
      files: [
        { relativePath: 'file.txt', status: 'modified', unifiedDiff: '--- a\n+++ b\n' },
        { relativePath: 'new.txt', status: 'new' },
        { relativePath: 'same.txt', status: 'identical' },
        { relativePath: 'old.txt', status: 'delete-listed' },
      ],
      identical: 1,
      modified: 1,
      newFiles: 1,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 1,
      hasDifferences: true,
    };

    const json = serializeDiffResult(result);

    expect(json.diffs).toHaveLength(4);
    expect(json.diffs[0]).toEqual({ path: 'file.txt', status: 'modified', diff: '--- a\n+++ b\n' });
    expect(json.diffs[1]).toEqual({ path: 'new.txt', status: 'new' });
    expect(json.diffs[2]).toEqual({ path: 'same.txt', status: 'identical' });
    expect(json.diffs[3]).toEqual({ path: 'old.txt', status: 'delete-listed' });
    expect(json.counts).toEqual({
      changed: 1,
      new: 1,
      matching: 1,
      deleted: 1,
    });
  });

  // @awa-test: JSON_P-1
  test('should produce valid parseable JSON', () => {
    const result: DiffResult = {
      files: [{ relativePath: 'file.txt', status: 'identical' }],
      identical: 1,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: false,
    };

    const json = serializeDiffResult(result);
    const serialized = JSON.stringify(json);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual(json);
  });

  // @awa-test: JSON_P-2
  test('should have counts matching diffs array entries', () => {
    const result: DiffResult = {
      files: [
        { relativePath: 'a.txt', status: 'modified' },
        { relativePath: 'b.txt', status: 'new' },
        { relativePath: 'c.txt', status: 'identical' },
        { relativePath: 'd.txt', status: 'identical' },
      ],
      identical: 2,
      modified: 1,
      newFiles: 1,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: true,
    };

    const json = serializeDiffResult(result);

    expect(json.counts.changed).toBe(1);
    expect(json.counts.new).toBe(1);
    expect(json.counts.matching).toBe(2);
    expect(json.counts.deleted).toBe(0);
  });

  test('should omit diff field for non-modified files', () => {
    const result: DiffResult = {
      files: [{ relativePath: 'new.txt', status: 'new' }],
      identical: 0,
      modified: 0,
      newFiles: 1,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: true,
    };

    const json = serializeDiffResult(result);

    expect(json.diffs[0]!.diff).toBeUndefined();
  });

  test('should handle empty results', () => {
    const result: DiffResult = {
      files: [],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: false,
    };

    const json = serializeDiffResult(result);

    expect(json.diffs).toEqual([]);
    expect(json.counts).toEqual({ changed: 0, new: 0, matching: 0, deleted: 0 });
  });
});

describe('formatGenerationSummary', () => {
  // @awa-test: JSON-5_AC-1
  test('should produce a single line with counts', () => {
    const result: GenerationResult = {
      actions: [],
      created: 3,
      overwritten: 1,
      deleted: 0,
      skipped: 2,
      skippedEmpty: 1,
      skippedUser: 0,
      skippedEqual: 1,
    };

    const summary = formatGenerationSummary(result);

    expect(summary).toBe('created: 3, overwritten: 1, skipped: 2, deleted: 0');
    expect(summary.split('\n')).toHaveLength(1);
  });
});

describe('formatDiffSummary', () => {
  // @awa-test: JSON-5_AC-1
  test('should produce a single line with counts', () => {
    const result: DiffResult = {
      files: [],
      identical: 5,
      modified: 2,
      newFiles: 1,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: true,
    };

    const summary = formatDiffSummary(result);

    expect(summary).toBe('changed: 2, new: 1, matching: 5, deleted: 0');
    expect(summary.split('\n')).toHaveLength(1);
  });
});

describe('writeJsonOutput', () => {
  // @awa-test: JSON-8_AC-1
  test('should write JSON to stdout', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    const data = {
      actions: [{ type: 'create', path: '/out/a.md' }],
      counts: { created: 1, overwritten: 0, skipped: 0, deleted: 0 },
    };

    writeJsonOutput(data);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    const output = writeSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).toEqual(data);

    writeSpy.mockRestore();
  });
});
