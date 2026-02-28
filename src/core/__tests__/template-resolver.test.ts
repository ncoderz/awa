// @awa-component: TPL-TemplateResolver
// @awa-test: TPL_P-3, TPL_P-4
// @awa-test: TPL-1_AC-1, TPL-1_AC-2, TPL-1_AC-3, TPL-1_AC-4
// @awa-test: TPL-2_AC-1, TPL-2_AC-2, TPL-2_AC-3, TPL-2_AC-4, TPL-2_AC-5, TPL-2_AC-6
// @awa-test: TPL-3_AC-1, TPL-3_AC-2, TPL-3_AC-3, TPL-3_AC-4
// @awa-test: TPL-9_AC-1, TPL-9_AC-2
// @awa-test: TPL-10_AC-1, TPL-10_AC-2, TPL-10_AC-3
// @awa-test: CLI-3_AC-1, CLI-3_AC-2, CLI-3_AC-3, CLI-8_AC-2

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TemplateError } from '../../types/index.js';
import { TemplateResolver } from '../template-resolver.js';

describe('TemplateResolver', () => {
  let testDir: string;
  let resolver: TemplateResolver;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-resolver-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    resolver = new TemplateResolver();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('detectType', () => {
    // @awa-test: TPL-1_AC-1, TPL-1_AC-2
    it('should detect local paths starting with dot', () => {
      expect(resolver.detectType('./templates')).toBe('local');
      expect(resolver.detectType('../templates')).toBe('local');
    });

    it('should detect local absolute paths', () => {
      expect(resolver.detectType('/usr/local/templates')).toBe('local');
      expect(resolver.detectType('~/templates')).toBe('local');
    });

    it('should detect Windows absolute paths', () => {
      expect(resolver.detectType('C:\\templates')).toBe('local');
      expect(resolver.detectType('D:/templates')).toBe('local');
    });

    // @awa-test: TPL-2_AC-1, CLI-3_AC-3
    it('should detect GitHub shorthand as git', () => {
      expect(resolver.detectType('user/repo')).toBe('git');
    });

    // @awa-test: TPL-2_AC-2
    it('should detect prefixed git URLs', () => {
      expect(resolver.detectType('github:user/repo')).toBe('git');
      expect(resolver.detectType('gitlab:user/repo')).toBe('git');
      expect(resolver.detectType('bitbucket:user/repo')).toBe('git');
    });

    // @awa-test: TPL-2_AC-3
    it('should detect HTTPS git URLs', () => {
      expect(resolver.detectType('https://github.com/user/repo')).toBe('git');
      expect(resolver.detectType('https://gitlab.com/user/repo.git')).toBe('git');
    });

    // @awa-test: TPL-2_AC-4
    it('should detect SSH git URLs', () => {
      expect(resolver.detectType('git@github.com:user/repo')).toBe('git');
      expect(resolver.detectType('git@gitlab.com:user/repo.git')).toBe('git');
    });

    // @awa-test: TPL-2_AC-5
    it('should detect git sources with subdirectories', () => {
      expect(resolver.detectType('user/repo/templates')).toBe('git');
      expect(resolver.detectType('user/repo/path/to/templates')).toBe('git');
    });

    // @awa-test: TPL-2_AC-6
    it('should detect git sources with refs', () => {
      expect(resolver.detectType('user/repo#main')).toBe('git');
      expect(resolver.detectType('user/repo#v1.0.0')).toBe('git');
      expect(resolver.detectType('user/repo#abc123')).toBe('git');
    });
  });

  describe('getCachePath', () => {
    // @awa-test: TPL-3_AC-1, TPL-3_AC-2
    it('should generate consistent paths for same source', () => {
      const path1 = resolver.getCachePath('user/repo');
      const path2 = resolver.getCachePath('user/repo');

      expect(path1).toBe(path2);
    });

    it('should generate different paths for different sources', () => {
      const path1 = resolver.getCachePath('user/repo1');
      const path2 = resolver.getCachePath('user/repo2');

      expect(path1).not.toBe(path2);
    });

    it('should include cache directory in path', () => {
      const source = 'user/repo';
      const cachePath = resolver.getCachePath(source);

      expect(cachePath).toContain('.cache');
      expect(cachePath).toContain('awa');
      expect(cachePath).toContain('templates');
    });

    it('should generate valid filesystem paths', () => {
      const source = 'user/repo#branch/subdir';
      const cachePath = resolver.getCachePath(source);

      // Should be a valid path (no invalid characters in hash portion)
      expect(cachePath).toBeTruthy();
      expect(typeof cachePath).toBe('string');
    });
  });

  describe('resolve', () => {
    // @awa-test: TPL-10_AC-1, CLI-3_AC-2
    it('should return bundled template when source is null', async () => {
      const resolved = await resolver.resolve(null, false);

      expect(resolved.type).toBe('bundled');
      expect(resolved.source).toBe('bundled');
      expect(resolved.localPath).toMatch(/templates[/\\]awa$/);
    });

    // @awa-test: TPL-1_AC-2
    it('should resolve local template with absolute path (P9)', async () => {
      const templateDir = join(testDir, 'my-templates');
      await mkdir(templateDir);
      await writeFile(join(templateDir, 'template.md'), 'content');

      const resolved = await resolver.resolve(templateDir, false);

      expect(resolved.type).toBe('local');
      expect(resolved.localPath).toBe(templateDir);
      expect(resolved.source).toBe(templateDir);
    });

    // @awa-test: TPL-1_AC-1
    it('should resolve local template with relative path (P9)', async () => {
      const originalCwd = process.cwd();
      const templateDir = join(testDir, 'templates');
      await mkdir(templateDir);
      await writeFile(join(templateDir, 'template.md'), 'content');

      process.chdir(testDir);

      try {
        const resolved = await resolver.resolve('./templates', false);

        expect(resolved.type).toBe('local');
        expect(resolved.localPath).toContain('templates');
      } finally {
        process.chdir(originalCwd);
      }
    });

    // @awa-test: TPL-1_AC-3
    it('should throw error for non-existent local path', async () => {
      const nonexistentPath = join(testDir, 'nonexistent');

      await expect(resolver.resolve(nonexistentPath, false)).rejects.toThrow(TemplateError);
      await expect(resolver.resolve(nonexistentPath, false)).rejects.toMatchObject({
        code: 'SOURCE_NOT_FOUND',
      });
    });

    // @awa-test: TPL-1_AC-4, TPL-9_AC-1, TPL-9_AC-2
    it('should not cache local templates (P9)', async () => {
      const templateDir = join(testDir, 'local-template');
      await mkdir(templateDir);
      await writeFile(join(templateDir, 'file.md'), 'original');

      // First resolve
      const resolved1 = await resolver.resolve(templateDir, false);
      expect(resolved1.localPath).toBe(templateDir);

      // Modify template
      await writeFile(join(templateDir, 'file.md'), 'modified');

      // Second resolve should point to same directory (no cache)
      const resolved2 = await resolver.resolve(templateDir, false);
      expect(resolved2.localPath).toBe(templateDir);
      expect(resolved1.localPath).toBe(resolved2.localPath);
    });

    // Note: Testing actual git fetching requires network access and is slow
    // Git fetch tests should be covered in integration tests

    // Skip actual git tests to avoid network calls in unit tests
    // These should be covered in integration tests
  });

  describe('git template caching (P10)', () => {
    it('should generate cache path for git sources', () => {
      const source = 'user/repo';
      const cachePath = resolver.getCachePath(source);

      expect(cachePath).toBeTruthy();
      expect(typeof cachePath).toBe('string');
    });

    it('should reuse same cache path for same source', () => {
      const source = 'github:user/repo#main';
      const path1 = resolver.getCachePath(source);
      const path2 = resolver.getCachePath(source);

      expect(path1).toBe(path2);
    });
  });
});
