// @zen-component: FileGenerator
// @zen-impl: GEN-1 AC-1.1
// @zen-impl: GEN-1 AC-1.2
// @zen-impl: GEN-1 AC-1.3
// @zen-impl: GEN-2 AC-2.1
// @zen-impl: GEN-2 AC-2.2
// @zen-impl: GEN-2 AC-2.3
// @zen-impl: GEN-3 AC-3.1
// @zen-impl: GEN-3 AC-3.2
// @zen-impl: GEN-3 AC-3.3
// @zen-impl: GEN-8 AC-8.1
// @zen-impl: GEN-8 AC-8.2
// @zen-impl: GEN-8 AC-8.3
// @zen-impl: GEN-11 AC-11.3
// @zen-impl: TPL-9 AC-9.1
// @zen-impl: TPL-9 AC-9.2

import { join, relative } from 'node:path';
import {
  type FileAction,
  type GenerateOptions,
  GenerationError,
  type GenerationResult,
} from '../types/index.js';
import { pathExists, walkDirectory, writeTextFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { conflictResolver } from './resolver.js';
import { templateEngine } from './template.js';

export class FileGenerator {
  // @zen-impl: GEN-1 AC-1.1, GEN-1 AC-1.2, GEN-1 AC-1.3
  // @zen-impl: GEN-2 AC-2.1, GEN-2 AC-2.2, GEN-2 AC-2.3
  // @zen-impl: GEN-3 AC-3.1, GEN-3 AC-3.2, GEN-3 AC-3.3
  async generate(options: GenerateOptions): Promise<GenerationResult> {
    const { templatePath, outputPath, features, force, dryRun } = options;

    // Configure template engine
    templateEngine.configure(templatePath);

    const actions: FileAction[] = [];
    let created = 0;
    let overwritten = 0;
    let skippedEmpty = 0;
    let skippedUser = 0;

    try {
      // Walk template directory
      for await (const templateFile of this.walkTemplates(templatePath)) {
        // Compute output path
        const outputFile = this.computeOutputPath(templateFile, templatePath, outputPath);

        // Render template
        const result = await templateEngine.render(templateFile, { features });

        // Handle empty output
        if (result.isEmpty && !result.isEmptyFileMarker) {
          // Skip empty files
          actions.push({
            type: 'skip-empty',
            sourcePath: templateFile,
            outputPath: outputFile,
          });
          skippedEmpty++;
          logger.fileAction({
            type: 'skip-empty',
            sourcePath: templateFile,
            outputPath: outputFile,
          });
          continue;
        }

        // Get final content (empty string if marker)
        const content = result.isEmptyFileMarker ? '' : result.content;

        // Check for conflicts
        const fileExists = await pathExists(outputFile);

        if (fileExists) {
          // Resolve conflict
          const choice = await conflictResolver.resolve(outputFile, force, dryRun);

          if (choice === 'skip') {
            actions.push({
              type: 'skip-user',
              sourcePath: templateFile,
              outputPath: outputFile,
            });
            skippedUser++;
            logger.fileAction({
              type: 'skip-user',
              sourcePath: templateFile,
              outputPath: outputFile,
            });
            continue;
          }

          // Overwrite
          if (!dryRun) {
            await writeTextFile(outputFile, content);
          }
          actions.push({
            type: 'overwrite',
            sourcePath: templateFile,
            outputPath: outputFile,
          });
          overwritten++;
          logger.fileAction({
            type: 'overwrite',
            sourcePath: templateFile,
            outputPath: outputFile,
          });
        } else {
          // Create new file
          if (!dryRun) {
            await writeTextFile(outputFile, content);
          }
          actions.push({
            type: 'create',
            sourcePath: templateFile,
            outputPath: outputFile,
          });
          created++;
          logger.fileAction({
            type: 'create',
            sourcePath: templateFile,
            outputPath: outputFile,
          });
        }
      }

      return {
        actions,
        created,
        overwritten,
        skipped: skippedEmpty + skippedUser,
        skippedEmpty,
        skippedUser,
      };
    } catch (error) {
      // @zen-impl: GEN-2 AC-2.3, GEN-11 AC-11.3
      if (error instanceof Error && 'code' in error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'EACCES' || code === 'EPERM') {
          throw new GenerationError(`Permission denied: ${error.message}`, 'PERMISSION_DENIED');
        }
        if (code === 'ENOSPC') {
          throw new GenerationError(`Disk full: ${error.message}`, 'DISK_FULL');
        }
      }
      throw error;
    }
  }

  // @zen-impl: GEN-8 AC-8.1, GEN-8 AC-8.2, GEN-8 AC-8.3
  // @zen-impl: TPL-9 AC-9.1, TPL-9 AC-9.2
  async *walkTemplates(dir: string): AsyncIterable<string> {
    // Use utility function that already handles underscore exclusion
    yield* walkDirectory(dir);
  }

  // @zen-impl: GEN-1 AC-1.1, GEN-1 AC-1.2, GEN-1 AC-1.3
  computeOutputPath(templatePath: string, templateRoot: string, outputRoot: string): string {
    // Get relative path from template root
    const relativePath = relative(templateRoot, templatePath);

    // Join with output root to mirror structure
    return join(outputRoot, relativePath);
  }
}

export const fileGenerator = new FileGenerator();
