// @awa-component: CLI-CodesFixer
// @awa-impl: CLI-40_AC-1
// @awa-impl: CLI-40_AC-2

import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { scanCodes } from '../codes/scanner.js';
import type { FixResult } from './matrix-fixer.js';
import type { CheckConfig, SpecFile, SpecParseResult } from './types.js';

/** Escape characters that would break a Markdown table cell. */
function sanitizeCell(value: string): string {
  return value
    .replace(/\|/g, '\\|')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

export interface CodesFixResult extends FixResult {
  /** Codes that have no scope boundary text. */
  readonly emptyScopeCodes: readonly string[];
}

/** Basenames eligible for Feature Codes table auto-generation. */
const FEATURE_CODES_BASENAMES = new Set(['ARCHITECTURE.md', 'PROJECT.md']);

/**
 * Regenerate the "Feature Codes" table in any spec file that has one
 * (typically ARCHITECTURE.md and/or PROJECT.md).
 * Returns whether any files were modified and any codes missing scope text.
 */
export async function fixCodesTable(
  specs: SpecParseResult,
  config: Pick<CheckConfig, 'specGlobs' | 'specIgnore'>,
): Promise<CodesFixResult> {
  // Find all eligible spec files
  const candidateFiles = specs.specFiles.filter((sf) =>
    FEATURE_CODES_BASENAMES.has(basename(sf.filePath)),
  );

  if (candidateFiles.length === 0) {
    return { filesFixed: 0, fileResults: [], emptyScopeCodes: [] };
  }

  // Load content for each candidate and filter to those with Feature Codes heading
  const targets: { file: SpecFile; content: string; sectionStart: number; headingLevel: number }[] =
    [];
  for (const file of candidateFiles) {
    let content: string;
    if (file.content != null) {
      content = file.content;
    } else {
      try {
        content = await readFile(file.filePath, 'utf-8');
      } catch {
        continue;
      }
    }
    const lines = content.split('\n');
    const sectionStart = lines.findIndex((l) => /^#{2,3}\s+Feature Codes\s*$/.test(l));
    if (sectionStart !== -1) {
      const headingLevel = lines[sectionStart]!.startsWith('###') ? 3 : 2;
      targets.push({ file, content, sectionStart, headingLevel });
    }
  }

  if (targets.length === 0) {
    return { filesFixed: 0, fileResults: [], emptyScopeCodes: [] };
  }

  // Scan codes once (shared across all target files)
  const codesResult = await scanCodes(specs.specFiles, config.specGlobs, config.specIgnore);

  // Generate new table
  const tableLines: string[] = [];
  tableLines.push('');
  tableLines.push(
    'Run `awa spec codes` for the live inventory. The table below defines scope boundaries.',
  );
  tableLines.push('');
  tableLines.push('| Code | Feature | Scope Boundary |');
  tableLines.push('|------|---------|----------------|');

  const emptyScopeCodes: string[] = [];

  for (const code of codesResult.codes) {
    const scope = sanitizeCell(code.scope || '');
    if (!scope) {
      emptyScopeCodes.push(code.code);
    }
    tableLines.push(`| ${sanitizeCell(code.code)} | ${sanitizeCell(code.feature)} | ${scope} |`);
  }

  const newSection = tableLines.join('\n');

  // Replace section content in each target file
  let filesFixed = 0;
  const fileResults: { filePath: string; changed: boolean }[] = [];

  for (const { file, content, sectionStart, headingLevel } of targets) {
    const newContent = replaceFeatureCodesSection(content, sectionStart, headingLevel, newSection);
    if (newContent === content) {
      fileResults.push({ filePath: file.filePath, changed: false });
      continue;
    }
    await writeFile(file.filePath, newContent, 'utf-8');
    filesFixed++;
    fileResults.push({ filePath: file.filePath, changed: true });
  }

  return { filesFixed, fileResults, emptyScopeCodes };
}

/**
 * Replace the content of the Feature Codes section
 * (between the heading and the next heading at the same or higher level).
 */
function replaceFeatureCodesSection(
  content: string,
  sectionStart: number,
  headingLevel: number,
  newSection: string,
): string {
  const lines = content.split('\n');

  // Build a regex that matches any heading at the same or higher (fewer #) level.
  // For ### (level 3): stop at ## or ###. For ## (level 2): stop at ##.
  const endPattern = new RegExp(`^#{2,${headingLevel}}\\s`);

  // Find the next heading at the same or higher level after the section start
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && endPattern.test(line)) {
      sectionEnd = i;
      break;
    }
  }

  const before = lines.slice(0, sectionStart + 1);
  const after = lines.slice(sectionEnd);

  const result = [...before, newSection.trimEnd(), '', ...after];
  return result.join('\n');
}
