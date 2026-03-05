// @awa-component: RENUM-Propagator
// @awa-impl: RENUM-5_AC-1, RENUM-5_AC-2, RENUM-5_AC-3
// @awa-impl: RENUM-6_AC-1, RENUM-6_AC-2

import { readFile, writeFile } from 'node:fs/promises';

import { collectFiles } from '../check/glob.js';
import type { CheckConfig, MarkerScanResult, SpecParseResult } from '../check/types.js';
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
  config: CheckConfig,
  dryRun: boolean,
): Promise<PropagationResult> {
  if (map.entries.size === 0) {
    return { affectedFiles: [], totalReplacements: 0 };
  }

  // Collect all file paths that need scanning
  const filePaths = await collectFilePaths(map, specs, markers, config);

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
 * Includes all spec files (any may reference the code's IDs in matrices,
 * prose, or cross-references), extra spec files from extraSpecGlobs,
 * and code files with relevant markers.
 */
// @awa-impl: RENUM-5_AC-1, RENUM-5_AC-2, RENUM-5_AC-3
async function collectFilePaths(
  map: RenumberMap,
  specs: SpecParseResult,
  markers: MarkerScanResult,
  config: CheckConfig,
): Promise<string[]> {
  const paths = new Set<string>();
  const code = map.code;

  // Include all spec files — any may contain IDs in matrices, prose, or cross-refs.
  // The replacement pass efficiently skips files with no matches.
  // @awa-impl: RENUM-5_AC-1, RENUM-5_AC-3
  for (const specFile of specs.specFiles) {
    paths.add(specFile.filePath);
  }

  // Include extra spec files from extraSpecGlobs (custom files in .awa/ not matched by specGlobs)
  const combinedIgnore = [...config.specIgnore, ...config.extraSpecIgnore];
  const extraFiles = await collectFiles(config.extraSpecGlobs, combinedIgnore);
  for (const filePath of extraFiles) {
    paths.add(filePath);
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
  map: RenumberMap,
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

  // Single pass per line: replace old IDs with placeholders, then placeholders with new IDs.
  // This avoids holding separate pass1Lines and pass2Lines arrays (reduces from 4× to 2× memory).
  for (let idx = 0; idx < lines.length; idx++) {
    let modified = lines[idx] as string;
    const origLine = modified;

    // Phase 1: Replace old IDs with placeholders and track replacements
    for (const [oldId, placeholder] of placeholders) {
      const regex = buildWholeIdRegex(oldId);
      // Count matches on original line for tracking
      const trackRegex = buildWholeIdRegex(oldId);
      while (trackRegex.exec(origLine) !== null) {
        replacements.push({
          line: idx + 1,
          oldId,
          newId: map.entries.get(oldId) ?? oldId,
        });
      }
      modified = modified.replace(regex, placeholder);
    }

    // Phase 2: Replace placeholders with new IDs
    for (const [placeholder, newId] of placeholderToNew) {
      modified = modified.replaceAll(placeholder, newId);
    }

    lines[idx] = modified;
  }

  // Deduplicate replacements per line (same oldId on same line counted once)
  const seen = new Set<string>();
  const dedupedReplacements = replacements.filter((r) => {
    const key = `${r.line}:${r.oldId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { newContent: lines.join('\n'), replacements: dedupedReplacements };
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
