// @awa-component: CFG-ConfigLoader
// @awa-test: CFG_P-1
// @awa-test: CFG-1_AC-1, CFG-1_AC-2, CFG-1_AC-3, CFG-1_AC-4
// @awa-test: CFG-2_AC-1, CFG-2_AC-2, CFG-2_AC-3
// @awa-test: CFG-3_AC-1, CFG-3_AC-2, CFG-3_AC-3, CFG-3_AC-4, CFG-3_AC-5, CFG-3_AC-6, CFG-3_AC-7, CFG-3_AC-8, CFG-3_AC-9, CFG-3_AC-10
// @awa-test: CFG-4_AC-1, CFG-4_AC-2, CFG-4_AC-3, CFG-4_AC-4
// @awa-test: CFG-5_AC-1, CFG-5_AC-2
// @awa-test: CFG-6_AC-1, CFG-6_AC-2
// @awa-test: MULTI-1_AC-1, MULTI-2_AC-1, MULTI-3_AC-1
// @awa-test: CLI-1_AC-4, CLI-2_AC-2, CLI-2_AC-3, CLI-2_AC-4, CLI-4_AC-3, CLI-7_AC-2
// @awa-test: FP-1_AC-1, FP-1_AC-4, FP-3_AC-1, FP-5_AC-1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConfigError, type FileConfig } from '../../types/index.js';
import { ConfigLoader } from '../config.js';

