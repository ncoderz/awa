// @awa-component: TTST-Reporter
// @awa-impl: TTST-6_AC-1
// @awa-impl: TTST-10_AC-1

import chalk from 'chalk';
import type { FixtureResult, TestSuiteResult } from './types.js';

// @awa-impl: TTST-6_AC-1
export function report(result: TestSuiteResult, options?: { json?: boolean }): void {
  if (options?.json) {
    reportJson(result);
    return;
  }

  console.log('');

  for (const fixture of result.results) {
    reportFixture(fixture);
  }

  // Summary
  console.log('');
  console.log(chalk.bold('Test Summary:'));
  console.log(`  Total:  ${result.total}`);
  console.log(chalk.green(`  Passed: ${result.passed}`));
  if (result.failed > 0) {
    console.log(chalk.red(`  Failed: ${result.failed}`));
  }
  console.log('');
}

function reportJson(result: TestSuiteResult): void {
  const output = {
    total: result.total,
    passed: result.passed,
    failed: result.failed,
    results: result.results.map((r) => ({
      name: r.name,
      passed: r.passed,
      ...(r.error ? { error: r.error } : {}),
      fileResults: r.fileResults.map((f) => ({
        path: f.path,
        found: f.found,
      })),
      snapshotResults: r.snapshotResults.map((s) => ({
        path: s.path,
        status: s.status,
      })),
    })),
  };
  console.log(JSON.stringify(output, null, 2));
}

function reportFixture(fixture: FixtureResult): void {
  const icon = fixture.passed ? chalk.green('✔') : chalk.red('✖');
  console.log(`${icon} ${fixture.name}`);

  if (fixture.error) {
    console.log(chalk.red(`    Error: ${fixture.error}`));
    return;
  }

  // Report missing files
  const missingFiles = fixture.fileResults.filter((r) => !r.found);
  for (const missing of missingFiles) {
    console.log(chalk.red(`    Missing file: ${missing.path}`));
  }

  // Report snapshot mismatches
  const snapshotFailures = fixture.snapshotResults.filter((r) => r.status !== 'match');
  for (const failure of snapshotFailures) {
    switch (failure.status) {
      case 'mismatch':
        console.log(chalk.yellow(`    Snapshot mismatch: ${failure.path}`));
        break;
      case 'missing-snapshot':
        console.log(chalk.yellow(`    Missing snapshot: ${failure.path}`));
        break;
      case 'extra-snapshot':
        console.log(chalk.yellow(`    Extra snapshot (not in output): ${failure.path}`));
        break;
    }
  }
}
