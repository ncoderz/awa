// @awa-component: VAL-Reporter
// @awa-impl: VAL-9_AC-1

import chalk from 'chalk';
import type { Finding } from './types.js';

// @awa-impl: VAL-9_AC-1
export function report(findings: readonly Finding[], format: 'text' | 'json'): void {
  if (format === 'json') {
    reportJson(findings);
  } else {
    reportText(findings);
  }
}

function reportJson(findings: readonly Finding[]): void {
  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');

  const output = {
    valid: errors.length === 0,
    errors: errors.length,
    warnings: warnings.length,
    findings: findings.map((f) => ({
      severity: f.severity,
      code: f.code,
      message: f.message,
      ...(f.filePath ? { filePath: f.filePath } : {}),
      ...(f.line ? { line: f.line } : {}),
      ...(f.id ? { id: f.id } : {}),
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

function reportText(findings: readonly Finding[]): void {
  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');

  if (errors.length > 0) {
    console.log(chalk.red(`\n${errors.length} error(s):\n`));
    for (const f of errors) {
      const location = formatLocation(f.filePath, f.line);
      console.log(chalk.red('  ✖'), f.message, location ? chalk.dim(location) : '');
    }
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow(`\n${warnings.length} warning(s):\n`));
    for (const f of warnings) {
      const location = formatLocation(f.filePath, f.line);
      console.log(chalk.yellow('  ⚠'), f.message, location ? chalk.dim(location) : '');
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(chalk.green('\n✔ Validation passed — no issues found'));
  } else {
    console.log('');
    const parts: string[] = [];
    if (errors.length > 0) parts.push(chalk.red(`${errors.length} error(s)`));
    if (warnings.length > 0) parts.push(chalk.yellow(`${warnings.length} warning(s)`));
    console.log(`Summary: ${parts.join(', ')}`);
  }
}

function formatLocation(filePath?: string, line?: number): string {
  if (!filePath) return '';
  return line ? `(${filePath}:${line})` : `(${filePath})`;
}
