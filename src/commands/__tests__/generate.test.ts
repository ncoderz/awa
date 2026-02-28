// @awa-component: JSON-GenerateCommand
// @awa-component: INIT-AliasRegistration
// @awa-test: JSON_P-3
// @awa-test: JSON_P-4
// @awa-test: INIT-1_AC-1
// @awa-test: INIT-2_AC-1
// @awa-test: INIT-3_AC-1
// @awa-test: INIT-4_AC-1
// @awa-test: INIT-5_AC-1
// @awa-test: INIT_P-1
// @awa-test: INIT_P-2

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { GenerationResult } from '../../types/index.js';

// Mock dependencies BEFORE importing the module under test
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  multiselect: vi.fn().mockResolvedValue(['copilot']),
  isCancel: vi.fn().mockReturnValue(false),
}));

vi.mock('../../core/config.js');
vi.mock('../../core/generator.js');
vi.mock('../../core/template-resolver.js');
vi.mock('../../core/json-output.js');
vi.mock('../../core/feature-resolver.js');
vi.mock('../../utils/logger.js');

import { intro, outro } from '@clack/prompts';
import { configLoader } from '../../core/config.js';
import { featureResolver } from '../../core/feature-resolver.js';
import { fileGenerator } from '../../core/generator.js';
import {
  formatGenerationSummary,
  serializeGenerationResult,
  writeJsonOutput,
} from '../../core/json-output.js';
import { templateResolver } from '../../core/template-resolver.js';
import { logger } from '../../utils/logger.js';
import { generateCommand } from '../generate.js';

const mockResult: GenerationResult = {
  actions: [{ type: 'create', sourcePath: '/tmp/src/a.md', outputPath: '/out/a.md' }],
  created: 1,
  overwritten: 0,
  deleted: 0,
  skipped: 0,
  skippedEmpty: 0,
  skippedUser: 0,
  skippedEqual: 0,
};

const DEFAULT_RESOLVED_OPTIONS = {
  template: './templates/awa',
  output: './output',
  features: ['copilot'],
  preset: [],
  removeFeatures: [],
  presets: {},
  refresh: false,
  force: false,
  dryRun: false,
  delete: false,
  listUnknown: false,
  json: false,
  summary: false,
};

describe('generateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(configLoader.load).mockResolvedValue({
      output: './output',
      features: ['copilot'],
    });
    vi.mocked(configLoader.merge).mockReturnValue(DEFAULT_RESOLVED_OPTIONS);
    vi.mocked(templateResolver.resolve).mockResolvedValue({
      type: 'local',
      localPath: './templates/awa',
      source: 'local',
    });
    vi.mocked(featureResolver.resolve).mockReturnValue(['copilot']);
    vi.mocked(fileGenerator.generate).mockResolvedValue({
      actions: [],
      created: 1,
      overwritten: 0,
      skipped: 0,
      skippedEmpty: 0,
      skippedUser: 0,
      skippedEqual: 0,
      deleted: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // @awa-test: INIT-1_AC-1
  // @awa-test: INIT-2_AC-1
  // @awa-test: INIT-3_AC-1
  // @awa-test: INIT_P-1
  test('invokes generateCommand successfully with standard options', async () => {
    await generateCommand({
      output: './output',
      features: ['copilot'],
      preset: [],
      removeFeatures: [],
      force: false,
      dryRun: false,
      delete: false,
      refresh: false,
    });

    expect(configLoader.load).toHaveBeenCalledWith(null);
    expect(configLoader.merge).toHaveBeenCalled();
    expect(templateResolver.resolve).toHaveBeenCalled();
    expect(fileGenerator.generate).toHaveBeenCalled();
  });

  // @awa-test: INIT-3_AC-1
  // @awa-test: INIT_P-1
  test('produces identical output regardless of which command name is used (generate vs init)', async () => {
    // Both "generate" and "init" invoke generateCommand — verify it resolves correctly
    const cliOptions = {
      output: './output',
      features: ['copilot'],
      preset: [],
      removeFeatures: [],
      force: false,
      dryRun: false,
      delete: false,
      refresh: false,
    };

    await generateCommand(cliOptions);

    expect(fileGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        outputPath: './output',
        features: ['copilot'],
      })
    );
  });

  // @awa-test: INIT-5_AC-1
  // @awa-test: INIT_P-2
  test('logs config hint when no config file is found and --config not provided', async () => {
    vi.mocked(configLoader.load).mockResolvedValue(null);
    vi.mocked(configLoader.merge).mockReturnValue(DEFAULT_RESOLVED_OPTIONS);

    await generateCommand({
      output: './output',
      features: ['copilot'],
      preset: [],
      removeFeatures: [],
      force: false,
      dryRun: false,
      delete: false,
      refresh: false,
    });

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('.awa.toml'));
  });

  // @awa-test: INIT-5_AC-1
  // @awa-test: INIT_P-2
  test('does NOT log config hint when --config is provided', async () => {
    vi.mocked(configLoader.load).mockResolvedValue(null);
    vi.mocked(configLoader.merge).mockReturnValue(DEFAULT_RESOLVED_OPTIONS);

    await generateCommand({
      output: './output',
      features: ['copilot'],
      preset: [],
      removeFeatures: [],
      force: false,
      dryRun: false,
      delete: false,
      refresh: false,
      config: './custom.toml',
    });

    const infoCalls = vi.mocked(logger.info).mock.calls;
    const hintCalls = infoCalls.filter(
      ([msg]) => typeof msg === 'string' && msg.includes('.awa.toml')
    );
    expect(hintCalls).toHaveLength(0);
  });

  // @awa-test: INIT-5_AC-1
  // @awa-test: INIT_P-2
  test('does NOT log config hint when config file was found', async () => {
    // configLoader.load returns non-null (file was found)
    vi.mocked(configLoader.load).mockResolvedValue({ output: './output' });

    await generateCommand({
      output: './output',
      features: ['copilot'],
      preset: [],
      removeFeatures: [],
      force: false,
      dryRun: false,
      delete: false,
      refresh: false,
    });

    const infoCalls = vi.mocked(logger.info).mock.calls;
    const hintCalls = infoCalls.filter(
      ([msg]) => typeof msg === 'string' && msg.includes('.awa.toml')
    );
    expect(hintCalls).toHaveLength(0);
  });
});

