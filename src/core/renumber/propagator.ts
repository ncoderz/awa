// @awa-component: RENUM-Propagator
// @awa-impl: RENUM-5_AC-1, RENUM-5_AC-2, RENUM-5_AC-3
// @awa-impl: RENUM-6_AC-1, RENUM-6_AC-2

import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { MarkerScanResult, SpecParseResult } from '../check/types.js';
import type { AffectedFile, PropagationResult, RenumberMap, Replacement } from './types.js';
import { RenumberError } from './types.js';

/**
 * Apply the renumber map across all spec files and code files.
 * Uses two-pass placeholder replacement to avoid swap collisions.
 */
export async function propagate(
  map: RenumberMap,
  specs: SpecParseResult,
  markers: MarkerScanResult,
  dryRun: boolean
): Promise<PropagationResult> {
  if (map.entries.size === 0) {
    return { affectedFiles: [], totalReplacements: 0 };
  }

  // Collect all file paths that need scanning
  const filePaths = collectFilePaths(map, specs, markers);

  const affectedFiles: AffectedFile[] = [];
  let totalReplacements = 0;

  for (const filePath of filePaths) {
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      continue; // Skip unreadable files
    }

    const result = applyReplacements(content, map);
    if (result.replacements.length === 0) continue;

    affectedFiles.push({ filePath, replacements: result.replacements });
    totalReplacements += result.replacements.length;

    if (!dryRun) {
      try {
        await writeFile(filePath, result.newContent, 'utf-8');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new RenumberError('WRITE_FAILED', `Failed to write ${filePath}: ${msg}`);
      }
    }
  }

  return { affectedFiles, totalReplacements };
}

/**
 * Collect unique file paths that may contain IDs needing replacement.
 * Includes spec files for the code and code files with relevant markers.
 */
// @awa-impl: RENUM-5_AC-1, RENUM-5_AC-2, RENUM-5_AC-3
function collectFilePaths(
  map: RenumberMap,
  specs: SpecParseResult,
  markers: MarkerScanResult
): string[] {
  const paths = new Set<string>();
  const code = map.code;

  // Add spec files that match the feature code or reference its IDs
  // @awa-impl: RENUM-5_AC-1, RENUM-5_AC-3
  for (const specFile of specs.specFiles) {
    const name = basename(specFile.filePath);
    // Include REQ, DESIGN, FEAT, TASK, EXAMPLE, PLAN files matching the code
    const prefixes = ['REQ', 'DESIGN', 'FEAT', 'TASK', 'EXAMPLE', 'PLAN'];
    for (const prefix of prefixes) {
      if (name.startsWith(`${prefix}-${code}-`)) {
        paths.add(specFile.filePath);
        break;
      }
    }
    // Also include ARCHITECTURE.md and any spec file that cross-references our IDs
    for (const xref of specFile.crossRefs) {
      if (xref.ids.some((id) => hasCodePrefix(id, code))) {
        paths.add(specFile.filePath);
        break;
      }
    }
  }

  // Add code/test files that have markers referencing affected IDs
  // @awa-impl: RENUM-5_AC-2
  const affectedIds = new Set(map.entries.keys());
  for (const marker of markers.markers) {
    if (affectedIds.has(marker.id) || hasCodePrefix(marker.id, code)) {
      paths.add(marker.filePath);
    }
  }

  return [...paths];
}

/**
 * Apply two-pass placeholder replacement to file content.
 * Pass 1: Replace old IDs with unique placeholders.
 * Pass 2: Replace placeholders with new IDs.
 * Uses whole-ID boundary matching to avoid partial replacements.
 */
// @awa-impl: RENUM-6_AC-1, RENUM-6_AC-2
function applyReplacements(
  content: string,
  map: RenumberMap
): { newContent: string; replacements: Replacement[] } {
  const replacements: Replacement[] = [];
  const lines = content.split('\n');

  // Build sorted entries: replace longer IDs first to avoid partial matches
  const sortedEntries = [...map.entries].sort(([a], [b]) => b.length - a.length);

  // Build placeholder map: old ID → placeholder → new ID
  const placeholders = new Map<string, string>();
  const placeholderToNew = new Map<string, string>();
  for (const [oldId, newId] of sortedEntries) {
    const placeholder = `__RENUM_${placeholders.size}__`;
    placeholders.set(oldId, placeholder);
    placeholderToNew.set(placeholder, newId);
  }

  // Pass 1: Replace old IDs with placeholders (line by line for tracking)
  const pass1Lines = lines.map((line, idx) => {
    let modified = line;
    for (const [oldId, placeholder] of placeholders) {
      const regex = buildWholeIdRegex(oldId);
      // Count matches on original line for tracking
      const origRegex = buildWholeIdRegex(oldId);
      while (origRegex.exec(line) !== null) {
        replacements.push({
          line: idx + 1,
          oldId,
          newId: map.entries.get(oldId) ?? oldId,
        });
      }
      modified = modified.replace(regex, placeholder);
    }
    return modified;
  });

  // Pass 2: Replace placeholders with new IDs
  const pass2Lines = pass1Lines.map((line) => {
    let modified = line;
    for (const [placeholder, newId] of placeholderToNew) {
      modified = modified.replaceAll(placeholder, newId);
    }
    return modified;
  });

  // Deduplicate replacements per line (same oldId on same line counted once)
  const seen = new Set<string>();
  const dedupedReplacements = replacements.filter((r) => {
    const key = `${r.line}:${r.oldId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { newContent: pass2Lines.join('\n'), replacements: dedupedReplacements };
}

/**
 * Build a regex that matches a whole ID with boundary assertions.
 * Prevents partial matches within unrelated tokens.
 */
function buildWholeIdRegex(id: string): RegExp {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word boundary won't work across hyphens/underscores, so use lookahead/lookbehind
  // Match the ID when not preceded or followed by alphanumeric, hyphen, underscore, or dot
  return new RegExp(`(?<![A-Za-z0-9_.-])${escaped}(?![A-Za-z0-9_.-])`, 'g');
}

/**
 * Check if an ID starts with the given feature code prefix.
 */
function hasCodePrefix(id: string, code: string): boolean {
  return id.startsWith(`${code}-`) || id.startsWith(`${code}_`);
}
