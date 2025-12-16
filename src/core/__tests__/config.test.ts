// @zen-component: CFG-ConfigLoader
// @zen-test: P1

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConfigError } from '../../types/index.js';
import { ConfigLoader } from '../config.js';

describe('ConfigLoader', () => {
  let testDir: string;
  let loader: ConfigLoader;

  beforeEach(async () => {
    testDir = join(tmpdir(), `zen-config-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    loader = new ConfigLoader();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('should parse valid TOML configuration', async () => {
      const configPath = join(testDir, '.zen.toml');
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

    it('should return null if default config path does not exist', async () => {
      // Change to test directory where no .zen.toml exists
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const config = await loader.load(null);
        expect(config).toBeNull();
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should throw error if explicit config path does not exist', async () => {
      const nonexistentPath = join(testDir, 'missing.toml');

      await expect(loader.load(nonexistentPath)).rejects.toThrow(ConfigError);
      await expect(loader.load(nonexistentPath)).rejects.toMatchObject({
        code: 'FILE_NOT_FOUND',
      });
    });

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

    it('should throw error when output not provided in CLI or config', () => {
      const cliOptions = {};
      const fileConfig = null;

      expect(() => loader.merge(cliOptions, fileConfig)).toThrow('Output directory is required');
    });

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
  });
});
