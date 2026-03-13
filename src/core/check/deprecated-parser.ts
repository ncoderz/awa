// @awa-component: DEP-DeprecatedParser
// @awa-impl: DEP-1_AC-1
// @awa-impl: DEP-1_AC-2
// @awa-impl: DEP-1_AC-3
// @awa-impl: DEP-2_AC-1
// @awa-impl: DEP-2_AC-2
// @awa-impl: DEP-2_AC-3

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { DeprecatedResult } from './types.js';

const DEPRECATED_PATH = 'deprecated/DEPRECATED.md';

// @awa-impl: DEP-1_AC-1, DEP-1_AC-2, DEP-1_AC-3, DEP-2_AC-1, DEP-2_AC-2, DEP-2_AC-3
export async function parseDeprecated(specDir: string): Promise<DeprecatedResult> {
  const filePath = join(specDir, DEPRECATED_PATH);
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    // File does not exist — empty deprecated set
    return { deprecatedIds: new Set() };
  }

  const deprecatedIds = new Set<string>();
  const idPattern = /[A-Z][A-Z0-9]*(?:-\d+(?:\.\d+)?(?:_AC-\d+)?|_P-\d+|-[A-Za-z][A-Za-z0-9]*)/g;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    // Skip empty lines and H1 headings (# CODE)
    if (trimmed === '' || /^#\s/.test(trimmed)) continue;

    // Extract IDs from comma-separated values
    for (const segment of trimmed.split(',')) {
      const match = segment.trim().match(idPattern);
      if (match) {
        for (const id of match) {
          deprecatedIds.add(id);
        }
      }
    }
  }

  return { deprecatedIds };
}
