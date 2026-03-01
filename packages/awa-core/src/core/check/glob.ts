// @awa-component: CHK-MarkerScanner
// @awa-impl: CHK-13_AC-1

import { glob } from 'node:fs/promises';

/**
 * Matches a path against a simple glob pattern supporting * and **.
 * Also matches a directory prefix against `dir/**` patterns (e.g. "src" matches "src/**").
 */
export function matchSimpleGlob(path: string, pattern: string): boolean {
  const regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<GLOBSTAR>>/g, '.*');
  return new RegExp(`(^|/)${regex}($|/)`).test(path);
}

/**
 * Collect files matching globs while applying ignore patterns.
 * Uses fs.glob exclude callback for directory-level skipping (perf optimization)
 * and post-filters results for file-level ignore matching.
 */
export async function collectFiles(
  globs: readonly string[],
  ignore: readonly string[]
): Promise<string[]> {
  const files: string[] = [];

  // For exclude callback, also match directory prefixes (e.g. "src" for "src/**")
  const dirPrefixes = ignore.filter((ig) => ig.endsWith('/**')).map((ig) => ig.slice(0, -3));

  for (const pattern of globs) {
    for await (const filePath of glob(pattern, {
      exclude: (p) => dirPrefixes.includes(p) || ignore.some((ig) => matchSimpleGlob(p, ig)),
    })) {
      // Post-filter: fs.glob exclude only receives directory names,
      // so we must also filter the yielded file paths
      if (!ignore.some((ig) => matchSimpleGlob(filePath, ig))) {
        files.push(filePath);
      }
    }
  }

  return [...new Set(files)];
}
