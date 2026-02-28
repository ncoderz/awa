// @awa-component: INIT-AliasRegistration
// @awa-test: INIT-1_AC-1
// @awa-test: INIT-2_AC-1
// @awa-test: INIT-3_AC-1
// @awa-test: INIT-4_AC-1
// @awa-test: INIT-5_AC-1
// @awa-test: INIT_P-1
// @awa-test: INIT_P-2

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

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
vi.mock('../../core/feature-resolver.js');
vi.mock('../../utils/logger.js');

import { configLoader } from '../../core/config.js';
import { featureResolver } from '../../core/feature-resolver.js';
import { fileGenerator } from '../../core/generator.js';
import { templateResolver } from '../../core/template-resolver.js';
import { logger } from '../../utils/logger.js';
import { generateCommand } from '../generate.js';

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
