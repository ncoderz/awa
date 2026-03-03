// @awa-component: RCOD-RecodeReporter
// @awa-impl: RCOD-4_AC-2, RCOD-4_AC-3

import type { RecodeResult } from './types.js';

/**
 * Format recode results as human-readable text.
 * In dry-run mode, prefixes output with a banner.
 */
// @awa-impl: RCOD-4_AC-2
export function formatText(result: RecodeResult, dryRun: boolean): string {
  const lines: string[] = [];

  if (dryRun) {
    lines.push('DRY RUN — no files were modified\n');
  }

  if (result.noChange) {
    lines.push(`${result.sourceCode} → ${result.targetCode}: no IDs to recode`);
    return lines.join('\n');
  }

  lines.push(
    `${result.sourceCode} → ${result.targetCode}: ${result.map.entries.size} ID(s) recoded\n`
  );
  lines.push('  Old ID → New ID');
  lines.push(`  ${'─'.repeat(40)}`);
  for (const [oldId, newId] of result.map.entries) {
    lines.push(`  ${oldId} → ${newId}`);
  }

  if (result.affectedFiles.length > 0) {
    lines.push('');
    lines.push(
      `  ${result.totalReplacements} replacement(s) in ${result.affectedFiles.length} file(s):`
    );
    for (const file of result.affectedFiles) {
      lines.push(`    ${file.filePath} (${file.replacements.length})`);
    }
  }

  // File renames section
  if (result.renames.length > 0) {
    lines.push('');
    lines.push(`  ${result.renames.length} file(s) renamed:`);
    for (const r of result.renames) {
      lines.push(`    ${r.oldPath} → ${r.newPath}`);
    }
  }

  // Stale references (errors)
  if (result.staleRefs.length > 0) {
    lines.push('');
    lines.push(`  ✖ ${result.staleRefs.length} file(s) still reference ${result.sourceCode}:`);
    for (const ref of result.staleRefs) {
      lines.push(`    ${ref}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format recode results as JSON for CI consumption.
 */
// @awa-impl: RCOD-4_AC-3
export function formatJson(result: RecodeResult): string {
  const output = {
    sourceCode: result.sourceCode,
    targetCode: result.targetCode,
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
    renames: result.renames.map((r) => ({ oldPath: r.oldPath, newPath: r.newPath })),
    staleRefs: result.staleRefs,
  };

  return JSON.stringify(output, null, 2);
}
