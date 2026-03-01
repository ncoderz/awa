// @awa-component: GEN-DeleteList
// @awa-impl: GEN-12_AC-1
// @awa-impl: GEN-12_AC-8

import { join } from 'node:path';
import { pathExists, readTextFile } from '../utils/fs.js';

const DELETE_LIST_FILENAME = '_delete.txt';

/**
 * A delete list entry. When `features` is set, the path is only deleted
 * when NONE of those features are present in the active feature set
 * (stale tool cleanup). When `features` is absent, the path is always
 * deleted (legacy removal).
 */
export interface DeleteEntry {
  path: string;
  /** One or more feature names — keep (don't delete) if any is active. */
  features?: string[];
}

/**
 * Parse `_delete.txt` content into structured entries.
 *
 * Format:
 * - Blank lines and `#` comments are ignored.
 * - `# @feature <name> [<name2> ...]` starts a feature-gated section: subsequent
 *   paths are deleted only when NONE of the listed features are active.
 * - Any other comment line clears the current feature section (returns to
 *   always-delete behaviour).
 * - Path lines inherit the current section's feature tag (if any).
 */
export function parseDeleteList(content: string): DeleteEntry[] {
  const entries: DeleteEntry[] = [];
  let currentFeatures: string[] | undefined;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line.length === 0) continue;

    if (line.startsWith('#')) {
      const featureMatch = line.match(/^#\s*@feature\s+(.+)$/);
      if (featureMatch) {
        const featureSection = featureMatch[1];
        currentFeatures = featureSection ? featureSection.trim().split(/\s+/) : undefined;
      } else {
        // Any other comment resets the feature section
        currentFeatures = undefined;
      }
      continue;
    }

    entries.push({ path: line, features: currentFeatures });
  }

  return entries;
}

/**
 * Resolve which paths from the delete list should actually be deleted,
 * given the currently active feature flags.
 *
 * - Entries without a feature tag are always included (legacy removals).
 * - Entries with feature tags are included only when NONE of those features are active
 *   (stale tool output cleanup).
 */
export function resolveDeleteList(entries: DeleteEntry[], activeFeatures: string[]): string[] {
  const activeSet = new Set(activeFeatures);
  return entries
    .filter((e) => e.features === undefined || !e.features.some((f) => activeSet.has(f)))
    .map((e) => e.path);
}

/**
 * Load and parse `_delete.txt` from the template directory.
 * Returns empty array if the file does not exist.
 */
export async function loadDeleteList(templatePath: string): Promise<DeleteEntry[]> {
  const deleteListPath = join(templatePath, DELETE_LIST_FILENAME);

  if (!(await pathExists(deleteListPath))) {
    return [];
  }

  const content = await readTextFile(deleteListPath);
  return parseDeleteList(content);
}
