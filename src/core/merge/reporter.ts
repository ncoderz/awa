import type { MergeResult } from './types.js';

/**
 * Format merge results as human-readable text.
 * Shows sections: ID remap table, file appends, affected files, stale refs.
 */
export function formatText(result: MergeResult, dryRun: boolean): string {
  const lines: string[] = [];

  if (dryRun) {
    lines.push('DRY RUN — no files were modified\n');
  }

  if (result.noChange) {
    lines.push(`${result.sourceCode} → ${result.targetCode}: nothing to merge`);
    return lines.join('\n');
  }

  // Section 1: ID remap table
  lines.push(
    `${result.sourceCode} → ${result.targetCode}: ${result.map.entries.size} ID(s) recoded\n`
  );
  if (result.map.entries.size > 0) {
    lines.push('  Old ID → New ID');
    lines.push(`  ${'─'.repeat(40)}`);
    for (const [oldId, newId] of result.map.entries) {
      lines.push(`  ${oldId} → ${newId}`);
    }
  }

  // Section 2: File moves
  if (result.moves.length > 0) {
    lines.push('');
    lines.push(`  ${result.moves.length} file(s) moved:`);
    for (const m of result.moves) {
      lines.push(`    ${m.sourceFile} → ${m.targetFile} (${m.docType})`);
    }
  }

  // Affected files from recode propagation
  if (result.affectedFiles.length > 0) {
    lines.push('');
    lines.push(
      `  ${result.totalReplacements} replacement(s) in ${result.affectedFiles.length} file(s):`
    );
    for (const file of result.affectedFiles) {
      lines.push(`    ${file.filePath} (${file.replacements.length})`);
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
 * Format merge results as JSON for CI consumption.
 */
export function formatJson(result: MergeResult): string {
  const output = {
    sourceCode: result.sourceCode,
    targetCode: result.targetCode,
    noChange: result.noChange,
    map: Object.fromEntries(result.map.entries),
    moves: result.moves.map((m) => ({
      sourceFile: m.sourceFile,
      targetFile: m.targetFile,
      docType: m.docType,
    })),
    staleRefs: result.staleRefs,
    affectedFiles: result.affectedFiles.map((f) => ({
      filePath: f.filePath,
      replacements: f.replacements.map((r) => ({
        line: r.line,
        oldId: r.oldId,
        newId: r.newId,
      })),
    })),
    totalReplacements: result.totalReplacements,
  };

  return JSON.stringify(output, null, 2);
}
