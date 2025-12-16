// @zen-component: ConfigLoader
// @zen-impl: CFG-1 AC-1.1
// @zen-impl: CFG-1 AC-1.2
// @zen-impl: CFG-1 AC-1.3
// @zen-impl: CFG-1 AC-1.4
// @zen-impl: CFG-2 AC-2.1
// @zen-impl: CFG-2 AC-2.2
// @zen-impl: CFG-2 AC-2.3
// @zen-impl: CFG-3 AC-3.1
// @zen-impl: CFG-3 AC-3.2
// @zen-impl: CFG-3 AC-3.3
// @zen-impl: CFG-3 AC-3.4
// @zen-impl: CFG-3 AC-3.5
// @zen-impl: CFG-3 AC-3.6
// @zen-impl: CFG-4 AC-4.1
// @zen-impl: CFG-4 AC-4.2
// @zen-impl: CFG-4 AC-4.3
// @zen-impl: CFG-4 AC-4.4
// @zen-impl: CFG-5 AC-5.1
// @zen-impl: CFG-6 AC-6.1
// @zen-impl: CFG-6 AC-6.2
// @zen-impl: CLI-1 AC-1.4
// @zen-impl: CLI-2 AC-2.2
// @zen-impl: CLI-2 AC-2.3
// @zen-impl: CLI-2 AC-2.4
// @zen-impl: CLI-4 AC-4.3
// @zen-impl: CLI-7 AC-7.2

