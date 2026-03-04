import { describe, expect, test } from 'vitest';

import { buildJsonOutput, formatJson, formatSummary, formatTable } from '../reporter.js';
import type { CodesResult } from '../types.js';

const sampleResult: CodesResult = {
  codes: [
    {
      code: 'CHK',
      feature: 'check',
      reqCount: 16,
      scope: 'Traceability validation tool',
      docs: { feat: true, req: true, design: true, api: false, example: false },
    },
    {
      code: 'CLI',
      feature: 'cli',
      reqCount: 15,
      scope: 'Command-line interface',
      docs: { feat: true, req: true, design: false, api: false, example: false },
    },
    {
      code: 'TRC',
      feature: 'trace',
      reqCount: 12,
      scope: 'Traceability chain navigation',
      docs: { feat: false, req: true, design: true, api: false, example: false },
    },
  ],
};

const emptyResult: CodesResult = { codes: [] };

describe('buildJsonOutput', () => {
  test('builds correct JSON structure', () => {
    const output = buildJsonOutput(sampleResult);

    expect(output.totalCodes).toBe(3);
    expect(output.codes).toHaveLength(3);
    expect(output.codes[0]).toEqual({
      code: 'CHK',
      feature: 'check',
      reqCount: 16,
      docs: 'FRD··',
      scope: 'Traceability validation tool',
    });
  });

  test('handles empty result', () => {
    const output = buildJsonOutput(emptyResult);

    expect(output.totalCodes).toBe(0);
    expect(output.codes).toHaveLength(0);
  });
});

describe('formatJson', () => {
  test('produces valid JSON', () => {
    const json = formatJson(sampleResult);
    const parsed = JSON.parse(json);

    expect(parsed.totalCodes).toBe(3);
    expect(parsed.codes[0].code).toBe('CHK');
  });
});

describe('formatTable', () => {
  test('produces table with all codes', () => {
    const table = formatTable(sampleResult);

    expect(table).toContain('CHK');
    expect(table).toContain('CLI');
    expect(table).toContain('TRC');
    expect(table).toContain('check');
    expect(table).toContain('Feature codes (3)');
  });

  test('shows message for empty result', () => {
    const table = formatTable(emptyResult);

    expect(table).toContain('No feature codes found');
  });

  test('contains header row', () => {
    const table = formatTable(sampleResult);

    expect(table).toContain('CODE');
    expect(table).toContain('Feature');
    expect(table).toContain('Reqs');
    expect(table).toContain('Docs');
    expect(table).toContain('Scope');
  });

  test('shows docs column with F·R·D·A indicators', () => {
    const table = formatTable(sampleResult);

    // CHK has feat, req, design but no api or example
    expect(table).toContain('FRD··');
    // TRC has req, design but no feat, api, or example
    expect(table).toContain('·RD··');
  });
});

describe('formatSummary', () => {
  test('produces compact summary', () => {
    expect(formatSummary(sampleResult)).toBe('codes: 3');
  });

  test('handles zero codes', () => {
    expect(formatSummary(emptyResult)).toBe('codes: 0');
  });
});
