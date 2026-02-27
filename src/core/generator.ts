// @awa-component: GEN-FileGenerator
// @awa-impl: GEN-1_AC-1
// @awa-impl: GEN-1_AC-2
// @awa-impl: GEN-1_AC-3
// @awa-impl: GEN-2_AC-1
// @awa-impl: GEN-2_AC-2
// @awa-impl: GEN-2_AC-3
// @awa-impl: GEN-3_AC-1
// @awa-impl: GEN-3_AC-2
// @awa-impl: GEN-3_AC-3
// @awa-impl: GEN-8_AC-1
// @awa-impl: GEN-8_AC-2
// @awa-impl: GEN-8_AC-3
// @awa-impl: GEN-11_AC-3
// @awa-impl: TPL-9_AC-1
// @awa-impl: TPL-9_AC-2

import { join, relative } from 'node:path';
import { PACKAGE_INFO } from '../_generated/package_info.js';
import {
  type ConflictItem,
  type FileAction,
  type GenerateOptions,
  GenerationError,
  type GenerationResult,
} from '../types/index.js';
import { deleteFile, pathExists, readTextFile, walkDirectory, writeTextFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { loadDeleteList, resolveDeleteList } from './delete-list.js';
import { conflictResolver, deleteResolver } from './resolver.js';
import { templateEngine } from './template.js';

export class FileGenerator {
  // @awa-impl: GEN-1_AC-1, GEN-1_AC-2, GEN-1_AC-3
  // @awa-impl: GEN-2_AC-1, GEN-2_AC-2, GEN-2_AC-3
  // @awa-impl: GEN-3_AC-1, GEN-3_AC-2, GEN-3_AC-3
  async generate(options: GenerateOptions): Promise<GenerationResult> {
    const { templatePath, outputPath, features, force, dryRun } = options;
    const enableDelete = options.delete;

    // Configure template engine
    templateEngine.configure(templatePath);

    const actions: FileAction[] = [];
    let created = 0;
    let overwritten = 0;
    let deleted = 0;
    let skippedEmpty = 0;
    let skippedUser = 0;
    let skippedEqual = 0;

    // Collect files to process
    interface FileToProcess {
      templateFile: string;
      outputFile: string;
      content: string;
      isNew: boolean;
    }

    const filesToProcess: FileToProcess[] = [];
    const conflicts: ConflictItem[] = [];

    try {
      // First pass: render all templates and categorize files
      for await (const templateFile of this.walkTemplates(templatePath)) {
        // Compute output path
        const outputFile = this.computeOutputPath(templateFile, templatePath, outputPath);

        // Render template
        const result = await templateEngine.render(templateFile, {
          features,
          version: PACKAGE_INFO.version,
        });

        // Handle empty output
        if (result.isEmpty && !result.isEmptyFileMarker) {
          // Skip empty files
          actions.push({
            type: 'skip-empty',
            sourcePath: templateFile,
            outputPath: outputFile,
          });
          skippedEmpty++;
          continue;
        }

        // Get final content (empty string if marker)
        const content = result.isEmptyFileMarker ? '' : result.content;

        // Check for conflicts
        const fileExists = await pathExists(outputFile);

        if (fileExists) {
          // Read existing content for comparison
          const existingContent = await readTextFile(outputFile);
          conflicts.push({
            outputPath: outputFile,
            sourcePath: templateFile,
            newContent: content,
            existingContent,
          });
        }

        filesToProcess.push({
          templateFile,
          outputFile,
          content,
          isNew: !fileExists,
        });
      }

      // Resolve all conflicts at once if there are any
      let resolution: { overwrite: string[]; skip: string[]; equal: string[] } = {
        overwrite: [],
        skip: [],
        equal: [],
      };
      if (conflicts.length > 0) {
        resolution = await conflictResolver.resolveBatch(conflicts, force, dryRun);
      }

      // Second pass: process files based on resolution
      for (const file of filesToProcess) {
        if (file.isNew) {
          // Create new file
          if (!dryRun) {
            await writeTextFile(file.outputFile, file.content);
          }
          actions.push({
            type: 'create',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
          created++;
          logger.fileAction({
            type: 'create',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
        } else if (resolution.overwrite.includes(file.outputFile)) {
          // Overwrite existing file
          if (!dryRun) {
            await writeTextFile(file.outputFile, file.content);
          }
          actions.push({
            type: 'overwrite',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
          overwritten++;
          logger.fileAction({
            type: 'overwrite',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
        } else if (resolution.equal.includes(file.outputFile)) {
          // Skip file — content is identical
          actions.push({
            type: 'skip-equal',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
          skippedEqual++;
          logger.fileAction({
            type: 'skip-equal',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
        } else if (resolution.skip.includes(file.outputFile)) {
          // Skip file — user declined overwrite
          actions.push({
            type: 'skip-user',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
          skippedUser++;
          logger.fileAction({
            type: 'skip-user',
            sourcePath: file.templateFile,
            outputPath: file.outputFile,
          });
        }
      }

      // Process delete list (after file generation)
      const deleteEntries = await loadDeleteList(templatePath);
      if (deleteEntries.length > 0) {
        const deleteList = resolveDeleteList(deleteEntries, features);

        // Collect generated output paths to detect conflicts
        const generatedOutputPaths = new Set(filesToProcess.map((f) => f.outputFile));

        // Filter: only files that exist and aren't being generated
        const deleteCandidates: string[] = [];
        for (const relPath of deleteList) {
          const absPath = join(outputPath, relPath);
          if (generatedOutputPaths.has(absPath)) {
            logger.warn(
              `Delete list entry '${relPath}' conflicts with generated file — skipping deletion`
            );
            continue;
          }
          if (await pathExists(absPath)) {
            deleteCandidates.push(absPath);
          }
        }

        if (deleteCandidates.length > 0) {
          if (!enableDelete) {
            // --delete not passed: warn but do nothing
            for (const absPath of deleteCandidates) {
              logger.warn(
                `Would delete (pass --delete to enable): ${relative(outputPath, absPath)}`
              );
            }
          } else {
            const confirmed = await deleteResolver.resolveDeletes(deleteCandidates, force, dryRun);

            for (const absPath of confirmed) {
              if (!dryRun) {
                await deleteFile(absPath);
              }
              actions.push({ type: 'delete', outputPath: absPath });
              deleted++;
              logger.fileAction({ type: 'delete', outputPath: absPath });
            }
          }
        }
      }

      return {
        actions,
        created,
        overwritten,
        deleted,
        skipped: skippedEmpty + skippedUser + skippedEqual,
        skippedEmpty,
        skippedUser,
        skippedEqual,
      };
    } catch (error) {
      // @awa-impl: GEN-2_AC-3, GEN-11_AC-3
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

  // @awa-impl: GEN-8_AC-1, GEN-8_AC-2, GEN-8_AC-3
  // @awa-impl: TPL-9_AC-1, TPL-9_AC-2
  async *walkTemplates(dir: string): AsyncIterable<string> {
    // Use utility function that already handles underscore exclusion
    yield* walkDirectory(dir);
  }

  // @awa-impl: GEN-1_AC-1, GEN-1_AC-2, GEN-1_AC-3
  computeOutputPath(templatePath: string, templateRoot: string, outputRoot: string): string {
    // Get relative path from template root
    const relativePath = relative(templateRoot, templatePath);

    // Join with output root to mirror structure
    return join(outputRoot, relativePath);
  }
}

export const fileGenerator = new FileGenerator();
