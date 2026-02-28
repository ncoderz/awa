// @awa-component: GEN-FileGenerator
// @awa-test: GEN_P-1, GEN_P-2, GEN_P-3
// @awa-test: GEN-1_AC-1, GEN-1_AC-2, GEN-1_AC-3
// @awa-test: GEN-2_AC-1, GEN-2_AC-2
// @awa-test: GEN-3_AC-1, GEN-3_AC-2, GEN-3_AC-3
// @awa-test: GEN-6_AC-1, GEN-6_AC-2, GEN-6_AC-4
// @awa-test: GEN-7_AC-1, GEN-7_AC-2, GEN-7_AC-3, GEN-7_AC-4
// @awa-test: GEN-8_AC-1, GEN-8_AC-2, GEN-8_AC-3
// @awa-test: GEN-9_AC-1, GEN-9_AC-2, GEN-9_AC-3, GEN-9_AC-4, GEN-9_AC-5, GEN-9_AC-6, GEN-9_AC-7, GEN-9_AC-8
// @awa-test: GEN-10_AC-1, GEN-10_AC-2
// @awa-test: GEN-11_AC-3
// @awa-test: GEN-12_AC-2, GEN-12_AC-3, GEN-12_AC-4, GEN-12_AC-5, GEN-12_AC-6
// @awa-test: TPL-9_AC-1, TPL-9_AC-2

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { pathExists, readTextFile } from '../../utils/fs.js';
import { FileGenerator } from '../generator.js';

