// @zen-component: DiffEngine
// @zen-impl: DIFF-1 AC-1.1
// @zen-impl: DIFF-1 AC-1.2
// @zen-impl: DIFF-1 AC-1.3
// @zen-impl: DIFF-2 AC-2.1
// @zen-impl: DIFF-2 AC-2.2
// @zen-impl: DIFF-2 AC-2.3
// @zen-impl: DIFF-2 AC-2.4
// @zen-impl: DIFF-2 AC-2.5
// @zen-impl: DIFF-3 AC-3.1
// @zen-impl: DIFF-3 AC-3.2
// @zen-impl: DIFF-3 AC-3.3
// @zen-impl: DIFF-4 AC-4.1
// @zen-impl: DIFF-4 AC-4.2
// @zen-impl: DIFF-5 AC-5.1
// @zen-impl: DIFF-5 AC-5.2
// @zen-impl: DIFF-5 AC-5.3
// @zen-impl: DIFF-6 AC-6.1
// @zen-impl: DIFF-6 AC-6.2
// @zen-impl: DIFF-6 AC-6.3

import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { structuredPatch } from "diff";
import { isBinaryFile as detectBinaryFile } from "isbinaryfile";
import type { DiffOptions, DiffResult, FileDiff, GenerateOptions } from "../types/index.js";
import { pathExists, readTextFile, rmDir, walkDirectory } from "../utils/fs.js";
import { fileGenerator } from "./generator.js";

export class DiffEngine {
  // @zen-impl: DIFF-1 AC-1.1, DIFF-1 AC-1.2, DIFF-1 AC-1.3
  // @zen-impl: DIFF-2 AC-2.1, DIFF-2 AC-2.2, DIFF-2 AC-2.3, DIFF-2 AC-2.4, DIFF-2 AC-2.5
  // @zen-impl: DIFF-3 AC-3.1, DIFF-3 AC-3.2, DIFF-3 AC-3.3
  // @zen-impl: DIFF-4 AC-4.1, DIFF-4 AC-4.2
  // @zen-impl: DIFF-5 AC-5.1, DIFF-5 AC-5.2, DIFF-5 AC-5.3
  // @zen-impl: DIFF-6 AC-6.1, DIFF-6 AC-6.2, DIFF-6 AC-6.3
  async diff(options: DiffOptions): Promise<DiffResult> {
    const { templatePath, targetPath, features } = options;

    // @zen-impl: DIFF-1 AC-1.1, DIFF-1 AC-1.2
    const tempPath = await this.createTempDir();

    try {
      // Generate templates to temp directory
      const generateOptions: GenerateOptions = {
        templatePath,
        outputPath: tempPath,
        features,
        force: true,
        dryRun: false,
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

      // Compare files
      const files: FileDiff[] = [];
      const allFiles = new Set([...generatedFiles, ...targetFiles]);

      for (const relPath of allFiles) {
        const generatedFilePath = join(tempPath, relPath);
        const targetFilePath = join(targetPath, relPath);

        const inGenerated = generatedFiles.has(relPath);
        const inTarget = targetFiles.has(relPath);

        if (inGenerated && inTarget) {
          // @zen-impl: DIFF-2 AC-2.1, DIFF-2 AC-2.2, DIFF-2 AC-2.3, DIFF-2 AC-2.4, DIFF-2 AC-2.5
          const fileDiff = await this.compareFiles(generatedFilePath, targetFilePath, relPath);
          files.push(fileDiff);
        } else if (inGenerated && !inTarget) {
          // @zen-impl: DIFF-3 AC-3.1
          files.push({
            relativePath: relPath,
            status: "new",
          });
        } else if (!inGenerated && inTarget) {
          // @zen-impl: DIFF-3 AC-3.2
          files.push({
            relativePath: relPath,
            status: "extra",
          });
        }
      }

      // Calculate summary
      const identical = files.filter((f) => f.status === "identical").length;
      const modified = files.filter((f) => f.status === "modified").length;
      const newFiles = files.filter((f) => f.status === "new").length;
      const extraFiles = files.filter((f) => f.status === "extra").length;
      const binaryDiffers = files.filter((f) => f.status === "binary-differs").length;

      const hasDifferences = modified > 0 || newFiles > 0 || extraFiles > 0 || binaryDiffers > 0;

      return {
        files,
        identical,
        modified,
        newFiles,
        extraFiles,
        hasDifferences,
      };
    } finally {
      // @zen-impl: DIFF-6 AC-6.1, DIFF-6 AC-6.2, DIFF-6 AC-6.3
      await this.cleanupTempDir(tempPath);
    }
  }

  // @zen-impl: DIFF-1 AC-1.1, DIFF-1 AC-1.2
  async createTempDir(): Promise<string> {
    const systemTemp = tmpdir();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const tempPath = join(systemTemp, `zen-diff-${timestamp}-${random}`);
    return tempPath;
  }

  // @zen-impl: DIFF-6 AC-6.1, DIFF-6 AC-6.2, DIFF-6 AC-6.3
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

  // @zen-impl: DIFF-2 AC-2.1, DIFF-2 AC-2.2, DIFF-2 AC-2.3, DIFF-2 AC-2.4, DIFF-2 AC-2.5
  async compareFiles(generatedPath: string, targetPath: string, relativePath: string): Promise<FileDiff> {
    // @zen-impl: DIFF-2 AC-2.5
    const isBinary = await this.isBinaryFile(generatedPath);

    if (isBinary) {
      // Binary files: check if they differ by comparing content
      const generatedContent = await readTextFile(generatedPath);
      const targetContent = await readTextFile(targetPath);

      if (generatedContent === targetContent) {
        return {
          relativePath,
          status: "identical",
        };
      }

      return {
        relativePath,
        status: "binary-differs",
      };
    }

    // Text files: byte-for-byte comparison and unified diff
    const generatedContent = await readTextFile(generatedPath);
    const targetContent = await readTextFile(targetPath);

    // @zen-impl: DIFF-2 AC-2.1
    if (generatedContent === targetContent) {
      return {
        relativePath,
        status: "identical",
      };
    }

    // @zen-impl: DIFF-2 AC-2.4
    // Generate unified diff
    const patch = structuredPatch(relativePath, relativePath, targetContent, generatedContent, "target", "generated", {
      context: 3,
    });

    // Format as unified diff string
    const unifiedDiff = patch.hunks
      .map((hunk) => {
        const lines = [`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`];
        lines.push(...hunk.lines);
        return lines.join("\n");
      })
      .join("\n");

    return {
      relativePath,
      status: "modified",
      unifiedDiff,
    };
  }

  // @zen-impl: DIFF-2 AC-2.5
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
