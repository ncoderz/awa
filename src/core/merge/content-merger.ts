import { readFile, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';

import type { SpecFile } from '../check/types.js';
import type { FileMove } from './types.js';

/** File type prefixes handled by merge. */
const MERGE_PREFIXES = ['FEAT', 'REQ', 'DESIGN', 'API', 'EXAMPLE', 'TASK'] as const;

/**
 * Compute a conflict-free target path by replacing only the code in the filename.
 * If the resulting path collides with an existing file or an already-planned move,
 * appends an incrementing index (`-001`, `-002`, …) before the extension.
 */
export function resolveMovePath(
  sourceFilePath: string,
  prefix: string,
  sourceCode: string,
  targetCode: string,
  existingPaths: ReadonlySet<string>,
  plannedPaths: ReadonlySet<string>
): string {
  const dir = dirname(sourceFilePath);
  const name = basename(sourceFilePath);
  const newName = name.replace(`${prefix}-${sourceCode}-`, `${prefix}-${targetCode}-`);
  const newPath = join(dir, newName);

  if (!existingPaths.has(newPath) && !plannedPaths.has(newPath)) {
    return newPath;
  }

  // Conflict — add incrementing numeric suffix before the extension
  const ext = extname(newName);
  const stem = newName.slice(0, -ext.length);

  for (let i = 1; i < 1000; i++) {
    const indexed = join(dir, `${stem}-${String(i).padStart(3, '0')}${ext}`);
    if (!existingPaths.has(indexed) && !plannedPaths.has(indexed)) {
      return indexed;
    }
  }

  // Should never happen in practice
  throw new Error(`Cannot resolve conflict for ${sourceFilePath}`);
}

/**
 * Update the H1 heading in a spec file, replacing the source code with the target code.
 * Only the first H1 heading is modified; body content is left unchanged.
 */
export function updateHeading(content: string, sourceCode: string, targetCode: string): string {
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (/^#\s/.test(line)) {
      lines[i] = line.replaceAll(sourceCode, targetCode);
      break;
    }
  }

  return lines.join('\n');
}

/**
 * Execute all file moves: for each source file matching MERGE_PREFIXES,
 * rename it by replacing only the code portion of the filename.
 * If a conflict exists, an incrementing index suffix is added.
 * The H1 heading is also updated to reflect the new code.
 *
 * At this point, source file content has already been recoded by the propagator.
 */
export async function executeMoves(
  sourceCode: string,
  targetCode: string,
  specFiles: readonly SpecFile[],
  dryRun: boolean
): Promise<FileMove[]> {
  const moves: FileMove[] = [];

  // Build set of all existing paths (excluding source files that will be moved)
  const sourceFilePaths = new Set<string>();
  for (const sf of specFiles) {
    const name = basename(sf.filePath);
    for (const prefix of MERGE_PREFIXES) {
      if (name.startsWith(`${prefix}-${sourceCode}-`)) {
        sourceFilePaths.add(sf.filePath);
        break;
      }
    }
  }

  const existingPaths = new Set(
    specFiles.map((sf) => sf.filePath).filter((p) => !sourceFilePaths.has(p))
  );
  const plannedPaths = new Set<string>();

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

    const targetPath = resolveMovePath(
      sf.filePath,
      matchedPrefix,
      sourceCode,
      targetCode,
      existingPaths,
      plannedPaths
    );

    plannedPaths.add(targetPath);

    moves.push({
      sourceFile: sf.filePath,
      targetFile: targetPath,
      docType: matchedPrefix,
    });

    if (!dryRun) {
      // Read, update heading, rename
      const content = await readFile(sf.filePath, 'utf-8');
      const updated = updateHeading(content, sourceCode, targetCode);

      await rename(sf.filePath, targetPath);

      // If heading was updated, write the new content back
      if (updated !== content) {
        await writeFile(targetPath, updated, 'utf-8');
      }
    }
  }

  return moves;
}
