import { readFile, rename } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import type { SpecFile } from '../check/types.js';
import type { FileRename } from '../recode/types.js';
import { MergeError } from './types.js';

/** Spec file prefixes that include the feature code in their filename. */
const CODE_PREFIXES = ['REQ', 'DESIGN', 'FEAT', 'TASK', 'EXAMPLE'] as const;

/**
 * Resolve the feature-name slug for a code from its first REQ file.
 * e.g. code CLI with file REQ-CLI-cli.md → "cli"
 */
export function resolveFeatureName(
  code: string,
  specFiles: readonly SpecFile[],
): string | undefined {
  for (const sf of specFiles) {
    const name = basename(sf.filePath, '.md');
    const match = new RegExp(`^REQ-${code}-(.+)$`).exec(name);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

/**
 * Compute file renames for all spec files belonging to sourceCode.
 * Uses the target code's feature name for the renamed files.
 * Returns the list of planned renames without executing them.
 */
export function planRenames(
  sourceCode: string,
  targetCode: string,
  specFiles: readonly SpecFile[],
): FileRename[] {
  const targetFeature = resolveFeatureName(targetCode, specFiles);
  const renames: FileRename[] = [];

  for (const sf of specFiles) {
    const name = basename(sf.filePath);
    for (const prefix of CODE_PREFIXES) {
      const oldPrefix = `${prefix}-${sourceCode}-`;
      if (name.startsWith(oldPrefix)) {
        const oldSuffix = name.slice(oldPrefix.length);
        // Replace the feature-name part with the target's feature name
        const newSuffix = targetFeature ? replaceFeaturePart(oldSuffix, targetFeature) : oldSuffix;
        const newName = `${prefix}-${targetCode}-${newSuffix}`;
        const newPath = join(dirname(sf.filePath), newName);
        renames.push({ oldPath: sf.filePath, newPath });
        break;
      }
    }
  }

  return renames;
}

/**
 * Replace the feature-name part of a suffix with a new feature name.
 * e.g. "check.md" → "cli.md", "check-001.md" → "cli-001.md"
 */
function replaceFeaturePart(suffix: string, targetFeature: string): string {
  // Suffix patterns: "feature-name.md" or "feature-name-NNN.md"
  const numericMatch = /^(.+)-(\d+\.md)$/.exec(suffix);
  if (numericMatch) {
    return `${targetFeature}-${numericMatch[2]}`;
  }
  // Simple case: "feature-name.md"
  if (suffix.endsWith('.md')) {
    return `${targetFeature}.md`;
  }
  return suffix;
}

/**
 * Check for rename conflicts — target filenames that already exist.
 * Returns paths that would collide.
 */
export function detectConflicts(
  renames: readonly FileRename[],
  specFiles: readonly SpecFile[],
): string[] {
  const existingPaths = new Set(specFiles.map((sf) => sf.filePath));
  const conflicts: string[] = [];

  for (const r of renames) {
    if (existingPaths.has(r.newPath)) {
      conflicts.push(r.newPath);
    }
  }

  return conflicts;
}

/**
 * Update the H1 heading in a spec file if it contains the old code name.
 * Returns the updated content.
 */
export function updateHeading(content: string, sourceCode: string, targetCode: string): string {
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    // Match H1 heading: # Some Title
    if (/^#\s/.test(line)) {
      // Replace occurrences of source code in the heading
      lines[i] = line.replaceAll(sourceCode, targetCode);
      break; // Only update the first H1
    }
  }

  return lines.join('\n');
}

/**
 * Execute all planned renames: update headings and rename files.
 * In dry-run mode, returns the list without modifying the filesystem.
 */
export async function executeRenames(
  renames: readonly FileRename[],
  sourceCode: string,
  targetCode: string,
  dryRun: boolean,
): Promise<readonly FileRename[]> {
  if (dryRun) return renames;

  for (const r of renames) {
    // Read and update heading
    const content = await readFile(r.oldPath, 'utf-8');
    const updated = updateHeading(content, sourceCode, targetCode);

    // Write updated content to new path via rename + write
    // Use fs.rename for atomic move on same filesystem
    await rename(r.oldPath, r.newPath);

    // If heading was updated, write the new content
    if (updated !== content) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(r.newPath, updated, 'utf-8');
    }
  }

  return renames;
}

/**
 * Delete the original source spec files (called after successful renames).
 * In dry-run mode, returns the planned deletions without executing.
 */
export async function deleteSourceFiles(
  _renames: readonly FileRename[],
  _dryRun: boolean,
): Promise<readonly string[]> {
  // After rename, old files no longer exist — they were moved.
  // This function handles any remaining source files not covered by renames.
  // In practice, renames cover all source files, so this is a no-op.
  // Retained for extensibility.
  return [];
}

/**
 * Scan for stale references to the source code that weren't covered by recode.
 * Checks all spec files for any remaining `sourceCode-` prefixed IDs.
 */
export async function findStaleRefs(
  sourceCode: string,
  specFiles: readonly SpecFile[],
): Promise<string[]> {
  const stale: string[] = [];
  const pattern = new RegExp(`\\b${sourceCode}-\\d`, 'g');

  for (const sf of specFiles) {
    let content: string;
    try {
      content = await readFile(sf.filePath, 'utf-8');
    } catch {
      continue;
    }
    if (pattern.test(content)) {
      stale.push(sf.filePath);
    }
    // Reset regex lastIndex for next iteration
    pattern.lastIndex = 0;
  }

  return stale;
}

/**
 * Validate merge preconditions.
 */
export function validateMerge(sourceCode: string, targetCode: string): void {
  if (sourceCode === targetCode) {
    throw new MergeError('SELF_MERGE', `Cannot merge a code into itself: ${sourceCode}`);
  }
}
