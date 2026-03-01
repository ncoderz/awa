// @awa-test: DISC_P-3
// @awa-test: DISC-6_AC-1
// @awa-test: DISC-7_AC-1

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FeaturesReporter } from '../reporter.js';
import type { ScanResult } from '../scanner.js';

const reporter = new FeaturesReporter();

describe('FeaturesReporter', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('buildJsonOutput', () => {
    // VALIDATES: DISC-6_AC-1
    test('should produce valid JSON structure with features', () => {
      const scanResult: ScanResult = {
        features: [
          { name: 'copilot', files: ['a.md', 'b.md'] },
          { name: 'claude', files: ['c.md'] },
        ],
        filesScanned: 10,
      };

      const output = reporter.buildJsonOutput(scanResult);
      expect(output.features).toHaveLength(2);
      expect(output.features[0]!.name).toBe('copilot');
      expect(output.features[0]!.files).toEqual(['a.md', 'b.md']);
      expect(output.filesScanned).toBe(10);
      expect(output.presets).toBeUndefined();
    });

    // VALIDATES: DISC-7_AC-1
    test('should include presets when provided', () => {
      const scanResult: ScanResult = {
        features: [{ name: 'copilot', files: ['a.md'] }],
        filesScanned: 5,
      };
      const presets = { ci: ['copilot', 'claude'] };

      const output = reporter.buildJsonOutput(scanResult, presets);
      expect(output.presets).toEqual({ ci: ['copilot', 'claude'] });
    });

    test('should omit presets when empty', () => {
      const scanResult: ScanResult = {
        features: [],
        filesScanned: 0,
      };

      const output = reporter.buildJsonOutput(scanResult, {});
      expect(output.presets).toBeUndefined();
    });
  });

  describe('report', () => {
    // VALIDATES: DISC-6_AC-1
    test('should output valid JSON when json option is true', () => {
      const scanResult: ScanResult = {
        features: [{ name: 'copilot', files: ['a.md'] }],
        filesScanned: 1,
      };

      reporter.report({ scanResult, json: true });

      const calls = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('');
      const parsed = JSON.parse(calls);
      expect(parsed.features).toHaveLength(1);
      expect(parsed.features[0].name).toBe('copilot');
    });

    test('should output table format when json option is false', () => {
      const scanResult: ScanResult = {
        features: [{ name: 'copilot', files: ['a.md'] }],
        filesScanned: 1,
      };

      reporter.report({ scanResult, json: false });

      expect(consoleSpy).toHaveBeenCalled();
    });

    test('should display no flags message when features is empty', () => {
      const scanResult: ScanResult = {
        features: [],
        filesScanned: 5,
      };

      reporter.report({ scanResult, json: false });

      const output = consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
      expect(output).toContain('No feature flags found');
    });
  });
});
