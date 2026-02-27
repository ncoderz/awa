// @awa-component: TPL-TemplateEngine
// @awa-test: TPL_P-1, TPL_P-2

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TemplateError } from '../../types/index.js';
import { TemplateEngine } from '../template.js';

describe('TemplateEngine', () => {
  let testDir: string;
  let engine: TemplateEngine;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-template-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    engine = new TemplateEngine();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('configure', () => {
    it('should configure template engine with directory', () => {
      expect(() => engine.configure(testDir)).not.toThrow();
    });

    it('should clear cache on reconfigure', async () => {
      // First configuration
      engine.configure(testDir);
      const template = join(testDir, 'test.md');
      await writeFile(template, 'Content: <%= it.features[0] %>');

      await engine.render(template, { features: ['feature1'] });

      // Reconfigure should clear cache
      engine.configure(testDir);

      // Should still work after reconfigure
      const result = await engine.render(template, { features: ['feature2'] });
      expect(result.content).toContain('feature2');
    });
  });

  describe('render', () => {
    beforeEach(() => {
      engine.configure(testDir);
    });

    it('should throw error if not configured', async () => {
      const unconfiguredEngine = new TemplateEngine();
      const templatePath = join(testDir, 'test.md');

      await expect(unconfiguredEngine.render(templatePath, { features: [] })).rejects.toThrow(
        TemplateError
      );
    });

    it('should render simple template', async () => {
      const templatePath = join(testDir, 'simple.md');
      await writeFile(templatePath, 'Hello, World!');

      const result = await engine.render(templatePath, { features: [] });

      expect(result.content).toBe('Hello, World!');
      expect(result.isEmpty).toBe(false);
      expect(result.isEmptyFileMarker).toBe(false);
    });

    it('should render template with feature flags', async () => {
      const templatePath = join(testDir, 'features.md');
      const templateContent = `
<% if (it.features.includes('feature1')) { %>
Feature 1 is enabled
<% } %>
<% if (it.features.includes('feature2')) { %>
Feature 2 is enabled
<% } %>
`.trim();
      await writeFile(templatePath, templateContent);

      const result = await engine.render(templatePath, { features: ['feature1'] });

      expect(result.content).toContain('Feature 1 is enabled');
      expect(result.content).not.toContain('Feature 2 is enabled');
    });

    it('should detect empty content (whitespace only) as empty (P3)', async () => {
      const templatePath = join(testDir, 'whitespace.md');
      await writeFile(templatePath, '   \n\t   \n   ');

      const result = await engine.render(templatePath, { features: [] });

      expect(result.isEmpty).toBe(true);
    });

    it('should detect empty file marker (P4)', async () => {
      const templatePath = join(testDir, 'marker.md');
      await writeFile(templatePath, '<!-- AWA:EMPTY_FILE -->');

      const result = await engine.render(templatePath, { features: [] });

      expect(result.isEmptyFileMarker).toBe(true);
      expect(result.content.trim()).toBe('<!-- AWA:EMPTY_FILE -->');
    });

    it('should detect empty file marker with surrounding whitespace (P4)', async () => {
      const templatePath = join(testDir, 'marker-whitespace.md');
      await writeFile(templatePath, '\n\n  <!-- AWA:EMPTY_FILE -->  \n');

      const result = await engine.render(templatePath, { features: [] });

      expect(result.isEmptyFileMarker).toBe(true);
    });

    it('should not detect empty file marker if mixed with other content', async () => {
      const templatePath = join(testDir, 'mixed.md');
      await writeFile(templatePath, 'Some content\n<!-- AWA:EMPTY_FILE -->');

      const result = await engine.render(templatePath, { features: [] });

      expect(result.isEmptyFileMarker).toBe(false);
      expect(result.isEmpty).toBe(false);
    });

    it('should handle conditional empty file marker', async () => {
      const templatePath = join(testDir, 'conditional-empty.md');
      const templateContent = `
<% if (it.features.length === 0) { %>
<!-- AWA:EMPTY_FILE -->
<% } else { %>
Features: <%= it.features.join(', ') %>
<% } %>
`.trim();
      await writeFile(templatePath, templateContent);

      // No features - should be empty marker
      const result1 = await engine.render(templatePath, { features: [] });
      expect(result1.isEmptyFileMarker).toBe(true);

      // With features - should have content
      const result2 = await engine.render(templatePath, { features: ['test'] });
      expect(result2.isEmpty).toBe(false);
      expect(result2.content).toContain('test');
    });

    it('should support partials via include', async () => {
      // Create partial directory
      const partialsDir = join(testDir, '_partials');
      await mkdir(partialsDir);

      // Create partial - no extension needed since templates use exact filenames
      const partialPath = join(partialsDir, 'header');
      await writeFile(partialPath, '# <%= it.title %>\n');

      // Create main template
      const templatePath = join(testDir, 'main.md');
      await writeFile(
        templatePath,
        '<%~ include("_partials/header", { title: "My Document" }) %>\nContent here'
      );

      const result = await engine.render(templatePath, { features: [] });

      expect(result.content).toContain('# My Document');
      expect(result.content).toContain('Content here');
    });

    it('should handle arrays in feature context', async () => {
      const templatePath = join(testDir, 'array.md');
      const templateContent = `
Features:
<% it.features.forEach(function(feature) { %>
- <%= feature %>
<% }) %>
`.trim();
      await writeFile(templatePath, templateContent);

      const result = await engine.render(templatePath, {
        features: ['planning', 'testing', 'documentation'],
      });

      expect(result.content).toContain('- planning');
      expect(result.content).toContain('- testing');
      expect(result.content).toContain('- documentation');
    });

    it('should throw error for non-existent template', async () => {
      const nonexistentPath = join(testDir, 'nonexistent.md');

      await expect(engine.render(nonexistentPath, { features: [] })).rejects.toThrow(TemplateError);
    });

    it('should throw error for template with syntax error', async () => {
      const templatePath = join(testDir, 'syntax-error.md');
      await writeFile(templatePath, '<% if (unclosed condition %>');

      await expect(engine.render(templatePath, { features: [] })).rejects.toThrow(TemplateError);
    });

    it('should preserve newlines and formatting', async () => {
      const templatePath = join(testDir, 'formatting.md');
      const templateContent = 'Line 1\n\nLine 3\n\n\nLine 6';
      await writeFile(templatePath, templateContent);

      const result = await engine.render(templatePath, { features: [] });

      expect(result.content).toBe(templateContent);
    });

    it('should render version when provided in context', async () => {
      const templatePath = join(testDir, 'version.md');
      await writeFile(templatePath, 'App version: <%= it.version %>');

      const result = await engine.render(templatePath, { features: [], version: '2.3.4' });

      expect(result.content).toBe('App version: 2.3.4');
    });

    it('should default version to empty string when not provided', async () => {
      const templatePath = join(testDir, 'version-default.md');
      await writeFile(templatePath, 'Version: [<%= it.version %>]');

      const result = await engine.render(templatePath, { features: [] });

      expect(result.content).toBe('Version: []');
    });

    it('should not escape HTML by default', async () => {
      const templatePath = join(testDir, 'html.md');
      await writeFile(templatePath, '<div>HTML content</div>');

      const result = await engine.render(templatePath, { features: [] });

      expect(result.content).toBe('<div>HTML content</div>');
    });
  });
});
