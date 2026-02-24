// @awa-component: DIFF-DiffEngine
// @awa-impl: DIFF-1_AC-1
// @awa-impl: DIFF-1_AC-2
// @awa-impl: DIFF-1_AC-3
// @awa-impl: DIFF-2_AC-1
// @awa-impl: DIFF-2_AC-2
// @awa-impl: DIFF-2_AC-3
// @awa-impl: DIFF-2_AC-4
// @awa-impl: DIFF-2_AC-5
// @awa-impl: DIFF-3_AC-1
// @awa-impl: DIFF-3_AC-2
// @awa-impl: DIFF-3_AC-3
// @awa-impl: DIFF-4_AC-1
// @awa-impl: DIFF-4_AC-2
// @awa-impl: DIFF-5_AC-1
// @awa-impl: DIFF-5_AC-2
// @awa-impl: DIFF-5_AC-3
// @awa-impl: DIFF-6_AC-1
// @awa-impl: DIFF-6_AC-2
// @awa-impl: DIFF-6_AC-3

import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { structuredPatch } from 'diff';
import { isBinaryFile as detectBinaryFile } from 'isbinaryfile';
import type { DiffOptions, DiffResult, FileDiff, GenerateOptions } from '../types/index.js';
import { ensureDir, pathExists, readBinaryFile, rmDir, walkDirectory } from '../utils/fs.js';
import { loadDeleteList, resolveDeleteList } from './delete-list.js';
import { fileGenerator } from './generator.js';

export class DiffEngine {
  // @awa-impl: DIFF-1_AC-1, DIFF-1_AC-2, DIFF-1_AC-3
  // @awa-impl: DIFF-2_AC-1, DIFF-2_AC-2, DIFF-2_AC-3, DIFF-2_AC-4, DIFF-2_AC-5
  // @awa-impl: DIFF-3_AC-1, DIFF-3_AC-2, DIFF-3_AC-3
  // @awa-impl: DIFF-4_AC-1, DIFF-4_AC-2
  // @awa-impl: DIFF-5_AC-1, DIFF-5_AC-2, DIFF-5_AC-3
  // @awa-impl: DIFF-6_AC-1, DIFF-6_AC-2, DIFF-6_AC-3
  async diff(options: DiffOptions): Promise<DiffResult> {
    const { templatePath, targetPath, features, listUnknown } = options;

    // @awa-impl: DIFF-1_AC-1, DIFF-1_AC-2
    const tempPath = await this.createTempDir();

    try {
      // Generate templates to temp directory
      const generateOptions: GenerateOptions = {
        templatePath,
        outputPath: tempPath,
        features,
        force: true,
        dryRun: false,
        delete: false,
      };

      await fileGenerator.generate(generateOptions);

      // Collect all files from both directories
      const generatedFiles = new Set<string>();
      const targetFiles = new Set<string>();

      // Walk generated directory (if exists - may be empty if template generates nothing)
      if (await pathExists(tempPath)) {
        for await (const file of walkDirectory(tempPath)) {
          const relPath = relative(tempPath, file);
          generatedFiles.add(relPath);
        }
      }

      // Walk target directory (if exists)
      if (await pathExists(targetPath)) {
        for await (const file of walkDirectory(targetPath)) {
          const relPath = relative(targetPath, file);
          targetFiles.add(relPath);
        }
      }

      // Compare files: iterate generated files first; optionally include target-only files when requested
      const files: FileDiff[] = [];

      for (const relPath of generatedFiles) {
        const generatedFilePath = join(tempPath, relPath);
        const targetFilePath = join(targetPath, relPath);

        if (targetFiles.has(relPath)) {
          // @awa-impl: DIFF-2_AC-1, DIFF-2_AC-2, DIFF-2_AC-3, DIFF-2_AC-4, DIFF-2_AC-5
          const fileDiff = await this.compareFiles(generatedFilePath, targetFilePath, relPath);
          files.push(fileDiff);
        } else {
          // @awa-impl: DIFF-3_AC-1
          files.push({
            relativePath: relPath,
            status: 'new',
          });
        }
      }

      if (listUnknown) {
        for (const relPath of targetFiles) {
          if (generatedFiles.has(relPath)) {
            continue;
          }

          // @awa-impl: DIFF-3_AC-2, DIFF-3_AC-3, DIFF-3_AC-4
          files.push({
            relativePath: relPath,
            status: 'extra',
          });
        }
      }

      // Check delete list for files that exist in target
      const deleteEntries = await loadDeleteList(templatePath);
      const deleteList = resolveDeleteList(deleteEntries, features ?? []);
      for (const relPath of deleteList) {
        if (targetFiles.has(relPath) && !generatedFiles.has(relPath)) {
          // Remove any existing 'extra' entry for this path (to avoid double-reporting)
          const existingIdx = files.findIndex(
            (f) => f.relativePath === relPath && f.status === 'extra'
          );
          if (existingIdx !== -1) {
            files.splice(existingIdx, 1);
          }
          files.push({
            relativePath: relPath,
            status: 'delete-listed',
          });
        }
      }

      // Calculate summary
      const identical = files.filter((f) => f.status === 'identical').length;
      const modified = files.filter((f) => f.status === 'modified').length;
      const newFiles = files.filter((f) => f.status === 'new').length;
      const extraFiles = files.filter((f) => f.status === 'extra').length;
      const binaryDiffers = files.filter((f) => f.status === 'binary-differs').length;
      const deleteListed = files.filter((f) => f.status === 'delete-listed').length;

      const hasDifferences =
        modified > 0 || newFiles > 0 || extraFiles > 0 || binaryDiffers > 0 || deleteListed > 0;

      return {
        files,
        identical,
        modified,
        newFiles,
        extraFiles,
        binaryDiffers,
        deleteListed,
        hasDifferences,
      };
    } finally {
      // @awa-impl: DIFF-6_AC-1, DIFF-6_AC-2, DIFF-6_AC-3
      await this.cleanupTempDir(tempPath);
    }
  }