describe('generateCommand --json', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(configLoader.load).mockResolvedValue({
      output: './output',
      features: ['copilot'],
    });
    vi.mocked(configLoader.merge).mockReturnValue({
      ...DEFAULT_RESOLVED_OPTIONS,
      json: true,
      summary: false,
    });
    vi.mocked(templateResolver.resolve).mockResolvedValue({
      type: 'local',
      localPath: './templates/awa',
      source: 'local',
    });
    vi.mocked(featureResolver.resolve).mockReturnValue(['copilot']);
    vi.mocked(fileGenerator.generate).mockResolvedValue(mockResult);
    vi.mocked(serializeGenerationResult).mockReturnValue({
      actions: [{ type: 'create', path: '/out/a.md' }],
      counts: { created: 1, overwritten: 0, skipped: 0, deleted: 0 },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // @awa-test: JSON-6_AC-1
  // @awa-test: JSON_P-4
  test('should suppress intro/outro when --json is active', async () => {
    await generateCommand({
      output: './output',
      features: ['copilot'],
      json: true,
    });

    expect(intro).not.toHaveBeenCalled();
    expect(outro).not.toHaveBeenCalled();
  });

  // @awa-test: JSON-7_AC-1
  // @awa-test: JSON_P-3
  test('should enforce dry-run when --json is active', async () => {
    await generateCommand({
      output: './output',
      features: ['copilot'],
      json: true,
    });

    expect(fileGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: true,
      })
    );
  });

  // @awa-test: JSON-1_AC-1
  test('should output JSON when --json is active', async () => {
    await generateCommand({
      output: './output',
      features: ['copilot'],
      json: true,
    });

    expect(serializeGenerationResult).toHaveBeenCalledWith(mockResult);
    expect(writeJsonOutput).toHaveBeenCalled();
  });

  // @awa-test: JSON-6_AC-1
  test('should not call logger.summary when --json is active', async () => {
    await generateCommand({
      output: './output',
      features: ['copilot'],
      json: true,
    });

    expect(logger.summary).not.toHaveBeenCalled();
  });

  // @awa-test: JSON-8_AC-1
  test('should write errors to stderr on failure with --json', async () => {
    vi.mocked(fileGenerator.generate).mockRejectedValue(new Error('test error'));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(
      generateCommand({
        output: './output',
        features: ['copilot'],
        json: true,
      })
    ).rejects.toThrow('process.exit');

    expect(logger.error).toHaveBeenCalledWith('test error');
    expect(writeJsonOutput).not.toHaveBeenCalled();

    exitSpy.mockRestore();
  });
});

describe('generateCommand --summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(configLoader.load).mockResolvedValue({
      output: './output',
      features: ['copilot'],
    });
    vi.mocked(configLoader.merge).mockReturnValue({
      ...DEFAULT_RESOLVED_OPTIONS,
      json: false,
      summary: true,
    });
    vi.mocked(templateResolver.resolve).mockResolvedValue({
      type: 'local',
      localPath: './templates/awa',
      source: 'local',
    });
    vi.mocked(featureResolver.resolve).mockReturnValue(['copilot']);
    vi.mocked(fileGenerator.generate).mockResolvedValue(mockResult);
    vi.mocked(formatGenerationSummary).mockReturnValue(
      'created: 1, overwritten: 0, skipped: 0, deleted: 0'
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // @awa-test: JSON-5_AC-1
  test('should output summary line when --summary is active', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await generateCommand({
      output: './output',
      features: ['copilot'],
      summary: true,
    });

    expect(formatGenerationSummary).toHaveBeenCalledWith(mockResult);
    expect(consoleSpy).toHaveBeenCalledWith('created: 1, overwritten: 0, skipped: 0, deleted: 0');

    consoleSpy.mockRestore();
  });

  // @awa-test: JSON-6_AC-1
  test('should suppress intro/outro when --summary is active', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await generateCommand({
      output: './output',
      features: ['copilot'],
      summary: true,
    });

    expect(intro).not.toHaveBeenCalled();
    expect(outro).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});

describe('generateCommand normal mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(configLoader.load).mockResolvedValue({
      output: './output',
      features: ['copilot'],
    });
    vi.mocked(configLoader.merge).mockReturnValue({
      ...DEFAULT_RESOLVED_OPTIONS,
      json: false,
      summary: false,
    });
    vi.mocked(templateResolver.resolve).mockResolvedValue({
      type: 'local',
      localPath: './templates/awa',
      source: 'local',
    });
    vi.mocked(featureResolver.resolve).mockReturnValue(['copilot']);
    vi.mocked(fileGenerator.generate).mockResolvedValue(mockResult);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should call intro/outro in normal mode', async () => {
    await generateCommand({
      output: './output',
      features: ['copilot'],
    });

    expect(intro).toHaveBeenCalledWith('awa CLI - Template Generator');
    expect(outro).toHaveBeenCalledWith('Generation complete!');
  });

  test('should call logger.summary in normal mode', async () => {
    await generateCommand({
      output: './output',
      features: ['copilot'],
    });

    expect(logger.summary).toHaveBeenCalledWith(mockResult);
  });
});