describe('FileGenerator', () => {
  let testDir: string;
  let templatesDir: string;
  let outputDir: string;
  let generator: FileGenerator;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-generator-test-${Date.now()}`);
    templatesDir = join(testDir, 'templates');
    outputDir = join(testDir, 'output');
    await mkdir(templatesDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    generator = new FileGenerator();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('generate', () => {
    // @awa-test: GEN-3_AC-1, GEN-3_AC-2, GEN-3_AC-3, GEN-2_AC-1
    it('should create files from templates', async () => {
      // Create template
      await writeFile(join(templatesDir, 'file1.md'), 'Content');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(1);
      expect(await pathExists(join(outputDir, 'file1.md'))).toBe(true);
      expect(await readTextFile(join(outputDir, 'file1.md'))).toBe('Content');
    });

    // @awa-test: GEN-1_AC-1, GEN-1_AC-2, GEN-1_AC-3, GEN-2_AC-2
    it('should preserve directory structure (P6)', async () => {
      // Create nested templates
      await mkdir(join(templatesDir, 'subdir'));
      await writeFile(join(templatesDir, 'root.md'), 'Root');
      await writeFile(join(templatesDir, 'subdir', 'nested.md'), 'Nested');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(2);
      expect(await pathExists(join(outputDir, 'root.md'))).toBe(true);
      expect(await pathExists(join(outputDir, 'subdir', 'nested.md'))).toBe(true);
    });

    // @awa-test: GEN-8_AC-1, TPL-9_AC-2
    it('should exclude files starting with underscore (P5)', async () => {
      await writeFile(join(templatesDir, 'normal.md'), 'Normal');
      await writeFile(join(templatesDir, '_hidden.md'), 'Hidden');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(1);
      expect(await pathExists(join(outputDir, 'normal.md'))).toBe(true);
      expect(await pathExists(join(outputDir, '_hidden.md'))).toBe(false);
    });

    // @awa-test: GEN-8_AC-2, GEN-8_AC-3, TPL-9_AC-1
    it('should exclude directories starting with underscore (P5)', async () => {
      await mkdir(join(templatesDir, '_private'));
      await writeFile(join(templatesDir, '_private', 'secret.md'), 'Secret');
      await writeFile(join(templatesDir, 'public.md'), 'Public');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(1);
      expect(await pathExists(join(outputDir, 'public.md'))).toBe(true);
      expect(await pathExists(join(outputDir, '_private', 'secret.md'))).toBe(false);
    });

    // @awa-test: GEN-7_AC-2, TPL-7_AC-1, TPL-7_AC-3
    it('should skip empty files (whitespace only) (P3)', async () => {
      await writeFile(join(templatesDir, 'empty.md'), '   \n\t   \n   ');
      await writeFile(join(templatesDir, 'content.md'), 'Content');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.skippedEmpty).toBe(1);
      expect(result.created).toBe(1);
      expect(await pathExists(join(outputDir, 'empty.md'))).toBe(false);
      expect(await pathExists(join(outputDir, 'content.md'))).toBe(true);
    });

    // @awa-test: TPL-7_AC-2
    it('should create empty files with marker (P4)', async () => {
      await writeFile(join(templatesDir, 'empty-marker.md'), '<!-- AWA:EMPTY_FILE -->');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(1);
      expect(await pathExists(join(outputDir, 'empty-marker.md'))).toBe(true);
      expect(await readTextFile(join(outputDir, 'empty-marker.md'))).toBe('');
    });

    // @awa-test: GEN-6_AC-1, GEN-6_AC-2, GEN-6_AC-4, GEN-7_AC-1, GEN-7_AC-4
    it('should not write files in dry-run mode (P7)', async () => {
      await writeFile(join(templatesDir, 'file.md'), 'Content');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: true,
        delete: false,
      });

      expect(result.created).toBe(1);
      expect(await pathExists(join(outputDir, 'file.md'))).toBe(false);
    });

    // @awa-test: GEN-4_AC-3
    it('should overwrite files in force mode (P8)', async () => {
      await writeFile(join(templatesDir, 'file.md'), 'New content');
      await writeFile(join(outputDir, 'file.md'), 'Old content');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: true,
        dryRun: false,
        delete: false,
      });

      expect(result.overwritten).toBe(1);
      expect(await readTextFile(join(outputDir, 'file.md'))).toBe('New content');
    });

    it('should render templates with feature flags', async () => {
      const templateContent = `
<% if (it.features.includes('feature1')) { %>
Feature 1
<% } %>
`.trim();
      await writeFile(join(templatesDir, 'conditional.md'), templateContent);

      const result1 = await generator.generate({
        templatePath: templatesDir,
        outputPath: join(outputDir, 'test1'),
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      const result2 = await generator.generate({
        templatePath: templatesDir,
        outputPath: join(outputDir, 'test2'),
        features: ['feature1'],
        force: false,
        dryRun: false,
        delete: false,
      });

      // Without feature - empty (skipped)
      expect(result1.skippedEmpty).toBe(1);

      // With feature - created
      expect(result2.created).toBe(1);
      const content = await readTextFile(join(outputDir, 'test2', 'conditional.md'));
      expect(content).toContain('Feature 1');
    });

    // @awa-test: GEN-9_AC-1, GEN-9_AC-2, GEN-9_AC-3, GEN-9_AC-4, GEN-9_AC-8
    it('should track all action types correctly', async () => {
      // Setup: mix of scenarios
      await writeFile(join(templatesDir, 'new.md'), 'New');
      await writeFile(join(templatesDir, 'existing.md'), 'Updated');
      await writeFile(join(templatesDir, 'empty.md'), '   ');
      await writeFile(join(outputDir, 'existing.md'), 'Old');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: true,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(1); // new.md
      expect(result.overwritten).toBe(1); // existing.md
      expect(result.skippedEmpty).toBe(1); // empty.md
      expect(result.skippedUser).toBe(0);
    });

    // @awa-test: GEN-1_AC-3
    it('should handle deep directory nesting (P6)', async () => {
      const deepPath = join(templatesDir, 'a', 'b', 'c', 'd');
      await mkdir(deepPath, { recursive: true });
      await writeFile(join(deepPath, 'deep.md'), 'Deep content');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(1);
      expect(await pathExists(join(outputDir, 'a', 'b', 'c', 'd', 'deep.md'))).toBe(true);
    });
    it('should inject package version into templates', async () => {
      await writeFile(join(templatesDir, 'version.txt'), 'v<%= it.version %>');

      const result = await generator.generate({
        templatePath: templatesDir,
        outputPath: outputDir,
        features: [],
        force: false,
        dryRun: false,
        delete: false,
      });

      expect(result.created).toBe(1);
      const content = await readTextFile(join(outputDir, 'version.txt'));
      // Should contain the PACKAGE_INFO version (semver format)
      expect(content).toMatch(/^v\d+\.\d+\.\d+/);
    });
  });
});
