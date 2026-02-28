// @awa-test: DISC_P-4
// @awa-test: DISC-4_AC-1
// @awa-test: DISC-5_AC-1

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock dependencies BEFORE importing the module under test
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
}));

vi.mock('../../core/config.js');
vi.mock('../../core/template-resolver.js');
vi.mock('../../core/features/scanner.js');
vi.mock('../../core/features/reporter.js');
vi.mock('../../utils/logger.js');

import { configLoader } from '../../core/config.js';
import { featuresReporter } from '../../core/features/reporter.js';
import { featureScanner } from '../../core/features/scanner.js';
import { templateResolver } from '../../core/template-resolver.js';
import { logger } from '../../utils/logger.js';
import { featuresCommand } from '../features.js';

describe('featuresCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(configLoader.load).mockResolvedValue(null);
    vi.mocked(templateResolver.resolve).mockResolvedValue({
      type: 'local',
      localPath: './templates/awa',
      source: 'local',
    });
    vi.mocked(featureScanner.scan).mockResolvedValue({
      features: [{ name: 'copilot', files: ['a.md'] }],
      filesScanned: 10,
    });
    vi.mocked(featuresReporter.report).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // VALIDATES: DISC-4_AC-1, DISC-5_AC-1
  test('should resolve template and scan for features', async () => {
    const exitCode = await featuresCommand({
      template: './templates/awa',
    });

    expect(exitCode).toBe(0);
    expect(templateResolver.resolve).toHaveBeenCalledWith('./templates/awa', false);
    expect(featureScanner.scan).toHaveBeenCalledWith('./templates/awa');
    expect(featuresReporter.report).toHaveBeenCalledWith(
      expect.objectContaining({
        json: false,
      })
    );
  });

  test('should use template from config when not provided', async () => {
    vi.mocked(configLoader.load).mockResolvedValue({
      template: './from-config',
    });

    const exitCode = await featuresCommand({});

    expect(exitCode).toBe(0);
    expect(templateResolver.resolve).toHaveBeenCalledWith('./from-config', false);
  });

  test('should pass --json flag to reporter', async () => {
    const exitCode = await featuresCommand({
      template: './templates/awa',
      json: true,
    });

    expect(exitCode).toBe(0);
    expect(featuresReporter.report).toHaveBeenCalledWith(
      expect.objectContaining({
        json: true,
      })
    );
  });

  test('should pass presets from config to reporter', async () => {
    vi.mocked(configLoader.load).mockResolvedValue({
      template: './templates/awa',
      presets: { ci: ['copilot', 'claude'] },
    });

    const exitCode = await featuresCommand({
      template: './templates/awa',
    });

    expect(exitCode).toBe(0);
    expect(featuresReporter.report).toHaveBeenCalledWith(
      expect.objectContaining({
        presets: { ci: ['copilot', 'claude'] },
      })
    );
  });

  test('should return exit code 1 on error', async () => {
    vi.mocked(templateResolver.resolve).mockRejectedValue(new Error('Template not found'));

    const exitCode = await featuresCommand({
      template: './nonexistent',
    });

    expect(exitCode).toBe(1);
    expect(logger.error).toHaveBeenCalled();
  });

  test('should pass refresh flag to template resolver', async () => {
    const exitCode = await featuresCommand({
      template: './templates/awa',
      refresh: true,
    });

    expect(exitCode).toBe(0);
    expect(templateResolver.resolve).toHaveBeenCalledWith('./templates/awa', true);
  });
});