import { parse } from 'smol-toml';
import {
  ConfigError,
  type FileConfig,
  type PresetDefinitions,
  type RawCliOptions,
  type ResolvedOptions,
} from '../types/index.js';
import { pathExists, readTextFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

const DEFAULT_CONFIG_PATH = '.zen.toml';

export class ConfigLoader {
  // @zen-impl: CFG-1 AC-1.1, CFG-1 AC-1.2, CFG-1 AC-1.3, CFG-1 AC-1.4
  async load(configPath: string | null): Promise<FileConfig | null> {
    const pathToLoad = configPath ?? DEFAULT_CONFIG_PATH;

    // Check if file exists
    const exists = await pathExists(pathToLoad);

    // If explicit path provided but doesn't exist, error
    if (configPath && !exists) {
      throw new ConfigError(
        `Configuration file not found: ${configPath}`,
        'FILE_NOT_FOUND',
        configPath
      );
    }

    // If default path doesn't exist, return null (no error)
    if (!configPath && !exists) {
      return null;
    }

    // Read and parse TOML
    try {
      const content = await readTextFile(pathToLoad);
      const parsed = parse(content) as Record<string, unknown>;

      // Validate and extract known options
      const config: FileConfig = {};

      if (parsed.output !== undefined) {
        if (typeof parsed.output !== 'string') {
          throw new ConfigError(
            `Invalid type for 'output': expected string, got ${typeof parsed.output}`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.output = parsed.output;
      }

      if (parsed.template !== undefined) {
        if (typeof parsed.template !== 'string') {
          throw new ConfigError(
            `Invalid type for 'template': expected string, got ${typeof parsed.template}`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.template = parsed.template;
      }

      if (parsed.features !== undefined) {
        if (
          !Array.isArray(parsed.features) ||
          !parsed.features.every((f) => typeof f === 'string')
        ) {
          throw new ConfigError(
            `Invalid type for 'features': expected array of strings`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.features = parsed.features;
      }

      if (parsed.preset !== undefined) {
        if (!Array.isArray(parsed.preset) || !parsed.preset.every((p) => typeof p === 'string')) {
          throw new ConfigError(
            `Invalid type for 'preset': expected array of strings`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.preset = parsed.preset;
      }

      if (parsed['remove-features'] !== undefined) {
        if (
          !Array.isArray(parsed['remove-features']) ||
          !parsed['remove-features'].every((f) => typeof f === 'string')
        ) {
          throw new ConfigError(
            `Invalid type for 'remove-features': expected array of strings`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config['remove-features'] = parsed['remove-features'];
      }

      if (parsed.force !== undefined) {
        if (typeof parsed.force !== 'boolean') {
          throw new ConfigError(
            `Invalid type for 'force': expected boolean, got ${typeof parsed.force}`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.force = parsed.force;
      }

      if (parsed['dry-run'] !== undefined) {
        if (typeof parsed['dry-run'] !== 'boolean') {
          throw new ConfigError(
            `Invalid type for 'dry-run': expected boolean, got ${typeof parsed['dry-run']}`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config['dry-run'] = parsed['dry-run'];
      }

      if (parsed.refresh !== undefined) {
        if (typeof parsed.refresh !== 'boolean') {
          throw new ConfigError(
            `Invalid type for 'refresh': expected boolean, got ${typeof parsed.refresh}`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.refresh = parsed.refresh;
      }

      if (parsed.presets !== undefined) {
        if (
          parsed.presets === null ||
          typeof parsed.presets !== 'object' ||
          Array.isArray(parsed.presets)
        ) {
          throw new ConfigError(
            `Invalid type for 'presets': expected table of string arrays`,
            'INVALID_PRESET',
            pathToLoad
          );
        }

        const defs: PresetDefinitions = {};
        for (const [presetName, value] of Object.entries(
          parsed.presets as Record<string, unknown>
        )) {
          if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
            throw new ConfigError(
              `Invalid preset '${presetName}': expected array of strings`,
              'INVALID_PRESET',
              pathToLoad
            );
          }
          defs[presetName] = value as string[];
        }

        config.presets = defs;
      }

      if (parsed['list-unknown'] !== undefined) {
        if (typeof parsed['list-unknown'] !== 'boolean') {
          throw new ConfigError(
            `Invalid type for 'list-unknown': expected boolean, got ${typeof parsed['list-unknown']}`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config['list-unknown'] = parsed['list-unknown'];
      }

      // Warn about unknown options
      const knownKeys = new Set([
        'output',
        'template',
        'features',
        'preset',
        'remove-features',
        'presets',
        'force',
        'dry-run',
        'refresh',
        'list-unknown',
      ]);
      for (const key of Object.keys(parsed)) {
        if (!knownKeys.has(key)) {
          logger.warn(`Unknown configuration option: '${key}'`);
        }
      }

      return config;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }

      // TOML parsing error
      throw new ConfigError(
        `Failed to parse TOML configuration: ${error instanceof Error ? error.message : String(error)}`,
        'PARSE_ERROR',
        pathToLoad
      );
    }
  }

  // @zen-impl: CFG-4 AC-4.1, CFG-4 AC-4.2, CFG-4 AC-4.3, CFG-4 AC-4.4
  // @zen-impl: CLI-2 AC-2.2, CLI-2 AC-2.3, CLI-2 AC-2.4
  merge(cli: RawCliOptions, file: FileConfig | null): ResolvedOptions {
    // CLI arguments override file config values
    // Output can come from CLI (positional argument) or config file

    // @zen-impl: CLI-2 AC-2.2, CLI-2 AC-2.3
    const output = cli.output ?? file?.output;

    // @zen-impl: CLI-1 AC-1.4, CLI-2 AC-2.4
    if (!output) {
      throw new ConfigError(
        'Output directory is required. Provide it as a positional argument or in the config file.',
        'MISSING_OUTPUT',
        null
      );
    }

    const template = cli.template ?? file?.template ?? null;

    // Features: CLI completely replaces config (no merge)
    const features = cli.features ?? file?.features ?? [];

    const preset = cli.preset ?? file?.preset ?? [];
    const removeFeatures = cli.removeFeatures ?? file?.['remove-features'] ?? [];
    const presets = file?.presets ?? {};

    const force = cli.force ?? file?.force ?? false;
    const dryRun = cli.dryRun ?? file?.['dry-run'] ?? false;
    const refresh = cli.refresh ?? file?.refresh ?? false;
    const listUnknown = cli.listUnknown ?? file?.['list-unknown'] ?? false;

    return {
      output,
      template,
      features,
      preset,
      removeFeatures,
      force,
      dryRun,
      refresh,
      presets,
      listUnknown,
    };
  }
}

export const configLoader = new ConfigLoader();