describe('ConfigLoader', () => {
  let testDir: string;
  let loader: ConfigLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `awa-config-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new ConfigLoader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('load', () => {
    // @awa-test: CFG-1_AC-1, CFG-1_AC-3, CFG-2_AC-1, CFG-2_AC-3
    // @awa-test: CFG-3_AC-1, CFG-3_AC-2, CFG-3_AC-3, CFG-3_AC-4, CFG-3_AC-5, CFG-3_AC-6, CFG-3_AC-8
    it('should parse valid TOML configuration', async () => {
      const configPath = join(testDir, '.awa.toml');
      const tomlContent = `
output = "./out"
template = "user/repo"
features = ["planning", "testing"]
force = true
dry-run = false
refresh = true
list-unknown = true
`;
      await writeFile(configPath, tomlContent);

      const config = await loader.load(configPath);

      expect(config).toEqual({
        output: './out',
        template: 'user/repo',
        features: ['planning', 'testing'],
        force: true,
        'dry-run': false,
        refresh: true,
        'list-unknown': true,
      });
    });

    // @awa-test: CFG-1_AC-1, CFG-1_AC-2
    it('should return null if default config path does not exist', async () => {
      // Change to test directory where no .awa.toml exists
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const config = await loader.load(null);
        expect(config).toBeNull();
      } finally {
        process.chdir(originalCwd);
      }
    });

    // @awa-test: CFG-1_AC-4
    it('should throw error if explicit config path does not exist', async () => {
      const nonexistentPath = join(testDir, 'missing.toml');

      await expect(loader.load(nonexistentPath)).rejects.toThrow(ConfigError);
      await expect(loader.load(nonexistentPath)).rejects.toMatchObject({
        code: 'FILE_NOT_FOUND',
      });
    });

    // @awa-test: CFG-2_AC-2
    it('should throw error on invalid TOML syntax', async () => {
      const configPath = join(testDir, 'invalid.toml');
      await writeFile(configPath, 'this is [ not valid TOML');

      await expect(loader.load(configPath)).rejects.toThrow(ConfigError);
      await expect(loader.load(configPath)).rejects.toMatchObject({
        code: 'PARSE_ERROR',
      });
    });

    it('should throw error if output is not a string', async () => {
      const configPath = join(testDir, 'bad-output.toml');
      await writeFile(configPath, 'output = 123');

      await expect(loader.load(configPath)).rejects.toThrow(ConfigError);
      await expect(loader.load(configPath)).rejects.toMatchObject({
        code: 'INVALID_TYPE',
      });
    });

    it('should throw error if template is not a string', async () => {
      const configPath = join(testDir, 'bad-template.toml');
      await writeFile(configPath, 'template = true');

      await expect(loader.load(configPath)).rejects.toThrow(ConfigError);
    });

    it('should throw error if features is not an array of strings', async () => {
      const configPath = join(testDir, 'bad-features.toml');
      await writeFile(configPath, 'features = ["valid", 123]');

      await expect(loader.load(configPath)).rejects.toThrow(ConfigError);
    });

    it('should throw error if force is not a boolean', async () => {
      const configPath = join(testDir, 'bad-force.toml');
      await writeFile(configPath, 'force = "yes"');

      await expect(loader.load(configPath)).rejects.toThrow(ConfigError);
    });

    it('should handle partial configuration', async () => {
      const configPath = join(testDir, 'partial.toml');
      await writeFile(configPath, 'output = "./output"');

      const config = await loader.load(configPath);

      expect(config).toEqual({
        output: './output',
      });
    });

    it('should handle empty configuration', async () => {
      const configPath = join(testDir, 'empty.toml');
      await writeFile(configPath, '');

      const config = await loader.load(configPath);

      expect(config).toEqual({});
    });
  });

  describe('merge', () => {
    // @awa-test: CFG-4_AC-1
    it('should use CLI value when both CLI and config provide same option (P1)', () => {
      const cliOptions = {
        output: './cli-output', // Required from CLI
      };

      const fileConfig = {
        output: './file-output',
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.output).toBe('./cli-output');
    });

    // @awa-test: CFG-4_AC-2, CLI-2_AC-3
    it('should use config value when CLI option is not provided', () => {
      const cliOptions = {};

      const fileConfig = {
        output: './file-output',
        template: 'user/repo',
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.output).toBe('./file-output'); // From config
      expect(resolved.template).toBe('user/repo');
    });

    // @awa-test: CLI-1_AC-4, CLI-2_AC-4
    it('should throw error when output not provided in CLI or config', () => {
      const cliOptions = {};
      const fileConfig = null;

      expect(() => loader.merge(cliOptions, fileConfig)).toThrow('Output directory is required');
    });

    // @awa-test: CFG-4_AC-3, CLI-4_AC-3, FP-3_AC-1, FP-5_AC-1
    // @awa-test: CFG-3_AC-9, CFG-3_AC-10
    it('should use default values for other options when not provided', () => {
      const cliOptions = {
        output: './output',
      };
      const fileConfig = null;

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.output).toBe('./output'); // From CLI
      expect(resolved.template).toBeNull();
      expect(resolved.features).toEqual([]);
      expect(resolved.preset).toEqual([]);
      expect(resolved.removeFeatures).toEqual([]);
      expect(resolved.force).toBe(false);
      expect(resolved.dryRun).toBe(false);
      expect(resolved.refresh).toBe(false);
      expect(resolved.presets).toEqual({});
      expect(resolved.listUnknown).toBe(false);
    });

    // @awa-test: CFG-4_AC-4
    it('should replace features array completely, not merge (P2)', () => {
      const cliOptions = {
        output: './output',
        features: ['cli-feature'],
      };

      const fileConfig = {
        features: ['config-feature1', 'config-feature2'],
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.features).toEqual(['cli-feature']);
      expect(resolved.features).not.toContain('config-feature1');
      expect(resolved.features).not.toContain('config-feature2');
    });

    // @awa-test: CFG-3_AC-7, CFG-3_AC-8
    it('should handle all boolean flags correctly', () => {
      const cliOptions = {
        output: './output',
        force: true,
        dryRun: true,
        listUnknown: true,
      };

      const fileConfig = {
        refresh: true,
        'list-unknown': false,
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.force).toBe(true);
      expect(resolved.dryRun).toBe(true);
      expect(resolved.refresh).toBe(true);
      expect(resolved.preset).toEqual([]);
      expect(resolved.removeFeatures).toEqual([]);
      expect(resolved.presets).toEqual({});
      expect(resolved.listUnknown).toBe(true);
    });

    // @awa-test: CFG-5_AC-1, CFG-5_AC-2
    it('should map dry-run from config to dryRun in resolved options', () => {
      const cliOptions = {
        output: './output',
      };

      const fileConfig = {
        'dry-run': true,
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.dryRun).toBe(true);
    });

    it('should handle null file config', () => {
      const cliOptions = {
        output: './test',
        template: 'user/repo',
      };

      const resolved = loader.merge(cliOptions, null);

      expect(resolved.output).toBe('./test');
      expect(resolved.template).toBe('user/repo');
      expect(resolved.force).toBe(false);
      expect(resolved.preset).toEqual([]);
      expect(resolved.removeFeatures).toEqual([]);
      expect(resolved.presets).toEqual({});
    });

    // VALIDATES: T-MULTI-005 — regression test for || [] bug fix
    it('should use config features when CLI features are undefined (not empty array)', () => {
      const cliOptions = {
        output: './output',
        // features is undefined — should NOT become []
      };

      const fileConfig = {
        features: ['copilot', 'architect'],
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.features).toEqual(['copilot', 'architect']);
    });

    // VALIDATES: T-MULTI-005 — regression test for || [] bug fix
    it('should use config preset when CLI preset is undefined', () => {
      const cliOptions = {
        output: './output',
        // preset is undefined
      };

      const fileConfig = {
        preset: ['full'],
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.preset).toEqual(['full']);
    });

    // VALIDATES: T-MULTI-005 — regression test for || [] bug fix
    it('should use config remove-features when CLI removeFeatures is undefined', () => {
      const cliOptions = {
        output: './output',
        // removeFeatures is undefined
      };

      const fileConfig = {
        'remove-features': ['debug'],
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.removeFeatures).toEqual(['debug']);
    });
  });

  // @awa-test: OVL-8_AC-1
  describe('overlay config', () => {
    it('should parse overlay array from TOML config', async () => {
      const configPath = join(testDir, '.awa.toml');
      const tomlContent = `
output = "./out"
overlay = ["./overlay1", "./overlay2"]
`;
      await writeFile(configPath, tomlContent);

      const config = await loader.load(configPath);

      expect(config?.overlay).toEqual(['./overlay1', './overlay2']);
    });

    it('should merge overlay from CLI over config', async () => {
      const cliOptions = {
        output: './out',
        overlay: ['./cli-overlay'],
      };
      const fileConfig = {
        overlay: ['./config-overlay'],
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.overlay).toEqual(['./cli-overlay']);
    });

    it('should use config overlay when CLI overlay is not provided', async () => {
      const cliOptions = {
        output: './out',
      };
      const fileConfig = {
        overlay: ['./config-overlay1', './config-overlay2'],
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.overlay).toEqual(['./config-overlay1', './config-overlay2']);
    });

    it('should default overlay to empty array when not provided', async () => {
      const cliOptions = { output: './out' };
      const resolved = loader.merge(cliOptions, null);
      expect(resolved.overlay).toEqual([]);
    });

    it('should throw error if overlay is not an array of strings', async () => {
      const configPath = join(testDir, 'invalid.toml');
      await writeFile(configPath, 'overlay = "not-an-array"\n');

      await expect(loader.load(configPath)).rejects.toMatchObject({
        code: 'INVALID_TYPE',
      });
    });

    // @awa-test: CFG-3_AC-7
    it('should support delete as a boolean in config', () => {
      const cliOptions = {
        output: './output',
      };

      const fileConfig = {
        delete: true,
      };

      const resolved = loader.merge(cliOptions, fileConfig);

      expect(resolved.delete).toBe(true);
    });

    // @awa-test: CFG-6_AC-1, CFG-6_AC-2
    it('should continue execution with unknown config options', async () => {
      const configPath = join(testDir, 'unknown.toml');
      await writeFile(configPath, 'output = "./out"\nunknown_option = "value"\n');

      // Should not throw - continues execution (CFG-6_AC-2)
      const config = await loader.load(configPath);
      expect(config).toBeDefined();
      expect((config as Record<string, unknown>).output).toBe('./out');
    });
  });

  // VALIDATES: MULTI-1_AC-1
  describe('load with [targets.*] sections', () => {
    it('should parse targets from TOML configuration', async () => {
      const configPath = join(testDir, '.awa.toml');
      const tomlContent = `
template = "./templates/awa"
features = ["architect", "code"]

[targets.claude]
output = "."
features = ["claude", "architect", "code"]

[targets.copilot]
output = "."
features = ["copilot", "code", "vibe"]
`;
      await writeFile(configPath, tomlContent);

      const config = await loader.load(configPath);

      expect(config?.targets).toBeDefined();
      expect(config?.targets?.claude).toEqual({
        output: '.',
        features: ['claude', 'architect', 'code'],
      });
      expect(config?.targets?.copilot).toEqual({
        output: '.',
        features: ['copilot', 'code', 'vibe'],
      });
    });

    it('should handle targets with partial fields', async () => {
      const configPath = join(testDir, '.awa.toml');
      const tomlContent = `
template = "./templates/awa"

[targets.claude]
output = "."
`;
      await writeFile(configPath, tomlContent);

      const config = await loader.load(configPath);

      expect(config?.targets?.claude).toEqual({
        output: '.',
      });
    });

    it('should throw error for invalid target section type', async () => {
      const configPath = join(testDir, 'bad-target.toml');
      await writeFile(
        configPath,
        `
[targets]
claude = "invalid"
`
      );

      await expect(loader.load(configPath)).rejects.toThrow(ConfigError);
    });

    it('should throw error for invalid target field types', async () => {
      const configPath = join(testDir, 'bad-target-output.toml');
      await writeFile(
        configPath,
        `
[targets.claude]
output = 123
`
      );

      await expect(loader.load(configPath)).rejects.toThrow(ConfigError);
    });

    it('should parse target with all supported fields', async () => {
      const configPath = join(testDir, '.awa.toml');
      const tomlContent = `
[targets.full]
output = "./out"
template = "./custom-template"
features = ["a", "b"]
preset = ["full"]
remove-features = ["debug"]
`;
      await writeFile(configPath, tomlContent);

      const config = await loader.load(configPath);

      expect(config?.targets?.full).toEqual({
        output: './out',
        template: './custom-template',
        features: ['a', 'b'],
        preset: ['full'],
        'remove-features': ['debug'],
      });
    });
  });

  // VALIDATES: MULTI-3_AC-1
  describe('resolveTarget', () => {
    it('should merge target with root config', () => {
      const fileConfig: FileConfig = {
        template: './templates/awa',
        features: ['architect', 'code'],
        output: './default-out',
        targets: {
          claude: {
            output: './claude-out',
            features: ['claude', 'architect'],
          },
        },
      };

      const resolved = loader.resolveTarget('claude', fileConfig);

      expect(resolved.output).toBe('./claude-out');
      expect(resolved.features).toEqual(['claude', 'architect']);
      expect(resolved.template).toBe('./templates/awa');
      expect(resolved.targets).toBeUndefined();
    });

    it('should inherit root values when target field is undefined', () => {
      const fileConfig: FileConfig = {
        template: './templates/awa',
        features: ['architect'],
        output: './default-out',
        targets: {
          minimal: {
            output: './minimal-out',
          },
        },
      };

      const resolved = loader.resolveTarget('minimal', fileConfig);

      expect(resolved.output).toBe('./minimal-out');
      expect(resolved.features).toEqual(['architect']);
      expect(resolved.template).toBe('./templates/awa');
    });

    it('should throw UNKNOWN_TARGET for nonexistent target', () => {
      const fileConfig: FileConfig = {
        targets: {
          claude: { output: '.' },
        },
      };

      expect(() => loader.resolveTarget('nonexistent', fileConfig)).toThrow(ConfigError);
      expect(() => loader.resolveTarget('nonexistent', fileConfig)).toThrow(/Unknown target/);
    });

    it('should throw NO_TARGETS when no targets defined', () => {
      const fileConfig: FileConfig = {
        output: '.',
      };

      expect(() => loader.resolveTarget('anything', fileConfig)).toThrow(ConfigError);
      expect(() => loader.resolveTarget('anything', fileConfig)).toThrow(/No targets defined/);
    });
  });

  describe('getTargetNames', () => {
    it('should return target names from config', () => {
      const fileConfig: FileConfig = {
        targets: {
          claude: { output: '.' },
          copilot: { output: '.' },
        },
      };

      expect(loader.getTargetNames(fileConfig)).toEqual(['claude', 'copilot']);
    });

    it('should return empty array when no targets', () => {
      expect(loader.getTargetNames(null)).toEqual([]);
      expect(loader.getTargetNames({})).toEqual([]);
    });
  });
});
