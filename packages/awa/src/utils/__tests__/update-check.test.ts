import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Logger } from '../logger.js';
import {
  compareSemver,
  isMajorVersionBump,
  printUpdateWarning,
  type UpdateCheckResult,
} from '../update-check.js';

describe('compareSemver', () => {
  it('should return 0 for equal versions', () => {
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('2.3.4', '2.3.4')).toBe(0);
  });

  it('should return negative when first version is lower (patch bump)', () => {
    expect(compareSemver('1.0.0', '1.0.1')).toBeLessThan(0);
  });

  it('should return negative when first version is lower (minor bump)', () => {
    expect(compareSemver('1.0.0', '1.1.0')).toBeLessThan(0);
  });

  it('should return negative when first version is lower (major bump)', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBeLessThan(0);
  });

  it('should return positive when first version is higher', () => {
    expect(compareSemver('2.0.0', '1.0.0')).toBeGreaterThan(0);
    expect(compareSemver('1.1.0', '1.0.0')).toBeGreaterThan(0);
    expect(compareSemver('1.0.1', '1.0.0')).toBeGreaterThan(0);
  });

  it('should handle versions with different lengths', () => {
    expect(compareSemver('1.0', '1.0.0')).toBe(0);
    expect(compareSemver('1', '1.0.0')).toBe(0);
  });

  it('should strip pre-release suffixes (compare only numeric parts)', () => {
    // parseInt will parse "0-beta" as 0, treating pre-release as equal
    expect(compareSemver('1.0.0', '1.0.0-beta')).toBe(0);
  });
});

describe('isMajorVersionBump', () => {
  it('should return true for major version bump', () => {
    expect(isMajorVersionBump('1.0.0', '2.0.0')).toBe(true);
    expect(isMajorVersionBump('1.5.3', '3.0.0')).toBe(true);
  });

  it('should return false for same major version', () => {
    expect(isMajorVersionBump('1.0.0', '1.1.0')).toBe(false);
    expect(isMajorVersionBump('1.0.0', '1.0.1')).toBe(false);
  });

  it('should return false for lower major version', () => {
    expect(isMajorVersionBump('2.0.0', '1.0.0')).toBe(false);
  });
});

describe('printUpdateWarning', () => {
  let mockLogger: Logger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      success: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fileAction: vi.fn(),
      summary: vi.fn(),
      diffLine: vi.fn(),
      diffSummary: vi.fn(),
    } as unknown as Logger;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should not print anything if not outdated', () => {
    const result: UpdateCheckResult = {
      current: '1.0.0',
      latest: '1.0.0',
      isOutdated: false,
      isMajorBump: false,
    };
    printUpdateWarning(mockLogger, result);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('should print minor/patch update message when outdated', () => {
    const result: UpdateCheckResult = {
      current: '1.0.0',
      latest: '1.1.0',
      isOutdated: true,
      isMajorBump: false,
    };
    printUpdateWarning(mockLogger, result);
    expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    const firstCall = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(firstCall).toContain('1.0.0');
    expect(firstCall).toContain('1.1.0');
  });

  it('should print major version message with breaking changes notice', () => {
    const result: UpdateCheckResult = {
      current: '1.0.0',
      latest: '2.0.0',
      isOutdated: true,
      isMajorBump: true,
    };
    printUpdateWarning(mockLogger, result);
    expect(mockLogger.warn).toHaveBeenCalledTimes(3);
    const firstCall = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
    expect(firstCall).toContain('breaking changes');
    const secondCall = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls[1]?.[0] as string;
    expect(secondCall).toContain('releases');
  });

  it('should always include npm install command', () => {
    const result: UpdateCheckResult = {
      current: '1.0.0',
      latest: '1.1.0',
      isOutdated: true,
      isMajorBump: false,
    };
    printUpdateWarning(mockLogger, result);
    const lastCall = (mockLogger.warn as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain('npm install -g @ncoderz/awa');
  });
});
