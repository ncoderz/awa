import chalk from 'chalk';
import type { CodesResult } from './types.js';

/** JSON output structure for --json mode. */
export interface CodesJsonOutput {
  codes: Array<{
    code: string;
    feature: string;
    reqCount: number;
    docs: string;
    scope: string;
  }>;
  totalCodes: number;
}

/** Format doc types as a compact F·R·D·A·E string. */
function formatDocs(docs: {
  feat: boolean;
  req: boolean;
  design: boolean;
  api: boolean;
  example: boolean;
}): string {
  return [
    docs.feat ? 'F' : '·',
    docs.req ? 'R' : '·',
    docs.design ? 'D' : '·',
    docs.api ? 'A' : '·',
    docs.example ? 'E' : '·',
  ].join('');
}

/** Build the JSON output object. */
export function buildJsonOutput(result: CodesResult): CodesJsonOutput {
  return {
    codes: result.codes.map((c) => ({
      code: c.code,
      feature: c.feature,
      reqCount: c.reqCount,
      docs: formatDocs(c.docs),
      scope: c.scope,
    })),
    totalCodes: result.codes.length,
  };
}

/** Format result as JSON string. */
export function formatJson(result: CodesResult): string {
  return JSON.stringify(buildJsonOutput(result), null, 2);
}

/** Format result as a human-readable table. */
export function formatTable(result: CodesResult): string {
  const { codes } = result;

  if (codes.length === 0) {
    return chalk.yellow('No feature codes found.');
  }

  // Calculate column widths
  const codeWidth = Math.max(4, ...codes.map((c) => c.code.length));
  const featureWidth = Math.max(7, ...codes.map((c) => c.feature.length));
  const reqWidth = 4;
  const docsWidth = 5; // FRDAE is always 5 chars

  // Header
  const header = [
    'CODE'.padEnd(codeWidth),
    'Feature'.padEnd(featureWidth),
    'Reqs'.padStart(reqWidth),
    'Docs'.padEnd(docsWidth),
    'Scope',
  ].join('  ');

  const separator = [
    '─'.repeat(codeWidth),
    '─'.repeat(featureWidth),
    '─'.repeat(reqWidth),
    '─'.repeat(docsWidth),
    '─'.repeat(40),
  ].join('  ');

  // Rows
  const rows = codes.map((c) => {
    const docs = formatDocs(c.docs);
    return [
      chalk.cyan(c.code.padEnd(codeWidth)),
      c.feature.padEnd(featureWidth),
      String(c.reqCount).padStart(reqWidth),
      docs,
      chalk.dim(c.scope),
    ].join('  ');
  });

  return [chalk.bold(`Feature codes (${codes.length}):\n`), header, separator, ...rows].join('\n');
}

/** Format result as a compact one-line summary. */
export function formatSummary(result: CodesResult): string {
  return `codes: ${result.codes.length}`;
}
