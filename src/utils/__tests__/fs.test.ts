// @awa-component: Utils-FileSystem
// @awa-test: P5, P7

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ensureDir,
  getCacheDir,
  getTemplateDir,
  isDirectory,
  pathExists,
  readTextFile,
  walkDirectory,
  writeTextFile,
} from '../fs.js';

describe('FileSystemUtilities', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('ensureDir', () => {
    it('should create a directory if it does not exist', async () => {
      const dirPath = join(testDir, 'new-dir');
      await ensureDir(dirPath);
      expect(await pathExists(dirPath)).toBe(true);
    });

    it('should create nested directories recursively', async () => {
      const nestedPath = join(testDir, 'a', 'b', 'c');
      await ensureDir(nestedPath);
      expect(await pathExists(nestedPath)).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const dirPath = join(testDir, 'existing');
      await mkdir(dirPath);
      await expect(ensureDir(dirPath)).resolves.not.toThrow();
    });
  });

  describe('pathExists', () => {
    it('should return true for existing paths', async () => {
      expect(await pathExists(testDir)).toBe(true);
    });

    it('should return false for non-existing paths', async () => {
      expect(await pathExists(join(testDir, 'nonexistent'))).toBe(false);
    });
  });

  describe('isDirectory', () => {
    it('should return true for directories', async () => {
      expect(await isDirectory(testDir)).toBe(true);
    });

    it('should return false for files', async () => {
      const filePath = join(testDir, 'file.txt');
      await writeFile(filePath, 'content');
      expect(await isDirectory(filePath)).toBe(false);
    });

    it('should return false for non-existing paths', async () => {
      expect(await isDirectory(join(testDir, 'nonexistent'))).toBe(false);
    });
  });

  describe('readTextFile', () => {
    it('should read file contents as UTF-8 text', async () => {
      const filePath = join(testDir, 'test.txt');
      const content = 'Hello, awa!';
      await writeFile(filePath, content, 'utf-8');
      expect(await readTextFile(filePath)).toBe(content);
    });

    it('should handle multi-line content', async () => {
      const filePath = join(testDir, 'multiline.txt');
      const content = 'Line 1\nLine 2\nLine 3';
      await writeFile(filePath, content, 'utf-8');
      expect(await readTextFile(filePath)).toBe(content);
    });
  });

  describe('writeTextFile', () => {
    it('should write UTF-8 text to file', async () => {
      const filePath = join(testDir, 'output.txt');
      const content = 'Test content';
      await writeTextFile(filePath, content);
      expect(await readTextFile(filePath)).toBe(content);
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = join(testDir, 'nested', 'deep', 'file.txt');
      await writeTextFile(filePath, 'content');
      expect(await pathExists(filePath)).toBe(true);
    });

    it('should overwrite existing files', async () => {
      const filePath = join(testDir, 'overwrite.txt');
      await writeTextFile(filePath, 'old content');
      await writeTextFile(filePath, 'new content');
      expect(await readTextFile(filePath)).toBe('new content');
    });
  });

  describe('walkDirectory', () => {
    beforeEach(async () => {
      // Create test structure:
      // test-dir/
      //   file1.txt
      //   _hidden.txt (should be excluded)
      //   subdir/
      //     file2.txt
      //   _private/ (should be excluded)
      //     secret.txt
      await writeFile(join(testDir, 'file1.txt'), 'content1');
      await writeFile(join(testDir, '_hidden.txt'), 'hidden');
      await mkdir(join(testDir, 'subdir'));
      await writeFile(join(testDir, 'subdir', 'file2.txt'), 'content2');
      await mkdir(join(testDir, '_private'));
      await writeFile(join(testDir, '_private', 'secret.txt'), 'secret');
    });

    it('should yield all non-underscore files recursively', async () => {
      const files: string[] = [];
      for await (const file of walkDirectory(testDir)) {
        files.push(file);
      }

      expect(files).toHaveLength(2);
      expect(files).toContain(join(testDir, 'file1.txt'));
      expect(files).toContain(join(testDir, 'subdir', 'file2.txt'));
    });

    it('should exclude files starting with underscore (P5)', async () => {
      const files: string[] = [];
      for await (const file of walkDirectory(testDir)) {
        files.push(file);
      }

      expect(files.every((f) => !f.includes('_hidden.txt'))).toBe(true);
    });

    it('should exclude directories starting with underscore (P5)', async () => {
      const files: string[] = [];
      for await (const file of walkDirectory(testDir)) {
        files.push(file);
      }

      expect(files.every((f) => !f.includes('_private'))).toBe(true);
      expect(files.every((f) => !f.includes('secret.txt'))).toBe(true);
    });

    it('should return empty for empty directories', async () => {
      const emptyDir = join(testDir, 'empty');
      await mkdir(emptyDir);

      const files: string[] = [];
      for await (const file of walkDirectory(emptyDir)) {
        files.push(file);
      }

      expect(files).toHaveLength(0);
    });
  });

  describe('getCacheDir', () => {
    it('should return path in user home directory', () => {
      const cacheDir = getCacheDir();
      expect(cacheDir).toContain('.cache');
      expect(cacheDir).toContain('awa');
      expect(cacheDir).toContain('templates');
    });
  });

  describe('getTemplateDir', () => {
    it('should return templates directory path', () => {
      const templateDir = getTemplateDir();
      expect(templateDir).toContain('templates');
    });

    it('should handle both src and dist contexts', () => {
      // Just verify it returns a string with templates
      const templateDir = getTemplateDir();
      expect(typeof templateDir).toBe('string');
      expect(templateDir.endsWith('templates')).toBe(true);
    });
  });
});
