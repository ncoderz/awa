// @awa-component: TTST-Reporter
// @awa-impl: TTST-6_AC-1

import chalk from 'chalk';
import type { FixtureResult, TestSuiteResult } from './types.js';

// @awa-impl: TTST-6_AC-1
export function report(result: TestSuiteResult): void {
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
