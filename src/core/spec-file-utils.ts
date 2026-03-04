// @awa-impl: RENUM-1_AC-1
// @awa-impl: RCOD-1_AC-1

import { basename } from 'node:path';

import type { SpecFile } from './check/types.js';

/**
 * Find all spec files matching a feature code and file type prefix.
 * Returns files sorted alphabetically by basename for deterministic ordering.
 */
export function findSpecFiles(
  specFiles: readonly SpecFile[],
  code: string,
  prefix: string,
): SpecFile[] {
  return specFiles
    .filter((sf) => {
      const name = basename(sf.filePath);
      return name.startsWith(`${prefix}-${code}-`);
    })
    .sort((a, b) => basename(a.filePath).localeCompare(basename(b.filePath)));
}

/**
 * Find the first spec file matching a feature code and file type prefix.
 * Convenience wrapper over findSpecFiles for cases needing a single match.
 */
export function findSpecFile(
  specFiles: readonly SpecFile[],
  code: string,
  prefix: string,
): SpecFile | undefined {
  return findSpecFiles(specFiles, code, prefix)[0];
}

/** Known spec file prefixes that carry a feature code. */
export const SPEC_PREFIXES = ['FEAT', 'REQ', 'DESIGN', 'EXAMPLE', 'API', 'TASK'] as const;

/**
 * Check whether at least one spec file exists for the given feature code.
 */
export function hasAnySpecFile(specFiles: readonly SpecFile[], code: string): boolean {
  return specFiles.some((sf) => {
    const name = basename(sf.filePath);
    return SPEC_PREFIXES.some((prefix) => name.startsWith(`${prefix}-${code}-`));
  });
}
