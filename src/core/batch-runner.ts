// @awa-component: MULTI-BatchRunner
// @awa-impl: MULTI-4_AC-1
// @awa-impl: MULTI-4_AC-2
// @awa-impl: MULTI-8_AC-1
// @awa-impl: MULTI-9_AC-1

import {
  ConfigError,
  type FileConfig,
  type RawCliOptions,
  type ResolvedOptions,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { configLoader } from './config.js';

export interface BatchTargetResult {
  targetName: string;
  options: ResolvedOptions;
}

export class BatchRunner {
  // Resolve all targets or a single named target from config
  resolveTargets(
    cli: RawCliOptions,
    fileConfig: FileConfig | null,
    mode: 'all' | 'single',
    targetName?: string
  ): BatchTargetResult[] {
    if (!fileConfig) {
      throw new ConfigError(
        'No configuration file found. --all and --target require a config file with [targets.*] sections.',
        'NO_TARGETS',
        null
      );
    }

    const targetNames = configLoader.getTargetNames(fileConfig);

    if (targetNames.length === 0) {
      throw new ConfigError(
        'No targets defined in configuration. Add [targets.<name>] sections to .awa.toml.',
        'NO_TARGETS',
        null
      );
    }

    const namesToProcess = mode === 'all' ? targetNames : [targetName as string];

    const results: BatchTargetResult[] = [];

    for (const name of namesToProcess) {
      const resolved = configLoader.resolveTarget(name, fileConfig);

      // Build CLI options for this target:
      // - When --all, ignore CLI positional output
      // - When --target, CLI positional overrides target output
      const targetCli: RawCliOptions = {
        ...cli,
        output: mode === 'all' ? undefined : cli.output,
      };

      let options: ResolvedOptions;
      try {
        options = configLoader.merge(targetCli, resolved);
      } catch (error) {
        // Re-throw MISSING_OUTPUT with target-specific message
        if (error instanceof ConfigError && error.code === 'MISSING_OUTPUT') {
          throw new ConfigError(
            `Target '${name}' has no output directory. Specify 'output' in [targets.${name}] or in the root config.`,
            'MISSING_OUTPUT',
            null
          );
        }
        throw error;
      }

      results.push({ targetName: name, options });
    }

    return results;
  }

  // Log a message prefixed with target name
  logForTarget(targetName: string, message: string): void {
    logger.info(`[${targetName}] ${message}`);
  }

  warnForTarget(targetName: string, message: string): void {
    logger.warn(`[${targetName}] ${message}`);
  }

  errorForTarget(targetName: string, message: string): void {
    logger.error(`[${targetName}] ${message}`);
  }
}

export const batchRunner = new BatchRunner();
