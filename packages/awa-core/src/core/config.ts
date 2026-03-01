// @awa-component: CFG-ConfigLoader
// @awa-component: MULTI-TargetResolver
// @awa-impl: CFG-1_AC-1
// @awa-impl: CFG-1_AC-2
// @awa-impl: CFG-1_AC-3
// @awa-impl: CFG-1_AC-4
// @awa-impl: CFG-2_AC-1
// @awa-impl: CFG-2_AC-2
// @awa-impl: CFG-2_AC-3
// @awa-impl: CFG-3_AC-1
// @awa-impl: CFG-3_AC-2
// @awa-impl: CFG-3_AC-3
// @awa-impl: CFG-3_AC-4
// @awa-impl: CFG-3_AC-5
// @awa-impl: CFG-3_AC-6
// @awa-impl: CFG-3_AC-7
// @awa-impl: CFG-3_AC-8
// @awa-impl: CFG-3_AC-9
// @awa-impl: CFG-3_AC-10
// @awa-impl: CFG-4_AC-1
// @awa-impl: CFG-4_AC-2
// @awa-impl: CFG-4_AC-3
// @awa-impl: CFG-4_AC-4
// @awa-impl: CFG-5_AC-1
// @awa-impl: CFG-6_AC-1
// @awa-impl: CFG-6_AC-2
// @awa-impl: CLI-1_AC-4
// @awa-impl: CLI-2_AC-2
// @awa-impl: CLI-2_AC-3
// @awa-impl: CLI-2_AC-4
// @awa-impl: CLI-4_AC-3
// @awa-impl: CLI-7_AC-2
// @awa-impl: FP-1_AC-1
// @awa-impl: FP-1_AC-2
// @awa-impl: FP-1_AC-3
// @awa-impl: FP-1_AC-4
// @awa-impl: FP-3_AC-1
// @awa-impl: FP-3_AC-2
// @awa-impl: FP-3_AC-3
// @awa-impl: FP-5_AC-1
// @awa-impl: FP-5_AC-2
// @awa-impl: FP-5_AC-3
// @awa-impl: MULTI-1_AC-1
// @awa-impl: MULTI-2_AC-1
// @awa-impl: MULTI-3_AC-1
// @awa-impl: MULTI-5_AC-2

import { parse } from 'smol-toml';
import {
  ConfigError,
  type FileConfig,
  type PresetDefinitions,
  type RawCliOptions,
  type ResolvedOptions,
  type TargetConfig,
  type UpdateCheckConfig,
} from '../types/index.js';
import { pathExists, readTextFile } from '../utils/fs.js';

const DEFAULT_CONFIG_PATH = '.awa.toml';

export class ConfigLoader {
  constructor(private readonly onWarn: (msg: string) => void = () => {}) {}
  // @awa-impl: CFG-1_AC-1, CFG-1_AC-2, CFG-1_AC-3, CFG-1_AC-4
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

