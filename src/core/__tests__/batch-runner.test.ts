// @awa-component: MULTI-BatchRunner
// @awa-test: MULTI_P-1

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigError, type FileConfig, type RawCliOptions } from '../../types/index.js';
import { BatchRunner } from '../batch-runner.js';

// We need to mock the configLoader singleton used by BatchRunner
vi.mock('../config.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../config.js')>();
  const loader = new original.ConfigLoader();
  return {
    ...original,
    configLoader: loader,
  };
});

vi.mock('../../utils/logger.js');

describe('BatchRunner', () => {
  let runner: BatchRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    runner = new BatchRunner();
  });

  describe('resolveTargets', () => {
    // VALIDATES: MULTI-4_AC-1
    it('should resolve all targets when mode is all', () => {
      const cli: RawCliOptions = {};
      const fileConfig: FileConfig = {
        template: './templates/awa',
        features: ['architect'],
        targets: {
          claude: {
            output: './out-claude',
            features: ['claude', 'architect'],
          },
          copilot: {
            output: './out-copilot',
            features: ['copilot', 'code'],
          },
        },
      };

      const results = runner.resolveTargets(cli, fileConfig, 'all');

      expect(results).toHaveLength(2);
      expect(results[0].targetName).toBe('claude');
      expect(results[0].options.output).toBe('./out-claude');
      expect(results[0].options.features).toEqual(['claude', 'architect']);
      expect(results[1].targetName).toBe('copilot');
      expect(results[1].options.output).toBe('./out-copilot');
      expect(results[1].options.features).toEqual(['copilot', 'code']);
    });

    // VALIDATES: MULTI-5_AC-1
    it('should resolve a single target when mode is single', () => {
      const cli: RawCliOptions = {};
      const fileConfig: FileConfig = {
        template: './templates/awa',
        targets: {
          claude: {
            output: './out-claude',
            features: ['claude'],
          },
          copilot: {
            output: './out-copilot',
            features: ['copilot'],
          },
        },
      };

      const results = runner.resolveTargets(cli, fileConfig, 'single', 'claude');

      expect(results).toHaveLength(1);
      expect(results[0].targetName).toBe('claude');
      expect(results[0].options.output).toBe('./out-claude');
    });

    // VALIDATES: MULTI-3_AC-1
    it('should inherit root config values in target', () => {
      const cli: RawCliOptions = {};
      const fileConfig: FileConfig = {
        template: './templates/awa',
        features: ['architect', 'code'],
        targets: {
          claude: {
            output: './out-claude',
            // no features — should inherit from root
          },
        },
      };

      const results = runner.resolveTargets(cli, fileConfig, 'single', 'claude');

      expect(results[0].options.template).toBe('./templates/awa');
      expect(results[0].options.features).toEqual(['architect', 'code']);
    });

    // VALIDATES: MULTI-3_AC-1 (target overrides root)
    it('should override root features with target features', () => {
      const cli: RawCliOptions = {};
      const fileConfig: FileConfig = {
        template: './templates/awa',
        features: ['architect', 'code'],
        targets: {
          claude: {
            output: './out-claude',
            features: ['claude', 'architect', 'code'],
          },
        },
      };

      const results = runner.resolveTargets(cli, fileConfig, 'single', 'claude');

      expect(results[0].options.features).toEqual(['claude', 'architect', 'code']);
    });

    // VALIDATES: MULTI-4_AC-2
    it('should error with NO_TARGETS when no targets defined', () => {
      const cli: RawCliOptions = {};
      const fileConfig: FileConfig = {
        output: '.',
        template: './templates/awa',
      };

      expect(() => runner.resolveTargets(cli, fileConfig, 'all')).toThrow(ConfigError);
      expect(() => runner.resolveTargets(cli, fileConfig, 'all')).toThrow(/No targets defined/);
    });

    // VALIDATES: MULTI-4_AC-2
    it('should error with NO_TARGETS when fileConfig is null', () => {
      const cli: RawCliOptions = {};

      expect(() => runner.resolveTargets(cli, null, 'all')).toThrow(ConfigError);
    });

    // VALIDATES: MULTI-5_AC-2
    it('should error with UNKNOWN_TARGET for unknown target name', () => {
      const cli: RawCliOptions = {};
      const fileConfig: FileConfig = {
        targets: {
          claude: { output: '.' },
        },
      };

      expect(() => runner.resolveTargets(cli, fileConfig, 'single', 'nonexistent')).toThrow(
        ConfigError
      );
      expect(() => runner.resolveTargets(cli, fileConfig, 'single', 'nonexistent')).toThrow(
        /Unknown target/
      );
    });

    // VALIDATES: MULTI-11_AC-1
    it('should ignore CLI positional output when mode is all', () => {
      const cli: RawCliOptions = { output: './cli-output' };
      const fileConfig: FileConfig = {
        template: './templates/awa',
        targets: {
          claude: {
            output: './out-claude',
          },
        },
      };

      const results = runner.resolveTargets(cli, fileConfig, 'all');

      expect(results[0].options.output).toBe('./out-claude');
    });

    // VALIDATES: MULTI-11_AC-1
    it('should allow CLI positional to override target output when mode is single', () => {
      const cli: RawCliOptions = { output: './cli-output' };
      const fileConfig: FileConfig = {
        template: './templates/awa',
        targets: {
          claude: {
            output: './out-claude',
          },
        },
      };

      const results = runner.resolveTargets(cli, fileConfig, 'single', 'claude');

      expect(results[0].options.output).toBe('./cli-output');
    });

    // VALIDATES: MULTI-9_AC-1
    it('should error with MISSING_OUTPUT naming the target when output unresolvable', () => {
      const cli: RawCliOptions = {};
      const fileConfig: FileConfig = {
        template: './templates/awa',
        targets: {
          claude: {
            // no output, and root has no output either
            features: ['claude'],
          },
        },
      };

      expect(() => runner.resolveTargets(cli, fileConfig, 'single', 'claude')).toThrow(
        /Target 'claude' has no output/
      );
    });
  });
});
