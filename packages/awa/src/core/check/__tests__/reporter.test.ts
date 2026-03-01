// @awa-component: CHK-Reporter
// @awa-test: CHK-9_AC-1

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { report } from '../reporter.js';
import type { Finding } from '../types.js';

describe('Reporter', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // @awa-test: CHK-9_AC-1
  test('outputs valid JSON when format is json', () => {
    const findings: Finding[] = [
      {
        severity: 'error',
        code: 'orphaned-marker',
        message: "Marker 'FOO-1_AC-1' not found",
        filePath: 'src/foo.ts',
        line: 5,
        id: 'FOO-1_AC-1',
      },
      {
        severity: 'warning',
        code: 'uncovered-ac',
        message: "AC 'BAR-1_AC-1' has no test",
        id: 'BAR-1_AC-1',
      },
    ];

    report(findings, 'json');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);

    expect(parsed.valid).toBe(false);
    expect(parsed.errors).toBe(1);
    expect(parsed.warnings).toBe(1);
    expect(parsed.findings).toHaveLength(2);
    expect(parsed.findings[0].severity).toBe('error');
    expect(parsed.findings[0].filePath).toBe('src/foo.ts');
    expect(parsed.findings[0].line).toBe(5);
    expect(parsed.findings[1].severity).toBe('warning');
    expect(parsed.findings[1].filePath).toBeUndefined();
  });

  // @awa-test: CHK-9_AC-1
  test('outputs valid=true when no errors in JSON', () => {
    const findings: Finding[] = [
      {
        severity: 'warning',
        code: 'uncovered-ac',
        message: "AC 'X-1_AC-1' has no test",
        id: 'X-1_AC-1',
      },
    ];

    report(findings, 'json');

    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toBe(0);
    expect(parsed.warnings).toBe(1);
  });

  // @awa-test: CHK-9_AC-1
  test('outputs valid JSON with empty findings', () => {
    report([], 'json');

    const output = consoleSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toBe(0);
    expect(parsed.warnings).toBe(0);
    expect(parsed.findings).toEqual([]);
  });

  // @awa-test: CHK-9_AC-1
  test('text format outputs to console without throwing', () => {
    const findings: Finding[] = [
      {
        severity: 'error',
        code: 'orphaned-marker',
        message: "Marker 'A-1_AC-1' not found",
        filePath: 'src/a.ts',
        line: 1,
        id: 'A-1_AC-1',
      },
    ];

    // Should not throw
    expect(() => report(findings, 'text')).not.toThrow();
  });

  // @awa-test: CHK-9_AC-1
  test('text format with no findings reports success', () => {
    report([], 'text');

    const allOutput = consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n');
    expect(allOutput).toContain('Validation passed');
  });
});