      if (parsed.delete !== undefined) {
        if (typeof parsed.delete !== 'boolean') {
          throw new ConfigError(
            `Invalid type for 'delete': expected boolean, got ${typeof parsed.delete}`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.delete = parsed.delete;
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

      // @awa-impl: CHK-16_AC-1
      // Pass through [check] table as-is for check command to process
      if (parsed.check !== undefined) {
        if (
          parsed.check === null ||
          typeof parsed.check !== 'object' ||
          Array.isArray(parsed.check)
        ) {
          throw new ConfigError(
            `Invalid type for 'check': expected table`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.check = parsed.check as Record<string, unknown>;
      }

      // @awa-impl: OVL-8_AC-1
      if (parsed.overlay !== undefined) {
        if (!Array.isArray(parsed.overlay) || !parsed.overlay.every((o) => typeof o === 'string')) {
          throw new ConfigError(
            `Invalid type for 'overlay': expected array of strings`,
            'INVALID_TYPE',
            pathToLoad
          );
        }
        config.overlay = parsed.overlay;
      }

      if (parsed['update-check'] !== undefined) {
        if (
          parsed['update-check'] === null ||
          typeof parsed['update-check'] !== 'object' ||
          Array.isArray(parsed['update-check'])
        ) {
          throw new ConfigError(
            `Invalid type for 'update-check': expected table`,
            'INVALID_TYPE',
            pathToLoad
          );
        }

        const raw = parsed['update-check'] as Record<string, unknown>;
        const updateCheckConfig: UpdateCheckConfig = {};

        if (raw.enabled !== undefined) {
          if (typeof raw.enabled !== 'boolean') {
            throw new ConfigError(
              `Invalid type for 'update-check.enabled': expected boolean, got ${typeof raw.enabled}`,
              'INVALID_TYPE',
              pathToLoad
            );
          }
          updateCheckConfig.enabled = raw.enabled;
        }

        if (raw.interval !== undefined) {
          if (typeof raw.interval !== 'number') {
            throw new ConfigError(
              `Invalid type for 'update-check.interval': expected number, got ${typeof raw.interval}`,
              'INVALID_TYPE',
              pathToLoad
            );
          }
          updateCheckConfig.interval = raw.interval;
        }

        config['update-check'] = updateCheckConfig;
      }

      // Parse [targets.*] sections
      if (parsed.targets !== undefined) {
        if (
          parsed.targets === null ||
          typeof parsed.targets !== 'object' ||
          Array.isArray(parsed.targets)
        ) {
          throw new ConfigError(
            `Invalid type for 'targets': expected table of target sections`,
            'INVALID_TYPE',
            pathToLoad
          );
        }

        const targets: Record<string, TargetConfig> = {};
        for (const [targetName, targetValue] of Object.entries(
          parsed.targets as Record<string, unknown>
        )) {
          if (
            targetValue === null ||
            typeof targetValue !== 'object' ||
            Array.isArray(targetValue)
          ) {
            throw new ConfigError(
              `Invalid target '${targetName}': expected table`,
              'INVALID_TYPE',
              pathToLoad
            );
          }
          targets[targetName] = this.parseTargetSection(
            targetValue as Record<string, unknown>,
            targetName,
            pathToLoad
          );
        }
        config.targets = targets;
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
        'delete',
        'refresh',
        'list-unknown',
        'check',
        'targets',
        'overlay',
        'update-check',
      ]);
      for (const key of Object.keys(parsed)) {
        if (!knownKeys.has(key)) {
          this.onWarn(`Unknown configuration option: '${key}'`);
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

  // @awa-impl: CFG-4_AC-1, CFG-4_AC-2, CFG-4_AC-3, CFG-4_AC-4
  // @awa-impl: CLI-2_AC-2, CLI-2_AC-3, CLI-2_AC-4
  merge(cli: RawCliOptions, file: FileConfig | null): ResolvedOptions {
    // CLI arguments override file config values
    // Output can come from CLI (positional argument) or config file

    // @awa-impl: CLI-2_AC-2, CLI-2_AC-3
    const output = cli.output ?? file?.output;

    // @awa-impl: CLI-1_AC-4, CLI-2_AC-4
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
    const enableDelete = cli.delete ?? file?.delete ?? false;
    const refresh = cli.refresh ?? file?.refresh ?? false;
    const listUnknown = cli.listUnknown ?? file?.['list-unknown'] ?? false;
    const overlay = cli.overlay ?? file?.overlay ?? [];
    const json = cli.json ?? false;
    const summary = cli.summary ?? false;

    return {
      output,
      template,
      features,
      preset,
      removeFeatures,
      force,
      dryRun,
      delete: enableDelete,
      refresh,
      presets,
      listUnknown,
      overlay,
      json,
      summary,
    };
  }

  // Parse a [targets.<name>] section, validating allowed keys and types
  private parseTargetSection(
    section: Record<string, unknown>,
    targetName: string,
    configPath: string
  ): TargetConfig {
    const target: TargetConfig = {};
    const allowedKeys = new Set(['output', 'template', 'features', 'preset', 'remove-features']);

    for (const key of Object.keys(section)) {
      if (!allowedKeys.has(key)) {
        this.onWarn(`Unknown option in target '${targetName}': '${key}'`);
      }
    }

    if (section.output !== undefined) {
      if (typeof section.output !== 'string') {
        throw new ConfigError(
          `Invalid type for 'targets.${targetName}.output': expected string, got ${typeof section.output}`,
          'INVALID_TYPE',
          configPath
        );
      }
      target.output = section.output;
    }

    if (section.template !== undefined) {
      if (typeof section.template !== 'string') {
        throw new ConfigError(
          `Invalid type for 'targets.${targetName}.template': expected string, got ${typeof section.template}`,
          'INVALID_TYPE',
          configPath
        );
      }
      target.template = section.template;
    }

    if (section.features !== undefined) {
      if (
        !Array.isArray(section.features) ||
        !section.features.every((f) => typeof f === 'string')
      ) {
        throw new ConfigError(
          `Invalid type for 'targets.${targetName}.features': expected array of strings`,
          'INVALID_TYPE',
          configPath
        );
      }
      target.features = section.features;
    }

    if (section.preset !== undefined) {
      if (!Array.isArray(section.preset) || !section.preset.every((p) => typeof p === 'string')) {
        throw new ConfigError(
          `Invalid type for 'targets.${targetName}.preset': expected array of strings`,
          'INVALID_TYPE',
          configPath
        );
      }
      target.preset = section.preset;
    }

    if (section['remove-features'] !== undefined) {
      if (
        !Array.isArray(section['remove-features']) ||
        !section['remove-features'].every((f) => typeof f === 'string')
      ) {
        throw new ConfigError(
          `Invalid type for 'targets.${targetName}.remove-features': expected array of strings`,
          'INVALID_TYPE',
          configPath
        );
      }
      target['remove-features'] = section['remove-features'];
    }

    return target;
  }

  // Resolve a target by merging target config with root config (target overrides root via nullish coalescing)
  resolveTarget(targetName: string, fileConfig: FileConfig): FileConfig {
    const targets = fileConfig.targets;
    if (!targets || Object.keys(targets).length === 0) {
      throw new ConfigError(
        'No targets defined in configuration. Add [targets.<name>] sections to .awa.toml.',
        'NO_TARGETS',
        null
      );
    }

    const target = targets[targetName];
    if (!target) {
      throw new ConfigError(
        `Unknown target: '${targetName}'. Available targets: ${Object.keys(targets).join(', ')}`,
        'UNKNOWN_TARGET',
        null
      );
    }

    // Merge: target fields override root (nullish coalescing — target value ?? root value)
    return {
      ...fileConfig,
      output: target.output ?? fileConfig.output,
      template: target.template ?? fileConfig.template,
      features: target.features ?? fileConfig.features,
      preset: target.preset ?? fileConfig.preset,
      'remove-features': target['remove-features'] ?? fileConfig['remove-features'],
      targets: undefined, // Don't propagate targets into resolved config
    };
  }

  // Get all target names from config
  getTargetNames(fileConfig: FileConfig | null): string[] {
    if (!fileConfig?.targets) {
      return [];
    }
    return Object.keys(fileConfig.targets);
  }
}

export const configLoader = new ConfigLoader();
