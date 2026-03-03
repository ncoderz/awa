import { readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { SpecFile } from '../check/types.js';
import type { FileAppend } from './types.js';

/** File type prefixes handled by merge. */
const MERGE_PREFIXES = ['FEAT', 'REQ', 'DESIGN', 'API', 'EXAMPLE'] as const;

/**
 * Resolve the feature-name slug for a code from its first spec file.
 * Looks at REQ files first, then falls back to other prefixes.
 */
function resolveFeatureName(
  code: string,
  specFiles: readonly SpecFile[]
): string | undefined {
  // Prefer REQ file for feature name
  for (const sf of specFiles) {
    const name = basename(sf.filePath);
    const reqPrefix = `REQ-${code}-`;
    if (name.startsWith(reqPrefix)) {
      return name.slice(reqPrefix.length).replace(/\.\w+$/, '');
    }
  }
  // Fallback to any merge-prefixed file
  for (const sf of specFiles) {
    const name = basename(sf.filePath);
    for (const prefix of MERGE_PREFIXES) {
      const pat = `${prefix}-${code}-`;
      if (name.startsWith(pat)) {
        return name.slice(pat.length).replace(/(-\d+)?\.\w+$/, '');
      }
    }
  }
  return undefined;
}

/**
 * Replace the feature-name part of a filename suffix with a new feature name.
 * Handles "feature.ext", "feature-NNN.ext", and multi-word "feature-name-NNN.ext".
 */
function replaceFeaturePart(suffix: string, targetFeature: string): string {
  // Numbered: feature-name-NNN.ext
  const numericMatch = /^.+(-\d+\.\w+)$/.exec(suffix);
  if (numericMatch) {
    return `${targetFeature}${numericMatch[1]}`;
  }
  // Simple: feature-name.ext
  const extMatch = /(\.\w+)$/.exec(suffix);
  return extMatch ? `${targetFeature}${extMatch[1]}` : suffix;
}

/**
 * Find the target file path for a source file and indicate whether it already exists.
 * For single-instance types (FEAT, REQ, DESIGN, API): matches by prefix.
 * For EXAMPLE: matches by sequence number suffix.
 */
export function resolveTargetFile(
  sourceFilePath: string,
  prefix: string,
  sourceCode: string,
  targetCode: string,
  specFiles: readonly SpecFile[]
): { path: string; exists: boolean } {
  const name = basename(sourceFilePath);
  const dir = dirname(sourceFilePath);
  const sourceSlug = name.slice(`${prefix}-${sourceCode}-`.length);

  // Look for an existing target file with the same prefix
  for (const sf of specFiles) {
    const targetName = basename(sf.filePath);
    if (!targetName.startsWith(`${prefix}-${targetCode}-`)) continue;

    if (prefix === 'EXAMPLE') {
      // Match by sequence number for multi-instance types
      const sourceSeq = sourceSlug.match(/-(\d+)\.\w+$/)?.[1];
      const targetSlug = targetName.slice(`${prefix}-${targetCode}-`.length);
      const targetSeq = targetSlug.match(/-(\d+)\.\w+$/)?.[1];
      if (sourceSeq && targetSeq && sourceSeq === targetSeq) {
        return { path: sf.filePath, exists: true };
      }
    } else {
      // Single-instance: first match wins
      return { path: sf.filePath, exists: true };
    }
  }

  // No existing target — derive path using target feature name
  const targetFeature = resolveFeatureName(targetCode, specFiles);
  if (targetFeature) {
    const newSuffix = replaceFeaturePart(sourceSlug, targetFeature);
    return { path: join(dir, `${prefix}-${targetCode}-${newSuffix}`), exists: false };
  }

  // Fallback: just replace code in filename
  const fallbackName = name.replace(`${prefix}-${sourceCode}-`, `${prefix}-${targetCode}-`);
  return { path: join(dir, fallbackName), exists: false };
}

/**
 * Execute all file appends: for each source file matching MERGE_PREFIXES,
 * append its content to the corresponding target file (creating if needed),
 * then delete the source file.
 *
 * At this point, source file content has already been recoded by the propagator.
 */
export async function executeAppends(
  sourceCode: string,
  targetCode: string,
  specFiles: readonly SpecFile[],
  dryRun: boolean
): Promise<FileAppend[]> {
  const appends: FileAppend[] = [];

  for (const sf of specFiles) {
    const name = basename(sf.filePath);
    let matchedPrefix = '';
    for (const prefix of MERGE_PREFIXES) {
      if (name.startsWith(`${prefix}-${sourceCode}-`)) {
        matchedPrefix = prefix;
        break;
      }
    }
    if (!matchedPrefix) continue;

    const { path: targetPath, exists } = resolveTargetFile(
      sf.filePath,
      matchedPrefix,
      sourceCode,
      targetCode,
      specFiles
    );

    appends.push({
      sourceFile: sf.filePath,
      targetFile: targetPath,
      created: !exists,
      docType: matchedPrefix,
    });

    if (!dryRun) {
      const sourceContent = await readFile(sf.filePath, 'utf-8');

      if (exists) {
        const targetContent = await readFile(targetPath, 'utf-8');
        const merged = `${targetContent.trimEnd()}\n\n---\n\n${sourceContent}`;
        await writeFile(targetPath, merged, 'utf-8');
      } else {
        await writeFile(targetPath, sourceContent, 'utf-8');
      }

      await unlink(sf.filePath);
    }
  }

  return appends;
}
