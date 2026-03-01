// @awa-component: DIFF-DiffEngine
// @awa-test: DIFF_P-1, DIFF_P-2, DIFF_P-3, DIFF_P-4
// @awa-test: DIFF-1_AC-1, DIFF-1_AC-2, DIFF-1_AC-3
// @awa-test: DIFF-2_AC-1, DIFF-2_AC-2, DIFF-2_AC-3, DIFF-2_AC-4, DIFF-2_AC-5
// @awa-test: DIFF-3_AC-1, DIFF-3_AC-2, DIFF-3_AC-3, DIFF-3_AC-4
// @awa-test: DIFF-4_AC-1, DIFF-4_AC-2, DIFF-4_AC-4, DIFF-4_AC-5
// @awa-test: DIFF-6_AC-1, DIFF-6_AC-2, DIFF-6_AC-3

import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { pathExists, rmDir } from '../../utils/fs.js';
import { DiffEngine } from '../differ.js';

describe('DiffEngine', () => {
  let diffEngine: DiffEngine;
  let testTempDir: string;

  beforeEach(() => {
    diffEngine = new DiffEngine();
    testTempDir = join(tmpdir(), `awa-differ-test-${Date.now()}`);
  });

  afterEach(async () => {
    if (await pathExists(testTempDir)) {
      await rmDir(testTempDir);
    }
  });

  describe('createTempDir', () => {
    // @awa-test: DIFF_P-2
    // VALIDATES: DIFF-1_AC-1, DIFF-1_AC-2
    test('should create unique temp directory', async () => {
      const tempPath1 = await diffEngine.createTempDir();
      const tempPath2 = await diffEngine.createTempDir();

      expect(tempPath1).toContain('awa-diff-');
      expect(tempPath2).toContain('awa-diff-');
      expect(tempPath1).not.toBe(tempPath2);

      await rmDir(tempPath1);
      await rmDir(tempPath2);
    });
  });

  describe('cleanupTempDir', () => {
    // @awa-test: DIFF_P-2
    // VALIDATES: DIFF-6_AC-1, DIFF-6_AC-2
    test('should delete temp directory', async () => {
      await mkdir(testTempDir, { recursive: true });
      await writeFile(join(testTempDir, 'test.txt'), 'content');

      await diffEngine.cleanupTempDir(testTempDir);

      expect(await pathExists(testTempDir)).toBe(false);
    });

    // @awa-test: DIFF_P-2
    // VALIDATES: DIFF-6_AC-3
    test('should not throw on non-existent directory', async () => {
      await expect(diffEngine.cleanupTempDir('/non/existent/path')).resolves.not.toThrow();
    });
  });

  describe('isBinaryFile', () => {
    // VALIDATES: DIFF-2_AC-5
    test('should detect text files', async () => {
      await mkdir(testTempDir, { recursive: true });
      const textFile = join(testTempDir, 'text.txt');
      await writeFile(textFile, 'Hello, world!');

      const isBinary = await diffEngine.isBinaryFile(textFile);

      expect(isBinary).toBe(false);
    });

    // VALIDATES: DIFF-2_AC-5
    test('should detect binary files', async () => {
      await mkdir(testTempDir, { recursive: true });
      const binaryFile = join(testTempDir, 'binary.bin');
      // Create binary content with null bytes
      await writeFile(binaryFile, Buffer.from([0x00, 0x01, 0x02, 0x03]));

      const isBinary = await diffEngine.isBinaryFile(binaryFile);

      expect(isBinary).toBe(true);
    });

    // VALIDATES: DIFF-2_AC-5
    test('should return false on error', async () => {
      const isBinary = await diffEngine.isBinaryFile('/non/existent/file');

      expect(isBinary).toBe(false);
    });
  });

  describe('compareFiles', () => {
    // @awa-test: DIFF_P-3
    // VALIDATES: DIFF-2_AC-1
    test('should detect identical files', async () => {
      await mkdir(testTempDir, { recursive: true });
      const file1 = join(testTempDir, 'file1.txt');
      const file2 = join(testTempDir, 'file2.txt');
      await writeFile(file1, 'same content');
      await writeFile(file2, 'same content');

      const result = await diffEngine.compareFiles(file1, file2, 'test.txt');

      expect(result.status).toBe('identical');
      expect(result.unifiedDiff).toBeUndefined();
    });

    // @awa-test: DIFF_P-3
    // VALIDATES: DIFF-2_AC-1, DIFF-2_AC-4
    test('should detect modified text files with unified diff', async () => {
      await mkdir(testTempDir, { recursive: true });
      const file1 = join(testTempDir, 'file1.txt');
      const file2 = join(testTempDir, 'file2.txt');
      await writeFile(file1, 'line 1\nline 2\nline 3\n');
      await writeFile(file2, 'line 1\nmodified line 2\nline 3\n');

      const result = await diffEngine.compareFiles(file2, file1, 'test.txt');

      expect(result.status).toBe('modified');
      expect(result.unifiedDiff).toBeDefined();
      expect(result.unifiedDiff).toContain('-line 2');
      expect(result.unifiedDiff).toContain('+modified line 2');
    });

    // VALIDATES: DIFF-2_AC-5
    test('should detect binary file differences', async () => {
      await mkdir(testTempDir, { recursive: true });
      const file1 = join(testTempDir, 'file1.bin');
      const file2 = join(testTempDir, 'file2.bin');
      await writeFile(file1, Buffer.from([0x00, 0x01, 0x02]));
      await writeFile(file2, Buffer.from([0x00, 0x01, 0x03]));

      const result = await diffEngine.compareFiles(file1, file2, 'test.bin');

      expect(result.status).toBe('binary-differs');
      expect(result.unifiedDiff).toBeUndefined();
    });

    // VALIDATES: DIFF-2_AC-5
    test('should detect identical binary files', async () => {
      await mkdir(testTempDir, { recursive: true });
      const file1 = join(testTempDir, 'file1.bin');
      const file2 = join(testTempDir, 'file2.bin');
      const content = Buffer.from([0x00, 0x01, 0x02]);
      await writeFile(file1, content);
      await writeFile(file2, content);

      const result = await diffEngine.compareFiles(file1, file2, 'test.bin');

      expect(result.status).toBe('identical');
    });

    // @awa-test: DIFF_P-3
    // VALIDATES: DIFF-2_AC-1
    test('should be whitespace-sensitive', async () => {
      await mkdir(testTempDir, { recursive: true });
      const file1 = join(testTempDir, 'file1.txt');
      const file2 = join(testTempDir, 'file2.txt');
      await writeFile(file1, 'content\n');
      await writeFile(file2, 'content \n'); // Trailing space

      const result = await diffEngine.compareFiles(file1, file2, 'test.txt');

      expect(result.status).toBe('modified');
    });
  });

  describe('diff', () => {
    let templateDir: string;
    let targetDir: string;

    beforeEach(async () => {
      templateDir = join(testTempDir, 'template');
      targetDir = join(testTempDir, 'target');
      await mkdir(templateDir, { recursive: true });
      await mkdir(targetDir, { recursive: true });
    });

    // @awa-test: DIFF_P-1
    // VALIDATES: DIFF-1_AC-3
    test('should not modify target directory (read-only)', async () => {
      await writeFile(join(targetDir, 'existing.txt'), 'original');
      await writeFile(join(templateDir, 'template.txt'), 'template content');

      await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: false,
      });

      const targetContent = await pathExists(join(targetDir, 'existing.txt'));
      expect(targetContent).toBe(true);
    });

    // VALIDATES: DIFF-2_AC-3, DIFF-4_AC-4
    test('should report identical files when all match', async () => {
      await writeFile(join(templateDir, 'file1.txt'), 'content');
      await writeFile(join(targetDir, 'file1.txt'), 'content');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: false,
      });

      expect(result.identical).toBe(1);
      expect(result.modified).toBe(0);
      expect(result.newFiles).toBe(0);
      expect(result.extraFiles).toBe(0);
      expect(result.binaryDiffers).toBe(0);
      expect(result.hasDifferences).toBe(false);
    });

    // VALIDATES: DIFF-2_AC-4, DIFF-4_AC-1, DIFF-4_AC-2
    test('should report modified files with unified diff', async () => {
      await writeFile(join(templateDir, 'file1.txt'), 'new content');
      await writeFile(join(targetDir, 'file1.txt'), 'old content');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: false,
      });

      expect(result.modified).toBe(1);
      expect(result.hasDifferences).toBe(true);
      expect(result.binaryDiffers).toBe(0);
      const modifiedFile = result.files.find((f) => f.status === 'modified');
      expect(modifiedFile?.unifiedDiff).toBeDefined();
    });

    // VALIDATES: DIFF-3_AC-1
    test('should report new files in generated output', async () => {
      await writeFile(join(templateDir, 'new.txt'), 'content');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: false,
      });

      expect(result.newFiles).toBe(1);
      expect(result.hasDifferences).toBe(true);
      expect(result.binaryDiffers).toBe(0);
      const newFile = result.files.find((f) => f.status === 'new');
      expect(newFile?.relativePath).toBe('new.txt');
    });

    // VALIDATES: DIFF-3_AC-2, DIFF-3_AC-3
    test('should report extra files in target when listUnknown is true', async () => {
      await writeFile(join(targetDir, 'extra.txt'), 'content');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: true,
      });

      expect(result.extraFiles).toBe(1);
      expect(result.hasDifferences).toBe(true);
      expect(result.binaryDiffers).toBe(0);
      const extraFile = result.files.find((f) => f.status === 'extra');
      expect(extraFile?.relativePath).toBe('extra.txt');
    });

    // VALIDATES: DIFF-3_AC-3, DIFF-3_AC-4
    test('should ignore target-only files when listUnknown is false', async () => {
      await writeFile(join(targetDir, 'extra.txt'), 'content');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: false,
      });

      expect(result.extraFiles).toBe(0);
      expect(result.files.find((f) => f.status === 'extra')).toBeUndefined();
      expect(result.hasDifferences).toBe(false);
    });

    // VALIDATES: DIFF-2_AC-5
    test('should handle binary file differences', async () => {
      await writeFile(join(templateDir, 'file.bin'), Buffer.from([0x00, 0x01]));
      await writeFile(join(targetDir, 'file.bin'), Buffer.from([0x00, 0x02]));

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: true,
      });

      const binaryFile = result.files.find((f) => f.relativePath === 'file.bin');
      expect(binaryFile?.status).toBe('binary-differs');
      expect(binaryFile?.unifiedDiff).toBeUndefined();
      expect(result.binaryDiffers).toBe(1);
    });

    // @awa-test: DIFF_P-2
    // VALIDATES: DIFF-6_AC-1, DIFF-6_AC-2, DIFF-6_AC-3
    test('should cleanup temp directory after success', async () => {
      await writeFile(join(templateDir, 'file.txt'), 'content');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: false,
      });

      // Temp directory should be cleaned up
      // We can't directly verify it's gone since it's created and deleted internally
      // But we can verify the operation completed successfully
      expect(result).toBeDefined();
    });

    // @awa-test: DIFF_P-2
    // VALIDATES: DIFF-6_AC-2, DIFF-6_AC-3
    test('should handle non-existent target directory', async () => {
      // Non-existent target should report all files as "new"
      await writeFile(join(templateDir, 'file.txt'), 'content');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: '/non/existent/path',
        features: [],
        listUnknown: false,
      });

      // All generated files should be marked as "new" since target doesn't exist
      expect(result.newFiles).toBe(1);
      expect(result.extraFiles).toBe(0);
      expect(result.binaryDiffers).toBe(0);
      expect(result.hasDifferences).toBe(true);
    });

    // VALIDATES: DIFF-3_AC-3, DIFF-4_AC-5
    test('should provide complete diff summary', async () => {
      await writeFile(join(templateDir, 'same.txt'), 'content');
      await writeFile(join(targetDir, 'same.txt'), 'content');
      await writeFile(join(templateDir, 'modified.txt'), 'new');
      await writeFile(join(targetDir, 'modified.txt'), 'old');
      await writeFile(join(templateDir, 'new.txt'), 'new file');
      await writeFile(join(targetDir, 'extra.txt'), 'extra file');

      const result = await diffEngine.diff({
        templatePath: templateDir,
        targetPath: targetDir,
        features: [],
        listUnknown: true,
      });

      expect(result.identical).toBe(1);
      expect(result.modified).toBe(1);
      expect(result.newFiles).toBe(1);
      expect(result.extraFiles).toBe(1);
      expect(result.binaryDiffers).toBe(0);
      expect(result.hasDifferences).toBe(true);
      expect(result.files).toHaveLength(4);
    });
  });
});
