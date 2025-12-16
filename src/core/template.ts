// @zen-component: TPL-TemplateEngine
// @zen-impl: TPL-4_AC-1
// @zen-impl: TPL-4_AC-2
// @zen-impl: TPL-4_AC-3
// @zen-impl: TPL-4_AC-4
// @zen-impl: TPL-5_AC-1
// @zen-impl: TPL-5_AC-2
// @zen-impl: TPL-5_AC-3
// @zen-impl: TPL-6_AC-1
// @zen-impl: TPL-6_AC-2
// @zen-impl: TPL-7_AC-1
// @zen-impl: TPL-7_AC-2
// @zen-impl: TPL-8_AC-1
// @zen-impl: TPL-8_AC-2
// @zen-impl: TPL-8_AC-3
// @zen-impl: TPL-8_AC-4
// @zen-impl: TPL-11_AC-1
// @zen-impl: TPL-11_AC-2

import { Eta } from 'eta';
import { type RenderResult, type TemplateContext, TemplateError } from '../types/index.js';
import { readTextFile } from '../utils/fs.js';

const EMPTY_FILE_MARKER = '<!-- ZEN:EMPTY_FILE -->';

export class TemplateEngine {
  private eta: Eta | null = null;
  private templateDir: string | null = null;
  private compiledCache = new Map<string, unknown>();

  // @zen-impl: TPL-8_AC-1, TPL-8_AC-2, TPL-8_AC-3, TPL-8_AC-4
  configure(templateDir: string): void {
    this.templateDir = templateDir;
    this.compiledCache.clear();

    // @zen-impl: TPL-4_AC-1, TPL-4_AC-2, TPL-4_AC-3, TPL-4_AC-4
    // Configure Eta with partials support
    this.eta = new Eta({
      views: templateDir,
      cache: true, // Enable compilation caching
      autoEscape: false, // Don't escape HTML by default
      defaultExtension: '', // No automatic extension - use exact path as specified (AC-8.2)
    });
  }

  // @zen-impl: TPL-5_AC-1, TPL-5_AC-2, TPL-5_AC-3
  // @zen-impl: TPL-6_AC-1, TPL-6_AC-2
  // @zen-impl: TPL-7_AC-1, TPL-7_AC-2
  // @zen-impl: TPL-11_AC-1, TPL-11_AC-2
  async render(templatePath: string, context: TemplateContext): Promise<RenderResult> {
    if (!this.eta || !this.templateDir) {
      throw new TemplateError(
        'Template engine not configured. Call configure() first.',
        'RENDER_ERROR'
      );
    }

    try {
      // Read template content
      const templateContent = await readTextFile(templatePath);

      // Render with features context
      // The context is available as 'it' in templates
      const rendered = await this.eta.renderStringAsync(templateContent, {
        features: context.features,
      });

      // Check if output is empty or only whitespace
      const trimmed = rendered.trim();
      const isEmpty = trimmed.length === 0;

      // Check for empty file marker
      const isEmptyFileMarker = trimmed === EMPTY_FILE_MARKER;

      return {
        content: rendered,
        isEmpty,
        isEmptyFileMarker,
      };
    } catch (error) {
      throw new TemplateError(
        `Failed to render template ${templatePath}: ${error instanceof Error ? error.message : String(error)}`,
        'RENDER_ERROR',
        templatePath
      );
    }
  }
}

export const templateEngine = new TemplateEngine();
