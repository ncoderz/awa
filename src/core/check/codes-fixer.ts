// @awa-component: CHK-CodesFixer
// @awa-impl: CHK-25_AC-1
// @awa-impl: CHK-25_AC-2

import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { scanCodes } from '../codes/scanner.js';
import type { FixResult } from './matrix-fixer.js';
import type { CheckConfig, SpecParseResult } from './types.js';

export interface CodesFixResult extends FixResult {
  /** Codes that have no scope boundary text. */
  readonly emptyScopeCodes: readonly string[];
}

/**
 * Regenerate the "Feature Codes" table in ARCHITECTURE.md from spec data.
 * Returns whether the file was modified and any codes missing scope text.
 */
export async function fixCodesTable(
  specs: SpecParseResult,
  config: Pick<CheckConfig, 'specGlobs' | 'specIgnore'>
): Promise<CodesFixResult> {
  // Find ARCHITECTURE.md in spec files
  const archFile = specs.specFiles.find((sf) => basename(sf.filePath) === 'ARCHITECTURE.md');

  if (!archFile) {
    return { filesFixed: 0, fileResults: [], emptyScopeCodes: [] };
  }

  let content: string;
  try {
    content = await readFile(archFile.filePath, 'utf-8');
  } catch {
    return { filesFixed: 0, fileResults: [], emptyScopeCodes: [] };
  }

  // Check if ## Feature Codes section exists
  const lines = content.split('\n');
  const sectionStart = lines.findIndex((l) => /^##\s+Feature Codes\s*$/.test(l));
  if (sectionStart === -1) {
    return { filesFixed: 0, fileResults: [], emptyScopeCodes: [] };
  }

  // Scan codes from spec data
  const codesResult = await scanCodes(specs.specFiles, config.specGlobs, config.specIgnore);

  // Generate new table
  const tableLines: string[] = [];
  tableLines.push('');
  tableLines.push(
    'Run `awa spec codes` for the live inventory. The table below defines scope boundaries.'
  );
  tableLines.push('');
  tableLines.push('| Code | Feature | Scope Boundary |');
  tableLines.push('|------|---------|----------------|');

  const emptyScopeCodes: string[] = [];

  for (const code of codesResult.codes) {
    const scope = code.scope || '';
    if (!scope) {
      emptyScopeCodes.push(code.code);
    }
    tableLines.push(`| ${code.code} | ${code.feature} | ${scope} |`);
  }

  const newSection = tableLines.join('\n');

  // Replace section content
  const newContent = replaceFeatureCodesSection(content, sectionStart, newSection);
  if (newContent === content) {
    return {
      filesFixed: 0,
      fileResults: [{ filePath: archFile.filePath, changed: false }],
      emptyScopeCodes,
    };
  }

  await writeFile(archFile.filePath, newContent, 'utf-8');
  return {
    filesFixed: 1,
    fileResults: [{ filePath: archFile.filePath, changed: true }],
    emptyScopeCodes,
  };
}

/**
 * Replace the content of the Feature Codes section (between ## Feature Codes and the next ## heading).
 */
function replaceFeatureCodesSection(
  content: string,
  sectionStart: number,
  newSection: string
): string {
  const lines = content.split('\n');

  // Find the next ## heading after the section start
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && /^##\s/.test(line)) {
      sectionEnd = i;
      break;
    }
  }

  const before = lines.slice(0, sectionStart + 1);
  const after = lines.slice(sectionEnd);

  const result = [...before, newSection.trimEnd(), '', ...after];
  return result.join('\n');
}
