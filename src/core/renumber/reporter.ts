// @awa-component: RENUM-Reporter
// @awa-impl: RENUM-7_AC-1
// @awa-impl: RENUM-11_AC-1

import type { RenumberResult } from './types.js';

/**
 * Format renumber results as human-readable text.
 * In dry-run mode, prefixes output with a banner.
 */
// @awa-impl: RENUM-7_AC-1
export function formatText(result: RenumberResult, dryRun: boolean): string {
  const lines: string[] = [];

  if (dryRun) {
    lines.push('DRY RUN — no files were modified\n');
  }

  if (result.noChange) {
    lines.push(`${result.code}: no changes needed (IDs already sequential)`);
    return lines.join('\n');
  }

  // Renumber map table
  lines.push(`${result.code}: ${result.map.entries.size} ID(s) renumbered\n`);
  lines.push('  Old ID → New ID');
  lines.push(`  ${'─'.repeat(40)}`);
  for (const [oldId, newId] of result.map.entries) {
    lines.push(`  ${oldId} → ${newId}`);
  }

  // Affected files
  if (result.affectedFiles.length > 0) {
    lines.push('');
    lines.push(
      `  ${result.totalReplacements} replacement(s) in ${result.affectedFiles.length} file(s):`,
    );
    for (const file of result.affectedFiles) {
      lines.push(`    ${file.filePath} (${file.replacements.length})`);
    }
  }

  // Malformed warnings
  if (result.malformedWarnings.length > 0) {
    lines.push('');
    lines.push('  Malformed ID warnings:');
    for (const w of result.malformedWarnings) {
      lines.push(`    ${w.filePath}:${w.line} — ${w.token}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format renumber results as JSON for CI consumption.
 */
// @awa-impl: RENUM-11_AC-1
export function formatJson(result: RenumberResult): string {
  const output = {
    code: result.code,
    noChange: result.noChange,
    map: Object.fromEntries(result.map.entries),
    affectedFiles: result.affectedFiles.map((f) => ({
      filePath: f.filePath,
      replacements: f.replacements.map((r) => ({
        line: r.line,
        oldId: r.oldId,
        newId: r.newId,
      })),
    })),
    totalReplacements: result.totalReplacements,
    malformedWarnings: result.malformedWarnings.map((w) => ({
      filePath: w.filePath,
      line: w.line,
      token: w.token,
    })),
  };

  return JSON.stringify(output, null, 2);
}
