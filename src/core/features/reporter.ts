// @awa-component: DISC-Reporter
// @awa-impl: DISC-6_AC-1
// @awa-impl: DISC-7_AC-1

import chalk from 'chalk';
import type { PresetDefinitions } from '../../types/index.js';
import type { ScanResult } from './scanner.js';

/** Options for rendering the features report. */
export interface ReportOptions {
  /** Scan results from the feature scanner. */
  scanResult: ScanResult;
  /** Whether to output JSON instead of a human-readable table. */
  json: boolean;
  /** Preset definitions from the user's .awa.toml, if available. */
  presets?: PresetDefinitions;
}

/** JSON output structure for --json mode. */
export interface FeaturesJsonOutput {
  features: Array<{
    name: string;
    files: string[];
  }>;
  presets?: Record<string, string[]>;
  filesScanned: number;
}

export class FeaturesReporter {
  // @awa-impl: DISC-6_AC-1, DISC-7_AC-1
  /** Render the features report to stdout. */
  report(options: ReportOptions): void {
    const { scanResult, json, presets } = options;

    if (json) {
      this.reportJson(scanResult, presets);
    } else {
      this.reportTable(scanResult, presets);
    }
  }

  // @awa-impl: DISC-6_AC-1
  /** Build the JSON output object (also used by tests). */
  buildJsonOutput(scanResult: ScanResult, presets?: PresetDefinitions): FeaturesJsonOutput {
    const output: FeaturesJsonOutput = {
      features: scanResult.features.map((f) => ({
        name: f.name,
        files: f.files,
      })),
      filesScanned: scanResult.filesScanned,
    };

    if (presets && Object.keys(presets).length > 0) {
      output.presets = presets;
    }

    return output;
  }

  private reportJson(scanResult: ScanResult, presets?: PresetDefinitions): void {
    const output = this.buildJsonOutput(scanResult, presets);
    console.log(JSON.stringify(output, null, 2));
  }

  // @awa-impl: DISC-7_AC-1
  private reportTable(scanResult: ScanResult, presets?: PresetDefinitions): void {
    const { features, filesScanned } = scanResult;

    if (features.length === 0) {
      console.log(chalk.yellow('No feature flags found.'));
      console.log(chalk.dim(`(${filesScanned} files scanned)`));
      return;
    }

    console.log(chalk.bold(`Feature flags (${features.length} found):\n`));

    for (const feature of features) {
      console.log(`  ${chalk.cyan(feature.name)}`);
      for (const file of feature.files) {
        console.log(`    ${chalk.dim(file)}`);
      }
    }

    console.log('');
    console.log(chalk.dim(`${filesScanned} files scanned`));

    // Show presets if available
    if (presets && Object.keys(presets).length > 0) {
      console.log('');
      console.log(chalk.bold('Presets (from .awa.toml):\n'));
      for (const [name, flags] of Object.entries(presets)) {
        console.log(`  ${chalk.green(name)}: ${flags.join(', ')}`);
      }
    }
  }
}

export const featuresReporter = new FeaturesReporter();
