// @awa-component: DIFF-DiffCommand
// @awa-test: DIFF_P-4
// @awa-test: DIFF-4_AC-1, DIFF-4_AC-2, DIFF-4_AC-3, DIFF-4_AC-4, DIFF-4_AC-5
// @awa-test: DIFF-5_AC-1, DIFF-5_AC-2, DIFF-5_AC-3
// @awa-test: DIFF-7_AC-1, DIFF-7_AC-2, DIFF-7_AC-3, DIFF-7_AC-11
// @awa-test: DIFF-8_AC-1, DIFF-8_AC-2, DIFF-8_AC-4

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DiffResult } from '../../types/index.js';

// Mock dependencies BEFORE importing the module under test
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
}));

vi.mock('../../core/config.js');
vi.mock('../../core/differ.js');
vi.mock('../../core/template-resolver.js');
vi.mock('../../utils/fs.js');
vi.mock('../../utils/logger.js');

import { configLoader } from '../../core/config.js';
import { diffEngine } from '../../core/differ.js';
import { templateResolver } from '../../core/template-resolver.js';
import { pathExists } from '../../utils/fs.js';
import { logger } from '../../utils/logger.js';
import { diffCommand } from '../diff.js';

describe('diffCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mocks
    vi.mocked(configLoader.load).mockResolvedValue({
      output: './output',
      features: [],
      refresh: false,
    });
    vi.mocked(configLoader.merge).mockReturnValue({
      template: './templates/awa',
      output: './output',
      features: [],
      preset: [],
      removeFeatures: [],
      presets: {},
      refresh: false,
      force: false,
      dryRun: false,
      delete: false,
      listUnknown: false,
      json: false,
      summary: false,
    });
    vi.mocked(pathExists).mockResolvedValue(true);
    vi.mocked(templateResolver.resolve).mockResolvedValue({
      type: 'local',
      localPath: './templates/awa',
      source: 'local',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // @awa-test: DIFF_P-4
  // VALIDATES: DIFF-5_AC-1
  test('should use output from config when not provided in CLI', async () => {
    const mockResult: DiffResult = {
      files: [],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);
    vi.mocked(configLoader.merge).mockReturnValue({
      template: './templates/awa',
      output: './from-config',
      features: [],
      preset: [],
      removeFeatures: [],
      presets: {},
      refresh: false,
      force: false,
      dryRun: false,
      delete: false,
      listUnknown: false,
      json: false,
      summary: false,
    });

    const exitCode = await diffCommand({
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: undefined,
    });

    expect(exitCode).toBe(0);
    expect(pathExists).toHaveBeenCalledWith('./from-config');
  });

  // @awa-test: DIFF-5_AC-1, DIFF-4_AC-4
  test('should return exit code 0 when files are identical', async () => {
    const mockResult: DiffResult = {
      files: [{ relativePath: 'file.txt', status: 'identical' }],
      identical: 1,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    const exitCode = await diffCommand({
      output: './target',
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: undefined,
    });

    expect(exitCode).toBe(0);
    expect(logger.diffSummary).toHaveBeenCalledWith(mockResult);
  });

  // @awa-test: DIFF_P-4
  // VALIDATES: DIFF-5_AC-2
  test('should return exit code 1 when files have differences', async () => {
    const mockResult: DiffResult = {
      files: [
        {
          relativePath: 'file.txt',
          status: 'modified',
          unifiedDiff: '--- file.txt\n+++ file.txt\n@@ -1,1 +1,1 @@\n-old\n+new\n',
        },
      ],
      identical: 0,
      modified: 1,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: true,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    const exitCode = await diffCommand({
      output: './target',
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: undefined,
    });

    expect(exitCode).toBe(1);
    expect(logger.diffLine).toHaveBeenCalled();
  });

  // @awa-test: DIFF_P-4
  // VALIDATES: DIFF-5_AC-3
  test('should return exit code 2 on error', async () => {
    vi.mocked(pathExists).mockResolvedValue(false);

    const exitCode = await diffCommand({
      output: './non-existent',
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: undefined,
    });

    expect(exitCode).toBe(2);

    expect(logger.error).toHaveBeenCalled();
  });

  // @awa-test: DIFF-4_AC-3
  // VALIDATES: DIFF-4_AC-3
  test('should display unified diff with colored output', async () => {
    const mockResult: DiffResult = {
      files: [
        {
          relativePath: 'file.txt',
          status: 'modified',
          unifiedDiff:
            '--- file.txt\n+++ file.txt\n@@ -1,2 +1,2 @@\n line 1\n-old line\n+new line\n',
        },
      ],
      identical: 0,
      modified: 1,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: true,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    await diffCommand({
      output: './target',
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: undefined,
    });

    // Verify that diffLine was called with appropriate line types
    const calls = vi.mocked(logger.diffLine).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    // Check that addition and removal lines were detected
    const hasRemoval = calls.some((call) => call[0].includes('-old line') && call[1] === 'remove');
    const hasAddition = calls.some((call) => call[0].includes('+new line') && call[1] === 'add');
    expect(hasRemoval).toBe(true);
    expect(hasAddition).toBe(true);
  });

  // @awa-test: DIFF-7_AC-1, DIFF-7_AC-2
  // VALIDATES: DIFF-7_AC-1, DIFF-7_AC-2
  test('should resolve template from config if not provided', async () => {
    const mockResult: DiffResult = {
      files: [],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    await diffCommand({
      output: './target',
      template: undefined,
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: undefined,
    });

    expect(templateResolver.resolve).toHaveBeenCalled();
  });

  // @awa-test: DIFF-7_AC-3
  // VALIDATES: DIFF-7_AC-3
  test('should use features from options', async () => {
    const mockResult: DiffResult = {
      files: [],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);
    vi.mocked(configLoader.merge).mockReturnValue({
      template: './templates/awa',
      output: './output',
      features: ['feature1', 'feature2'],
      preset: [],
      removeFeatures: [],
      force: false,
      dryRun: false,
      delete: false,
      presets: {},
      refresh: false,
      listUnknown: false,
      json: false,
      summary: false,
    });

    await diffCommand({
      output: './target',
      template: './templates/awa',
      features: ['feature1', 'feature2'],
      config: undefined,
      refresh: false,
      listUnknown: undefined,
    });

    expect(diffEngine.diff).toHaveBeenCalledWith(
      expect.objectContaining({
        features: ['feature1', 'feature2'],
      })
    );
  });

  // @awa-test: DIFF-7_AC-11
  // VALIDATES: DIFF-7_AC-11
  test('should pass listUnknown flag to diff engine', async () => {
    const mockResult: DiffResult = {
      files: [],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: false,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);
    vi.mocked(configLoader.merge).mockReturnValue({
      template: './templates/awa',
      output: './output',
      features: [],
      preset: [],
      removeFeatures: [],
      force: false,
      dryRun: false,
      delete: false,
      presets: {},
      refresh: false,
      listUnknown: true,
      json: false,
      summary: false,
    });

    await diffCommand({
      output: './target',
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: true,
    });

    expect(diffEngine.diff).toHaveBeenCalledWith(
      expect.objectContaining({
        listUnknown: true,
      })
    );
  });

  // @awa-test: DIFF-4_AC-1, DIFF-4_AC-2
  // VALIDATES: DIFF-4_AC-1, DIFF-4_AC-2
  test('should display diffs for new and extra files', async () => {
    const mockResult: DiffResult = {
      files: [
        { relativePath: 'new-file.txt', status: 'new' },
        { relativePath: 'extra-file.txt', status: 'extra' },
      ],
      identical: 0,
      modified: 0,
      newFiles: 1,
      extraFiles: 1,
      binaryDiffers: 0,
      deleteListed: 0,
      hasDifferences: true,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    await diffCommand({
      output: './target',
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: true,
    });

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('new-file.txt'));
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('extra-file.txt'));
  });

  // @awa-test: DIFF-8_AC-1, DIFF-8_AC-2, DIFF-8_AC-4
  test('should display delete-listed files', async () => {
    const mockResult: DiffResult = {
      files: [{ relativePath: 'old-agent.md', status: 'delete-listed' }],
      identical: 0,
      modified: 0,
      newFiles: 0,
      extraFiles: 0,
      binaryDiffers: 0,
      deleteListed: 1,
      hasDifferences: true,
    };

    vi.mocked(diffEngine.diff).mockResolvedValue(mockResult);

    const exitCode = await diffCommand({
      output: './target',
      template: './templates/awa',
      features: [],
      config: undefined,
      refresh: false,
      listUnknown: false,
    });

    expect(exitCode).toBe(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('old-agent.md'));
  });
});