  // @awa-impl: DIFF-1_AC-1, DIFF-1_AC-2
  async createTempDir(): Promise<string> {
    const systemTemp = tmpdir();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const tempPath = join(systemTemp, `awa-diff-${timestamp}-${random}`);

    await ensureDir(tempPath);
    return tempPath;
  }

  // @awa-impl: DIFF-6_AC-1, DIFF-6_AC-2, DIFF-6_AC-3
  async cleanupTempDir(tempPath: string): Promise<void> {
    try {
      if (await pathExists(tempPath)) {
        await rmDir(tempPath);
      }
    } catch (_error) {
      // Swallow cleanup errors - temp directory will be cleaned by OS eventually
      // This ensures cleanup errors don't mask the actual diff results
    }
  }

  // @awa-impl: DIFF-2_AC-1, DIFF-2_AC-2, DIFF-2_AC-3, DIFF-2_AC-4, DIFF-2_AC-5
  async compareFiles(
    generatedPath: string,
    targetPath: string,
    relativePath: string
  ): Promise<FileDiff> {
    // Read raw bytes for byte-for-byte comparison.
    const generatedBytes = await readBinaryFile(generatedPath);
    const targetBytes = await readBinaryFile(targetPath);

    // @awa-impl: DIFF-2_AC-1, DIFF-2_AC-3
    if (generatedBytes.equals(targetBytes)) {
      return {
        relativePath,
        status: 'identical',
      };
    }

    // @awa-impl: DIFF-2_AC-5
    // If either side is binary, do not attempt a text diff.
    const isBinaryGenerated = await this.isBinaryFile(generatedPath);
    const isBinaryTarget = await this.isBinaryFile(targetPath);

    if (isBinaryGenerated || isBinaryTarget) {
      return {
        relativePath,
        status: 'binary-differs',
      };
    }

    // Text files: unified diff (diff library is text-based)
    const generatedContent = generatedBytes.toString('utf-8');
    const targetContent = targetBytes.toString('utf-8');

    // @awa-impl: DIFF-2_AC-4
    // Generate unified diff
    const patch = structuredPatch(
      `a/${relativePath}`,
      `b/${relativePath}`,
      targetContent,
      generatedContent,
      'target',
      'generated',
      {
        context: 3,
      }
    );

    // Format as git-style unified diff string (with file headers)
    const headerLines = [
      `diff --git a/${relativePath} b/${relativePath}`,
      `--- a/${relativePath}`,
      `+++ b/${relativePath}`,
    ];

    const hunkLines = patch.hunks.flatMap((hunk) => {
      const lines = [`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`];
      lines.push(...hunk.lines);
      return lines;
    });

    const unifiedDiff = [...headerLines, ...hunkLines].join('\n');

    return {
      relativePath,
      status: 'modified',
      unifiedDiff,
    };
  }

  // @awa-impl: DIFF-2_AC-5
  async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      return await detectBinaryFile(filePath);
    } catch {
      // If detection fails, assume text file
      return false;
    }
  }
}

export const diffEngine = new DiffEngine();
